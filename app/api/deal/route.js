import { chooseLineup, dayNumber } from "@/lib/game";

export const dynamic = "force-dynamic";

function ticket(id) {
  return `${id}.${Math.random().toString(36).slice(2, 14)}`;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  return deal(searchParams.get("mode") ?? "classic", searchParams.get("day"), []);
}

export async function POST(request) {
  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  return deal(body.mode ?? "classic", body.day, Array.isArray(body.recent) ? body.recent : []);
}

function deal(mode, requestedDay, recent) {
  const day = requestedDay || new Date().toISOString().slice(0, 10);
  const lineup = chooseLineup({ mode, day, recent });
  const tickets = Object.fromEntries(lineup.map((prompt) => [prompt.id, ticket(prompt.id)]));
  if (mode === "endless") {
    return Response.json({ prompt: lineup[0] ?? null, run: `run-${Date.now().toString(36)}`, ticket: tickets[lineup[0]?.id] ?? null });
  }
  return Response.json({ day, number: dayNumber(day), prompts: lineup, tickets });
}
