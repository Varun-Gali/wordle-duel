// 5-letter word list for Wordle Duo
const WORDS = [
  "crane", "slate", "trace", "store", "snore", "shine", "share", "shape",
  "shake", "shade", "shale", "shame", "shave", "shawl", "brine", "brink",
  "prize", "pride", "prime", "print", "bring", "brush", "blast", "blaze",
  "bleak", "blend", "bless", "blimp", "blind", "block", "blood", "bloom",
  "blown", "blunt", "blush", "board", "boast", "booze", "boost", "booth",
  "bound", "boxer", "braid", "brake", "brand", "brave", "bread", "break",
  "breed", "brick", "bride", "brief", "broil", "broke", "brood", "brook",
  "brown", "brute", "build", "built", "bulge", "bunch", "burnt", "burst",
  "cabin", "cache", "camel", "candy", "cargo", "carry", "carve", "catch",
  "cause", "chain", "chair", "chalk", "charm", "chart", "chase", "cheap",
  "cheat", "check", "cheek", "cheer", "chess", "chest", "chief", "child",
  "chill", "chimp", "choir", "chord", "chunk", "civic", "civil", "claim",
  "clamp", "clash", "clasp", "class", "cleat", "cleave", "clerk", "click",
  "cliff", "climb", "cling", "cloak", "clock", "close", "cloth", "cloud",
  "clown", "clump", "coach", "coast", "comet", "comic", "comma", "coral",
  "count", "court", "cover", "crack", "craft", "cramp", "crash", "crawl",
  "creak", "creep", "crest", "crimp", "crisp", "crock", "cross", "crowd",
  "crown", "cruel", "crush", "crust", "crypt", "cubic", "curly", "curve",
  "cycle", "daily", "dance", "datum", "dawns", "deals", "decay", "decoy",
  "debut", "delta", "demon", "depot", "depth", "derby", "devil", "dirty",
  "disco", "ditch", "dizzy", "dodge", "dogma", "doubt", "dough", "dowry",
  "drain", "drake", "drape", "drawl", "drawn", "dread", "dream", "dress",
  "drift", "drink", "drive", "drone", "drool", "droop", "drove", "drown",
  "drove", "duchy", "dunce", "dying", "eager", "eagle", "early", "earth",
  "eight", "elect", "elite", "ember", "empty", "enact", "enemy", "enjoy",
  "epoch", "equal", "error", "essay", "event", "every", "exact", "excel",
  "exert", "exile", "exist", "extra", "fable", "facet", "fairy", "faith",
  "false", "fancy", "fatal", "fault", "feast", "fetch", "fever", "fiend",
  "fifth", "fight", "final", "first", "fixed", "fjord", "flack", "flame",
  "flank", "flare", "flash", "flask", "flesh", "fleet", "flesh", "flick",
  "fling", "flint", "flock", "flood", "floor", "flora", "flour", "fluid",
  "flush", "focal", "foray", "force", "forge", "forte", "forum", "found",
  "frame", "frank", "fraud", "freak", "freed", "fresh", "front", "frost",
  "froze", "fruit", "fully", "fungi", "funny", "gauge", "genre", "ghost",
  "giant", "given", "gland", "glare", "glass", "gleam", "glean", "glide",
  "glint", "gloat", "globe", "gloom", "gloss", "glove", "glyph", "gnash",
  "gnome", "gorge", "grace", "grade", "grain", "grand", "grant", "grasp",
  "grass", "grave", "gravy", "graze", "greed", "green", "greet", "grief",
  "grime", "grind", "groan", "groin", "groom", "gross", "grout", "grove",
  "growl", "grown", "gruel", "gruff", "guard", "guess", "guest", "guile",
  "guise", "gulch", "gully", "gummy", "gusto", "hasty", "haunt", "haven",
  "hazel", "heist", "hello", "hence", "herbs", "heron", "hinge", "hippo",
  "hoist", "homer", "honey", "honor", "horns", "horse", "hotel", "hound",
  "house", "hover", "howls", "human", "humid", "humor", "hurry", "hydro",
  "hyena", "ideal", "image", "imply", "index", "infer", "infix", "ingot",
  "input", "inter", "intro", "inure", "ivory", "jaunt", "jazzy", "jerky",
  "jewel", "joust", "juice", "juicy", "jumbo", "jumpy", "karma", "kazoo",
  "kelps", "kinky", "kitty", "knack", "knead", "kneel", "knelt", "knife",
  "knock", "knoll", "known", "koala", "label", "lance", "lapse", "large",
  "laser", "latch", "latte", "laugh", "layer", "learn", "lease", "leash",
  "least", "leave", "ledge", "legal", "lemma", "level", "light", "liver",
  "livid", "llama", "lodge", "logic", "loose", "louse", "lover", "lower",
  "lucid", "lucky", "lunge", "lusty", "lyric", "magic", "major", "maker",
  "manor", "maple", "march", "marsh", "match", "mayor", "medal", "media",
  "melee", "mercy", "merge", "merit", "metal", "midday", "might", "mimic",
  "mirth", "model", "money", "monks", "month", "moose", "moral", "morse",
  "motel", "motif", "mound", "mourn", "mouth", "moved", "movie", "mucky",
  "muddy", "music", "musty", "myrrh", "naive", "naval", "nerve", "never",
  "night", "ninja", "nicer", "noble", "noise", "north", "noted", "novel",
  "nurse", "nymph", "occur", "ocean", "octet", "offer", "often", "olive",
  "onset", "orbit", "order", "organ", "other", "otter", "ought", "ovary",
  "overt", "oxide", "ozone", "paint", "panic", "pansy", "paper", "party",
  "pasta", "patch", "pause", "peace", "peach", "pearl", "pedal", "penny",
  "perch", "peril", "petal", "petty", "phase", "phone", "photo", "piano",
  "pilot", "pinch", "pixie", "pixel", "place", "plain", "plait", "plane",
  "plank", "plant", "plasm", "plead", "pleat", "pluck", "plumb", "plume",
  "plump", "plunge", "plunk", "polar", "pooch", "poppy", "posse", "pouch",
  "power", "prank", "prose", "proud", "prowl", "prude", "psalm", "pubic",
  "pulse", "punch", "puppy", "purse", "query", "queen", "quest", "queue",
  "quick", "quiet", "quota", "quote", "rabbi", "radar", "radix", "rally",
  "ranch", "range", "rapid", "raven", "reach", "realm", "reedy", "reign",
  "relax", "remix", "repay", "repel", "reset", "resin", "revel", "rider",
  "ridge", "rifle", "right", "risky", "rival", "river", "rivet", "roast",
  "rocky", "roman", "rouge", "rough", "round", "route", "rover", "rowdy",
  "rural", "rusty", "sadly", "saint", "salsa", "sandy", "sauce", "scale",
  "scalp", "scald", "scarf", "scene", "scone", "scope", "score", "scout",
  "scour", "scowl", "seize", "sense", "sever", "shell", "shift", "shirt",
  "shone", "short", "shout", "shove", "shred", "shrug", "sight", "silky",
  "since", "skill", "skull", "skunk", "slain", "slant", "slash", "slave",
  "sleek", "sleep", "sleet", "slick", "slide", "slime", "slimy", "sling",
  "slope", "sloth", "slump", "small", "smash", "smear", "smell", "smelt",
  "smile", "smite", "smoke", "smoky", "smite", "snake", "snare", "sneak",
  "sniff", "snore", "snort", "solar", "solve", "sound", "south", "spark",
  "spawn", "speak", "spear", "speck", "speed", "spend", "spice", "spicy",
  "spike", "spill", "spine", "spite", "spook", "sport", "spout", "spray",
  "spree", "sprig", "spunk", "squad", "squat", "squid", "stack", "staff",
  "stage", "stain", "stake", "stale", "stalk", "stamp", "stand", "stark",
  "start", "state", "stays", "steam", "steel", "steep", "steer", "stern",
  "stick", "stiff", "still", "sting", "stock", "stone", "stood", "storm",
  "story", "stout", "stomp", "straw", "stray", "strip", "stump", "stung",
  "stunk", "style", "sugar", "suite", "sunup", "super", "surge", "swamp",
  "swarm", "swear", "sweat", "sweep", "sweet", "swept", "swift", "swirl",
  "sword", "swore", "sworn", "swung", "table", "talon", "tango", "taste",
  "taunt", "tawny", "thorn", "three", "threw", "throw", "thrum", "thump",
  "tiger", "tight", "timer", "tired", "title", "toast", "today", "token",
  "torch", "total", "touch", "tough", "towel", "tower", "toxic", "trail",
  "train", "trait", "tramp", "trash", "trawl", "treat", "trend", "trial",
  "trick", "tried", "troop", "trout", "truck", "trump", "trunk", "truss",
  "trust", "truth", "tummy", "tumor", "tuner", "tuple", "tutor", "tweed",
  "twirl", "twist", "tying", "typed", "ultra", "unfit", "union", "unity",
  "until", "unwed", "upper", "upset", "urban", "usage", "using", "usual",
  "usurp", "utter", "vague", "valor", "valve", "vapor", "vault", "vaunt",
  "venom", "verse", "video", "vigor", "viral", "virus", "visit", "visor",
  "vital", "vivid", "vocal", "vodka", "voice", "vomit", "voter", "vowel",
  "vulva", "wager", "waltz", "watch", "water", "weave", "weedy", "weigh",
  "weird", "whale", "wheat", "wheel", "where", "which", "while", "whiff",
  "whine", "whole", "whose", "wield", "windy", "witch", "witty", "world",
  "worry", "worse", "worst", "worth", "would", "wound", "wrath", "wreak",
  "wreck", "wrist", "wrong", "yacht", "yearn", "yield", "young", "yours",
  "youth", "zebra", "zesty", "zilch", "zippy", "zombi", "zonal"
];

const VALID_GUESSES = new Set([
  ...WORDS,
  "aahed","aalii","abaci","aback","abaft","abash","abate","abbey","abbot",
  "abeam","abele","abhor","abide","abler","abode","abohm","abort","about",
  "above","abris","abuse","abuts","abyss","acids","acidy","acing","acorn",
  "acred","acres","acted","actin","acute","adage","adapt","adder","adept",
  "admit","admix","adobe","aeons","afoot","afoul","after","again","agate",
  "agave","agent","agger","aging","agist","aglow","agone","agony","agora",
  "agree","ahead","aided","aimer","algae","algal","algorithm","alibi","alien",
  "align","alike","alive","allay","aloft","along","aloof","aloud","altar",
  "alter","altho","amass","amaze","amber","amble","amend","amino","amiss",
  "amity","ample","amply","amuse","angel","anger","angle","angry","anise",
  "annex","annoy","antic","anvil","aphid","apple","aptly","archy","ardor",
  "arena","argot","arid","arise","armor","aroma","arose","arson","aside",
  "askew","atlas","atoll","atone","attic","audit","aunty","avail","avert",
  "avid","avoid","awash","awful","awoke","awry","axial","azure","badge",
  "badly","bagel","banjo","bangs","basis","bathe","bayou","beach","beard",
  "beast","began","beget","begin","being","belay","belch","beret","berry",
  "bezel","bison","bitch","bleep","blithe","bloat","brash","bylaw","bytes",
]);

function getRandomWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

function isValidWord(word) {
  return VALID_GUESSES.has(word.toLowerCase()) || WORDS.includes(word.toLowerCase());
}

function checkGuess(guess, target) {
  guess = guess.toLowerCase();
  target = target.toLowerCase();
  const result = Array(5).fill('absent');
  const targetLetters = target.split('');
  const guessLetters = guess.split('');
  const used = Array(5).fill(false);

  // First pass: correct positions
  for (let i = 0; i < 5; i++) {
    if (guessLetters[i] === targetLetters[i]) {
      result[i] = 'correct';
      used[i] = true;
      guessLetters[i] = null;
    }
  }

  // Second pass: present but wrong position
  for (let i = 0; i < 5; i++) {
    if (guessLetters[i] === null) continue;
    for (let j = 0; j < 5; j++) {
      if (!used[j] && guessLetters[i] === targetLetters[j]) {
        result[i] = 'present';
        used[j] = true;
        break;
      }
    }
  }

  return result;
}

module.exports = { getRandomWord, isValidWord, checkGuess, WORDS };
