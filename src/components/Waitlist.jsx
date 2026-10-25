import { useState } from "react";
import { ArrowUpRight, Check } from "lucide-react";
import "./waitlist.css";

export default function Waitlist() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

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
      className="waitlist section-wrap"
      id="waitlist"
      aria-labelledby="waitlist-title"
    >
      <div className="waitlist-copy">
        <h2 id="waitlist-title">
          Be part of
          <br />
          <span className="serif">what’s next.</span>
        </h2>
        <p>
          Join the 80degrees waitlist for launch updates.
          <br />A new angle on creating, straight to your inbox.
        </p>
      </div>
      <div className="waitlist-signup">
        {status === "success" ? (
          <div className="waitlist-success" role="status">
            <Check size={28} aria-hidden="true" />
            <h3>You’re on the list.</h3>
            <p>Thanks for joining 80degrees. We’re glad you’re here.</p>
          </div>
        ) : (
          <form onSubmit={submit} aria-busy={status === "submitting"}>
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
                <p role="status">Saving your place…</p>
              )}
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
