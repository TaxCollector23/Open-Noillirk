import { findPrompt, scoreAnswer } from "@/lib/game-data";

export const dynamic = "force-dynamic";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const prompt = findPrompt(body?.promptId);
  if (!prompt) return Response.json({ error: "Prompt not found" }, { status: 404 });
  return Response.json({ ...scoreAnswer(prompt, body.answer) });
}
