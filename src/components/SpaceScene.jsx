import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { frameCorners } from "three/addons/utils/CameraUtils.js";
import { loadOriginalAstronaut } from "../lib/originalAstronaut";
import { loadOriginalTunnels } from "../lib/originalTunnels";

const clamp = (v) => Math.max(0, Math.min(1, v));
const range = (v, from, to) => clamp((v - from) / (to - from));
const smooth = (value, from, to) => {
  const t = range(value, from, to);
  return t * t * (3 - 2 * t);
};

// Original meshes, baked skeleton, entrance/exit and fracture tracks: Lusion.
// Local Three.js rendering; the source website is neither embedded nor hotlinked.
export default function SpaceScene({ progress, paused, reduced }) {
  const host = useRef(null);
  const options = useRef({ paused, reduced });
  const [status, setStatus] = useState("loading");
  useEffect(() => {
    options.current = { paused, reduced };
  }, [paused, reduced]);

  useEffect(() => {
    const container = host.current;
    const controller = new AbortController();
    let disposed = false;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      });
    } catch {
      setStatus("unavailable");
      return;
    }
    renderer.setPixelRatio(
      Math.min(devicePixelRatio, innerWidth < 760 ? 1 : 1.25),
    );
    const palette = getComputedStyle(document.documentElement);
    const night = new THREE.Color(
      palette.getPropertyValue("--night").trim() || "#151310",
    );
    renderer.setClearColor(night, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.85;
    container.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.background = night;
    scene.fog = new THREE.FogExp2(night, 0.009);
    const camera = new THREE.PerspectiveCamera(45, 1, 0.08, 300);
    camera.position.set(0, 0, 25);
    const screenCamera = camera.clone();
    const screenBottomLeft = new THREE.Vector3();
    const screenBottomRight = new THREE.Vector3();
    const screenTopLeft = new THREE.Vector3();
    const room = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = pmrem.fromScene(room, 0.04);
    scene.environment = environment.texture;
    scene.environmentIntensity = 0.38;
    const hemisphere = new THREE.HemisphereLight(0xf6f3eb, 0x27241f, 0.65);
    const sun = new THREE.DirectionalLight(0xffecd7, 3.4);
    sun.position.set(-8, 12, 27);
    const rim = new THREE.DirectionalLight(0xffffff, 2.6);
    rim.position.set(4, 3, 8);
    const copper = new THREE.PointLight(0xe67a45, 28, 40, 1.5);
    copper.position.set(-5, 0, 16);
    const cool = new THREE.PointLight(0xf6dfbb, 22, 40, 1.5);
    cool.position.set(5, 4, 10);
    scene.add(hemisphere, sun, rim, copper, cool);
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.3, 0.35, 1.2);
    const output = new OutputPass();
    composer.addPass(renderPass);
    composer.addPass(bloom);
    composer.addPass(output);
    const screenTarget = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType,
    });

    const planetGeometry = new THREE.SphereGeometry(45, 48, 24);
    const planetMaterial = new THREE.MeshStandardMaterial({
      color: 0x211912,
      roughness: 1,
      metalness: 0.1,
    });
    const planet = new THREE.Mesh(planetGeometry, planetMaterial);
    planet.position.set(0, -48, -60);
    scene.add(planet);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
      vertexShader:
        "varying vec3 n; varying vec3 v; void main(){vec4 p=modelViewMatrix*vec4(position,1.0); n=normalize(normalMatrix*normal);v=normalize(-p.xyz);gl_Position=projectionMatrix*p;}",
      fragmentShader:
        "varying vec3 n; varying vec3 v; void main(){float a=pow(1.0-abs(dot(normalize(n),normalize(v))),4.0);gl_FragColor=vec4(0.68,0.29,0.10,a*0.32);}",
    });
    const atmosphere = new THREE.Mesh(planetGeometry, atmosphereMaterial);
    atmosphere.scale.setScalar(1.012);
    atmosphere.position.copy(planet.position);
    scene.add(atmosphere);
    let earthMap;
    fetch("/scene/lusion/earth_landscape.jpg", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Earth texture unavailable");
        return response.blob();
      })
      .then((blob) => createImageBitmap(blob, { imageOrientation: "flipY" }))
      .then((bitmap) => {
        if (disposed) {
          bitmap.close();
          return;
        }
        earthMap = new THREE.Texture(bitmap);
        earthMap.flipY = false;
        earthMap.colorSpace = THREE.SRGBColorSpace;
        earthMap.needsUpdate = true;
        planetMaterial.map = earthMap;
        planetMaterial.needsUpdate = true;
      })
      .catch((error) => {
        if (!disposed && error.name !== "AbortError") console.warn(error);
      });

    let astronaut;
    let tunnels;
    let prepared = false;
    const echoes = [];
    const pending = [
      loadOriginalAstronaut({ signal: controller.signal }),
      loadOriginalTunnels(controller.signal),
    ];
    Promise.allSettled(pending).then(async (results) => {
      if (disposed || results.some((result) => result.status === "rejected")) {
        results.forEach((result) => {
          if (result.status === "fulfilled") result.value.dispose();
        });
        if (!disposed) {
          const error = results.find(
            (result) => result.status === "rejected",
          ).reason;
          console.error("Original scene asset loading failed", error);
          setStatus("unavailable");
        }
        return;
      }
      astronaut = results[0].value;
      tunnels = results[1].value;
      scene.add(
        astronaut.object,
        tunnels.dark,
        tunnels.bright,
        tunnels.monitor,
        tunnels.glass,
        tunnels.debris,
      );
      tunnels.screen.material.map = screenTarget.texture;
      resize();
      for (let i = 0; i < 6; i++) {
        const echo = astronaut.object.clone(true);
        echo.visible = false;
        scene.add(echo);
        echoes.push(echo);
      }
      // Compile the tunnel, fracture and suit variants before revealing the
      // canvas, rather than stalling at their first scroll-driven appearance.
      try {
        await renderer.compileAsync(scene, camera);
      } catch (error) {
        if (!disposed) {
          console.error("Scene preparation failed", error);
          setStatus("unavailable");
        }
        return;
      }
      if (disposed) return;
      prepared = true;
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
    const entrancePose = new THREE.Object3D();
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
      if (event.clientY < rect.top || event.clientY > rect.bottom) {
        pointer.set(0, 0);
        return;
      }
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        ((event.clientY - rect.top) / rect.height) * 2 - 1,
      );
    };
    window.addEventListener("pointermove", movePointer, { passive: true });
    let mobile = false;
    let needsRender = true;
    const resize = () => {
      // Use layout dimensions, not a transformed preview's bounding rectangle.
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (!width || !height) return;
      mobile = width < 760;
      const pixelRatio = Math.min(devicePixelRatio, mobile ? 1 : 1.25);
      if (renderer.getPixelRatio() !== pixelRatio) {
        renderer.setPixelRatio(pixelRatio);
        composer.setPixelRatio(pixelRatio);
      }
      renderer.setSize(width, height, false);
      composer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      if (tunnels) {
        const surface = tunnels.screen.geometry.parameters;
        screenCamera.aspect = surface.width / surface.height;
        const targetWidth = Math.min(
          960,
          Math.ceil(Math.max(width, height * screenCamera.aspect)),
        );
        screenTarget.setSize(
          targetWidth,
          Math.round(targetWidth / screenCamera.aspect),
        );
        screenCamera.updateProjectionMatrix();
      }
      needsRender = true;
    };
    let visible = false;
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
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
    let smoothedProgress = null;
    const animate = (now) => {
      frame = requestAnimationFrame(animate);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!visible || document.hidden || !prepared) return;
      const { paused: stopped, reduced: quiet } = options.current;
      const goal = quiet ? 0.03 : clamp(progress.current);
      if (smoothedProgress === null || stopped || quiet)
        smoothedProgress = goal;
      else
        smoothedProgress +=
          (goal - smoothedProgress) * (1 - Math.exp(-dt * 18));
      if (Math.abs(goal - smoothedProgress) < 0.00001) smoothedProgress = goal;
      const p = smoothedProgress;
      if (
        !needsRender &&
        (stopped || quiet) &&
        p === lastProgress &&
        lastQuiet === quiet &&
        (quiet || (pointer.x === lastPointerX && pointer.y === lastPointerY))
      )
        return;
      needsRender = false;
      if (!stopped && !quiet) time += dt;
      lastProgress = p;
      lastQuiet = quiet;
      lastPointerX = pointer.x;
      lastPointerY = pointer.y;
      const departure = range(p, 0.03, 0.3);
      const tunnelProgress = range(p, 0.3, 0.76);
      const returning = range(p, 0.76, 0.95);
      const breaking = smooth(p, 0.925, 0.98);
      // The baked segments are not loops. Ping-pong within a segment and blend
      // into the next pose instead of wrapping from frame 88 straight to zero.
      const idleFrame = 44 - Math.cos(time * 0.48) * 38;
      const arrivalFrame = 140 + (1 - Math.cos(time * 0.35)) * 68;
      const approachFrame = THREE.MathUtils.lerp(
        idleFrame,
        90,
        smooth(p, 0.9, 0.925),
      );
      const floating = THREE.MathUtils.lerp(
        approachFrame + breaking * 49,
        arrivalFrame,
        smooth(p, 0.98, 1),
      );
      astronaut.update(quiet ? 12 : floating);
      sampleTrajectory(astronaut.entrance, departure ** 3, entrancePose);
      if (p < 0.74) {
        astronaut.object.position.copy(entrancePose.position);
        astronaut.object.quaternion.copy(entrancePose.quaternion);
      } else {
        sampleTrajectory(
          astronaut.exit,
          returning * 0.79 + range(p, 0.95, 1) * 0.21,
          astronaut.object,
        );
        const handoff = smooth(p, 0.74, 0.8);
        astronaut.object.position.lerpVectors(
          entrancePose.position,
          astronaut.object.position,
          handoff,
        );
        quaternion1.copy(astronaut.object.quaternion);
        astronaut.object.quaternion.slerpQuaternions(
          entrancePose.quaternion,
          quaternion1,
          handoff,
        );
      }
      const driftAmount = tunnelProgress * (1 - smooth(p, 0.69, 0.77));
      driftEuler.set(
        Math.sin(time * 0.43) * 0.3 * driftAmount,
        Math.sin(time * 0.31) * 0.5 * driftAmount,
        Math.sin(time * 0.29) * 0.35 * driftAmount,
      );
      drift.setFromEuler(driftEuler);
      astronaut.object.quaternion.multiply(drift);
      astronaut.object.position.x += Math.sin(time * 0.37) * driftAmount * 1.4;
      astronaut.object.position.y += Math.cos(time * 0.29) * driftAmount * 0.8;
      astronaut.object.position.y -= smooth(p, 0.95, 1) * 0.45;
      astronaut.object.scale.setScalar(mobile ? 0.8 : 1);
      astronaut.object.visible = true;
      const echoScale = smooth(p, 0.4, 0.46) * (1 - smooth(p, 0.68, 0.75));
      for (let i = 0; i < echoes.length; i++) {
        const echo = echoes[i];
        echo.visible = echoScale > 0;
        if (!echo.visible) continue;
        const a = (i * Math.PI) / 3 + time * 0.13;
        const radius = 4 + (i % 3) * 3;
        echo.position.set(
          Math.cos(a) * radius,
          Math.sin(a) * radius,
          5 - i * 5,
        );
        echo.quaternion.copy(astronaut.object.quaternion);
        echo.scale.setScalar(0.7 * echoScale);
      }
      const warp = smooth(p, 0.6, 0.76);
      const passage = smooth(p, 0.735, 0.785);
      const tunnelEnvelope =
        smooth(p, 0.27, 0.34) * (1 - smooth(p, 0.85, 0.92));
      const dolly = Math.sin(Math.PI * smooth(p, 0.72, 0.88));
      camera.fov =
        45 +
        dolly * 23 +
        Math.sin(tunnelProgress * 10 + time * 0.25) * 2 * tunnelEnvelope;
      if (mobile) camera.fov += 9;
      camera.updateProjectionMatrix();
      target.set(
        quiet ? 0 : pointer.x * 0.12,
        quiet ? 0 : -pointer.y * 0.12,
        13,
      );
      camera.lookAt(target);
      camera.rotateZ(warp * (1 - smooth(p, 0.76, 0.82)) * 0.5);
      planet.visible = atmosphere.visible = p < 0.34;
      planet.position.y = -48 - departure * 60;
      atmosphere.position.copy(planet.position);
      sun.intensity = 0.85 - tunnelEnvelope * 0.45;
      hemisphere.intensity = 0.3 - tunnelEnvelope * 0.1;
      rim.intensity = 1.3 - tunnelEnvelope * 0.6;
      copper.intensity = 8 + smooth(p, 0.32, 0.46) * 22;
      cool.intensity = 10 + tunnelEnvelope * 14;
      bloom.strength = 0.12 + tunnelEnvelope * (0.28 + warp * 0.12);
      tunnels.update(p, time);
      tunnels.dark.visible = p >= 0.26 && passage < 1;
      tunnels.bright.visible = passage > 0 && p < 0.96;
      if (p >= 0.88 && p < 0.96) {
        // Keep the astronaut inside the screen image while it is behind the
        // monitor plane. Removing it here made it disappear before emergence.
        tunnels.monitor.visible = false;
        tunnels.glass.visible = false;
        tunnels.debris.visible = false;
        // Treat the monitor as a window into the scene. Framing its world-space
        // corners preserves perspective at every viewport ratio and keeps the
        // on-screen astronaut aligned with the real mesh during emergence.
        const screen = tunnels.screen;
        const { width, height } = screen.geometry.parameters;
        screen.updateWorldMatrix(true, false);
        screenBottomLeft
          .set(-width / 2, -height / 2, 0)
          .applyMatrix4(screen.matrixWorld);
        screenBottomRight
          .set(width / 2, -height / 2, 0)
          .applyMatrix4(screen.matrixWorld);
        screenTopLeft
          .set(-width / 2, height / 2, 0)
          .applyMatrix4(screen.matrixWorld);
        screenCamera.position.copy(camera.position);
        frameCorners(
          screenCamera,
          screenBottomLeft,
          screenBottomRight,
          screenTopLeft,
        );
        renderer.setRenderTarget(screenTarget);
        renderer.render(scene, screenCamera);
        renderer.setRenderTarget(null);
        tunnels.bright.visible = false;
        tunnels.monitor.visible = true;
        tunnels.glass.visible = p >= 0.925;
        tunnels.debris.visible = p >= 0.94;
      }
      container.dataset.stage =
        p < 0.3
          ? "departure"
          : p < 0.76
            ? "tunnel"
            : p < 0.88
              ? "transition"
              : p < 0.95
                ? "breakthrough"
                : "arrival";
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

  return (
    <div
      ref={host}
      className="space-scene"
      data-scene-status={status}
      aria-hidden="true"
    >
      {status === "loading" && (
        <span className="space-loading">Preparing the journey…</span>
      )}
      {status === "unavailable" && (
        <span className="space-loading">
          The 3D scene could not load. You can still explore the builds below.
        </span>
      )}
    </div>
  );
}
