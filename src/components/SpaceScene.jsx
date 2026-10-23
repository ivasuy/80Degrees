import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { loadOriginalAstronaut } from "../lib/originalAstronaut";
import { loadOriginalTunnels } from "../lib/originalTunnels";

const clamp = (v) => Math.max(0, Math.min(1, v));
const range = (v, from, to) => clamp((v - from) / (to - from));

// Original meshes, baked skeleton, entrance/exit and fracture tracks: Lusion.
// Local Three.js rendering; the source website is neither embedded nor hotlinked.
export default function SpaceScene({ progress, paused, reduced }) {
  const host = useRef(null);
  const options = useRef({ paused, reduced });
  const [status, setStatus] = useState("loading");
  useEffect(() => { options.current = { paused, reduced }; }, [paused, reduced]);

  useEffect(() => {
    const container = host.current;
    const controller = new AbortController();
    let disposed = false;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    } catch {
      setStatus("unavailable");
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 760 ? 1 : 1.25));
    renderer.setClearColor(0x030405, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.85;
    container.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030405);
    scene.fog = new THREE.FogExp2(0x030405, 0.009);
    const camera = new THREE.PerspectiveCamera(45, 1, 0.08, 300);
    camera.position.set(0, 0, 25);
    const room = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = pmrem.fromScene(room, 0.04);
    scene.environment = environment.texture;
    scene.environmentIntensity = 0.38;
    const hemisphere = new THREE.HemisphereLight(0xe2f4ff, 0x0d1114, 0.65);
    const sun = new THREE.DirectionalLight(0xe4f2ff, 3.4);
    sun.position.set(-8, 12, 27);
    const rim = new THREE.DirectionalLight(0xffffff, 2.6);
    rim.position.set(4, 3, 8);
    const copper = new THREE.PointLight(0xe67a45, 28, 40, 1.5);
    copper.position.set(-5, 0, 16);
    const cool = new THREE.PointLight(0x91dfdd, 22, 40, 1.5);
    cool.position.set(5, 4, 10);
    scene.add(hemisphere, sun, rim, copper, cool);
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.3, 0.35, 1.2);
    const output = new OutputPass();
    composer.addPass(renderPass);
    composer.addPass(bloom);
    composer.addPass(output);
    const screenTarget = new THREE.WebGLRenderTarget(960, 540, { type: THREE.HalfFloatType });

    const planetGeometry = new THREE.SphereGeometry(45, 48, 24);
    const planetMaterial = new THREE.MeshStandardMaterial({ color: 0x070e15, roughness: 1, metalness: 0.1 });
    const planet = new THREE.Mesh(planetGeometry, planetMaterial);
    planet.position.set(0, -48, -60);
    scene.add(planet);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.BackSide,
      vertexShader: "varying vec3 n; varying vec3 v; void main(){vec4 p=modelViewMatrix*vec4(position,1.0); n=normalize(normalMatrix*normal);v=normalize(-p.xyz);gl_Position=projectionMatrix*p;}",
      fragmentShader: "varying vec3 n; varying vec3 v; void main(){float a=pow(1.0-abs(dot(normalize(n),normalize(v))),4.0);gl_FragColor=vec4(0.18,0.36,0.58,a*0.38);}",
    });
    const atmosphere = new THREE.Mesh(planetGeometry, atmosphereMaterial);
    atmosphere.scale.setScalar(1.012);
    atmosphere.position.copy(planet.position);
    scene.add(atmosphere);
    let earthMap;
    fetch("/scene/lusion/earth_landscape.jpg", { signal: controller.signal })
      .then((response) => { if (!response.ok) throw new Error("Earth texture unavailable"); return response.blob(); })
      .then((blob) => createImageBitmap(blob, { imageOrientation: "flipY" }))
      .then((bitmap) => {
        if (disposed) { bitmap.close(); return; }
        earthMap = new THREE.Texture(bitmap);
        earthMap.flipY = false;
        earthMap.colorSpace = THREE.SRGBColorSpace;
        earthMap.needsUpdate = true;
        planetMaterial.map = earthMap;
        planetMaterial.needsUpdate = true;
      }).catch((error) => { if (!disposed && error.name !== "AbortError") console.warn(error); });

    let astronaut;
    let tunnels;
    const echoes = [];
    const pending = [loadOriginalAstronaut({ signal: controller.signal }), loadOriginalTunnels(controller.signal)];
    Promise.allSettled(pending).then((results) => {
      if (disposed || results.some((result) => result.status === "rejected")) {
        results.forEach((result) => { if (result.status === "fulfilled") result.value.dispose(); });
        if (!disposed) {
          const error = results.find((result) => result.status === "rejected").reason;
          console.error("Original scene asset loading failed", error);
          setStatus("unavailable");
        }
        return;
      }
      astronaut = results[0].value;
      tunnels = results[1].value;
      scene.add(astronaut.object, tunnels.dark, tunnels.bright, tunnels.monitor, tunnels.glass, tunnels.debris);
      tunnels.screenMaterial.map = screenTarget.texture;
      for (let i = 0; i < 6; i++) {
        const echo = astronaut.object.clone(true);
        echo.visible = false;
        scene.add(echo);
        echoes.push(echo);
      }
      setStatus("ready");
    });

    const pointer = new THREE.Vector2();
    const target = new THREE.Vector3(0, 0, 13);
    const position0 = new THREE.Vector3();
    const position1 = new THREE.Vector3();
    const quaternion0 = new THREE.Quaternion();
    const quaternion1 = new THREE.Quaternion();
    const drift = new THREE.Quaternion();
    const driftEuler = new THREE.Euler();
    const sampleTrajectory = (track, value, object) => {
      const frame = clamp(value) * (track.count - 1);
      const a = Math.floor(frame);
      const b = Math.min(a + 1, track.count - 1);
      position0.fromArray(track.position, a * 3);
      position1.fromArray(track.position, b * 3);
      object.position.copy(position0).lerp(position1, frame - a);
      quaternion0.fromArray(track.orient, a * 4);
      quaternion1.fromArray(track.orient, b * 4);
      object.quaternion.copy(quaternion0).slerp(quaternion1, frame - a);
    };
    const movePointer = (event) => {
      if (event.pointerType === "touch") return;
      const rect = container.getBoundingClientRect();
      if (event.clientY < rect.top || event.clientY > rect.bottom) { pointer.set(0, 0); return; }
      pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, (event.clientY - rect.top) / rect.height * 2 - 1);
    };
    window.addEventListener("pointermove", movePointer, { passive: true });
    let mobile = false;
    let needsRender = true;
    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      if (!width || !height) return;
      mobile = width < 760;
      renderer.setSize(width, height);
      composer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      screenTarget.setSize(Math.min(width, 960), Math.min(height, 600));
      needsRender = true;
    };
    let visible = false;
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    intersection.observe(container);
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    let frame = 0;
    let last = performance.now();
    let time = 0;
    let lastProgress = -1;
    let lastQuiet = null;
    let lastPointerX = 0;
    let lastPointerY = 0;
    const animate = (now) => {
      frame = requestAnimationFrame(animate);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!visible || document.hidden || !astronaut || !tunnels) return;
      const { paused: stopped, reduced: quiet } = options.current;
      const p = quiet ? 0.03 : clamp(progress.current);
      if (!needsRender && (stopped || quiet) && p === lastProgress && lastQuiet === quiet && (quiet || (pointer.x === lastPointerX && pointer.y === lastPointerY))) return;
      needsRender = false;
      if (!stopped && !quiet) time += dt;
      lastProgress = p;
      lastQuiet = quiet;
      lastPointerX = pointer.x;
      lastPointerY = pointer.y;
      const departure = range(p, 0.03, 0.30);
      const tunnelProgress = range(p, 0.30, 0.76);
      const returning = range(p, 0.76, 0.95);
      const breaking = range(p, 0.925, 0.98);
      const floating = p < 0.925 ? (time * 35) % 89 : p < 0.98 ? 90 + breaking * 49 : 140 + (time * 35) % 147;
      astronaut.update(quiet ? 12 : floating);
      if (p < 0.76) sampleTrajectory(astronaut.entrance, departure ** 3, astronaut.object);
      else sampleTrajectory(astronaut.exit, returning * 0.79 + range(p, 0.95, 1) * 0.21, astronaut.object);
      if (p >= 0.30 && p < 0.76) {
        driftEuler.set(Math.sin(time * 0.43) * 0.3 * tunnelProgress, Math.sin(time * 0.31) * 0.5 * tunnelProgress, Math.sin(time * 0.29) * 0.35 * tunnelProgress);
        drift.setFromEuler(driftEuler);
        astronaut.object.quaternion.multiply(drift);
        astronaut.object.position.x += Math.sin(time * 0.37) * tunnelProgress * 1.4;
        astronaut.object.position.y += Math.cos(time * 0.29) * tunnelProgress * 0.8;
      }
      // The source framing puts the helmet above center at arrival, not on a side panel.
      if (p > 0.95) astronaut.object.position.y -= range(p, 0.95, 1) * 0.45;
      astronaut.object.scale.setScalar(mobile ? 0.8 : 1);
      astronaut.object.visible = true;
      for (let i = 0; i < echoes.length; i++) {
        const echo = echoes[i];
        echo.visible = p > 0.41 && p < 0.74;
        if (!echo.visible) continue;
        const a = i * Math.PI / 3 + time * 0.13;
        const radius = 4 + (i % 3) * 3;
        echo.position.set(Math.cos(a) * radius, Math.sin(a) * radius, 5 - i * 5);
        echo.quaternion.copy(astronaut.object.quaternion);
        echo.scale.setScalar(0.7);
      }
      const warp = range(p, 0.60, 0.76);
      camera.fov = 45 + (p >= 0.76 && p < 0.88 ? (1 - range(p, 0.76, 0.88)) * 45 : Math.sin(tunnelProgress * 10 + time * 0.25) * 4 * tunnelProgress * (1 - returning));
      if (mobile) camera.fov += 9;
      camera.updateProjectionMatrix();
      target.set(quiet ? 0 : pointer.x * 0.12, quiet ? 0 : -pointer.y * 0.12, 13);
      camera.lookAt(target);
      camera.rotateZ(warp * (p < 0.76 ? 1 : 1 - range(p, 0.76, 0.80)) * 0.5);
      planet.visible = atmosphere.visible = p < 0.30;
      planet.position.y = -48 - departure * 40;
      atmosphere.position.copy(planet.position);
      sun.intensity = p < 0.3 || p > 0.90 ? 0.85 : 0.4;
      hemisphere.intensity = p < 0.3 || p > 0.90 ? 0.3 : 0.2;
      rim.intensity = p < 0.3 || p > 0.90 ? 1.3 : 0.7;
      copper.intensity = p > 0.4 ? 38 : 8;
      cool.intensity = p > 0.3 && p < 0.76 ? 32 : 10;
      bloom.strength = p > 0.30 && p < 0.88 ? 0.5 + warp * 0.4 : 0.12;
      tunnels.update(p, time);
      tunnels.dark.visible = p >= 0.30 && p < 0.76;
      tunnels.bright.visible = p >= 0.76 && p < 0.96;
      if (p >= 0.88 && p < 0.96) {
        // Render the live tunnel onto the retreating monitor; the astronaut stays
        // in the main scene and crosses its plane during the original exit track.
        tunnels.monitor.visible = false;
        tunnels.glass.visible = false;
        tunnels.debris.visible = false;
        astronaut.object.visible = false;
        renderer.setRenderTarget(screenTarget);
        renderer.render(scene, camera);
        renderer.setRenderTarget(null);
        astronaut.object.visible = true;
        tunnels.bright.visible = false;
        tunnels.monitor.visible = true;
        tunnels.glass.visible = p >= 0.925;
        tunnels.debris.visible = p >= 0.94;
      }
      container.dataset.stage = p < 0.30 ? "departure" : p < 0.76 ? "tunnel" : p < 0.88 ? "transition" : p < 0.95 ? "breakthrough" : "arrival";
      composer.render();
    };
    resize();
    frame = requestAnimationFrame(animate);
    return () => {
      disposed = true;
      controller.abort();
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", movePointer);
      resizeObserver.disconnect();
      intersection.disconnect();
      astronaut?.dispose();
      tunnels?.dispose();
      planetGeometry.dispose();
      planetMaterial.dispose();
      atmosphereMaterial.dispose();
      earthMap?.source.data?.close?.();
      earthMap?.dispose();
      screenTarget.dispose();
      bloom.dispose();
      output.dispose();
      composer.dispose();
      environment.dispose();
      pmrem.dispose();
      room.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [progress]);

  return <div ref={host} className="space-scene" data-scene-status={status} aria-hidden="true">
    {status === "loading" && <span className="space-loading">Preparing the journey…</span>}
    {status === "unavailable" && <span className="space-loading">The 3D scene could not load. You can still explore the builds below.</span>}
  </div>;
}
