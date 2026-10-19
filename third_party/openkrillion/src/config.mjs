export const SITE = {
  name: 'Open Noillirk', origin: 'https://open-noillirk.vercel.app',
  repository: 'https://github.com/TaxCollector23/Open-Noillirk',
  description: 'A free, independent survey game. Guess the most common answer, climb seven prompts, and share your score.',
  title: 'Open Noillirk — The Common Answer Climb',
  languages: ['en'], gameplayLanguage: 'en',
  price: { amount: 0, currency: 'USD', label: 'Free to play', checkout: false },
  rounds: 7, previewSeconds: 3, answerSeconds: 15, maxScore: 700, metresPerPoint: 10,
  models: [], credits: false, accounts: false,
  modes: ['daily', 'classic', 'endless'],
  features: ['Seven-prompt daily and classic climbs', 'Endless balloon mode', 'Six common-answer tiers', 'Typo correction with confirmation', 'Animated ascent', 'Synthesized sound effects', 'Score and altitude report', 'Answer review', 'Local history and streaks', 'Shareable results', 'Low-power and colorblind modes'],
  analytics: { plausible: '' },
};
export const publicConfig = site => ({ name: site.name, origin: site.origin, repository: site.repository, price: site.price, rounds: site.rounds, previewSeconds: site.previewSeconds, answerSeconds: site.answerSeconds, maxScore: site.maxScore, metresPerPoint: site.metresPerPoint, models: site.models, credits: site.credits, accounts: site.accounts, modes: site.modes, features: site.features, languages: site.languages, gameplayLanguage: site.gameplayLanguage });
