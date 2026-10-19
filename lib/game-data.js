export const ROUND_SECONDS = 15;
export const CLASSIC_ROUNDS = 7;
export const MAX_SCORE = 700;
export const METRES_PER_POINT = 10;
export const OXYGEN_START = 3;
export const MAX_ANSWER_LENGTH = 80;

export const TIERS = [
  { id: "grounded", label: "GROUNDED", score: 4, blurb: "Nobody else said it. You stay put." },
  { id: "treetop", label: "TREETOP", score: 8, blurb: "Hardly anyone said that. A short hop." },
  { id: "kite", label: "KITE", score: 16, blurb: "Off the board, but a few said it." },
  { id: "cloud", label: "CLOUD NINE", score: 32, blurb: "On the board. Up you go." },
  { id: "jetstream", label: "JET STREAM", score: 64, blurb: "Top four. So close to the top." },
  { id: "skyhigh", label: "SKY HIGH", score: 100, blurb: "The number one answer. Straight up." },
];

export const MISS = {
  id: "miss",
  label: "NO LIFT",
  score: 0,
  blurb: "No accepted answer. The balloons hold still.",
};

// This is intentionally an original, compact answer corpus. Each board is
// transparent and editable rather than depending on a closed scoring service.
export const PROMPTS = [
  {
    id: "lost-at-home",
    text: "Name something people often forget at home",
    cat: "everyday",
    board: [
      ["phone", "mobile", "cell phone"],
      ["keys", "key"],
      ["wallet", "purse"],
      ["lunch", "food"],
      ["umbrella"],
      ["glasses", "sunglasses"],
      ["charger", "phone charger"],
      ["coat", "jacket"],
      ["water bottle", "bottle"],
    ],
  },
  {
    id: "breakfast-food",
    text: "Name a food people eat for breakfast",
    cat: "food-drink",
    board: [
      ["cereal"],
      ["eggs", "egg"],
      ["toast", "bread"],
      ["bacon"],
      ["pancakes", "pancake"],
      ["fruit"],
      ["oatmeal", "porridge"],
      ["yogurt", "yoghurt"],
      ["sausage"],
    ],
  },
  {
    id: "office-building",
    text: "Name something you might find on top of a tall office building",
    cat: "places",
    board: [
      ["antenna", "antennas", "aerial"],
      ["helipad", "helicopter pad"],
      ["satellite dish", "dish"],
      ["roof", "rooftop"],
      ["air conditioning", "ac", "hvac"],
      ["sign", "logo"],
      ["garden", "rooftop garden"],
      ["water tank", "tank"],
      ["solar panels", "solar panel"],
    ],
  },
  {
    id: "kitchen-install",
    text: "Name something you might ask a professional to install in your kitchen",
    cat: "home",
    board: [
      ["cabinets", "cabinet"],
      ["countertop", "counter", "worktop"],
      ["sink"],
      ["oven", "stove"],
      ["dishwasher"],
      ["lights", "lighting", "light"],
      ["backsplash"],
      ["faucet", "tap"],
      ["island", "kitchen island"],
    ],
  },
  {
    id: "hamburger-extra",
    text: "When ordering a hamburger, name something you might want extra of",
    cat: "food-drink",
    board: [
      ["cheese"],
      ["ketchup"],
      ["pickles", "pickle"],
      ["bacon"],
      ["onions", "onion"],
      ["lettuce"],
      ["sauce"],
      ["fries", "french fries"],
      ["meat", "patty"],
    ],
  },
  {
    id: "hotel-front-desk",
    text: "Name something a hotel guest calls the front desk to ask about",
    cat: "travel",
    board: [
      ["towels", "towel"],
      ["wifi", "wi-fi", "internet"],
      ["checkout", "check out"],
      ["room service"],
      ["directions", "how to get there"],
      ["taxi", "cab"],
      ["extra pillows", "pillow", "pillows"],
      ["breakfast"],
      ["key", "room key"],
    ],
  },
  {
    id: "make-a-wish",
    text: "Name something you might do when you make a wish",
    cat: "holidays",
    board: [
      ["blow out candles", "blow candles", "candles"],
      ["close your eyes", "shut your eyes"],
      ["cross your fingers", "cross fingers"],
      ["make a wish"],
      ["throw a coin", "coin"],
      ["wish on a star", "star"],
      ["pray"],
      ["hold your breath"],
      ["kiss"],
    ],
  },
  {
    id: "christmas-songs",
    text: "Name something Christmas songs mention that people rarely do in real life",
    cat: "music",
    board: [
      ["dance", "dancing"],
      ["carol", "sing carols", "caroling"],
      ["snow", "snowing"],
      ["kiss under the mistletoe", "mistletoe"],
      ["ride a sleigh", "sleigh"],
      ["go to church", "church"],
      ["bake cookies", "cookies"],
      ["hang stockings", "stockings"],
      ["visit santa", "santa"],
    ],
  },
  {
    id: "type-of-bell",
    text: "Name a type of bell",
    cat: "everyday",
    board: [
      ["doorbell", "door bell"],
      ["school bell"],
      ["church bell"],
      ["alarm bell"],
      ["cowbell", "cow bell"],
      ["bell pepper", "pepper"],
      ["dinner bell"],
      ["bicycle bell", "bike bell"],
      ["handbell", "hand bell"],
    ],
  },
  {
    id: "librarian",
    text: "Name something you would see a librarian do",
    cat: "school",
    board: [
      ["read", "reading"],
      ["shelve books", "put books away", "organize books"],
      ["check out books", "lend books", "loan books"],
      ["whisper", "shush"],
      ["use a computer", "computer"],
      ["help someone", "help people"],
      ["stamp a book", "stamp books"],
      ["answer a question", "answer questions"],
      ["clean"],
    ],
  },
  {
    id: "rainy-day",
    text: "Name something people do on a rainy day",
    cat: "weather",
    board: [
      ["stay inside", "stay home"],
      ["watch tv", "watch television"],
      ["read a book", "read"],
      ["use an umbrella", "umbrella"],
      ["sleep", "take a nap"],
      ["wear a raincoat", "raincoat"],
      ["watch a movie", "movie"],
      ["play games", "game"],
      ["jump in puddles", "puddles"],
    ],
  },
  {
    id: "things-in-pocket",
    text: "Name something people commonly carry in a pocket",
    cat: "everyday",
    board: [
      ["phone", "mobile"],
      ["keys", "key"],
      ["wallet"],
      ["coins", "coin", "money"],
      ["tissues", "tissue"],
      ["pen"],
      ["lip balm", "chapstick"],
      ["receipt", "receipts"],
      ["lighter"],
    ],
  },
  {
    id: "pet-name",
    text: "Name a common name for a pet dog",
    cat: "animals",
    board: [
      ["max"],
      ["bella"],
      ["buddy"],
      ["charlie"],
      ["luna"],
      ["coco"],
      ["bailey"],
      ["rocky"],
      ["daisy"],
    ],
  },
  {
    id: "supermarket",
    text: "Name something people buy at a supermarket every week",
    cat: "shopping",
    board: [
      ["milk"],
      ["bread"],
      ["eggs", "egg"],
      ["fruit"],
      ["vegetables", "vegetable", "veggies"],
      ["meat"],
      ["coffee"],
      ["snacks", "snack"],
      ["toilet paper"],
    ],
  },
  {
    id: "office-desk",
    text: "Name something you might find on an office desk",
    cat: "work",
    board: [
      ["computer", "laptop"],
      ["paper", "papers"],
      ["pen", "pens"],
      ["phone"],
      ["coffee", "coffee mug", "mug"],
      ["keyboard"],
      ["notebook"],
      ["stapler"],
      ["plant"],
    ],
  },
  {
    id: "beach-bag",
    text: "Name something people pack for a day at the beach",
    cat: "travel",
    board: [
      ["towel", "towels"],
      ["sunscreen", "sun cream"],
      ["swimsuit", "swimwear", "bathing suit"],
      ["water", "water bottle"],
      ["sunglasses", "glasses"],
      ["hat"],
      ["food", "snacks"],
      ["umbrella"],
      ["book"],
    ],
  },
  {
    id: "things-that-fly",
    text: "Name something that can fly",
    cat: "animals",
    board: [
      ["bird"],
      ["airplane", "plane"],
      ["insect", "bug"],
      ["butterfly"],
      ["helicopter"],
      ["bee"],
      ["kite"],
      ["balloon"],
      ["bat"],
    ],
  },
];

export const PROMPT_MAP = new Map(PROMPTS.map((prompt) => [prompt.id, prompt]));

export function findPrompt(id) {
  return PROMPT_MAP.get(id) ?? null;
}

export function tierForRank(rank) {
  if (rank === 0) return TIERS[5];
  if (rank <= 3) return TIERS[4];
  return TIERS[3];
}

export function normalizeAnswer(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function looksLikeText(value) {
  return value.length >= 2 && /[a-z]/i.test(value) && !/(.)\1{5,}/.test(value);
}

export function scoreAnswer(prompt, rawAnswer) {
  const answer = normalizeAnswer(rawAnswer);
  if (!looksLikeText(answer)) return { accepted: false, answer: "", tier: MISS.id, points: 0, reason: "Not an answer to that prompt." };

  const rank = prompt.board.findIndex((answers) => answers.some((alias) => normalizeAnswer(alias) === answer));
  if (rank >= 0) {
    const tier = tierForRank(rank);
    return { accepted: true, answer: prompt.board[rank][0], tier: tier.id, points: tier.score };
  }

  // The open-source build keeps the original game's generous "accepted but
  // rare" feeling without calling a paid classifier: an unknown text answer
  // earns the lowest accepted tier and is shown exactly as typed.
  return { accepted: true, answer: answer.slice(0, MAX_ANSWER_LENGTH), tier: TIERS[0].id, points: TIERS[0].score };
}

export function boardForPrompt(prompt) {
  return prompt.board.map(([answer], rank) => ({ answer, rank: rank + 1, tier: tierForRank(rank).id, points: tierForRank(rank).score }));
}
