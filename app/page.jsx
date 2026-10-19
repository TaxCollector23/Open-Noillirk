"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const MODES = {
  daily: { label: "Daily", rule: "The same seven prompts for everyone, once a day." },
  classic: { label: "Classic", rule: "Seven prompts. Fifteen seconds each." },
  endless: { label: "Endless", rule: "Keep climbing until three misses pop your balloons." },
};

const TIERS = {
  miss: { label: "NO LIFT", points: 0, color: "#8391a3" },
  grounded: { label: "GROUNDED", points: 4, color: "#dbe6f1" },
  treetop: { label: "TREETOP", points: 8, color: "#68c7ff" },
  kite: { label: "KITE", points: 16, color: "#6ee7a2" },
  cloud: { label: "CLOUD NINE", points: 32, color: "#ffc77a" },
  jetstream: { label: "JET STREAM", points: 64, color: "#ff789e" },
  skyhigh: { label: "SKY HIGH", points: 100, color: "#ffe66e" },
};

const STORAGE = {
  mode: "open-noillirk:mode",
  best: "open-noillirk:best",
  recent: "open-noillirk:recent",
};

function readStorage(key, fallback) {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private browsing can make localStorage unavailable; the game still works.
  }
}

function formatAltitude(points) {
  const metres = points * 10;
  if (metres < 1000) return `${metres}m`;
  if (metres < 1000000) return `${(metres / 1000).toFixed(metres < 10000 ? 1 : 0)}km`;
  return `${(metres / 1000000).toFixed(1)}M km`;
}

function modeLabel(mode) {
  return MODES[mode]?.label ?? "Classic";
}

export default function Home() {
  const [mode, setMode] = useState("classic");
  const [screen, setScreen] = useState("menu");
  const [phase, setPhase] = useState("idle");
  const [lineup, setLineup] = useState([]);
  const [promptIndex, setPromptIndex] = useState(0);
  const [rounds, setRounds] = useState([]);
  const [points, setPoints] = useState(0);
  const [draft, setDraft] = useState("");
  const [seconds, setSeconds] = useState(15);
  const [countdown, setCountdown] = useState(3);
  const [verdict, setVerdict] = useState(null);
  const [error, setError] = useState("");
  const [oxygen, setOxygen] = useState(3);
  const [best, setBest] = useState({ classic: 0, endless: 0 });
  const [sound, setSound] = useState(true);
  const [room, setRoom] = useState(null);
  const submitted = useRef(false);

  useEffect(() => {
    setMode(readStorage(STORAGE.mode, "classic"));
    setBest(readStorage(STORAGE.best, { classic: 0, endless: 0 }));
  }, []);

  const prompt = lineup[promptIndex] ?? null;
  const zone = useMemo(() => {
    if (points < 40) return { name: "THE FOREST FLOOR", blurb: "A pond in the moss. Every climb starts here." };
    if (points < 160) return { name: "THE CANOPY", blurb: "Leaves, light and the first clean lift." };
    if (points < 320) return { name: "THE WEATHER", blurb: "Clouds gather below you." };
    if (points < 600) return { name: "THE JET STREAM", blurb: "The air is thin and the view is wide." };
    return { name: "THE LAST LIGHT", blurb: "Keep climbing until the sky runs out." };
  }, [points]);

  const changeMode = (nextMode) => {
    setMode(nextMode);
    writeStorage(STORAGE.mode, nextMode);
  };

  const begin = useCallback(async (nextMode = mode) => {
    setError("");
    setScreen("game");
    setPhase("loading");
    setRounds([]);
    setPoints(0);
    setPromptIndex(0);
    setDraft("");
    setVerdict(null);
    setOxygen(3);
    try {
      const recent = readStorage(STORAGE.recent, []);
      const response = await fetch("/api/noillirk/deal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: nextMode, recent }),
      });
      if (!response.ok) throw new Error("Could not build a climb.");
      const data = await response.json();
      const prompts = nextMode === "endless" ? [data.prompt].filter(Boolean) : data.prompts ?? [];
      if (!prompts.length) throw new Error("No prompts were returned.");
      setLineup(prompts);
      setMode(nextMode);
      writeStorage(STORAGE.mode, nextMode);
      submitted.current = false;
      setCountdown(3);
      setPhase("countdown");
    } catch (caught) {
      setError(caught.message ?? "Could not reach mission control.");
      setPhase("error");
    }
  }, [mode]);

  useEffect(() => {
    if (phase !== "countdown") return undefined;
    const handle = window.setTimeout(() => {
      if (countdown > 1) setCountdown((value) => value - 1);
      else {
        submitted.current = false;
        setSeconds(15);
        setPhase("prompt");
      }
    }, 1000);
    return () => window.clearTimeout(handle);
  }, [phase, countdown]);

  const finishRound = useCallback((result, submittedAnswer) => {
    const safeResult = result ?? { accepted: false, answer: "", tier: "miss", points: 0, reason: "Out of time." };
    const round = {
      prompt,
      answer: safeResult.accepted ? safeResult.answer : submittedAnswer || null,
      tier: safeResult.accepted ? safeResult.tier : "miss",
      points: safeResult.accepted ? safeResult.points : 0,
      reason: safeResult.reason,
    };
    setVerdict(round);
    setRounds((current) => [...current, round]);
    setPoints((current) => current + round.points);
    if (mode === "endless") {
      setOxygen((current) => Math.max(0, current + (round.tier === "miss" ? -1 : round.tier === "skyhigh" ? 1 : 0)));
    }
    setPhase("reveal");
  }, [mode, prompt]);

  const submit = useCallback(async (answer = draft) => {
    if (phase !== "prompt" || submitted.current || !prompt) return;
    submitted.current = true;
    const submittedAnswer = String(answer ?? "").trim();
    if (!submittedAnswer) {
      finishRound({ accepted: false, reason: "Passed." }, "");
      return;
    }
    setPhase("judging");
    try {
      const response = await fetch("/api/noillirk/answer", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ promptId: prompt.id, answer: submittedAnswer }),
      });
      if (!response.ok) throw new Error("Could not score that answer.");
      finishRound(await response.json(), submittedAnswer);
    } catch (caught) {
      submitted.current = false;
      setError(caught.message ?? "Could not reach mission control.");
      setPhase("error");
    }
  }, [draft, finishRound, phase, prompt]);

  useEffect(() => {
    if (phase !== "prompt") return undefined;
    const handle = window.setInterval(() => {
      setSeconds((current) => {
        if (current <= 0.1) {
          window.clearInterval(handle);
          submit("");
          return 0;
        }
        return Math.max(0, current - 0.1);
      });
    }, 100);
    return () => window.clearInterval(handle);
  }, [phase, submit]);

  const next = useCallback(async () => {
    if (phase !== "reveal") return;
    const nextIndex = promptIndex + 1;
    const currentRounds = rounds.length;
    const outOfOxygen = mode === "endless" && oxygen <= 0;
    if ((mode !== "endless" && nextIndex >= lineup.length) || outOfOxygen) {
      const nextBest = { ...best, [mode]: Math.max(best[mode] ?? 0, points) };
      setBest(nextBest);
      writeStorage(STORAGE.best, nextBest);
      writeStorage(STORAGE.recent, [...lineup.map((item) => item.id), ...readStorage(STORAGE.recent, [])].slice(-40));
      setPhase("done");
      return;
    }
    setDraft("");
    setVerdict(null);
    submitted.current = false;
    if (mode === "endless" && nextIndex >= lineup.length) {
      try {
        const response = await fetch("/api/noillirk/deal", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ mode: "endless", recent: rounds.map((round) => round.prompt.id) }),
        });
        const data = await response.json();
        if (!data.prompt) throw new Error("No next prompt was returned.");
        setLineup((current) => [...current, data.prompt]);
      } catch (caught) {
        setError(caught.message ?? "Could not reach mission control.");
        setPhase("error");
        return;
      }
    }
    setPromptIndex(nextIndex);
    setCountdown(2);
    setPhase("countdown");
    void currentRounds;
  }, [best, lineup, mode, oxygen, phase, points, promptIndex, rounds]);

  const quit = () => {
    setPhase("idle");
    setScreen("menu");
    setLineup([]);
    setVerdict(null);
  };

  const createRoom = () => {
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    setRoom({ code, players: ["You", "Guest 1"], local: true });
  };

  if (screen === "room") {
    return <RoomPanel room={room} onBack={() => setScreen("menu")} onCreate={createRoom} onStart={() => begin("classic")} />;
  }

  return (
    <main className="site-shell">
      <header className="site-header">
        <a className="brand" href="#top" onClick={quit}><span className="brand-mark">▲</span> Open Noillirk</a>
        <nav className="header-nav" aria-label="Project links">
          <a href="https://github.com/TaxCollector23/Open-Noillirk" target="_blank" rel="noreferrer">GitHub</a>
          <button className="icon-button" type="button" onClick={() => setSound((value) => !value)} aria-label={sound ? "Mute sound" : "Enable sound"}>{sound ? "◖" : "×"}</button>
        </nav>
      </header>

      <section className={`scene scene--${phase === "idle" || phase === "loading" || phase === "error" ? "forest" : points > 320 ? "sky" : "canopy"}`} id="top">
        <div className="pixel-sun" aria-hidden="true" />
        <div className="cloud cloud-a" aria-hidden="true" />
        <div className="cloud cloud-b" aria-hidden="true" />
        <div className="tree-line tree-line-back" aria-hidden="true" />
        <div className="tree-line tree-line-front" aria-hidden="true" />
        <div className="scene-noise" aria-hidden="true" />

        {screen === "menu" ? (
          <Menu mode={mode} onMode={changeMode} onBegin={() => begin(mode)} onMultiplayer={() => setScreen("room")} best={best} />
        ) : (
          <GameScreen
            mode={mode}
            phase={phase}
            prompt={prompt}
            promptIndex={promptIndex}
            rounds={rounds}
            points={points}
            zone={zone}
            seconds={seconds}
            countdown={countdown}
            draft={draft}
            setDraft={setDraft}
            verdict={verdict}
            oxygen={oxygen}
            error={error}
            best={best}
            onSubmit={() => submit()}
            onPass={() => submit("")}
            onNext={next}
            onQuit={quit}
            onRetry={() => begin(mode)}
          />
        )}
      </section>

      <section className="info-grid" aria-label="About Open Noillirk">
        <article><span className="eyebrow">THE GAME</span><h2>Guess what the crowd would say.</h2><p>Seven open prompts. Fifteen seconds each. The answer that feels obvious to the most people lifts you highest.</p></article>
        <article><span className="eyebrow">THE BOARD</span><h2>Every accepted answer earns a tier.</h2><p>Sky High is the top answer. Jet Stream covers the next three. Cloud Nine covers the rest of the board; rare answers still get a small lift.</p></article>
        <article><span className="eyebrow">THE BUILD</span><h2>Readable, inspectable, yours.</h2><p>Open Noillirk keeps the prompt corpus, scoring rules, API routes and architecture in this repository. No paid AI key is required.</p></article>
      </section>

      <footer className="site-footer"><span>Open Noillirk · independent clean-room implementation</span><a href="https://github.com/morluto/rea" target="_blank" rel="noreferrer">Reverse-engineered with REA</a></footer>
    </main>
  );
}

function Menu({ mode, onMode, onBegin, onMultiplayer, best }) {
  return (
    <div className="menu-panel">
      <div className="title-lockup"><span className="title-shadow">NOILLIRK</span><h1>OPEN NOILLIRK</h1><p>THE COMMON ANSWER CLIMB</p></div>
      <p className="hero-rule">{MODES[mode].rule}</p>
      <div className="menu-bottom">
        <div className="mode-picker" role="group" aria-label="Climb mode">
          {Object.entries(MODES).map(([id, value]) => <button key={id} type="button" className={mode === id ? "mode-button active" : "mode-button"} onClick={() => onMode(id)}>{value.label}</button>)}
        </div>
        <div className="best-line">Best {modeLabel(mode)} <strong>{formatAltitude(best[mode] ?? 0)}</strong></div>
        <button type="button" className="primary-button" onClick={onBegin}>▲ BEGIN ASCENT ▲</button>
        <button type="button" className="secondary-button" onClick={onMultiplayer}>PLAY LOCAL MULTIPLAYER <span>2–4 players</span></button>
      </div>
    </div>
  );
}

function GameScreen({ mode, phase, prompt, promptIndex, rounds, points, zone, seconds, countdown, draft, setDraft, verdict, oxygen, error, best, onSubmit, onPass, onNext, onQuit, onRetry }) {
  const isPrompt = phase === "prompt" || phase === "judging";
  const isEnd = phase === "done";
  const tier = verdict ? TIERS[verdict.tier] ?? TIERS.miss : null;
  return (
    <div className="game-panel">
      <div className="game-topbar">
        <div className="stat-pill"><span>ALTITUDE</span><strong>{formatAltitude(points)}</strong></div>
        <div className="stat-pill stat-pill--center"><span>{modeLabel(mode)}</span><strong>{mode === "endless" ? `PROMPT ${promptIndex + 1}` : `PROMPT ${Math.min(promptIndex + 1, 7)} OF 7`}</strong></div>
        <div className="game-actions"><button type="button" className="icon-button" onClick={() => {}}>◖</button><button type="button" className="quit-button" onClick={onQuit}>QUIT</button></div>
      </div>
      <div className="zone-banner"><strong>{zone.name}</strong><span>{zone.blurb}</span></div>
      <div className="climber" style={{ "--climb": `${Math.min(72, points / 10)}%` }} aria-hidden="true"><span className="balloon balloon-a" /><span className="balloon balloon-b" /><span className="balloon balloon-c" /><span className="krill-body" /><span className="krill-basket" /></div>

      {phase === "loading" && <div className="center-card"><span className="eyebrow">MISSION CONTROL</span><h2>Plotting a fresh climb…</h2></div>}
      {phase === "error" && <div className="center-card"><span className="eyebrow">SIGNAL LOST</span><h2>{error || "Could not build a climb."}</h2><button className="primary-button small" type="button" onClick={onRetry}>TRY AGAIN</button></div>}
      {phase === "countdown" && <div className="center-card countdown-card"><span className="eyebrow">NEXT PROMPT</span><h2>{countdown}</h2><p>Get ready to answer for the crowd.</p></div>}
      {isPrompt && prompt && <div className="prompt-card"><div className="prompt-kicker">{prompt.cat.toUpperCase()} <span>▲ common answers climb higher ▲</span></div><h2>{prompt.text}</h2><div className="answer-row"><div className={`clock ${seconds <= 6 ? "clock--low" : ""}`}><span>{Math.ceil(seconds)}</span><small>sec</small></div><form onSubmit={(event) => { event.preventDefault(); onSubmit(); }}><input autoFocus value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={80} aria-label="Your answer" placeholder="type one answer…" disabled={phase === "judging"} /><button type="submit" className="primary-button" disabled={phase === "judging" || !draft.trim()}>CLIMB</button></form><button type="button" className="pass-button" onClick={onPass} disabled={phase === "judging"}>PASS</button></div></div>}
      {phase === "reveal" && verdict && <div className="reveal-card" style={{ "--tier-color": tier.color }}><span className="eyebrow">SURVEY SAYS</span><h2>{tier.label}</h2><div className="tier-meter"><span>RARE</span><i /><span>COMMON</span></div><p className="revealed-answer">“{verdict.answer || verdict.reason || "No answer"}”</p><p className="reveal-points"><strong>+{verdict.points} PTS</strong> · up to {formatAltitude(points)}</p><p>{tier.blurb}</p><button type="button" className="primary-button" onClick={onNext}>{mode === "endless" && oxygen <= 0 ? "VIEW RESULTS" : rounds.length >= 7 && mode !== "endless" ? "VIEW RESULTS" : "NEXT ▸"}</button></div>}
      {isEnd && <Results mode={mode} rounds={rounds} points={points} best={best} onAgain={() => onRetry()} onMenu={onQuit} />}

      {mode === "endless" && !isEnd && <div className="oxygen" aria-label={`${oxygen} balloons left`}>{Array.from({ length: 3 }, (_, index) => <span key={index} className={index < oxygen ? "balloon-dot" : "balloon-dot popped"}>●</span>)}</div>}
    </div>
  );
}

function Results({ mode, rounds, points, best, onAgain, onMenu }) {
  return <div className="results-card"><span className="eyebrow">CLIMB COMPLETE</span><h2>{mode === "endless" ? "The last light" : "Back to the pond"}</h2><div className="results-score">{formatAltitude(points)}</div><p>{rounds.length} prompts · {points} points {best[mode] === points ? "· new best" : ""}</p><div className="round-strip">{rounds.map((round, index) => <span key={`${round.prompt.id}-${index}`} style={{ background: TIERS[round.tier]?.color ?? TIERS.miss.color }} title={`${round.prompt.text}: ${round.points} points`} />)}</div><div className="result-actions"><button type="button" className="primary-button" onClick={onAgain}>CLIMB AGAIN</button><button type="button" className="secondary-button" onClick={onMenu}>BACK TO MENU</button></div></div>;
}

function RoomPanel({ room, onBack, onCreate, onStart }) {
  const [joinCode, setJoinCode] = useState("");
  return <main className="room-shell"><div className="room-card"><span className="eyebrow">LOCAL ROOM MODE</span><h1>Climb together.</h1><p>Open Noillirk keeps multiplayer open and dependency-free with a same-browser pass-and-play room. A durable cross-device realtime adapter is intentionally left as a small, documented seam for future hosting.</p>{room ? <div className="room-created"><span className="room-label">ROOM CODE</span><strong>{room.code}</strong><span>{room.players.length} climbers ready · {room.players.join(" · ")}</span><button type="button" className="primary-button" onClick={onStart}>START ROOM CLIMB</button></div> : <><button type="button" className="primary-button" onClick={onCreate}>CREATE LOCAL ROOM</button><div className="join-row"><input aria-label="Room code" value={joinCode} onChange={(event) => setJoinCode(event.target.value.toUpperCase())} placeholder="ROOM CODE" maxLength={6} /><button type="button" className="secondary-button" onClick={() => joinCode && onCreate()}>JOIN</button></div></>}<button type="button" className="text-button" onClick={onBack}>← Back to menu</button></div></main>;
}
