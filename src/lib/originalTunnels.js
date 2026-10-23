import * as THREE from "three";
import { loadSceneGeometry } from "./originalAstronaut";

// Geometry and fracture keyframes are served by lusion.co / lusion.dev.
// Rendering and scroll integration here are independent; no asset license is implied.
const clamp = (v) => Math.max(0, Math.min(1, v));
const unit = new THREE.Vector3(1, 1, 1);

export async function loadOriginalTunnels(signal) {
  const resources = [];
  const textures = [];
  const keep = (value) => { resources.push(value); return value; };
  const texture = async (file, color = false) => {
    const response = await fetch(`/scene/lusion/${file}`, { signal });
    if (!response.ok) throw new Error(`Scene texture: ${file} (${response.status})`);
    const bitmap = await createImageBitmap(await response.blob(), { imageOrientation: "flipY" });
    const map = new THREE.Texture(bitmap);
    map.flipY = false;
    map.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.needsUpdate = true;
    textures.push(map);
    return map;
  };
  const files = ["grid_structure_ld", "grid_base_ld", "grid_structure_hd", "grid_base_hd", "tunnel_block_base", "tunnel_block_wall", "broken_glass", "broken_glass_animation", "diamond"];
  const loaded = await Promise.allSettled([
    ...files.map(async (name) => keep(await loadSceneGeometry(name, signal))),
    texture("greeble_base.webp", true), texture("greeble_nor.webp"), texture("greeble_arm.webp"), texture("white_block.webp", true),
  ]);
  const dispose = () => {
    resources.forEach((value) => value.dispose());
    textures.forEach((map) => { map.source.data?.close?.(); map.dispose(); });
  };
  const failure = loaded.find((result) => result.status === "rejected");
  if (failure || signal.aborted) { dispose(); throw failure?.reason || new DOMException("Aborted", "AbortError"); }
  const [structureLow, baseLow, structureHigh, baseHigh, block, wall, glassGeo, glassAnimation, diamondGeo, baseMap, normalMap, armMap, whiteMap] = loaded.map((result) => result.value);
  const dark = new THREE.Group();
  const bright = new THREE.Group();
  const debris = new THREE.Group();
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const rotation = new THREE.Quaternion();
  const axis = new THREE.Vector3();
  const scale = new THREE.Vector3();
  const zAxis = new THREE.Vector3(0, 0, 1);
  const palettes = [new THREE.Color("#1acbb6"), new THREE.Color("#ed5218"), new THREE.Color("#e8a522"), new THREE.Color("#da318a")];
  const tint = new THREE.Color();
  const metal = keep(new THREE.MeshStandardMaterial({ color: "#788382", metalness: 0.95, roughness: 0.24, map: baseMap, normalMap, roughnessMap: armMap, metalnessMap: armMap, side: THREE.DoubleSide }));
  const lightMaterial = keep(new THREE.MeshStandardMaterial({ color: "#b3e6e0", emissive: "#81e2d7", emissiveIntensity: 3, metalness: 0.5, roughness: 0.28 }));
  const barGeometry = keep(new THREE.BoxGeometry(0.13, 0.13, 2));
  const warpUniform = { value: 0 };
  // Lusion's stereographic tunnel deformation, applied per vertex after
  // instancing. Rigidly rotating each beam loses the authored curved passage.
  const warpShader = `
    uniform float tunnelWarp;
    vec3 warpTunnel(vec3 pos) {
      float t = tunnelWarp * 6.2831853;
      float zWeight = pos.z * 0.025;
      float angle = t * zWeight * zWeight * sign(zWeight);
      float sa = sin(angle), ca = cos(angle);
      pos.xy = mat2(ca, -sa, sa, ca) * pos.xy;
      pos.z += t;
      pos = pos.xzy / 20.0;
      vec2 pq = vec2(-1.0, 0.5) * t;
      float ada = dot(pos, pos);
      vec4 b = vec4(2.0 * pos, ada - 1.0) / (1.0 + ada);
      vec4 pqCS = vec4(cos(pq), sin(pq)).xzyw;
      vec2 signs = vec2(-1.0, 1.0);
      vec4 c = (b.xxyy * signs.yxyy * pqCS + b.zzww * signs.yyxy * pqCS.yxwz).xzyw;
      pos = c.xyz / (1.0 - c.w);
      return pos.xzy * 20.0;
    }
  `;
  for (const material of [metal, lightMaterial]) {
    material.onBeforeCompile = (shader) => {
      shader.uniforms.tunnelWarp = warpUniform;
      shader.vertexShader = warpShader + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace("#include <project_vertex>", `
        vec4 mvPosition = instanceMatrix * vec4(transformed, 1.0);
        mvPosition.xyz = warpTunnel(mvPosition.xyz);
        mvPosition = modelViewMatrix * mvPosition;
        gl_Position = projectionMatrix * mvPosition;
      `);
    };
  }

  // The source uses separate near/far structures. Preserve both authored layouts.
  for (const [geometry, high] of [[baseLow, false], [baseHigh, true]]) {
    const points = geometry.attributes.position;
    const heights = geometry.attributes.height;
    for (let i = 0; i < points.count; i++) {
      let x = points.getX(i), y = points.getY(i), z = points.getZ(i);
      if (high) {
        const face = Math.floor(x + 0.5);
        x -= face;
        y = y * heights.getX(i) + 0.025;
        const a = face * Math.PI / 2;
        const rx = x * Math.cos(a) - y * Math.sin(a);
        y = x * Math.sin(a) + y * Math.cos(a);
        x = rx;
      }
      points.setXYZ(i, x * 20, y * 20, z * 20);
    }
    points.needsUpdate = true;
    geometry.computeVertexNormals();
    // The unfolded HD faces change their tangent basis. Let the material derive
    // it from the deformed positions/UVs instead of retaining authored tangents.
    geometry.deleteAttribute("tangent");
  }
  const layers = [[structureLow, baseLow], [structureHigh, baseHigh]].map(([layout, geometry]) => {
    const mesh = new THREE.InstancedMesh(geometry, metal, layout.attributes.position.count);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
    dark.add(mesh);
    return { layout, mesh };
  });
  const lights = new THREE.InstancedMesh(barGeometry, lightMaterial, structureHigh.attributes.position.count);
  lights.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  lights.frustumCulled = false;
  dark.add(lights);

  const whiteMaterial = keep(new THREE.MeshStandardMaterial({ color: "#e7ad79", map: whiteMap, metalness: 0.65, roughness: 0.17, emissive: "#8d3211", emissiveIntensity: 0.3, side: THREE.DoubleSide }));
  const whiteWallMaterial = keep(new THREE.MeshStandardMaterial({ color: "#bf6635", metalness: 0.82, roughness: 0.2, map: whiteMap, side: THREE.DoubleSide }));
  const segments = [block, wall].map((geometry, i) => {
    const mesh = new THREE.InstancedMesh(geometry, i ? whiteWallMaterial : whiteMaterial, 16);
    mesh.frustumCulled = false;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    bright.add(mesh);
    return mesh;
  });

  const frameMaterial = keep(new THREE.MeshStandardMaterial({ color: "#39332e", roughness: 0.25, metalness: 0.9 }));
  const frameGeometry = keep(new THREE.BoxGeometry(1, 1, 1));
  const monitor = new THREE.Group();
  for (let side = 0; side < 4; side++) {
    const rim = new THREE.Mesh(frameGeometry, frameMaterial);
    const horizontal = side < 2;
    rim.scale.set(horizontal ? 3.15 : 0.065, horizontal ? 0.065 : 1.82, 0.085);
    rim.position.set(horizontal ? 0 : (side === 2 ? -1 : 1) * 1.54, horizontal ? (side === 0 ? -1 : 1) * 0.88 : 0, 0);
    monitor.add(rim);
  }
  const screenMaterial = keep(new THREE.MeshBasicMaterial({ color: "#ffffff" }));
  const screen = new THREE.Mesh(keep(new THREE.PlaneGeometry(3.04, 1.7)), screenMaterial);
  screen.position.z = -0.025;
  monitor.add(screen);
  monitor.position.z = 22;

  // Source fracture: 946 pieces, 15 frames. Interpolate GPU positions, not random shards.
  const pieces = 946;
  const positions = glassAnimation.attributes.position.array;
  const orientations = glassAnimation.attributes.orient.array;
  const frameCount = positions.length / (pieces * 3);
  const positionPixels = new Float32Array(pieces * frameCount * 4);
  for (let i = 0; i < positions.length / 3; i++) positionPixels.set(positions.subarray(i * 3, i * 3 + 3), i * 4);
  const positionMap = keep(new THREE.DataTexture(positionPixels, pieces, frameCount, THREE.RGBAFormat, THREE.FloatType));
  const orientationMap = keep(new THREE.DataTexture(orientations, pieces, frameCount, THREE.RGBAFormat, THREE.FloatType));
  positionMap.needsUpdate = orientationMap.needsUpdate = true;
  const glassUniforms = { fractureFrame: { value: 0 }, fractureScale: { value: 1 }, fracturePositions: { value: positionMap }, fractureOrientations: { value: orientationMap } };
  const glassMaterial = keep(new THREE.MeshPhysicalMaterial({ color: "#b9d6dc", metalness: 0.3, roughness: 0.12, transparent: true, opacity: 0.16, side: THREE.DoubleSide, flatShading: true, depthWrite: false }));
  glassMaterial.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, glassUniforms);
    shader.vertexShader = `attribute float piece; uniform float fractureFrame; uniform float fractureScale; uniform sampler2D fracturePositions; uniform sampler2D fractureOrientations;
    vec3 rotateShard(vec4 q, vec3 p) { return p + 2.0 * cross(q.xyz, cross(q.xyz, p) + q.w * p); }
    ` + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", `
      float f0 = floor(fractureFrame); float f1 = min(f0 + 1.0, ${frameCount - 1}.0);
      vec2 uv0 = vec2((piece + 0.5) / 946.0, (f0 + 0.5) / ${frameCount}.0);
      vec2 uv1 = vec2(uv0.x, (f1 + 0.5) / ${frameCount}.0);
      vec3 p0 = rotateShard(texture2D(fractureOrientations, uv0), position * fractureScale) + texture2D(fracturePositions, uv0).xyz;
      vec3 p1 = rotateShard(texture2D(fractureOrientations, uv1), position * fractureScale) + texture2D(fracturePositions, uv1).xyz;
      vec3 transformed = mix(p0, p1, fract(fractureFrame));
    `);
  };
  const glass = new THREE.Mesh(glassGeo, glassMaterial);
  glass.frustumCulled = false;
  glass.position.z = 22;
  glass.scale.setScalar(1.72);

  const gemMaterial = keep(new THREE.MeshPhysicalMaterial({ color: "#b8d9d5", metalness: 0.65, roughness: 0.08, clearcoat: 1 }));
  const diamonds = new THREE.InstancedMesh(diamondGeo, gemMaterial, 40);
  diamonds.frustumCulled = false;
  debris.add(diamonds);
  const tokenMaterial = keep(new THREE.MeshStandardMaterial({ color: "#dd713e", metalness: 0.6, roughness: 0.24, emissive: "#54200d", emissiveIntensity: 0.3 }));
  const tokens = new THREE.InstancedMesh(keep(new THREE.TorusGeometry(0.1, 0.025, 8, 24, Math.PI * 1.55)), tokenMaterial, 20);
  tokens.frustumCulled = false;
  debris.add(tokens);

  const update = (progress, time) => {
    const travel = clamp((progress - 0.30) / 0.46);
    const warp = clamp((progress - 0.60) / 0.16);
    warpUniform.value = 1 - Math.cos(warp * Math.PI * 0.5);
    const distance = travel * 290 + time * 5;
    const palette = travel * (palettes.length - 1);
    const index = Math.min(palettes.length - 2, Math.floor(palette));
    tint.copy(palettes[index]).lerp(palettes[index + 1], palette - index);
    lightMaterial.emissive.copy(tint);
    lightMaterial.color.copy(tint);
    lightMaterial.emissiveIntensity = 2.4 + warp * 2;
    for (const { layout, mesh } of layers) {
      const positions = layout.attributes.position;
      const axes = layout.attributes.rotAxis;
      for (let i = 0; i < positions.count; i++) {
        position.fromBufferAttribute(positions, i);
        position.z += distance % 20;
        axis.fromBufferAttribute(axes, i);
        rotation.setFromAxisAngle(axis, Math.PI * 0.5);
        matrix.compose(position, rotation, unit);
        mesh.setMatrixAt(i, matrix);
        if (layout === structureHigh) {
          position.x += 0.7;
          scale.setScalar(1 + (i % 3) * 0.45);
          matrix.compose(position, rotation, scale);
          lights.setMatrixAt(i, matrix);
        }
      }
      mesh.instanceMatrix.needsUpdate = true;
    }
    lights.instanceMatrix.needsUpdate = true;
    dark.position.z = -80 * (1 - clamp(travel / 0.16));
    const whiteProgress = clamp((progress - 0.76) / 0.12);
    for (const mesh of segments) {
      for (let i = 0; i < 16; i++) {
        const depth = i / 15;
        const a = (1 - whiteProgress) * (depth * 9 + 1.8);
        position.set(Math.sin(depth * 6) * (1 - whiteProgress) * 3, Math.cos(depth * 6) * (1 - whiteProgress) * 3, 12 - i * (7 + 10 * (1 - whiteProgress)));
        rotation.setFromAxisAngle(zAxis, a);
        scale.set(15 * (1 - depth * 0.3), 15 * (1 - depth * 0.3), 15);
        matrix.compose(position, rotation, scale);
        mesh.setMatrixAt(i, matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    }
    const retract = clamp((progress - 0.88) / 0.05);
    monitor.scale.setScalar(1.8 - retract * 0.8);
    monitor.rotation.set(0, -0.12 * Math.sin(retract * Math.PI), 0.035 * Math.sin(retract * Math.PI));
    const breakProgress = clamp((progress - 0.925) / 0.055);
    glassUniforms.fractureFrame.value = breakProgress * (frameCount - 1);
    glassUniforms.fractureScale.value = 1 - clamp((progress - 0.97) / 0.03);
    glassMaterial.opacity = 0.16 * (1 - clamp((progress - 0.98) / 0.02));
    glass.visible = progress >= 0.925 && progress < 0.999;
    monitor.visible = progress >= 0.88 && progress < 0.96;
    monitor.scale.multiplyScalar(1 - clamp((progress - 0.95) / 0.01));
    const emerge = clamp((progress - 0.94) / 0.05);
    debris.visible = emerge > 0;
    for (let i = 0; i < 40; i++) {
      const a = i * 2.39996 + time * 0.08;
      const radius = 0.9 + (i % 7) * 0.24;
      position.set(Math.cos(a) * radius, Math.sin(a) * radius * 0.7, 21.5 + (i % 4) * 0.2);
      rotation.setFromAxisAngle(axis.set(0.5, 0.8, 0.3).normalize(), time * 0.3 + i);
      scale.setScalar((0.035 + (i % 4) * 0.013) * emerge);
      matrix.compose(position, rotation, scale);
      diamonds.setMatrixAt(i, matrix);
      if (i < 20) {
        scale.setScalar(emerge * (0.4 + (i % 3) * 0.12));
        matrix.compose(position, rotation, scale);
        tokens.setMatrixAt(i, matrix);
      }
    }
    diamonds.instanceMatrix.needsUpdate = tokens.instanceMatrix.needsUpdate = true;
  };
  return { dark, bright, monitor, screenMaterial, glass, debris, update, dispose };
}
