import { findCorrection, findPrompt, scoreAnswer } from "@/lib/game-data";
import { judgeAnswer } from "@/lib/answer-judge";
import { isDealTicketFor } from "@/lib/tickets";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const prompt = findPrompt(body?.promptId);
  if (!prompt) return Response.json({ error: "Prompt not found" }, { status: 404 });
  if (!isDealTicketFor(body?.ticket, prompt.id)) return Response.json({ error: "Deal this prompt again before submitting." }, { status: 403 });
  if (body?.previewCorrection && !body?.confirm && !scoreAnswer(prompt, body.answer).accepted) {
    const correction = findCorrection(prompt, body.answer);
    if (correction) return Response.json({ correction });
  }
  return Response.json({ ...(await judgeAnswer(prompt, body.answer)) });
}
