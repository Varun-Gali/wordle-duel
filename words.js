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
  "youth", "zebra", "zesty", "zilch", "zippy", "zombi", "zonal",
  "abroad", "accept", "access", "across", "action", "active", "actual", "advice", "advise", "affect", "afford", "afraid", "agency", "agenda", "almost", "always", "amount", "animal", "annual", "answer", "anyone", "anyway", "appeal", "appear", "around", "arrive", "artist", "aspect", "assess", "assist", "assume", "attack", "attend", "author", "avenue", "backed", "barely", "battle", "beauty", "became", "become", "before", "behalf", "behind", "belief", "belong", "better", "beyond", "bishop", "border", "bottle", "bottom", "bought", "branch", "breath", "bridge", "bright", "broken", "budget", "burden", "bureau", "button", "camera", "cancer", "cannot", "carbon", "career", "castle", "casual", "caught", "center", "centre", "chance", "change", "charge", "choice", "choose", "chorus", "church", "circle", "client", "closed", "closer", "coffee", "column", "combat", "coming", "common", "comply", "county", "couple", "course", "covers", "create", "credit", "crisis", "custom", "damage", "danger", "dealer", "debate", "decade", "decide", "defeat", "defend", "define", "degree", "demand", "depend", "deputy", "desert", "design", "desire", "detail", "detect", "device", "differ", "dinner", "direct", "doctor", "dollar", "domain", "double", "driven", "driver", "during", "easily", "eating", "editor", "effect", "effort", "eighth", "either", "eleven", "emerge", "empire", "employ", "enable", "ending", "energy", "engage", "engine", "enough", "ensure", "entire", "entity", "equity", "escape", "estate", "ethnic", "exceed", "except", "excess", "expand", "expect", "expert", "export", "extend", "extent", "fabric", "facing", "factor", "failed", "fairly", "fallen", "family", "famous", "father", "fellow", "female", "figure", "filing", "finger", "finish", "fiscal", "flight", "flying", "follow", "forced", "forest", "forget", "formal", "format", "former", "foster", "fought", "fourth", "French", "friend", "future", "garden", "gather", "gender", "global", "golden", "ground", "growth", "guilty", "handed", "handle", "happen", "hardly", "headed", "health", "height", "hidden", "holder", "honest", "impact", "import", "income", "indeed", "injury", "inside", "intend", "intent", "invest", "island", "itself", "jersey", "joined", "killer", "latest", "launch", "lawyer", "leader", "league", "leaves", "legacy", "length", "lesson", "letter", "lights", "likely", "listen", "little", "living", "losing", "mainly", "maker", "makers", "manage", "manner", "manual", "margin", "marine", "marked", "market", "matter", "mature", "medium", "member", "memory", "mental", "merely", "method", "middle", "miller", "minute", "mirror", "mobile", "modern", "modest", "module", "moment", "mother", "motion", "motive", "murder", "muscle", "museum", "mutual", "myself", "narrow", "nation", "native", "nature", "nearby", "nearly", "nights", "nobody", "normal", "notice", "notion", "number", "object", "obtain", "office", "offset", "online", "option", "orange", "origin", "output", "oxford", "packed", "palace", "parent", "partly", "patent", "people", "period", "permit", "person", "phrase", "picked", "planet", "player", "please", "plenty", "pocket", "police", "policy", "prefer", "pretty", "prince", "prison", "profit", "proper", "proven", "public", "pursue", "raised", "random", "rarely", "rather", "rating", "reader", "really", "reason", "recall", "recent", "record", "reduce", "reform", "regard", "regime", "region", "relate", "relief", "remain", "remote", "remove", "repair", "repeat", "replay", "report", "rescue", "resort", "result", "retail", "retain", "return", "reveal", "review", "reward", "riding", "rising", "robust", "ruling", "safety", "salary", "sample", "saving", "saying", "scheme", "school", "screen", "search", "season", "second", "secret", "sector", "secure", "seeing", "select", "seller", "senior", "series", "server", "settle", "severe", "sexual", "shadow", "should", "signal", "signed", "silent", "silver", "simple", "simply", "single", "sister", "slight", "smooth", "social", "solely", "sought", "source", "soviet", "speech", "spirit", "spoken", "spread", "spring", "square", "stable", "status", "steady", "stolen", "strain", "stream", "street", "stress", "strict", "strike", "string", "strong", "struck", "studio", "submit", "sudden", "suffer", "summer", "summit", "supply", "surely", "survey", "switch", "symbol", "system", "taking", "talent", "target", "taught", "tenant", "tender", "tennis", "thanks", "theory", "thirty", "though", "threat", "thrown", "ticket", "timber", "tissue", "toward", "travel", "treaty", "trying", "twelve", "twenty", "unable", "unique", "unless", "unlike", "update", "useful", "valley", "values", "vendor", "versus", "victim", "vision", "visual", "volume", "walker", "wealth", "weapon", "weekly", "weight", "wholly", "window", "winner", "winter", "within", "wonder", "worker", "wright", "writer", "yellow",
  "ability", "absence", "academy", "account", "achieve", "acquire", "address", "advance", "adverse", "advised", "adviser", "against", "airline", "airport", "alcohol", "alleged", "already", "analyst", "ancient", "another", "anxiety", "anxious", "anybody", "applied", "arrange", "arrival", "article", "assault", "assumed", "attempt", "attract", "auction", "average", "backing", "balance", "banking", "barrier", "battery", "bearing", "beating", "because", "bedroom", "believe", "beneath", "benefit", "besides", "between", "billion", "binding", "brother", "brought", "burning", "cabinet", "caliber", "calling", "capable", "capital", "captain", "caption", "capture", "careful", "carrier", "caution", "ceiling", "central", "centric", "century", "certain", "chamber", "channel", "chapter", "charity", "charlie", "charter", "checked", "chicken", "chronic", "circuit", "classes", "classic", "climate", "closing", "closure", "clothes", "collect", "college", "combine", "comfort", "command", "comment", "compact", "company", "compare", "compete", "complex", "concept", "concern", "concert", "conduct", "confirm", "connect", "consent", "consist", "contact", "contain", "content", "contest", "context", "control", "convert", "correct", "council", "counsel", "counter", "country", "crucial", "crystal", "culture", "current", "cutting", "dealing", "decided", "decline", "default", "defence", "deficit", "deliver", "density", "deposit", "desktop", "despite", "destroy", "develop", "devoted", "diamond", "digital", "discuss", "disease", "display", "dispute", "distant", "diverse", "divided", "drawing", "driving", "dynamic", "eastern", "economy", "edition", "elderly", "element", "engaged", "enhance", "essence", "evening", "evident", "exactly", "examine", "example", "excited", "exclude", "exhibit", "expense", "explain", "explore", "express", "extreme", "factory", "faculty", "failing", "failure", "fashion", "feature", "federal", "feeling", "fiction", "fifteen", "filling", "finance", "finding", "fishing", "fitness", "foreign", "forever", "formula", "fortune", "forward", "founder", "freedom", "further", "gallery", "gateway", "general", "genetic", "genuine", "gigantic", "greater", "hanging", "heading", "healthy", "hearing", "heavily", "helpful", "helping", "herself", "highway", "himself", "history", "holding", "holiday", "housing", "however", "hundred", "husband", "illegal", "illness", "imagine", "imaging", "improve", "include", "initial", "inquiry", "insight", "install", "instant", "instead", "intense", "interim", "involve", "jointly", "journal", "journey", "justice", "justify", "keeping", "killing", "kingdom", "kitchen", "knowing", "landing", "largely", "lasting", "leading", "learned", "leisure", "liberal", "liberty", "library", "license", "limited", "logical", "loyalty", "machine", "manager", "married", "massive", "maximum", "meaning", "measure", "medical", "meeting", "message", "million", "mineral", "minimal", "minimum", "missing", "mission", "mistake", "mixture", "monitor", "monthly", "morning", "musical", "mystery", "natural", "neither", "nervous", "network", "neutral", "notable", "nothing", "nowhere", "nuclear", "nursing", "obvious", "offence", "officer", "ongoing", "opening", "operate", "opinion", "optical", "organic", "outcome", "outdoor", "outlook", "outside", "overall", "pacific", "package", "painted", "parking", "partial", "partner", "passage", "passing", "passion", "passive", "patient", "pattern", "payable", "payment", "penalty", "pending", "pension", "percent", "perfect", "perform", "perhaps", "picture", "pioneer", "plastic", "playing", "popular", "portion", "poverty", "predict", "premier", "premium", "prepare", "present", "prevent", "primary", "printer", "privacy", "private", "problem", "proceed", "process", "produce", "product", "profile", "program", "project", "promise", "promote", "protect", "protein", "provide", "publish", "purpose", "pushing", "qualify", "quality", "quarter", "radical", "railway", "readily", "reading", "reality", "realize", "receipt", "receive", "recover", "reflect", "regular", "related", "release", "remains", "removal", "removed", "replace", "request", "require", "reserve", "resolve", "respect", "respond", "restore", "retired", "revenue", "reverse", "rollout", "routine", "running", "satisfy", "science", "section", "segment", "serious", "service", "serving", "session", "setting", "seventh", "several", "shortly", "showing", "silence", "silicon", "similar", "sitting", "sixteen", "skilled", "smoking", "society", "somehow", "someone", "speaker", "special", "species", "sponsor", "station", "storage", "strange", "stretch", "student", "studied", "subject", "succeed", "success", "suggest", "summary", "support", "suppose", "supreme", "surface", "surgery", "surplus", "survive", "suspect", "sustain", "teacher", "telecom", "telling", "tension", "theatre", "therapy", "thereby", "thought", "through", "tonight", "totally", "touched", "towards", "traffic", "trouble", "turning", "typical", "uniform", "unknown", "unusual", "upgrade", "upscale", "utility", "variety", "various", "vehicle", "venture", "version", "veteran", "victory", "viewing", "village", "violent", "virtual", "visible", "waiting", "walking", "wanting", "warning", "warrant", "wearing", "weather", "webcast", "website", "wedding", "weekend", "welcome", "welfare", "western", "whereas", "whereby", "whether", "willing", "winning", "without", "witness", "working", "writing", "written"
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
  const result = Array(guess.length).fill('absent');
  const targetLetters = target.split('');
  const guessLetters = guess.split('');
  const used = Array(target.length).fill(false);

  // First pass: correct positions
  for (let i = 0; i < guess.length; i++) {
    if (guessLetters[i] === targetLetters[i]) {
      result[i] = 'correct';
      used[i] = true;
      guessLetters[i] = null;
    }
  }

  // Second pass: present but wrong position
  for (let i = 0; i < guess.length; i++) {
    if (guessLetters[i] === null) continue;
    for (let j = 0; j < target.length; j++) {
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
