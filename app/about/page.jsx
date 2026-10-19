export const metadata = {
  title: "About Open Noillirk",
  description: "How Open Noillirk is built and what it is based on.",
};

export default function AboutPage() {
  return (
    <main className="info-page">
      <article>
        <a className="info-home" href="/">← BACK TO THE GAME</a>
        <p className="eyebrow">AN OPEN, INDEPENDENT PROJECT</p>
        <h1>About Open Noillirk</h1>
        <p>Open Noillirk is a free survey-answer climbing game. Pick a mode, answer each timed prompt, and climb higher when your answer matches the crowd.</p>
        <h2>How it is made</h2>
        <p>The client interface and visual assets are adapted under the MIT license from <a href="https://github.com/VulcanEon/openkrillion.com-service" target="_blank" rel="noreferrer">OpenKrillion</a>. The rules, answer corpus, relevance checks, and server routes are maintained separately for Open Noillirk.</p>
        <p>The public Noillirk game was investigated with <a href="https://github.com/morluto/rea" target="_blank" rel="noreferrer">REA</a>. This project recreates the observed play loop; it does not include the original operator's private server, accounts, or survey dataset.</p>
        <h2>What to expect</h2>
        <p>Daily and Classic have seven rounds; Endless continues with three balloons. Scores and settings stay in your browser. Local Party means pass-and-play on one device, not online multiplayer.</p>
        <p>See the <a href="https://github.com/TaxCollector23/Open-Noillirk" target="_blank" rel="noreferrer">source code</a>, the <a href="/privacy">privacy notes</a>, and the in-game guide for more detail.</p>
        <p className="info-credit">Open Noillirk is an independent project and is not affiliated with PlayDaily, OpenKrillion, or the operators of the original games.</p>
      </article>
    </main>
  );
}
