import * as THREE from "three";

// Original astronaut assets and baked animation: https://lusion.co/ (Lusion).
// Their .buf format is a uint32LE JSON-header length, JSON, then sequential
// attribute arrays. This is an independent Three.js decoder, not their shaders;
// downloading these assets does not grant a license or transfer ownership.
const ASSET_ROOT = "/scene/lusion/";
const BONE_COUNT = 53;
const FRAME_COUNT = 288;
const STORAGE = {
  Float32Array: { Type: Float32Array, read: "getFloat32", signed: false },
  Uint8Array: { Type: Uint8Array, read: "getUint8", signed: false },
  Int8Array: { Type: Int8Array, read: "getInt8", signed: true },
  Uint16Array: { Type: Uint16Array, read: "getUint16", signed: false },
  Int16Array: { Type: Int16Array, read: "getInt16", signed: true },
  Uint32Array: { Type: Uint32Array, read: "getUint32", signed: false },
  Int32Array: { Type: Int32Array, read: "getInt32", signed: true },
};

function decodeBuffer(buffer) {
  const view = new DataView(buffer);
  const headerLength = view.getUint32(0, true);
  let offset = 4 + headerLength;
  const header = JSON.parse(
    new TextDecoder().decode(new Uint8Array(buffer, 4, headerLength)),
  );
  const attributes = {};

  for (const attribute of header.attributes) {
    const storage = STORAGE[attribute.storageType];
    if (!storage) throw new Error(`Unsupported .buf storage: ${attribute.storageType}`);
    const { Type } = storage;
    const bytes = Type.BYTES_PER_ELEMENT;
    const isIndex = attribute.id === "indices";
    const count = (isIndex ? header.indexCount : header.vertexCount) * attribute.componentSize;
    if (offset + count * bytes > buffer.byteLength) {
      throw new Error(`Truncated .buf attribute: ${attribute.id}`);
    }
    if (isIndex && (storage.signed || Type === Float32Array)) {
      throw new Error("Original .buf indices must be unsigned integers");
    }
    const packed = attribute.needsPack && !isIndex;
    const array = packed ? new Float32Array(count) : new Type(count);
    const denominator = 2 ** (bytes * 8);
    const bias = storage.signed ? denominator / 2 : 0;
    for (let i = 0; i < count; i++) {
      const raw = view[storage.read](offset + i * bytes, true);
      if (packed) {
        const component = attribute.packedComponents[i % attribute.componentSize];
        array[i] = ((raw + bias) / denominator) * component.delta + component.from;
      } else {
        array[i] = raw;
      }
    }
    attributes[attribute.id] = { array, itemSize: attribute.componentSize };
    offset += count * bytes;
  }
  return { count: header.vertexCount, attributes };
}

async function fetchAsset(name, signal) {
  const response = await fetch(`${ASSET_ROOT}${name}`, { signal });
  if (!response.ok) throw new Error(`Lusion asset ${name}: HTTP ${response.status}`);
  return response;
}

async function loadBuffer(name, signal) {
  const response = await fetchAsset(`${name}.buf`, signal);
  const buffer = await response.arrayBuffer();
  signal?.throwIfAborted();
  return decodeBuffer(buffer);
}

function makeGeometry(decoded) {
  const geometry = new THREE.BufferGeometry();
  try {
    for (const [name, { array, itemSize }] of Object.entries(decoded.attributes)) {
      if (name === "indices") {
        geometry.setIndex(new THREE.BufferAttribute(array, 1));
      } else if (name === "boneIndices" || name === "boneWeights") {
        // The source shader has two influences; native Three skinning needs four.
        const expanded = name === "boneIndices"
          ? new Uint16Array(decoded.count * 4)
          : new Float32Array(decoded.count * 4);
        for (let i = 0; i < decoded.count; i++) {
          expanded[i * 4] = array[i * itemSize];
          expanded[i * 4 + 1] = array[i * itemSize + 1];
        }
        geometry.setAttribute(
          name === "boneIndices" ? "skinIndex" : "skinWeight",
          new THREE.BufferAttribute(expanded, 4),
        );
      } else {
        geometry.setAttribute(name, new THREE.BufferAttribute(array, itemSize));
      }
    }
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    return geometry;
  } catch (error) {
    geometry.dispose();
    throw error;
  }
}

export async function loadSceneGeometry(name, signal) {
  return makeGeometry(await loadBuffer(name, signal));
}

function trajectory(decoded) {
  return {
    position: decoded.attributes.position.array,
    orient: decoded.attributes.orient.array,
    count: decoded.count,
  };
}

function makeAnimationMatrices(animation) {
  if (animation.count !== BONE_COUNT * FRAME_COUNT) {
    throw new Error(`Unexpected astronaut animation transform count: ${animation.count}`);
  }
  const position = new THREE.Vector3();
  const orient = new THREE.Quaternion();
  const scale = new THREE.Vector3(1, 1, 1);
  const matrix = new THREE.Matrix4();
  const matrices = new Float32Array(animation.count * 16);
  const positions = animation.attributes.position.array;
  const orientations = animation.attributes.orient.array;
  for (let i = 0; i < animation.count; i++) {
    position.fromArray(positions, i * 3);
    orient.fromArray(orientations, i * 4);
    matrix.compose(position, orient, scale).toArray(matrices, i * 16);
  }
  return matrices;
}

export async function loadOriginalAstronaut({ signal } = {}) {
  signal?.throwIfAborted();
  const controller = new AbortController();
  const abort = () => controller.abort(signal.reason);
  signal?.addEventListener("abort", abort, { once: true });
  const geometries = [];
  const materials = [];
  const textures = [];
  const bitmaps = [];
  const object = new THREE.Group();
  object.name = "Lusion original astronaut";
  let skeleton;
  let animationMatrices;
  let disposed = false;

  function dispose() {
    if (disposed) return;
    disposed = true;
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) material.dispose();
    for (const texture of textures) texture.dispose();
    for (const bitmap of bitmaps) bitmap.close();
    skeleton?.dispose();
    animationMatrices = null;
    object.clear();
  }

  async function loadTexture(part, kind) {
    const response = await fetchAsset(`astronaut_${part}_${kind}.webp`, controller.signal);
    const blob = await response.blob();
    controller.signal.throwIfAborted();
    // ImageBitmap ignores Texture.flipY; perform the standard GL vertical flip
    // at decode time. Keep data maps linear and only base color in sRGB.
    const bitmap = await createImageBitmap(blob, {
      imageOrientation: "flipY",
      premultiplyAlpha: "none",
      colorSpaceConversion: "none",
    });
    if (controller.signal.aborted) {
      bitmap.close();
      controller.signal.throwIfAborted();
    }
    bitmaps.push(bitmap);
    const texture = new THREE.Texture(bitmap);
    textures.push(texture);
    texture.name = `astronaut_${part}_${kind}`;
    texture.flipY = false;
    texture.colorSpace = kind === "base" ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    texture.needsUpdate = true;
    return texture;
  }

  const parts = ["helmet", "helmet_glass", "glove_shoes", "wearpack"];
  const bodyParts = ["helmet", "glove_shoes", "wearpack"];
  const geometryLoads = parts.map(async (part) => {
    const geometry = await loadSceneGeometry(`astronaut_${part}`, controller.signal);
    geometries.push(geometry);
    return geometry;
  });
  const textureLoads = bodyParts.flatMap((part) =>
    ["base", "nor", "arm"].map((kind) => loadTexture(part, kind)),
  );
  const bufferLoads = ["astronaut_animations", "astronaut_in_animation", "astronaut_out_animation"]
    .map((name) => loadBuffer(name, controller.signal));
  const pending = [...geometryLoads, ...textureLoads, ...bufferLoads];

  try {
    const loaded = await Promise.all(pending);
    controller.signal.throwIfAborted();
    const [animation, entrance, exit] = loaded.slice(parts.length + textureLoads.length);
    animationMatrices = makeAnimationMatrices(animation);
    const bones = Array.from({ length: BONE_COUNT }, (_, index) => {
      const bone = new THREE.Bone();
      bone.name = `baked-skin-${index}`;
      // These are already skin-space transforms, NOT local hierarchical joints.
      // They deliberately stay outside the render tree so parent transforms are
      // applied once by the mesh, never folded into the skeleton a second time.
      bone.matrixAutoUpdate = false;
      bone.matrixWorldAutoUpdate = false;
      return bone;
    });
    skeleton = new THREE.Skeleton(bones, bones.map(() => new THREE.Matrix4()));
    const identity = new THREE.Matrix4();

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      let material;
      if (part === "helmet_glass") {
        material = new THREE.MeshPhysicalMaterial({
          color: 0x111a23,
          metalness: 0.86,
          roughness: 0.12,
          clearcoat: 1,
          clearcoatRoughness: 0.08,
          envMapIntensity: 1.8,
        });
      } else {
        const textureOffset = parts.length + bodyParts.indexOf(part) * 3;
        material = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          map: loaded[textureOffset],
          normalMap: loaded[textureOffset + 1],
          aoMap: loaded[textureOffset + 2],
          roughnessMap: loaded[textureOffset + 2],
          metalnessMap: loaded[textureOffset + 2],
          roughness: 1,
          metalness: 1,
          envMapIntensity: 1.25,
        });
      }
      materials.push(material);
      const mesh = new THREE.SkinnedMesh(loaded[i], material);
      mesh.name = `astronaut_${part}`;
      mesh.bindMode = THREE.DetachedBindMode;
      mesh.bind(skeleton, identity);
      // Static rest-pose bounds cannot cull the baked animation reliably.
      mesh.frustumCulled = false;
      object.add(mesh);
    }

    function update(frame) {
      if (disposed) return;
      const wrapped = ((frame % FRAME_COUNT) + FRAME_COUNT) % FRAME_COUNT;
      const first = Math.floor(wrapped);
      const next = (first + 1) % FRAME_COUNT;
      const mix = wrapped - first;
      const firstOffset = first * BONE_COUNT * 16;
      const nextOffset = next * BONE_COUNT * 16;
      for (let bone = 0; bone < BONE_COUNT; bone++) {
        const elements = bones[bone].matrixWorld.elements;
        const offset = bone * 16;
        for (let element = 0; element < 16; element++) {
          const a = animationMatrices[firstOffset + offset + element];
          const b = animationMatrices[nextOffset + offset + element];
          elements[element] = a + (b - a) * mix;
        }
      }
      // Matrix lerp exactly reproduces lerping adjacent transformed positions;
      // quaternion slerp would produce a different deformation. Updating the
      // bones also keeps Three's automatic skeleton.update() render-safe.
      skeleton.update();
    }

    update(0);
    return { object, update, entrance: trajectory(entrance), exit: trajectory(exit), dispose };
  } catch (error) {
    controller.abort();
    // Finish in-flight decodes before cleanup so no late resource escapes it.
    await Promise.allSettled(pending);
    dispose();
    throw error;
  } finally {
    signal?.removeEventListener("abort", abort);
  }
}
