const FORMSPREE_ENDPOINT = "https://formspree.io/f/xdeeazvn";

const reply = (body, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function joinWaitlist(input) {
  const email =
    typeof input?.email === "string" ? input.email.trim().toLowerCase() : "";
  if (
    email.length > 254 ||
    !/^[^\s\x00-\x1f\x7f@]+@[^\s\x00-\x1f\x7f@]+\.[^\s\x00-\x1f\x7f@]+$/.test(
      email,
    )
  ) {
    return reply({ error: "Enter a valid email address." }, 400);
  }
  if (input.consent !== true) {
    return reply(
      { error: "Please agree to receive 80degrees launch updates." },
      400,
    );
  }

  // Both /api/waitlist adapters use this Formspree endpoint; there is no local
  // or Blob fallback. Formspree's JSON success contract includes `next`.
  try {
    const response = await fetch(FORMSPREE_ENDPOINT, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        consent: "Email me about the 80degrees launch.",
        consentGiven: true,
        consentAt: new Date().toISOString(),
      }),
      redirect: "error",
      signal: AbortSignal.timeout(10000),
    });

    if (response.status === 429) {
      return reply(
        { error: "Signups are busy right now. Please try again in a few minutes." },
        429,
      );
    }
    if (!response.ok) {
      return reply(
        { error: "We couldn’t save your signup. Please try again shortly." },
        503,
      );
    }

    const data = await response.json();
    if (
      !data ||
      typeof data.next !== "string" ||
      "error" in data ||
      "errors" in data
    ) {
      return reply(
        { error: "We couldn’t confirm your signup. Please try again shortly." },
        503,
      );
    }
  } catch {
    // Never expose or log email addresses, upstream responses, or request errors.
    return reply(
      { error: "We couldn’t confirm your signup. Please try again shortly." },
      503,
    );
  }
  return reply({ success: true });
}
