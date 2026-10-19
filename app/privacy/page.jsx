export const metadata = {
  title: "Privacy — Open Noillirk",
  description: "What Open Noillirk stores in your browser and sends to its game API.",
};

export default function PrivacyPage() {
  return (
    <main className="info-page">
      <article>
        <a className="info-home" href="/">← BACK TO THE GAME</a>
        <p className="eyebrow">YOUR DATA, PLAINLY</p>
        <h1>Privacy</h1>
        <p>Open Noillirk has no accounts, advertising, or game analytics. Your settings, run history, best scores, drafts, and private feedback notes are stored in this browser's local storage. Clearing this site's browser data removes them.</p>
        <h2>Game requests</h2>
        <p>When you play, the browser contacts the Open Noillirk server to deal prompts, check answers, and load answer boards. The server receives the prompt identifier, your submitted answer, and a prompt-matching request marker. That marker is not an account credential or anti-cheat protection.</p>
        <h2>Optional answer review</h2>
        <p>If the site operator configures an OpenRouter API key, an off-board answer may be sent from the server to OpenRouter for an on-topic check. OpenRouter keys stay on the server and are never sent to your browser. Without that key—or if the model is unavailable—the game uses its local relevance check instead.</p>
        <h2>Hosting</h2>
        <p>The site is hosted by Vercel, which may process standard connection and operational logs as part of providing the service. Local Party and feedback notes do not create online rooms or submit feedback to a server.</p>
        <p>Questions or code changes can be raised through the <a href="https://github.com/TaxCollector23/Open-Noillirk" target="_blank" rel="noreferrer">public repository</a>.</p>
      </article>
    </main>
  );
}
