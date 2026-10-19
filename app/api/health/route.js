export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ ok: true, name: "Open Noillirk", version: "0.1.0" });
}
