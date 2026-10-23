import { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";

// A brand angle countdown, not a simulated asset-loading percentage.
export default function IntroSequence({ onComplete }) {
  const [leaving, setLeaving] = useState(false);
  const number = useRef(null);
  const surface = useRef(null);
  const done = useRef(onComplete);
  const skipped = useRef(false);
  done.current = onComplete;

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches || window.location.hash) {
      done.current();
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    let frame;
    let exitTimer;
    const start = performance.now();
    const finish = () => {
      setLeaving(true);
      exitTimer = setTimeout(() => done.current(), 760);
    };
    const update = (now) => {
      if (skipped.current) return;
      const progress = Math.min((now - start) / 1650, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      number.current.textContent = String(Math.round(eased * 80)).padStart(
        2,
        "0",
      );
      surface.current.style.setProperty("--angle", `${eased * 80}deg`);
      surface.current.style.setProperty("--intro-progress", eased);
      if (progress < 1) frame = requestAnimationFrame(update);
      else finish();
    };
    frame = requestAnimationFrame(update);
    const preferenceChanged = () => {
      if (reduced.matches) done.current();
    };
    reduced.addEventListener("change", preferenceChanged);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(exitTimer);
      reduced.removeEventListener("change", preferenceChanged);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const skip = () => {
    skipped.current = true;
    done.current();
  };
  return (
    <div
      ref={surface}
      className={`intro-sequence${leaving ? " intro-leaving" : ""}`}
      role="region"
      aria-label="80degrees opening sequence"
    >
      <div className="intro-top">
        <span>80degrees</span>
        <span>A NEW ANGLE ON CREATING</span>
      </div>
      <div className="intro-center" aria-hidden="true">
        <div className="intro-orbit">
          <span className="intro-needle" />
          <span className="intro-orbit-dot" />
        </div>
        <div className="intro-number">
          <span ref={number}>00</span>
          <sup>°</sup>
        </div>
        <div className="intro-phrase">
          A little shift.
          <br />
          <i>A whole new world.</i>
        </div>
      </div>
      <div className="intro-bottom">
        <span>IMAGINATION → POSSIBILITY</span>
        <button onClick={skip}>
          Skip intro <ArrowUpRight size={16} />
        </button>
      </div>
      <div className="intro-line" aria-hidden="true" />
    </div>
  );
}
