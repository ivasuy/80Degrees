import { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";

export default function ProjectCard({ project, paused }) {
  const card = useRef(null);
  const video = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(!document.hidden);
  const [loaded, setLoaded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const active = (hovered || focused) && allowed && visible && pageVisible && !paused;

  useEffect(() => {
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = matchMedia("(hover: hover) and (pointer: fine)");
    const updatePreference = () => setAllowed(!motion.matches && pointer.matches);
    const updateVisibility = () => setPageVisible(!document.hidden);
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
    );
    observer.observe(card.current);
    updatePreference();
    motion.addEventListener("change", updatePreference);
    pointer.addEventListener("change", updatePreference);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      observer.disconnect();
      motion.removeEventListener("change", updatePreference);
      pointer.removeEventListener("change", updatePreference);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  // Fetch only after hover/keyboard intent. Stop decoding when the card, page,
  // or motion preference is inactive; retain the poster and live link throughout.
  useEffect(() => {
    const player = video.current;
    if (!active) {
      player.pause();
      setPlaying(false);
      if (player.readyState > 0) player.currentTime = 0;
      return;
    }
    if (!loaded) {
      setLoaded(true);
      return;
    }
    player.play().catch(() => setPlaying(false));
    return () => player.pause();
  }, [active, loaded]);

  return (
    <a
      ref={card}
      className="project-card"
      href={project.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Visit ${project.name} live site (opens in a new tab)`}
      data-playing={playing}
      onPointerEnter={(event) => setHovered(event.pointerType === "mouse")}
      onPointerLeave={() => setHovered(false)}
      onFocus={(event) => setFocused(event.currentTarget.matches(":focus-visible"))}
      onBlur={() => setFocused(false)}
    >
      <div className="project-image">
        <img
          className="project-art"
          src={project.preview}
          alt={project.alt}
          width="1024"
          height="711"
          loading="lazy"
          decoding="async"
        />
        <video
          ref={video}
          className="project-art project-motion"
          src={loaded ? project.motion : undefined}
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
          tabIndex={-1}
          onPlaying={() => {
            if (active) setPlaying(true);
            else video.current.pause();
          }}
          onPause={() => setPlaying(false)}
          onError={() => setPlaying(false)}
        />
        <span className="project-open" aria-hidden="true">
          <ArrowUpRight size={21} />
        </span>
        <span className="project-hover-text">Visit live site</span>
      </div>
      <div className="project-meta">
        <div>
          <h3>{project.name}</h3>
          <span>{project.type}</span>
        </div>
        <span className="category-tag">Live site</span>
      </div>
    </a>
  );
}
