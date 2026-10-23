import { useEffect } from "react";

const clamp = (value) => Math.max(0, Math.min(1, value));

// Scroll work is coalesced into one frame. No continuous DOM animation loop.
// Each section has a different job: departure, word illumination, assembly, arrival.
export default function useScrollMotion(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const hero = root.querySelector(".hero");
    const manifesto = root.querySelector(".manifesto");
    const words = [...root.querySelectorAll(".manifesto-word")];
    const grid = root.querySelector(".projects-grid");
    const process = root.querySelector(".process-demo");
    const footer = root.querySelector(".footer-wordmark");
    const progress = root.querySelector(".scroll-progress");
    let cards = [...grid.querySelectorAll(".project-card")];
    let frame = null;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    root
      .querySelectorAll(
        "[data-reveal], .process-copy, .create-heading, .idea-form",
      )
      .forEach((element) => observer.observe(element));

    const update = () => {
      frame = null;
      const vh = innerHeight;
      const height = document.documentElement.scrollHeight - vh;
      progress.style.transform = `scaleX(${height > 0 ? scrollY / height : 0})`;
      const quiet = media.matches;
      const heroRect = hero.getBoundingClientRect();
      hero.style.setProperty(
        "--hero-progress",
        quiet ? 0 : clamp(-heroRect.top / heroRect.height),
      );
      const manifestoRect = manifesto.getBoundingClientRect();
      const reading = clamp((vh * 0.85 - manifestoRect.top) / (vh * 0.55));
      words.forEach((word, index) =>
        word.classList.toggle(
          "word-lit",
          quiet || reading >= index / words.length,
        ),
      );
      cards.forEach((card, index) => {
        const rect = card.getBoundingClientRect();
        const arrival = quiet ? 1 : clamp((vh - rect.top) / (vh * 0.68));
        const direction = index % 2 === 0 ? -1 : 1;
        card.style.setProperty("--card-y", `${(1 - arrival) * 70}px`);
        card.style.setProperty(
          "--card-rotate",
          `${(1 - arrival) * 4 * direction}deg`,
        );
        card.style.setProperty("--card-scale", 0.94 + arrival * 0.06);
      });
      const processProgress = quiet
        ? 1
        : clamp((vh - process.getBoundingClientRect().top) / (vh * 0.75));
      process.style.setProperty("--demo-arrival", processProgress);
      const footerProgress = quiet
        ? 1
        : clamp((vh - footer.getBoundingClientRect().top) / (vh * 0.55));
      footer.style.setProperty("--footer-arrival", footerProgress);
    };
    const schedule = () => {
      if (frame == null) frame = requestAnimationFrame(update);
    };
    const mutation = new MutationObserver(() => {
      cards = [...grid.querySelectorAll(".project-card")];
      schedule();
    });
    mutation.observe(grid, { childList: true });
    const resize = new ResizeObserver(schedule);
    resize.observe(root);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    media.addEventListener("change", schedule);
    update();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      mutation.disconnect();
      resize.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      media.removeEventListener("change", schedule);
    };
  }, [rootRef]);
}
