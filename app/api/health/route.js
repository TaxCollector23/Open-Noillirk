export const dynamic = "force-dynamic";

import { aiConfigured, answerJudgeModel } from "@/lib/answer-judge";

export function GET() {
  return Response.json({ ok: true, name: "Open Noillirk", version: "0.1.0", relevance: { aiConfigured: aiConfigured(), model: answerJudgeModel() } });
}
