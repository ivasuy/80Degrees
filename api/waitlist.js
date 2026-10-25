import { joinWaitlist } from "../server/waitlist.js";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Send a valid signup request." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  return joinWaitlist(body);
}
