import { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import "./intro.css";

const REVEAL_DURATION = 1450;
const EXIT_DURATION = 500;

export default function IntroSequence({ onComplete }) {
  const [leaving, setLeaving] = useState(false);
  const surface = useRef(null);
  const done = useRef(onComplete);
  const finish = useRef(null);
  const completed = useRef(false);
  done.current = onComplete;

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const previousOverflow = document.body.style.overflow;
    let active = true;
    let locked = false;
    let revealTimer;
    let exitTimer;

    const release = () => {
      clearTimeout(revealTimer);
      clearTimeout(exitTimer);
      if (locked) {
        document.body.style.overflow = previousOverflow;
        locked = false;
      }
    };
    const complete = () => {
      if (!active || completed.current) return;
      completed.current = true;
      release();
      done.current();
    };
    finish.current = complete;

    const preferenceChanged = () => {
      if (reduced.matches) complete();
    };
    const keyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        complete();
      }
    };

    if (reduced.matches || window.location.hash) {
      complete();
    } else {
      document.body.style.overflow = "hidden";
      locked = true;
      surface.current?.focus({ preventScroll: true });
      revealTimer = setTimeout(() => {
        if (!active || completed.current) return;
        setLeaving(true);
        exitTimer = setTimeout(complete, EXIT_DURATION);
      }, REVEAL_DURATION);
      reduced.addEventListener("change", preferenceChanged);
      window.addEventListener("keydown", keyDown);
    }

    return () => {
      active = false;
      release();
      reduced.removeEventListener("change", preferenceChanged);
      window.removeEventListener("keydown", keyDown);
      finish.current = null;
    };
  }, []);

  return (
    <div
      ref={surface}
      className={`intro-sequence${leaving ? " intro-leaving" : ""}`}
      style={{ "--intro-exit-duration": `${EXIT_DURATION}ms` }}
      role="region"
      aria-label="80degrees opening sequence"
      tabIndex={-1}
    >
      <div className="intro-top">
        <span>80degrees</span>
        <span>A NEW ANGLE ON CREATING</span>
      </div>
      <div className="intro-center">
        <div className="intro-lockup" aria-label="80degrees">
          <svg
            className="intro-mark"
            viewBox="0 0 512 512"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M376 310A154 154 0 1 1 336 142"
              stroke="currentColor"
              strokeWidth="60"
              strokeLinecap="round"
              pathLength="1"
            />
            <circle cx="424" cy="169" r="33" fill="currentColor" />
          </svg>
          <span className="intro-wordmark" aria-hidden="true">
            80degrees
          </span>
        </div>
        <p className="intro-phrase">
          A little shift. <i>A whole new world.</i>
        </p>
      </div>
      <div className="intro-bottom">
        <span>IMAGINATION → POSSIBILITY</span>
        <button
          type="button"
          onClick={() => finish.current?.()}
          aria-keyshortcuts="Escape"
        >
          Skip intro <ArrowUpRight size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
