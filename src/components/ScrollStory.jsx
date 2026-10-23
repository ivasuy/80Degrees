import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUpRight, Pause, Play } from "lucide-react";
const SpaceScene = lazy(() => import("./SpaceScene"));

const chapters = [
  {
    label: "The spark",
    title: (
      <>
        Every big thing
        <br />
        starts with <i>what if.</i>
      </>
    ),
    text: "Before the first page. Before the first line. There’s a thought that won’t leave you alone.",
  },
  {
    label: "The shift",
    title: (
      <>
        Leave the ordinary.
        <br />
        Find <i>your angle.</i>
      </>
    ),
    text: "A different perspective changes everything. Explore the unexpected. Make space for something only you could imagine.",
  },
  {
    label: "The possibility",
    title: (
      <>
        You didn’t come
        <br />
        this far to <i>just imagine.</i>
      </>
    ),
    text: "A website. An app. A whole new world. Bring it back from the unknown — and make it real.",
  },
];

export default function ScrollStory({ paused, onTogglePause }) {
  const section = useRef(null);
  const progress = useRef(0);
  const [nearby, setNearby] = useState(false);
  const [reduced, setReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReduced(media.matches);
    media.addEventListener("change", change);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNearby(true);
          observer.disconnect();
        }
      },
      { rootMargin: "1000px" },
    );
    observer.observe(section.current);
    return () => {
      observer.disconnect();
      media.removeEventListener("change", change);
    };
  }, []);

  useEffect(() => {
    const root = section.current;
    const panels = [...root.querySelectorAll(".story-chapter")];
    const links = [...root.querySelectorAll(".story-chapters button")];
    const meter = root.querySelector(".story-meter-fill");
    const angle = root.querySelector(".story-angle-value");
    let frame;
    const update = () => {
      frame = null;
      const rect = root.getBoundingClientRect();
      const value = Math.max(
        0,
        Math.min(1, -rect.top / Math.max(rect.height - innerHeight, 1)),
      );
      progress.current = value;
      const active = value < 0.33 ? 0 : value < 0.68 ? 1 : 2;
      root.dataset.chapter = String(active);
      panels.forEach((panel, index) => {
        const center = [0.1, 0.5, 0.9][index];
        const enter =
          index === 0
            ? 1
            : Math.max(0, Math.min(1, (value - [0, 0.33, 0.68][index]) / 0.08));
        const exit =
          index === 2
            ? 1
            : Math.max(0, Math.min(1, ([0.33, 0.68, 1][index] - value) / 0.08));
        const opacity = Math.min(enter, exit);
        panel.style.opacity = reduced ? 1 : opacity;
        panel.style.transform = reduced
          ? "none"
          : `translateY(${(value - center) * -100}px)`;
        panel.style.filter = reduced ? "none" : `blur(${(1 - opacity) * 5}px)`;
        panel.setAttribute("aria-hidden", String(!reduced && active !== index));
        panel.inert = !reduced && active !== index;
      });
      links.forEach((link, index) =>
        link.setAttribute("aria-current", index === active ? "step" : "false"),
      );
      meter.style.transform = `scaleX(${value})`;
      angle.textContent = String(Math.round(value * 80)).padStart(2, "0");
    };
    const schedule = () => {
      if (frame == null) frame = requestAnimationFrame(update);
    };
    const resize = new ResizeObserver(schedule);
    resize.observe(root);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    update();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [reduced]);

  const goTo = (index) => {
    const root = section.current;
    if (reduced) {
      root
        .querySelectorAll(".story-chapter")
        [index].scrollIntoView({ behavior: "auto", block: "center" });
      return;
    }
    const offset = root.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({
      top: offset + (root.offsetHeight - innerHeight) * [0.1, 0.5, 0.9][index],
      behavior: "smooth",
    });
  };

  return (
    <section
      ref={section}
      className="scroll-story"
      id="story"
      aria-label="An 80degrees journey from idea to creation"
    >
      <div className="story-stage">
        <div className="story-ambient" aria-hidden="true" />
        {nearby && (
          <Suspense fallback={null}>
            <SpaceScene progress={progress} paused={paused} reduced={reduced} />
          </Suspense>
        )}
        <div className="story-topline">
          <a href="#platform" className="story-brand">
            80degrees <span>EXPLORATIONS</span>
          </a>
          <span className="story-coordinate">
            IMAGINATION HAS NO COORDINATES
          </span>
          <button
            onClick={onTogglePause}
            aria-label={
              paused
                ? "Play story ambient motion"
                : "Pause story ambient motion"
            }
          >
            {paused ? <Play size={14} /> : <Pause size={14} />}
          </button>
        </div>
        <div className="story-copy">
          {chapters.map((chapter, index) => (
            <article
              className={`story-chapter story-chapter-${index}`}
              key={chapter.label}
            >
              <span className="story-chapter-label">
                <span>0{index + 1}</span> / {chapter.label}
              </span>
              <h2>{chapter.title}</h2>
              <p>{chapter.text}</p>
              {index === 2 && (
                <a href="#builds" className="story-cta">
                  See what’s possible <ArrowUpRight size={19} />
                </a>
              )}
            </article>
          ))}
        </div>
        <div className="story-angle" aria-hidden="true">
          <span className="story-angle-value">00</span>
          <sup>°</sup>
          <small>A CHANGE IN PERSPECTIVE.</small>
        </div>
        <div className="story-bottom">
          <div className="story-chapters" aria-label="Story chapters">
            {chapters.map((chapter, index) => (
              <button
                key={chapter.label}
                onClick={() => goTo(index)}
                aria-current={index === 0 ? "step" : "false"}
              >
                <span>0{index + 1}</span>
                {chapter.label}
              </button>
            ))}
          </div>
          <a href="#builds" className="story-skip">
            Skip to the possibilities <ArrowDown size={14} />
          </a>
        </div>
        <div className="story-meter" aria-hidden="true">
          <span className="story-meter-fill" />
        </div>
      </div>
      <div className="story-credit">
        Astronaut by{" "}
        <a
          href="https://modelviewer.dev/examples/scenegraph/"
          target="_blank"
          rel="noreferrer"
        >
          Poly
        </a>{" "}
        ·{" "}
        <a
          href="https://creativecommons.org/licenses/by/2.0/"
          target="_blank"
          rel="noreferrer"
        >
          CC BY 2.0
        </a>{" "}
        · Lighting, badge & motion adapted for 80degrees.
      </div>
    </section>
  );
}
