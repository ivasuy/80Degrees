import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUpRight, Pause, Play } from "lucide-react";
const SpaceScene = lazy(() => import("./SpaceScene"));

const chapters = [
  { label: "Departure", progress: 0.12 },
  { label: "Beyond", progress: 0.5 },
  { label: "Arrival", progress: 0.97 },
];
const titleLines = [
  "STEP INTO A NEW WORLD",
  "AND TURN YOUR",
  "IMAGINATION INTO REALITY",
];
const range = (value, start, end) =>
  Math.max(0, Math.min(1, (value - start) / (end - start)));

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
    const stage = root.querySelector(".story-stage");
    const title = root.querySelector(".story-title");
    const arrival = root.querySelector(".story-arrival");
    const links = [...root.querySelectorAll(".story-chapters a")];
    const meter = root.querySelector(".story-meter-fill");
    let frame;
    const update = () => {
      frame = null;
      const rect = root.getBoundingClientRect();
      const value = reduced
        ? 0.12
        : Math.max(0, Math.min(1, -rect.top / Math.max(rect.height - stage.offsetHeight, 1)));
      progress.current = value;
      const enter = range(value, 0.08, 0.11);
      const exit = 1 - range(value, 0.27, 0.3);
      const scale = 0.85 + 0.15 * enter + 11 * range(value, 0.18, 0.3) ** 3;
      const titleVisible = reduced || (value > 0.08 && value < 0.3);
      const arrivalVisible = reduced || value > 0.94;
      title.style.opacity = reduced ? 1 : Math.min(enter, exit);
      title.style.transform = reduced ? "none" : `scale(${scale})`;
      title.style.setProperty("--word-spread", reduced ? 0 : range(value, 0.15, 0.21));
      title.setAttribute("aria-hidden", String(!titleVisible));
      title.inert = !titleVisible;
      arrival.style.opacity = reduced ? 1 : range(value, 0.94, 0.97);
      arrival.style.transform = reduced ? "none" : `translateY(${(1 - range(value, 0.94, 0.97)) * 18}px)`;
      arrival.setAttribute("aria-hidden", String(!arrivalVisible));
      arrival.inert = !arrivalVisible;
      const active = value < 0.3 ? 0 : value < 0.88 ? 1 : 2;
      links.forEach((link, index) =>
        link.setAttribute("aria-current", index === active ? "step" : "false"),
      );
      meter.style.transform = `scaleX(${value})`;
    };
    const schedule = () => {
      if (frame == null) frame = requestAnimationFrame(update);
    };
    const resize = new ResizeObserver(schedule);
    resize.observe(root);
    resize.observe(stage);
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

  const goTo = (event, value) => {
    event.preventDefault();
    const root = section.current;
    const stage = root.querySelector(".story-stage");
    const offset = root.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({
      top: offset + (root.offsetHeight - stage.offsetHeight) * value,
      behavior: reduced ? "auto" : "smooth",
    });
  };

  return (
    <section
      ref={section}
      className="scroll-story"
      id="story"
      aria-label="An 80degrees journey from idea to creation"
    >
      {chapters.map((chapter) => (
        <span
          key={chapter.label}
          id={`story-${chapter.label.toLowerCase()}`}
          className="story-waypoint"
          style={{ "--chapter-progress": chapter.progress }}
          aria-hidden="true"
        />
      ))}
      <div className="story-stage">
        {nearby && (
          <Suspense fallback={null}>
            <SpaceScene progress={progress} paused={paused} reduced={reduced} />
          </Suspense>
        )}
        <div className="story-topline">
          <a href="#platform" className="story-brand">80degrees</a>
          <button
            onClick={onTogglePause}
            aria-label={paused ? "Play story ambient motion" : "Pause story ambient motion"}
            aria-pressed={paused}
          >
            {paused ? <Play size={14} /> : <Pause size={14} />}
          </button>
        </div>
        <div className="story-copy">
          <h2 className="story-title" aria-label={titleLines.join(" ")} aria-hidden={!reduced}>
            {titleLines.map((line) => {
              const words = line.split(" ");
              return (
                <span className="story-title-line" key={line} aria-hidden="true">
                  {words.map((word, index) => (
                    <span
                      key={`${word}-${index}`}
                      style={{ "--word-offset": index - (words.length - 1) / 2 }}
                    >
                      {word}
                    </span>
                  ))}
                </span>
              );
            })}
          </h2>
          <div className="story-arrival" aria-hidden={!reduced} inert={reduced ? undefined : ""}>
            <span className="story-arrival-brand">80degrees</span>
            <a href="#builds" className="story-cta">
              Bring your next idea to life. <ArrowUpRight size={20} />
            </a>
          </div>
        </div>
        <div className="story-bottom">
          <nav className="story-chapters" aria-label="Story chapters">
            {chapters.map((chapter, index) => (
              <a
                key={chapter.label}
                href={`#story-${chapter.label.toLowerCase()}`}
                onClick={(event) => goTo(event, chapter.progress)}
                aria-current={index === 0 ? "step" : "false"}
              >
                {chapter.label}
              </a>
            ))}
          </nav>
          <a href="#builds" className="story-skip">
            Skip story <ArrowDown size={14} />
          </a>
        </div>
        <div className="story-credit">
          Original scene assets: <a href="https://lusion.co/" target="_blank" rel="noreferrer" title="Original meshes, textures, and animation by Lusion. Local rendering adapted for 80degrees. Downloading these assets does not establish commercial reuse rights.">Lusion</a>
        </div>
        <div className="story-meter" aria-hidden="true">
          <span className="story-meter-fill" />
        </div>
      </div>
    </section>
  );
}
