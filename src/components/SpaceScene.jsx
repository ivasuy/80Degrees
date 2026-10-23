import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

// Astronaut by Poly, CC BY 2.0, distributed by modelviewer.dev.
// Adaptation: lighting, scale, orbital choreography, and an 80degrees chest badge.
// Visible attribution is included in ScrollStory. All motion is derived from scroll.
export default function SpaceScene({ progress, paused, reduced }) {
  const host = useRef(null);
  const options = useRef({ paused, reduced });
  const [status, setStatus] = useState("loading");
  useEffect(() => {
    options.current = { paused, reduced };
  }, [paused, reduced]);

  useEffect(() => {
    const container = host.current;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch {
      setStatus("unavailable");
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(39, 1, 0.1, 100);
    camera.position.set(0, 0, 10);
    const room = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = pmrem.fromScene(room, 0.05);
    scene.environment = environment.texture;
    scene.environmentIntensity = 0.45;
    scene.add(new THREE.HemisphereLight(0xe4edff, 0x26130c, 2));
    const key = new THREE.DirectionalLight(0xffecd6, 4);
    key.position.set(-3, 5, 6);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xe47742, 7);
    rim.position.set(4, -1, -3);
    scene.add(rim);
    const fill = new THREE.DirectionalLight(0xc7d9f2, 1.7);
    fill.position.set(-4, 1, 2);
    scene.add(fill);

    const explorer = new THREE.Group();
    scene.add(explorer);
    const copper = new THREE.MeshStandardMaterial({
      color: 0xbb5833,
      metalness: 0.85,
      roughness: 0.3,
    });
    const orbit = new THREE.Group();
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.4, 0.065, 16, 160),
      copper,
    );
    ring.rotation.x = 1.25;
    ring.rotation.y = 0.15;
    orbit.add(ring);
    const ring2 = new THREE.Mesh(
      new THREE.TorusGeometry(3.15, 0.012, 8, 160),
      new THREE.MeshBasicMaterial({
        color: 0x8b6649,
        transparent: true,
        opacity: 0.5,
      }),
    );
    ring2.rotation.set(0.8, -0.5, 0.5);
    orbit.add(ring2);
    const satellite = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 24, 16),
      copper,
    );
    orbit.add(satellite);
    scene.add(orbit);

    const planet = new THREE.Mesh(
      new THREE.SphereGeometry(4.6, 64, 40),
      new THREE.MeshStandardMaterial({
        color: 0x160b05,
        roughness: 1,
        metalness: 0.15,
      }),
    );
    planet.position.set(4.6, -5.8, -7);
    scene.add(planet);
    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(4.72, 48, 32),
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.BackSide,
        uniforms: { color: { value: new THREE.Color(0xdf7b49) } },
        vertexShader: `varying vec3 vNormal; varying vec3 vView; void main(){ vec4 p=modelViewMatrix*vec4(position,1.); vNormal=normalize(normalMatrix*normal); vView=normalize(-p.xyz); gl_Position=projectionMatrix*p; }`,
        fragmentShader: `uniform vec3 color; varying vec3 vNormal; varying vec3 vView; void main(){ float rim=pow(1.-abs(dot(normalize(vNormal),normalize(vView))),3.); gl_FragColor=vec4(color,rim*.48); }`,
      }),
    );
    atmosphere.position.copy(planet.position);
    scene.add(atmosphere);

    const positions = new Float32Array(540 * 3);
    let seed = 80;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] = (random() - 0.5) * 35;
      positions[i + 1] = (random() - 0.5) * 22;
      positions[i + 2] = -5 - random() * 15;
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3),
    );
    const stars = new THREE.Points(
      starGeometry,
      new THREE.PointsMaterial({
        size: 0.022,
        color: 0xe6daca,
        transparent: true,
        opacity: 0.65,
        depthWrite: false,
      }),
    );
    scene.add(stars);

    let disposed = false;
    const release = (root) => {
      const textures = new Set();
      const materials = new Set();
      const geometries = new Set();
      root.traverse((object) => {
        if (object.geometry) geometries.add(object.geometry);
        if (object.material)
          (Array.isArray(object.material)
            ? object.material
            : [object.material]
          ).forEach((material) => materials.add(material));
      });
      materials.forEach((material) => {
        Object.values(material).forEach((value) => {
          if (value?.isTexture) textures.add(value);
        });
        material.dispose();
      });
      textures.forEach((texture) => {
        texture.dispose();
        texture.source?.data?.close?.();
      });
      geometries.forEach((geometry) => geometry.dispose());
    };
    const controller = new AbortController();
    fetch("/models/astronaut.glb", { signal: controller.signal })
      .then((response) => {
        if (!response.ok)
          throw new Error(`Astronaut asset: ${response.status}`);
        return response.arrayBuffer();
      })
      .then((buffer) => new GLTFLoader().parseAsync(buffer, "/models/"))
      .then((gltf) => {
        if (disposed) {
          release(gltf.scene);
          return;
        }
        const model = gltf.scene;
        const bounds = new THREE.Box3().setFromObject(model);
        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());
        const scale = 4.2 / size.y;
        model.scale.setScalar(scale);
        model.position.copy(center).multiplyScalar(-scale);
        explorer.add(model);
        // The small copper badge makes the explorer part of the 80degrees world.
        const badge = new THREE.Group();
        const badgeBase = new THREE.Mesh(
          new THREE.BoxGeometry(0.42, 0.28, 0.035),
          new THREE.MeshStandardMaterial({ color: 0xad421f, roughness: 0.6 }),
        );
        badge.add(badgeBase);
        const badgeMark = new THREE.Mesh(
          new THREE.TorusGeometry(0.075, 0.015, 8, 28, Math.PI * 1.55),
          new THREE.MeshBasicMaterial({ color: 0xf7f5ef }),
        );
        badgeMark.rotation.z = 0.7;
        badgeMark.position.z = 0.025;
        badge.add(badgeMark);
        const badgeDot = new THREE.Mesh(
          new THREE.SphereGeometry(0.018, 10, 8),
          badgeMark.material,
        );
        badgeDot.position.set(0.086, 0.05, 0.025);
        badge.add(badgeDot);
        badge.position.set(0.26, 0.55, 0.56);
        explorer.add(badge);
        setStatus("ready");
      })
      .catch((error) => {
        if (!disposed && error.name !== "AbortError") setStatus("unavailable");
      });

    let visible = false;
    let mobile = false;
    let frame = 0;
    let last = performance.now();
    let time = 0;
    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      if (!width || !height) return;
      mobile = width < 760;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.position.z = mobile ? 11.8 : 10;
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    observer.observe(container);
    const interpolate = (a, b, t) => a + (b - a) * t;
    const animate = (now) => {
      frame = requestAnimationFrame(animate);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!visible || document.hidden) return;
      const { paused: stopped, reduced: quiet } = options.current;
      if (!stopped && !quiet) time += dt;
      // Text and geometry use the same scroll position, including fast jumps.
      const current = quiet ? 0 : progress.current;
      const segment = current < 0.5 ? current * 2 : (current - 0.5) * 2;
      const smooth = segment * segment * (3 - 2 * segment);
      const x =
        current < 0.5
          ? interpolate(2.15, -2.05, smooth)
          : interpolate(-2.05, 2.7, smooth);
      explorer.position.set(
        mobile ? Math.sin(current * Math.PI * 2) * 0.28 : x,
        (mobile ? -1.1 : -0.1) + Math.sin(time * 0.65) * 0.09,
        Math.sin(current * Math.PI) * 0.6,
      );
      explorer.scale.setScalar(mobile ? 0.77 : 1);
      explorer.rotation.set(
        0.08 + Math.sin(current * Math.PI * 2) * 0.14,
        -0.2 + Math.sin(current * Math.PI * 2) * 0.75,
        -0.2 +
          Math.sin(current * Math.PI * 2) * 0.48 +
          Math.sin(time * 0.4) * 0.035,
      );
      orbit.position.copy(explorer.position);
      orbit.scale.setScalar(mobile ? 0.69 : 1);
      orbit.rotation.set(
        current * 0.5,
        current * Math.PI * 0.8,
        current * Math.PI * 0.6 + time * 0.025,
      );
      satellite.position.set(
        Math.cos(current * Math.PI * 3 + time * 0.12) * 2.65,
        Math.sin(current * Math.PI * 3 + time * 0.12) * 1.32,
        Math.sin(current * Math.PI * 3 + time * 0.12) * 2.2,
      );
      stars.rotation.z = current * 0.08;
      planet.position.x = 4.6 - current * 5;
      atmosphere.position.copy(planet.position);
      renderer.render(scene, camera);
    };
    resize();
    frame = requestAnimationFrame(animate);
    return () => {
      disposed = true;
      controller.abort();
      cancelAnimationFrame(frame);
      observer.disconnect();
      resizeObserver.disconnect();
      release(scene);
      environment.dispose();
      pmrem.dispose();
      room.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [progress]);

  return (
    <div
      ref={host}
      className="space-scene"
      data-scene-status={status}
      aria-hidden="true"
    >
      {status === "loading" && (
        <span className="space-loading">Preparing your next perspective…</span>
      )}
      {status === "unavailable" && (
        <span className="space-loading">
          The 3D scene is unavailable. Keep scrolling to explore the story.
        </span>
      )}
    </div>
  );
}
