import { boardForPrompt, findPrompt } from "@/lib/game-data";
import { isDealTicketFor } from "@/lib/tickets";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const searchParams = new URL(request.url).searchParams;
  const promptId = searchParams.get("promptId") ?? searchParams.get("prompt");
  const prompt = findPrompt(promptId);
  if (!prompt) return Response.json({ error: "Prompt not found" }, { status: 404 });
  if (!isDealTicketFor(searchParams.get("ticket"), prompt.id)) return Response.json({ error: "Deal this prompt again before reviewing its board." }, { status: 403 });
  return Response.json({ promptId: prompt.id, answers: boardForPrompt(prompt) });
}
