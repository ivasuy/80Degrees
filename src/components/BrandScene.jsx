import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export default function BrandScene({ paused }) {
  const host = useRef(null);
  const pause = useRef(paused);
  const [available, setAvailable] = useState(true);
  useEffect(() => {
    pause.current = paused;
  }, [paused]);

  useEffect(() => {
    const container = host.current;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setAvailable(false);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    // Neutral product lighting preserves the logo's rust rather than a filmic hue shift.
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1;
    container.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const palette = getComputedStyle(container);
    const brandColor = new THREE.Color(palette.getPropertyValue("--rust").trim());
    const ivory = new THREE.Color(palette.getPropertyValue("--paper").trim());
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 0, 11);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, 0.04);
    scene.environment = environment.texture;
    scene.environmentIntensity = 0.35;
    const ambient = new THREE.HemisphereLight(ivory, brandColor, 0.55);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(ivory, 1.1);
    key.position.set(-4, 5, 6);
    scene.add(key);
    const edge = new THREE.DirectionalLight(ivory, 0.8);
    edge.position.set(5, 2, -3);
    scene.add(edge);
    const material = new THREE.MeshPhysicalMaterial({
      color: brandColor,
      metalness: 0.1,
      roughness: 0.45,
      clearcoat: 0.15,
      clearcoatRoughness: 0.4,
    });
    const cream = new THREE.MeshPhysicalMaterial({
      color: ivory,
      metalness: 0.4,
      roughness: 0.26,
    });
    const group = new THREE.Group();
    const arc = Math.PI * 1.57;
    const radius = 1.85;
    const tube = 0.54;
    const geometry = new THREE.TorusGeometry(radius, tube, 48, 140, arc);
    const ring = new THREE.Mesh(geometry, material);
    ring.rotation.z = Math.PI * 0.22;
    group.add(ring);
    const sphere = new THREE.SphereGeometry(tube, 48, 32);
    for (const angle of [ring.rotation.z, ring.rotation.z + arc]) {
      const cap = new THREE.Mesh(sphere, material);
      cap.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
      group.add(cap);
    }
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.49, 48, 32),
      material,
    );
    dot.position.set(2.5, 1.85, 0.02);
    group.add(dot);
    group.rotation.set(-0.28, -0.44, -0.2);
    scene.add(group);
    const satellite = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 24, 24),
      cream,
    );
    satellite.position.set(-2.45, 2.25, -0.8);
    scene.add(satellite);
    const satellite2 = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 24, 24),
      material,
    );
    satellite2.position.set(2.4, -2.2, 0.4);
    scene.add(satellite2);
    const pointer = new THREE.Vector2();
    let dragging = false;
    let dragX = 0;
    let rotation = 0;
    let visible = true;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.position.z = camera.aspect < 0.9 ? 13 : 11;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    visibility.observe(container);
    const move = (event) => {
      const rect = container.getBoundingClientRect();
      pointer.set(
        (event.clientX - rect.left) / rect.width - 0.5,
        (event.clientY - rect.top) / rect.height - 0.5,
      );
      if (dragging) {
        rotation += (event.clientX - dragX) * 0.008;
        dragX = event.clientX;
      }
    };
    const down = (event) => {
      dragging = true;
      dragX = event.clientX;
      container.setPointerCapture(event.pointerId);
    };
    const up = () => {
      dragging = false;
    };
    const leave = () => {
      pointer.set(0, 0);
    };
    container.addEventListener("pointermove", move);
    container.addEventListener("pointerdown", down);
    container.addEventListener("pointerup", up);
    container.addEventListener("pointercancel", up);
    container.addEventListener("pointerleave", leave);
    let frame;
    let time = 0;
    let last = performance.now();
    const animate = (now) => {
      frame = requestAnimationFrame(animate);
      const delta = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!visible || document.hidden) return;
      if (!pause.current && !reduced.matches) time += delta;
      const motion = reduced.matches ? 0 : 1;
      const scroll = Math.min(window.scrollY / window.innerHeight, 1);
      group.rotation.x +=
        (-0.28 +
          pointer.y * 0.25 * motion +
          Math.sin(time * 0.35) * 0.08 -
          group.rotation.x) *
        0.045;
      group.rotation.y +=
        (-0.44 +
          rotation +
          pointer.x * 0.5 * motion +
          scroll * 0.7 * motion -
          group.rotation.y) *
        0.045;
      group.rotation.z = -0.18 + Math.sin(time * 0.3) * 0.05;
      group.position.y = Math.sin(time * 0.65) * 0.12;
      satellite.position.y = 2.25 + Math.sin(time * 0.8) * 0.16;
      satellite2.position.y = -2.2 + Math.cos(time * 0.6) * 0.15;
      renderer.render(scene, camera);
    };
    resize();
    frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      visibility.disconnect();
      container.removeEventListener("pointermove", move);
      container.removeEventListener("pointerdown", down);
      container.removeEventListener("pointerup", up);
      container.removeEventListener("pointercancel", up);
      container.removeEventListener("pointerleave", leave);
      const geometries = new Set();
      scene.traverse((object) => {
        if (object.geometry) geometries.add(object.geometry);
      });
      geometries.forEach((item) => item.dispose());
      material.dispose();
      cream.dispose();
      room.dispose();
      environment.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div
      className="brand-scene"
      ref={host}
      aria-label="Interactive rust-orange 80degrees sculpture. Drag to rotate."
    >
      {!available && (
        <svg
          className="scene-fallback"
          viewBox="0 0 512 512"
          aria-hidden="true"
        >
          <path
            d="M376 310A154 154 0 1 1 336 142"
            fill="none"
            stroke="currentColor"
            strokeWidth="60"
            strokeLinecap="round"
          />
          <circle cx="424" cy="169" r="33" fill="currentColor" />
        </svg>
      )}
    </div>
  );
}
