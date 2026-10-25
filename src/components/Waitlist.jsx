import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Check } from "lucide-react";
import "./waitlist.css";

export default function Waitlist() {
  const section = useRef(null);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    const element = section.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;

    // The brand makes one 80-degree entrance, never an unattended loop.
    // CSS also pauses it immediately under the site's .motion-paused control.
    const syncMotion = () => {
      element.dataset.motion =
        visible && !document.hidden && !reducedMotion.matches
          ? "running"
          : "paused";
      if (visible) element.dataset.entered = "true";
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        syncMotion();
      },
      { threshold: 0 },
    );

    observer.observe(element);
    document.addEventListener("visibilitychange", syncMotion);
    reducedMotion.addEventListener("change", syncMotion);
    syncMotion();

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", syncMotion);
      reducedMotion.removeEventListener("change", syncMotion);
    };
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    if (status === "submitting") return;
    const consent = new FormData(event.currentTarget).get("consent") === "yes";
    setStatus("submitting");
    setError("");
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), consent }),
      });
      const data = await response.json();
      if (!response.ok || data.success !== true) {
        setError(
          data.error || "We couldn’t save your signup. Please try again.",
        );
        setStatus("error");
        return;
      }
      setStatus("success");
    } catch {
      setError(
        "We couldn’t reach the waitlist. Check your connection and try again.",
      );
      setStatus("error");
    }
  };

  return (
    <section
      ref={section}
      className="waitlist section-wrap"
      id="waitlist"
      aria-labelledby="waitlist-title"
      data-motion="paused"
    >
      <div className="waitlist-copy">
        <svg
          className="waitlist-mark"
          viewBox="0 0 512 512"
          fill="none"
          aria-hidden="true"
        >
          <path
            className="waitlist-mark-arc"
            d="M376 310A154 154 0 1 1 336 142"
            stroke="currentColor"
            strokeWidth="60"
            strokeLinecap="round"
          />
          <circle
            className="waitlist-mark-dot"
            cx="424"
            cy="169"
            r="33"
            fill="currentColor"
          />
        </svg>
        <h2 id="waitlist-title">
          Your idea deserves
          <br />
          <span className="serif waitlist-head-start">a head start.</span>
        </h2>
        <p>
          From a plain-English idea to a working product.
          Join the 80degrees waitlist for launch updates.
        </p>
      </div>
      <div className="waitlist-signup">
        {status === "success" ? (
          <div className="waitlist-success" role="status">
            <span className="waitlist-success-mark">
              <Check size={28} aria-hidden="true" />
            </span>
            <h3>You’re on the list.</h3>
            <p>We’ll email you with 80degrees launch updates. Until then, keep that idea close.</p>
          </div>
        ) : (
          <form onSubmit={submit} aria-busy={status === "submitting"}>
            <h3 className="waitlist-form-title">Make room for your next idea.</h3>
            <label className="waitlist-email-label" htmlFor="waitlist-email">
              Email address
            </label>
            <div className="waitlist-input-row">
              <input
                id="waitlist-email"
                name="email"
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="you@example.com"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError("");
                }}
                required
                maxLength={254}
                readOnly={status === "submitting"}
                aria-describedby={
                  error ? "waitlist-error" : "waitlist-consent-text"
                }
              />
              <button
                className="button waitlist-submit"
                type="submit"
                disabled={status === "submitting"}
              >
                {status === "submitting" ? "Joining…" : "Join waitlist"}
                <ArrowUpRight size={18} aria-hidden="true" />
              </button>
            </div>
            <label className="waitlist-consent">
              <input
                name="consent"
                type="checkbox"
                value="yes"
                required
                disabled={status === "submitting"}
              />
              <span id="waitlist-consent-text">
                Email me about the 80degrees launch.
              </span>
            </label>
            <div className="waitlist-message">
              {error && (
                <p id="waitlist-error" role="alert">
                  {error}
                </p>
              )}
              {status === "submitting" && (
                <p role="status">Saving your signup…</p>
              )}
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
