import OpenNoillirkClient from "./open-noillirk-client";
import { buildOpenNoillirkMarkup } from "@/lib/openkrillion-shell";

export default function Home() {
  return <OpenNoillirkClient markup={buildOpenNoillirkMarkup()} />;
}
