import { createHash } from "node:crypto";
import { put, head } from "@vercel/blob";

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

  // Private, immutable records: concurrent/repeated signups cannot overwrite the
  // original consent timestamp. Email addresses never appear in object paths.
  // Production and development use separate stores connected in Vercel.
  const key = createHash("sha256").update(email).digest("hex");
  const pathname = `waitlist/${key}.json`;
  try {
    await put(
      pathname,
      JSON.stringify({
        email,
        joinedAt: new Date().toISOString(),
        consent: "80degrees launch updates",
        emailVerified: false,
      }),
      {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: false,
        contentType: "application/json",
      },
    );
  } catch (error) {
    // Blob has no typed duplicate-key error. Confirm the saved record exists;
    // do not mistake an unavailable store or failed write for a successful signup.
    try {
      await head(pathname);
    } catch {
      console.error("Waitlist storage failed", { name: error.name });
      return reply(
        { error: "We couldn’t save your signup. Please try again shortly." },
        503,
      );
    }
  }
  // Identical response for new and existing entries avoids disclosing membership.
  return reply({ success: true });
}
