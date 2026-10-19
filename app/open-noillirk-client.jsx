"use client";

import { useEffect } from "react";

export default function OpenNoillirkClient({ markup }) {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "module";
    script.src = "/app.mjs";
    script.dataset.openNoillirk = "game-client";
    document.body.append(script);
    return () => script.remove();
  }, []);

  return <div id="open-noillirk-game" dangerouslySetInnerHTML={{ __html: markup }} />;
}
