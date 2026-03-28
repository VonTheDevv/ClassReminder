const login = require("@dongdev/fca-unofficial");
const fs = require("fs");
const path = require("path");
const cron = require("node-cron");
const moment = require("moment-timezone");


const PREFIX = "/";
const TIMEZONE = "Asia/Manila";
const PIO_ID = "100092567839096";
const REPRESENTATIVE_ID = "100004919079151";
const ADMINS = [PIO_ID, REPRESENTATIVE_ID];
const AUTO_UNSEND_DELAY = 10 * 60 * 1000; 
const HELP_UNSEND_DELAY = 5 * 60 * 1000; 


const BOT_NICKNAME = "TASK SCHEDULER";
const BOT_INTRO_NAME = "Mark";
const BOT_CREATOR_NAME = "Von";


const CONFIRM_TTL_MS = 10 * 60 * 1000; 
const pendingActions = new Map(); 


const lastActivitiesView = new Map(); 


const SUBJECTS_FILE = "./data/subjects.json";
const APPSTATE_FILE = "./appstate.json";
const GROUP_THREADS_FILE = "./data/group_threads.json";
const GROUP_DATA_DIR = "./data/groups";
const REMINDERS_DATA_DIR = "./data/reminders";

const POGI_DATA_DIR = "./data/pogi";
const LT_DATA_DIR = "./data/LT";
const POGI_STATE_FILE = "./data/pogi_state.json";

function resolveRuntimePath(relPath) {
  const relative = String(relPath || "");
  const fromDirname = path.resolve(__dirname, relative);
  const fromCwd = path.resolve(process.cwd(), relative);

  if (fs.existsSync(fromDirname)) return fromDirname;
  if (fs.existsSync(fromCwd)) return fromCwd;

  return fromDirname;
}

const POGI_DATA_DIR_ABS = resolveRuntimePath(POGI_DATA_DIR);
const LT_DATA_DIR_ABS = resolveRuntimePath(LT_DATA_DIR);
const POGI_STATE_FILE_ABS = resolveRuntimePath(POGI_STATE_FILE);
const APPSTATE_FILE_ABS = resolveRuntimePath(APPSTATE_FILE);

console.log(`[POGI] paths -> pogi=${POGI_DATA_DIR_ABS} | lt=${LT_DATA_DIR_ABS} | state=${POGI_STATE_FILE_ABS}`);

const POGI_PULL_PREPARE_DELAY_MS = 1200;
const POGI_RESULT_VISIBLE_MS = 15 * 1000;
const POGI_ULTRA_SOFT_PITY_START = 25;
const POGI_ULTRA_HARD_PITY = 50;
const POGI_ULTRA_SOFT_PITY_STEP = 0.02;
const LT_LAUGH_COOLDOWN_MS = 5 * 60 * 1000;
const UNKNOWN_COMMAND_SPAM_WINDOW_MS = 20 * 1000;
const UNKNOWN_COMMAND_SPAM_THRESHOLD = 5;
const UNKNOWN_COMMAND_COOLDOWN_MS = 2 * 60 * 60 * 1000;
const UNKNOWN_REPLY_TRACK_TTL_MS = 2 * 60 * 60 * 1000;
const SEND_MESSAGE_TIMEOUT_MS = 20 * 1000;
const POGI_PROCESSING_STALE_MS = 45 * 1000;
const EVERYONE_CALL_COOLDOWN_MS = 5 * 60 * 1000;
const RANDOM_ASK_TRIGGER_CHANCE = 0.03;
const RANDOM_ASK_COOLDOWN_MS = 20 * 60 * 1000;
const RANDOM_ASK_REPLY_TIMEOUT_MS = 2 * 60 * 1000;
const STATUS_VPS_CPU = "Intel Xeon 6";
const STATUS_VPS_RAM = "2 GB";
const BOT_STATUS_PROCESS_STARTED_AT_MS = Date.now();

const POGI_RARITY_DEFS = [
  { key: "common", label: "Common", aliases: ["common"], baseWeight: 55 },
  { key: "rare", label: "Rare", aliases: ["rare"], baseWeight: 25 },
  { key: "epic", label: "Epic", aliases: ["epic"], baseWeight: 10 },
  { key: "legendary", label: "Legendary", aliases: ["legendary"], baseWeight: 5 },
  { key: "mythical", label: "Mythical", aliases: ["mythical"], baseWeight: 4 },
  {
    key: "ultra",
    label: "ULTRA SUPER GWAPO",
    aliases: ["ultra super gwapo", "ultra", "ultra_super_gwapo"],
    baseWeight: 1,
  },
];

const UNKNOWN_COMMAND_PHRASES = [
  "eengot-engot mag command amp",
  "anlala mo boi haha",
  "kulang to sa tulog kaya mali mali",
  "hahahah what",
  "lala boi mali",
];

const UNKNOWN_REPLY_PHRASES = ["sasagot kapa e", "hahaha engot"];

const CURSE_WARNING_MESSAGES = ["Pst bawal mag mura, masama yan", "Sabing bawal ihhh"];
const CURSE_TERMS = [
  "gago",
  "gagu",
  "amputa",
  "amp",
  "tangena",
  "tangina",
  "tanginamo",
  "puta",
  "putangina",
  "putanginamo",
  "tangnamo",
];
const CURSE_REGEX = new RegExp(
  `(^|[^a-z0-9])(?:${CURSE_TERMS.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})(?=$|[^a-z0-9])`,
  "i",
);

const RANDOM_ASK_PROMPTS = [
  { topic: "food", text: "kumain ka na ba o nagpapacute ka pa rin?" },
  { topic: "food", text: "anong ulam mo, penge idea." },
  { topic: "food", text: "may meryenda ka ba o titigan na lang kita?" },
  { topic: "food", text: "busog ka na ba o need mo pa ng lambing ng adobo?" },
  { topic: "food", text: "nag tubig ka na ba o puro ka na lang charm?" },

  { topic: "mood", text: "kamusta ka naman today, buhay pa ang spark?" },
  { topic: "mood", text: "okay ka lang ba o need mo ng konting good vibes?" },
  { topic: "mood", text: "anong mood mo ngayon, main character o naka power save?" },
  { topic: "mood", text: "nakangiti ka ba today o tinatamad ang universe?" },
  { topic: "mood", text: "kamusta puso mo, chill lang ba?" },

  { topic: "photo", text: "send cute pic daw oh, char kalahati." },
  { topic: "photo", text: "ilan selfie mo today, honest answer." },
  { topic: "photo", text: "camera ready ka ba lagi o lucky shot lang lahat?" },
  { topic: "photo", text: "may bagong pfp ka na ba o inaantay mo destiny?" },
  { topic: "photo", text: "seryoso, bakit ka photogenic minsan?" },

  { topic: "study", text: "nag aral ka na ba o notes pa lang inaamo mo?" },
  { topic: "study", text: "alin mas matagal mo tinitigan, reviewer o crush?" },
  { topic: "study", text: "may natapos ka na ba today o moral support lang?" },
  { topic: "study", text: "ilan tabs na bukas mo, study pa ba yan?" },
  { topic: "study", text: "kaya pa ng braincells mo o kape na sagot?" },

  { topic: "sleep", text: "nakatulog ka ba nang maayos o overthink malala?" },
  { topic: "sleep", text: "ilang oras tulog mo, totoo dapat ha." },
  { topic: "sleep", text: "inaantok ka ba o cute ka lang talaga?" },
  { topic: "sleep", text: "nakapagpahinga ka na ba o laban ulit agad?" },
  { topic: "sleep", text: "may power nap ka ba today o pure tapang?" },

  { topic: "gala", text: "labas ka ba later o house tour muna sa kisame?" },
  { topic: "gala", text: "may lakad ka ba o available ka sa chika?" },
  { topic: "gala", text: "weekend plan mo, gala o hibernate?" },
  { topic: "gala", text: "naglalakad ka ba ngayon o nasa bed ka pa?" },
  { topic: "gala", text: "tara hangout daw, game ka ba in theory?" },

  { topic: "music", text: "anong song mo today, pang inlove o pang cram?" },
  { topic: "music", text: "may LSS ka ba o tahimik ang buhay?" },
  { topic: "music", text: "series ka muna mamaya o acads mode talaga?" },
  { topic: "music", text: "anong playlist mo kapag nagpapacute ka?" },
  { topic: "music", text: "movie night type ka ba o tulog agad?" },

  { topic: "crush", text: "may crush ka pa ba o graduate ka na?" },
  { topic: "crush", text: "nag first move ka na ba sa buhay mo?" },
  { topic: "crush", text: "may nagpapakilig ba sayo lately o secret lang?" },
  { topic: "crush", text: "red flag radar mo goods pa ba?" },
  { topic: "crush", text: "kung may mag confess sayo today, papayag ka ba makinig?" },

  { topic: "social", text: "madaldal ka today o selective lang sa kausap?" },
  { topic: "social", text: "marami ka bang tsismis o inner peace era ka?" },
  { topic: "social", text: "sino una mong ichchat kapag bored ka?" },
  { topic: "social", text: "ikaw ba yung mabilis magreply o aesthetic lang ang seen?" },
  { topic: "social", text: "may kinakausap ka ba ngayon na special-ish?" },

  { topic: "general", text: "kamusta araw mo, rate mo nga 1 to 10." },
  { topic: "general", text: "anong pinaka random na nangyari sayo today?" },
  { topic: "general", text: "may small win ka ba today? flex mo naman." },
  { topic: "general", text: "ano mas kailangan mo ngayon, kape, tulog, o himala?" },
  { topic: "general", text: "free ka ba ngayon o kunwari busy lang?" },
];

const RANDOM_ASK_REPLY_BANK = {
  food: {
    positive: [
      "Ayy nice, good yan. Wag papatalo sa gutom.",
      "Buti naman, busog ka pala. Mas productive ang cutie na may laman ang tiyan.",
    ],
    negative: [
      "Ayan na, kain ka na muna bago ka magdrama sa gutom.",
      "Nako delikado yan, priority muna ang pagkain ha.",
    ],
    neutral: ["Gets gets, update mo na lang ako kapag may laman na tiyan mo."],
  },
  mood: {
    positive: [
      "Love that energy. Keep mo lang yung good vibes.",
      "Ayun oh, buhay ang spark. Sana tuloy tuloy.",
    ],
    negative: [
      "Easyhan mo lang today. Pahinga rin kapag kailangan.",
      "Sige lang, one step at a time lang muna.",
    ],
    neutral: ["Noted yan. Basta kapit lang, aayos din ang timpla."],
  },
  photo: {
    positive: [
      "Aba confident, as you should. Baka naman may pang profile pic na.",
      "Expected na yan, camera-friendly ka eh.",
    ],
    negative: [
      "Okay lang yan, minsan mystery ang best angle.",
      "Walang pressure, darating din yung winning shot.",
    ],
    neutral: ["Fair enough. Timing lang yan, kusang gaganda ang kuha."],
  },
  study: {
    positive: [
      "Solid ah, may progress. Tuloy mo lang habang may momentum.",
      "Nice one, deserve mo ang mini break mamaya.",
    ],
    negative: [
      "Okay lang yan, start ka lang sa maliit na task.",
      "Kaya pa yan, kahit konti lang muna basta usad.",
    ],
    neutral: ["Saktong pace lang. Ang importante, umaandar."],
  },
  sleep: {
    positive: [
      "Good yan, mas mabait ang mundo kapag sapat tulog.",
      "Ayos, recharge is real. Mas fresh ang atake mo niyan.",
    ],
    negative: [
      "Nako, bawi ka mamaya kahit saglit na pahinga.",
      "Ramdam ko yan. Tubig at konting rest muna kung kaya.",
    ],
    neutral: ["Gets ko yan. Ingatan mo energy mo today."],
  },
  gala: {
    positive: [
      "Uy nice, enjoy ka. Huwag kalimutan mag-ingat.",
      "Ayun may agenda, sana sulit ang lakad mo.",
    ],
    negative: [
      "Okay lang yan, home mode is valid.",
      "Same vibes, minsan kisame lang talaga ang kasama.",
    ],
    neutral: ["Noted, chill mode lang muna pala today."],
  },
  music: {
    positive: [
      "Ay bet, may soundtrack ang araw mo.",
      "Nice taste ah, masaya pag may tamang background music.",
    ],
    negative: [
      "Okay lang yan, tahimik arc muna.",
      "Walang LSS? Baka brain mo naka-focus mode lang.",
    ],
    neutral: ["Solid din yan, depende talaga sa vibe ng araw."],
  },
  crush: {
    positive: [
      "Ayy may kilig meter. Good luck diyan, galingan mo.",
      "Interesting yan ah, basta dahan dahan lang sa feelings.",
    ],
    negative: [
      "Okay lang yan, peace of mind era muna.",
      "Valid yan, less sakit ng ulo minsan.",
    ],
    neutral: ["Sige lang, keep it mysterious muna."],
  },
  social: {
    positive: [
      "Ayun madami palang social battery. Enjoy sa chika.",
      "Nice, buhay ang inbox vibes mo.",
    ],
    negative: [
      "Gets, selective is peaceful din.",
      "Okay lang maging tahimik minsan, hindi laging broadcast mode.",
    ],
    neutral: ["Fair, depende talaga kung sino ang kausap."],
  },
  general: {
    positive: [
      "Love that for you. Sana tuloy tuloy ang good day.",
      "Ayos yan, may panalo ka today.",
    ],
    negative: [
      "Bawi bukas, pwede pa i-reset ang araw.",
      "Kapit lang, minsan sabaw lang talaga ang universe.",
    ],
    neutral: ["Noted. Sana gumaan pa ang araw mo maya maya."],
  },
};

const RANDOM_ASK_NO_REPLY_LINES = [
  "ay snober",
  "tulog ata hahaha",
  "seen zone malala ah",
  "sige na nga, next time na lang",
  "busy yarn, noted",
  "nahiya yata sakin",
  "nagpakamysterious bigla",
  "quiet mode si idol",
  "hala, di pinansin si bot",
  "baka nasa ibang dimension pa",
];

const pogiThreadLocks = new Map(); 
const pogiPhotoBags = new Map(); 
const phraseShuffleBags = new Map();
const unknownCommandSpamHits = new Map(); 
const unknownCommandCooldowns = new Map(); 
const unknownCommandReplyTargets = new Map(); 
const ltCooldowns = new Map(); 
const userNameCache = new Map(); 
const everyoneCallCooldowns = new Map(); 
const randomAskCooldowns = new Map(); 
const activeRandomAsks = new Map(); 
const curseWarningCounts = new Map(); 

let pogiStateCache = null;


if (!fs.existsSync(REMINDERS_DATA_DIR)) {
  fs.mkdirSync(REMINDERS_DATA_DIR, { recursive: true });
}

if (!fs.existsSync(POGI_DATA_DIR_ABS)) {
  fs.mkdirSync(POGI_DATA_DIR_ABS, { recursive: true });
}

if (!fs.existsSync(LT_DATA_DIR_ABS)) {
  fs.mkdirSync(LT_DATA_DIR_ABS, { recursive: true });
}


const NOCLASS_DATA_DIR = "./data/noclass";
const EXAM_DATA_DIR = "./data/exams";


const SCHEDULE_IMAGE_PATH = "./data/schedule/sched.png";


const SCHEDULE_COOLDOWN_MS = 3 * 60 * 1000; 
const scheduleCooldowns = new Map(); 


if (!fs.existsSync(NOCLASS_DATA_DIR)) {
  fs.mkdirSync(NOCLASS_DATA_DIR, { recursive: true });
}

if (!fs.existsSync(EXAM_DATA_DIR)) {
  fs.mkdirSync(EXAM_DATA_DIR, { recursive: true });
}


const REMINDERLIST_UNSEND_DELAY = 30 * 60 * 1000; 


if (!fs.existsSync(GROUP_DATA_DIR)) {
  fs.mkdirSync(GROUP_DATA_DIR, { recursive: true });
}


const LEGACY_ACTIVITIES_FILE = "./data/activities.json";


const initializedGroups = new Set();


let legacyActivitiesCache = null;





const CLASS_SCHEDULE = [
  
  {
    day: 1, 
    code: "FIL2",
    name: "Filipino sa Iba't Ibang Disiplina",
    instructor: "CARDANO, MARIE",
    startTime: "17:00",
    endTime: "20:00",
    venue: "CAS 407"
  },
  
  {
    day: 2,
    code: "GE10",
    name: "Ethics with Peace Education",
    instructor: "REGALA, JEANNE ROSE",
    startTime: "14:00",
    endTime: "17:00",
    venue: "CAS 306"
  },
  {
    day: 2,
    code: "GE7",
    name: "Science, Technology and Society",
    instructor: "EBRADA, CRISTINA G.",
    startTime: "17:00",
    endTime: "20:00",
    venue: "CAS 310"
  },
  
  {
    day: 3,
    code: "CC3",
    name: "Intermediate Programming (Lecture and Laboratory)",
    instructor: "CO, JOSEPH DARWIN C.",
    startTime: "14:30",
    endTime: "19:30",
    venue: "CAS-CL1"
  },
  
  {
    day: 4,
    code: "NSTP2",
    name: "National Service Training Program 2",
    instructor: "ELEORDA, ARCHELO",
    startTime: "17:30",
    endTime: "20:30",
    venue: "CAS 407"
  },
  
  {
    day: 5,
    code: "GE1",
    name: "Understanding the Self",
    instructor: "DE LEON, ANN MENDOZA",
    startTime: "08:00",
    endTime: "11:00",
    venue: "CAS 301"
  },
  {
    day: 5,
    code: "GE3",
    name: "The Contemporary World",
    instructor: "UMALI, SHERIZ ANN MANAL H.",
    startTime: "17:30",
    endTime: "20:30",
    venue: "CPAG 201"
  },
  
  {
    day: 6,
    code: "PATHFit2",
    name: "Exercise-based Fitness Activities",
    instructor: "SANCHEZ, CLIP HAROLD",
    startTime: "08:00",
    endTime: "10:00",
    venue: "GYM 6"
  },
  {
    day: 6,
    code: "MST4",
    name: "Living in the IT Era",
    instructor: "APUYAN, MARK JOSEPH",
    startTime: "14:00",
    endTime: "17:00",
    venue: "CAS 403"
  }
];

const CLASS_ACTIVITY_SUBJECT_ALIASES = {
  FIL2: ["FILIPINO"],
  GE10: ["ETHICS"],
  GE7: ["STS"],
  CC3: ["PROGRAMMING"],
  NSTP2: ["NSTP2"],
  GE1: ["UTS"],
  GE3: ["CONTEMPORARY"],
  PATHFIT2: ["PATHFIT"],
  MST4: ["LITE"],
};


const sentClassReminders = new Map(); 





const DIVIDER = "━━━━━━━━━━━━━";
const THIN_DIVIDER = "";

function truncateText(text, maxLen = 40) {
  if (!text) return "";
  const s = String(text);
  return s.length > maxLen ? s.slice(0, maxLen - 1) + "…" : s;
}

function titleCaseSlot(slot) {
  if (!slot) return "";
  if (slot === "morning") return "Morning";
  if (slot === "noon") return "Noon";
  if (slot === "evening") return "Evening";
  return slot;
}

function sectionHeader(title, subtitle = "") {
  return subtitle ? `${title}
${subtitle}` : `${title}`;
}

function safeJoinSections(sections) {
  return sections.filter(Boolean).join(`\n\n${DIVIDER}\n\n`);
}

function getShortId(id) {
  if (!id) return "";
  const s = String(id);
  return s.length <= 6 ? s : s.slice(-6);
}


const COMMAND_ALIASES = {
  add: "addact",
  create: "addact",

  rm: "removeact",
  del: "removeact",
  delete: "removeact",
  remove: "removeact",

  edit: "extend",
  move: "extend",
  resched: "extend",
  reschedule: "extend",

  acts: "activities",
  act: "activities",
  tasks: "activities",

  subs: "listsub",
  subjects: "listsub",
  ls: "listsub",

  groups: "listgroups",
  remind: "reminder",
  reminders: "reminderlist",
  rmreminder: "removereminder",
};


function normalizeKey(str) {
  return String(str || "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeCommand(input) {
  const s = String(input || "").trim();
  const out = [];
  let buf = "";
  let quote = null;
  let escaped = false;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];

    if (escaped) {
      buf += ch;
      escaped = false;
      continue;
    }

    if (ch === "\\") {
      escaped = true;
      continue;
    }

    if (quote) {
      if (ch === quote) {
        quote = null;
      } else {
        buf += ch;
      }
      continue;
    }

    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }

    if (/\s/.test(ch)) {
      if (buf.length) {
        out.push(buf);
        buf = "";
      }
      continue;
    }

    buf += ch;
  }

  if (buf.length) out.push(buf);
  return out;
}

function levenshtein(a, b) {
  const s = String(a || "");
  const t = String(b || "");
  const n = s.length;
  const m = t.length;

  if (n === 0) return m;
  if (m === 0) return n;

  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 0; i <= n; i++) dp[i][0] = i;
  for (let j = 0; j <= m; j++) dp[0][j] = j;

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }
  return dp[n][m];
}

function suggestClosestSubject(input, subjects) {
  const key = normalizeKey(input);
  if (!key || !subjects || subjects.length === 0) return null;

  let best = null;
  for (const s of subjects) {
    const dist = levenshtein(key, normalizeKey(s));
    if (!best || dist < best.dist) best = { subject: s, dist };
  }

  if (best && best.dist <= 3) return best.subject;
  return null;
}

function parseNaturalDate(text) {
  const now = getCurrentTime();
  const raw = String(text || "").trim();
  if (!raw) return null;

  const lower = raw.toLowerCase().replace(/\s+/g, " ").trim();

  if (lower === "today") return now.clone().startOf("day");
  if (lower === "tomorrow") return now.clone().add(1, "day").startOf("day");
  if (lower === "yesterday")
    return now.clone().subtract(1, "day").startOf("day");

  const weekdays = {
    sun: 0,
    sunday: 0,
    mon: 1,
    monday: 1,
    tue: 2,
    tues: 2,
    tuesday: 2,
    wed: 3,
    weds: 3,
    wednesday: 3,
    thu: 4,
    thur: 4,
    thurs: 4,
    thursday: 4,
    fri: 5,
    friday: 5,
    sat: 6,
    saturday: 6,
  };

  const parts = lower.split(" ");
  if (parts.length === 1 && weekdays[parts[0]] !== undefined) {
    const targetDow = weekdays[parts[0]];
    let d = now.clone().startOf("day");
    while (d.day() !== targetDow) d.add(1, "day");
    return d;
  }

  if (
    parts.length === 2 &&
    (parts[0] === "next" || parts[0] === "this") &&
    weekdays[parts[1]] !== undefined
  ) {
    const targetDow = weekdays[parts[1]];
    let d = now.clone().startOf("day");

    if (parts[0] === "this") {
      while (d.day() !== targetDow) d.add(1, "day");
      return d;
    }

    while (d.day() !== targetDow) d.add(1, "day");
    if (d.isSame(now.clone().startOf("day"), "day")) d.add(7, "day");
    return d;
  }

  const formats = [
    "MM/DD/YYYY",
    "M/D/YYYY",
    "MM/D/YYYY",
    "M/DD/YYYY",
    "YYYY-MM-DD",
    "MMM D YYYY",
    "MMM D, YYYY",
    "MMMM D YYYY",
    "MMMM D, YYYY",
    "D MMM YYYY",
    "D MMMM YYYY",
  ];

  const parsed = moment.tz(raw, formats, true, TIMEZONE);
  return parsed.isValid() ? parsed.startOf("day") : null;
}

function findDateSegment(args, startIndex = 0) {
  for (let i = startIndex; i < args.length; i++) {
    for (let len = 3; len >= 1; len--) {
      if (i + len > args.length) continue;
      const candidate = args.slice(i, i + len).join(" ");
      const parsed = parseNaturalDate(candidate);
      if (parsed) {
        return { index: i, length: len, date: parsed };
      }
    }
  }
  return null;
}


function parseFlexibleTime(input) {
  const raw = String(input || "").trim();
  if (!raw) return null;

  const s = raw.toLowerCase().replace(/\s+/g, "");

  let m = s.match(/^(\d{1,2}):(\d{2})$/);
  if (m) {
    const hh = Number(m[1]);
    const mm = Number(m[2]);
    if (hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59)
      return { hour: hh, minute: mm };
    return null;
  }

  m = s.match(/^(\d{3,4})$/);
  if (m) {
    const digits = m[1];
    const hh =
      digits.length === 3
        ? Number(digits.slice(0, 1))
        : Number(digits.slice(0, 2));
    const mm = Number(digits.slice(-2));
    if (hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59)
      return { hour: hh, minute: mm };
    return null;
  }

  m = s.match(/^(\d{1,2})(?::?(\d{2}))?(am|pm)$/);
  if (m) {
    let hh = Number(m[1]);
    const mm = m[2] ? Number(m[2]) : 0;
    const ap = m[3];

    if (hh < 1 || hh > 12) return null;
    if (mm < 0 || mm > 59) return null;

    if (ap === "pm" && hh !== 12) hh += 12;
    if (ap === "am" && hh === 12) hh = 0;
    return { hour: hh, minute: mm };
  }

  const parsed = moment(raw, ["h:mma", "h:mm a", "HH:mm", "ha", "h a"], true);
  if (parsed.isValid()) return { hour: parsed.hour(), minute: parsed.minute() };

  return null;
}

function formatTime(time) {
  if (!time) return null;
  const parsed = parseFlexibleTime(time);
  if (!parsed) return null;
  return moment()
    .hour(parsed.hour)
    .minute(parsed.minute)
    .second(0)
    .format("h:mm A");
}

function isValidTime(timeStr) {
  if (!timeStr) return true;
  return !!parseFlexibleTime(timeStr);
}

function parseTimeFromTokens(tokens) {
  if (!tokens || tokens.length === 0) return null;

  if (tokens.length >= 2) {
    const two = `${tokens[0]} ${tokens[1]}`;
    if (parseFlexibleTime(two)) return { timeStr: two, consumed: 2 };
  }

  if (parseFlexibleTime(tokens[0])) return { timeStr: tokens[0], consumed: 1 };

  return null;
}

function parseDateTimeFromParsedDate(dateMoment, timeStr) {
  if (!dateMoment || !dateMoment.isValid()) return null;
  const date = dateMoment.clone().tz(TIMEZONE);

  if (timeStr) {
    const t = parseFlexibleTime(timeStr);
    if (!t) return null;
    date.hour(t.hour);
    date.minute(t.minute);
    date.second(0);
    date.millisecond(0);
  } else {
    date.hour(0);
    date.minute(0);
    date.second(0);
    date.millisecond(0);
  }
  return date;
}


function parseDurationToken(token) {
  const s = String(token || "").trim().toLowerCase();
  const m = s.match(/^\+(\d+)(d|h|m)$/);
  if (!m) return null;
  const num = Number(m[1]);
  const unit = m[2];
  if (!Number.isFinite(num) || num <= 0) return null;
  return { num, unit };
}

function addDurationToDeadline(deadlineIso, duration) {
  const d = moment(deadlineIso).tz(TIMEZONE);
  if (!d.isValid()) return null;

  if (duration.unit === "d") d.add(duration.num, "days");
  if (duration.unit === "h") d.add(duration.num, "hours");
  if (duration.unit === "m") d.add(duration.num, "minutes");

  return d;
}


function makeConfirmToken() {
  return Math.random().toString(36).slice(2, 6).toUpperCase();
}

function createPendingAction(threadID, senderID, action) {
  let token = makeConfirmToken();
  while (pendingActions.has(token)) token = makeConfirmToken();

  const expiresAt = Date.now() + CONFIRM_TTL_MS;
  pendingActions.set(token, { threadID, senderID, expiresAt, action });

  setTimeout(() => {
    const entry = pendingActions.get(token);
    if (entry && entry.expiresAt <= Date.now()) pendingActions.delete(token);
  }, CONFIRM_TTL_MS + 2000);

  return token;
}

function getPendingAction(token) {
  const entry = pendingActions.get(token);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    pendingActions.delete(token);
    return null;
  }
  return entry;
}

function cancelPendingAction(token) {
  return pendingActions.delete(token);
}

function buildSubjectIndex(subjects) {
  return (subjects || []).map((s) => ({ raw: s, key: normalizeKey(s) }));
}


function resolveActivityIdentifier(threadID, activities, args) {
  if (!args || args.length === 0)
    return { error: "Missing activity identifier" };

  const first = args[0];

  const mNum = String(first).match(/^#(\d+)$/);
  if (mNum) {
    const n = Number(mNum[1]);
    const cache = lastActivitiesView.get(threadID);
    if (!cache || !cache.items || cache.items.length === 0) {
      return {
        error: "No recent activities list found. Run /activities first.",
      };
    }
    const found = cache.items.find((x) => x.num === n);
    if (!found)
      return { error: `#${n} not found in the last /activities list.` };

    const act = activities.find((a) => String(a.id) === String(found.id));
    if (!act) return { error: `Activity for #${n} no longer exists.` };

    return { activity: act, consumed: 1 };
  }

  if (String(first).toLowerCase().startsWith("id:")) {
    const needle = String(first).slice(3).trim();
    if (!needle) return { error: "Invalid id: format. Use id:XXXXXX" };

    const matches = activities.filter((a) => {
      const id = String(a.id || "");
      return id === needle || id.endsWith(needle);
    });

    if (matches.length === 0)
      return { error: `No activity found for id:${needle}` };
    if (matches.length > 1)
      return {
        error: `id:${needle} matches multiple activities. Use a longer id.`,
      };

    return { activity: matches[0], consumed: 1 };
  }

  const nameToken = args[0];
  const remaining = args.slice(1);

  const subjects = getSubjects();
  const subjectIndex = buildSubjectIndex(subjects);

  let subjectMatch = null;
  let subjectConsumed = 0;

  for (let j = remaining.length; j >= 1; j--) {
    const cand = remaining.slice(0, j).join(" ");
    const candKey = normalizeKey(cand);
    const found = subjectIndex.find((s) => s.key === candKey);
    if (found) {
      subjectMatch = found.raw;
      subjectConsumed = j;
      break;
    }
  }

  const nameKey = normalizeKey(nameToken);
  const candidates = activities.filter((a) => normalizeKey(a.name) === nameKey);

  if (candidates.length === 0) {
    return { error: `Activity "${getActivityDisplayName(nameToken)}" not found.` };
  }

  if (candidates.length === 1) {
    if (
      subjectMatch &&
      normalizeKey(candidates[0].subject) !== normalizeKey(subjectMatch)
    ) {
      return {
        error: `Activity "${getActivityDisplayName(
          nameToken,
        )}" exists but not under "${subjectMatch}". Try /activities and use #N or id:XXXXXX.`,
      };
    }
    return { activity: candidates[0], consumed: 1 + subjectConsumed };
  }

  if (!subjectMatch) {
    const subjectsList = Array.from(
      new Set(candidates.map((c) => c.subject)),
    ).slice(0, 8);

    return {
      error:
        `Multiple activities named "${getActivityDisplayName(nameToken)}" found.\n` +
        `Please specify the subject OR use #N / id:XXXXXX from /activities.\n\n` +
        `Example:\n${PREFIX}removeact "${nameToken}" "${
          subjectsList[0] || "Subject"
        }"\n\n` +
        `Or:\n${PREFIX}removeact #3`,
    };
  }

  const filtered = candidates.filter(
    (a) => normalizeKey(a.subject) === normalizeKey(subjectMatch),
  );
  if (filtered.length === 0) {
    return {
      error: `No "${getActivityDisplayName(
        nameToken,
      )}" found under subject "${subjectMatch}".`,
    };
  }
  if (filtered.length > 1) {
    return {
      error: `Still ambiguous under "${subjectMatch}". Use #N or id:XXXXXX from /activities.`,
    };
  }

  return { activity: filtered[0], consumed: 1 + subjectConsumed };
}

function parseActivitiesArgs(args) {
  const out = {
    timeframe: null,
    subject: null,
    sort: "soonest",
  };

  const keywords = new Set(["today", "tomorrow", "2days", "thisweek", "nextweek"]);

  let i = 0;
  while (i < (args || []).length) {
    const token = String(args[i] || "").trim();
    const lower = token.toLowerCase();

    if (keywords.has(lower)) {
      out.timeframe = lower;
      i++;
      continue;
    }

    if (lower.startsWith("sort:")) {
      const v = lower.slice(5);
      if (v === "latest") out.sort = "latest";
      else out.sort = "soonest";
      i++;
      continue;
    }

    if (lower.startsWith("subject:")) {
      let v = token.slice(8);
      const parts = [v].filter(Boolean);

      let j = i + 1;
      while (j < args.length) {
        const nxt = String(args[j] || "");
        const nxtLower = nxt.toLowerCase();
        if (keywords.has(nxtLower)) break;
        if (nxtLower.startsWith("sort:")) break;
        if (nxtLower.startsWith("subject:")) break;
        parts.push(nxt);
        j++;
      }

      out.subject = parts.join(" ").trim();
      i = j;
      continue;
    }

    i++;
  }

  return out;
}

function loadJSON(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
    }
  } catch (err) {
    console.error(`Error loading ${filePath}:`, err.message);
  }
  return null;
}

function saveJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error(`Error saving ${filePath}:`, err.message);
    return false;
  }
}

function getGroupThreads() {
  const data = loadJSON(GROUP_THREADS_FILE);
  return data ? new Set(data.threads) : new Set();
}

function saveGroupThreads(threads) {
  saveJSON(GROUP_THREADS_FILE, { threads: Array.from(threads) });
}

let groupThreadIDs = getGroupThreads();


function getGroupDataPath(threadID) {
  return `${GROUP_DATA_DIR}/${threadID}.json`;
}


function getDefaultNotificationFlags() {
  return {
    notifiedNextWeek: { morning: false, noon: false, evening: false },
    notifiedThisWeek: { morning: false, noon: false, evening: false },
    notified2Days: { morning: false, noon: false, evening: false },
    notifiedTomorrow: { morning: false, noon: false, evening: false },
    notifiedToday: { morning: false, noon: false, evening: false },
    notified30Min: false,
    notified20Min: false,
    notified10Min: false,
    notifiedEnded: false,
    ended: false,
  };
}

function getGroupActivities(threadID) {
  const filePath = getGroupDataPath(threadID);
  const data = loadJSON(filePath);
  if (!data || !data.activities) return [];

  let needsSave = false;
  const normalizedActivities = data.activities.map((act) => {
    const needsMigration =
      typeof act.notifiedNextWeek === "boolean" ||
      act.notified20Min === undefined ||
      act.notified10Min === undefined ||
      act.notified30Min === undefined;

    if (needsMigration) {
      needsSave = true;
    }

    const migrateFlag = (oldValue) => {
      if (typeof oldValue === "object" && oldValue !== null) {
        return {
          morning: oldValue.morning || false,
          noon: oldValue.noon || false,
          evening: oldValue.evening || false,
        };
      }
      if (oldValue === true) {
        return { morning: true, noon: true, evening: true };
      }
      return { morning: false, noon: false, evening: false };
    };

    return {
      ...act,
      notifiedNextWeek: migrateFlag(act.notifiedNextWeek),
      notifiedThisWeek: migrateFlag(act.notifiedThisWeek),
      notified2Days: migrateFlag(act.notified2Days),
      notifiedTomorrow: migrateFlag(act.notifiedTomorrow),
      notifiedToday: migrateFlag(act.notifiedToday),
      notified30Min: act.notified30Min || false,
      notified20Min: act.notified20Min || false,
      notified10Min: act.notified10Min || false,
      notifiedEnded: act.notifiedEnded || false,
      ended: act.ended || false,
    };
  });

  if (needsSave) {
    saveGroupActivities(threadID, normalizedActivities);
    console.log(`📦 Normalized activity flags for group ${threadID}`);
  }

  return normalizedActivities;
}

function saveGroupActivities(threadID, activities) {
  const filePath = getGroupDataPath(threadID);
  saveJSON(filePath, {
    activities,
    lastUpdated: getCurrentTime().toISOString(),
  });
}

function initializeGroupData(threadID, shouldMigrateLegacy = true) {
  const filePath = getGroupDataPath(threadID);
  if (!fs.existsSync(filePath)) {
    if (shouldMigrateLegacy && legacyActivitiesCache === null) {
      const legacyData = loadJSON(LEGACY_ACTIVITIES_FILE);
      if (legacyData && legacyData.activities && legacyData.activities.length > 0) {
        legacyActivitiesCache = legacyData.activities;
      } else {
        legacyActivitiesCache = [];
      }
    }

    if (shouldMigrateLegacy && legacyActivitiesCache && legacyActivitiesCache.length > 0) {
      const migratedActivities = legacyActivitiesCache.map((act) => {
        const defaultFlags = getDefaultNotificationFlags();
        return {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: act.name,
          subject: act.subject,
          deadline: act.deadline,
          time: act.time || null,
          createdBy: act.createdBy,
          createdAt: act.createdAt,
          ...defaultFlags,
          migratedFrom: "legacy",
          migratedAt: getCurrentTime().toISOString(),
        };
      });
      saveGroupActivities(threadID, migratedActivities);
      console.log(
        `📦 Migrated ${migratedActivities.length} legacy activities to group ${threadID}`,
      );
    } else {
      saveGroupActivities(threadID, []);
      console.log(`📦 Initialized empty data for group ${threadID}`);
    }
  }
  initializedGroups.add(threadID);
}

function getSubjects() {
  const data = loadJSON(SUBJECTS_FILE);
  return data ? data.subjects : [];
}

function saveSubjects(subjects) {
  saveJSON(SUBJECTS_FILE, { subjects });
}

function getExamDataFile(threadID) {
  return `${EXAM_DATA_DIR}/${threadID}.json`;
}

function createDefaultExamEntry() {
  return {
    active: false,
    weekStart: null,
    exemptions: {},
    cancelledSubjects: {},
    lastExtendedWeekKey: null,
  };
}

function createDefaultExamState() {
  return {
    midterm: createDefaultExamEntry(),
    finals: createDefaultExamEntry(),
  };
}

function normalizeExamEntry(entry) {
  const normalized = createDefaultExamEntry();
  if (!entry || typeof entry !== "object") return normalized;

  normalized.active = !!entry.active && !!entry.weekStart;
  normalized.weekStart = entry.weekStart || null;
  normalized.lastExtendedWeekKey = entry.lastExtendedWeekKey || null;

  if (entry.exemptions && typeof entry.exemptions === "object") {
    Object.entries(entry.exemptions).forEach(([code, offset]) => {
      const normalizedCode = String(code || "").trim().toUpperCase();
      const normalizedOffset = Number(offset);
      if (normalizedCode && Number.isFinite(normalizedOffset) && normalizedOffset > 0) {
        normalized.exemptions[normalizedCode] = Math.floor(normalizedOffset);
      }
    });
  }

  if (entry.cancelledSubjects && typeof entry.cancelledSubjects === "object") {
    Object.entries(entry.cancelledSubjects).forEach(([code, isCancelled]) => {
      const normalizedCode = String(code || "").trim().toUpperCase();
      if (normalizedCode && isCancelled) {
        normalized.cancelledSubjects[normalizedCode] = true;
      }
    });
  }

  return normalized;
}

function getGroupExamState(threadID) {
  const data = loadJSON(getExamDataFile(threadID));
  if (!data || typeof data !== "object") {
    return createDefaultExamState();
  }

  return {
    midterm: normalizeExamEntry(data.midterm),
    finals: normalizeExamEntry(data.finals),
  };
}

function saveGroupExamState(threadID, examState) {
  const payload = {
    midterm: normalizeExamEntry(examState && examState.midterm),
    finals: normalizeExamEntry(examState && examState.finals),
    lastUpdated: getCurrentTime().toISOString(),
  };

  saveJSON(getExamDataFile(threadID), payload);
}

function getNextWeekStart(now = getCurrentTime()) {
  return now.clone().startOf("isoWeek").add(1, "week").startOf("day");
}

function getCurrentWeekKey(now = getCurrentTime()) {
  return now.clone().startOf("isoWeek").format("YYYY-MM-DD");
}

function getExamTypeLabel(examType) {
  return examType === "finals" ? "FINALS" : "MIDTERM";
}

function getExamTypeTitle(examType) {
  return examType === "finals" ? "Finals" : "Midterm";
}

function getExamWeekMoment(weekStart) {
  if (!weekStart) return null;
  const parsed = moment.tz(weekStart, "YYYY-MM-DD", TIMEZONE);
  if (!parsed.isValid()) return null;
  return parsed.startOf("isoWeek");
}

function formatExamWeekRange(weekStart) {
  const start = getExamWeekMoment(weekStart);
  if (!start) return "Invalid week";
  const end = start.clone().add(6, "days");
  return `${start.format("MMM D, YYYY")} - ${end.format("MMM D, YYYY")}`;
}

function getScheduledSubjectCatalog() {
  const seen = new Map();

  CLASS_SCHEDULE.forEach((item) => {
    const code = String(item.code || "").trim().toUpperCase();
    if (!code || seen.has(code)) return;
    seen.set(code, {
      code,
      name: item.name,
      codeKey: normalizeKey(code),
      nameKey: normalizeKey(item.name),
    });
  });

  return Array.from(seen.values());
}

function resolveScheduledSubject(input) {
  const query = normalizeKey(input);
  if (!query) return null;

  const catalog = getScheduledSubjectCatalog();
  const exact = catalog.find((item) => item.codeKey === query || item.nameKey === query);
  if (exact) return exact;

  const partialMatches = catalog.filter(
    (item) =>
      item.codeKey.includes(query) ||
      item.nameKey.includes(query) ||
      query.includes(item.codeKey) ||
      query.includes(item.nameKey),
  );

  if (partialMatches.length === 1) {
    return partialMatches[0];
  }

  if (partialMatches.length > 1) {
    return { ambiguous: true, matches: partialMatches };
  }

  return null;
}

function getExamOffsetWeeks(examEntry, classItem) {
  if (!examEntry || !classItem) return 0;
  const code = String(classItem.code || "").trim().toUpperCase();
  if (!code) return 0;
  const offset = examEntry.exemptions && examEntry.exemptions[code];
  return Number.isFinite(offset) && offset > 0 ? Math.floor(offset) : 0;
}

function isExamSubjectCancelled(examEntry, classItem) {
  if (!examEntry || !classItem) return false;
  const code = String(classItem.code || "").trim().toUpperCase();
  if (!code) return false;
  return !!(examEntry.cancelledSubjects && examEntry.cancelledSubjects[code]);
}

function getActiveExamLabelsForClass(examState, now, classItem) {
  const currentWeekKey = now.clone().startOf("isoWeek").format("YYYY-MM-DD");
  const labels = [];

  ["midterm", "finals"].forEach((examType) => {
    const entry = examState && examState[examType];
    if (!entry || !entry.active || !entry.weekStart) return;
    if (isExamSubjectCancelled(entry, classItem)) return;

    const baseWeek = getExamWeekMoment(entry.weekStart);
    if (!baseWeek) return;

    const effectiveWeekKey = baseWeek
      .clone()
      .add(getExamOffsetWeeks(entry, classItem), "weeks")
      .format("YYYY-MM-DD");

    if (effectiveWeekKey === currentWeekKey) {
      labels.push(`${getExamTypeLabel(examType)} WEEK`);
    }
  });

  return labels;
}

function formatExamLines(examLabels) {
  if (!Array.isArray(examLabels) || examLabels.length === 0) return "";
  return `${examLabels.map((label) => `⚠️ ${label}`).join("\n")}\n\n`;
}

function resolveActivitySubjectForClass(classItem, subjects = []) {
  const exactSubjects = Array.isArray(subjects) ? subjects : [];
  const subjectMap = new Map(exactSubjects.map((subject) => [normalizeKey(subject), subject]));
  const code = String(classItem && classItem.code ? classItem.code : "").trim().toUpperCase();
  const aliases = [
    ...(CLASS_ACTIVITY_SUBJECT_ALIASES[code] || []),
    code,
    classItem && classItem.name ? classItem.name : "",
  ];

  for (const alias of aliases) {
    const key = normalizeKey(alias);
    if (key && subjectMap.has(key)) {
      return subjectMap.get(key);
    }
  }

  for (const subject of exactSubjects) {
    const subjectKey = normalizeKey(subject);
    for (const alias of aliases) {
      const aliasKey = normalizeKey(alias);
      if (!aliasKey) continue;
      if (subjectKey.includes(aliasKey) || aliasKey.includes(subjectKey)) {
        return subject;
      }
    }
  }

  return classItem && classItem.name ? classItem.name : code || "Other";
}

function buildVirtualExamActivities(threadID, subjects, now = getCurrentTime()) {
  const examState = getGroupExamState(threadID);
  const items = [];

  ["midterm", "finals"].forEach((examType) => {
    const entry = examState[examType];
    if (!entry || !entry.active || !entry.weekStart) return;

    const baseWeek = getExamWeekMoment(entry.weekStart);
    if (!baseWeek) return;

    CLASS_SCHEDULE.forEach((classItem) => {
      if (isExamSubjectCancelled(entry, classItem)) {
        return;
      }

      const offsetWeeks = getExamOffsetWeeks(entry, classItem);
      const examMoment = baseWeek
        .clone()
        .add(offsetWeeks, "weeks")
        .isoWeekday(classItem.day)
        .hour(Number(classItem.startTime.split(":")[0] || 0))
        .minute(Number(classItem.startTime.split(":")[1] || 0))
        .second(0)
        .millisecond(0);

      if (!now.isBefore(examMoment)) {
        return;
      }

      items.push({
        id: `exam:${examType}:${classItem.code}:${examMoment.format("YYYY-MM-DD")}`,
        subject: resolveActivitySubjectForClass(classItem, subjects),
        name: `${getExamTypeLabel(examType)} EXAM`,
        deadline: examMoment.toISOString(),
        time: formatClassTime(classItem.startTime),
        isSystemExam: true,
        examType,
        examLabel: getExamTypeLabel(examType),
        classCode: classItem.code,
        className: classItem.name,
        venue: classItem.venue,
      });
    });
  });

  return items;
}

function isActivityPending(activity, now = getCurrentTime()) {
  const deadline = moment(activity.deadline).tz(TIMEZONE);
  if (activity.time) {
    return now.isBefore(deadline);
  }

  return now.isBefore(deadline.clone().endOf("day"));
}

function filterActivitiesByTimeframe(activities, timeframe, now = getCurrentTime()) {
  if (!timeframe) return activities;

  const todayStart = now.clone().startOf("day");
  const todayEnd = now.clone().endOf("day");
  const tomorrowStart = now.clone().add(1, "day").startOf("day");
  const tomorrowEnd = now.clone().add(1, "day").endOf("day");

  if (timeframe === "today") {
    return activities.filter((activity) => {
      const deadline = moment(activity.deadline).tz(TIMEZONE);
      return deadline.isBetween(todayStart, todayEnd, null, "[]");
    });
  }

  if (timeframe === "tomorrow") {
    return activities.filter((activity) => {
      const deadline = moment(activity.deadline).tz(TIMEZONE);
      return deadline.isBetween(tomorrowStart, tomorrowEnd, null, "[]");
    });
  }

  if (timeframe === "2days") {
    return activities.filter((activity) => isDeadlineIn2Days(activity.deadline));
  }

  if (timeframe === "thisweek") {
    return activities.filter((activity) => isDeadlineThisWeek(activity.deadline));
  }

  if (timeframe === "nextweek") {
    return activities.filter((activity) => isDeadlineNextWeek(activity.deadline));
  }

  return activities;
}

function buildExamUsageMessage(examType) {
  const title = getExamTypeTitle(examType);
  const cancelSubjectLines =
    examType === "midterm"
      ? [
          `${PREFIX}${examType} cancel "SUBJECT"`,
          `  - Remove the ${title.toLowerCase()} entry for one specific subject only`,
        ]
      : [];

  return [
    `📘 ${title} Command`,
    "",
    "Main:",
    `${PREFIX}${examType}`,
    `  - Set ${title.toLowerCase()} week to next week (Monday start)`,
    "",
    "Subcommands:",
    `${PREFIX}${examType} extend`,
    `  - Move the scheduled ${title.toLowerCase()} week to the following week`,
    `${PREFIX}${examType} exempt "SUBJECT"`,
    `  - Move one subject to the week after the scheduled ${title.toLowerCase()} week`,
    ...cancelSubjectLines,
    `${PREFIX}${examType} cancel`,
    `  - Cancel the scheduled ${title.toLowerCase()} week`,
    "",
    "Notes:",
    "• extend can only be used once per current week",
    "• SUBJECT can be the code or full subject name",
  ].join("\n");
}

function executeExamCommand(api, event, args, examType) {
  const threadID = event.threadID;
  const now = getCurrentTime();
  const examState = getGroupExamState(threadID);
  const entry = normalizeExamEntry(examState[examType]);
  const title = getExamTypeTitle(examType);
  const label = getExamTypeLabel(examType);
  const nextWeekStart = getNextWeekStart(now).format("YYYY-MM-DD");
  const subcommand = String(args[0] || "").trim().toLowerCase();

  if (!subcommand) {
    examState[examType] = {
      active: true,
      weekStart: nextWeekStart,
      exemptions: {},
      cancelledSubjects: {},
      lastExtendedWeekKey: null,
    };
    saveGroupExamState(threadID, examState);

    api.sendMessage(
      `✅ ${title} week scheduled.\n\n📅 ${formatExamWeekRange(nextWeekStart)}\n🗓️ Week starts every Monday.`,
      threadID,
    );
    return;
  }

  if (subcommand === "extend") {
    if (!entry.active || !entry.weekStart) {
      api.sendMessage(
        `❌ No active ${title.toLowerCase()} week found. Use ${PREFIX}${examType} first.`,
        threadID,
      );
      return;
    }

    const currentWeekKey = getCurrentWeekKey(now);
    if (entry.lastExtendedWeekKey === currentWeekKey) {
      api.sendMessage(
        `❌ ${title} week was already extended this week. You can use ${PREFIX}${examType} extend again next week.`,
        threadID,
      );
      return;
    }

    const currentWeek = getExamWeekMoment(entry.weekStart);
    if (!currentWeek) {
      api.sendMessage(
        `❌ Saved ${title.toLowerCase()} week is invalid. Use ${PREFIX}${examType} to set it again.`,
        threadID,
      );
      return;
    }

    const updatedWeekStart = currentWeek.clone().add(1, "week").format("YYYY-MM-DD");
    examState[examType] = {
      ...entry,
      active: true,
      weekStart: updatedWeekStart,
      lastExtendedWeekKey: currentWeekKey,
    };
    saveGroupExamState(threadID, examState);

    api.sendMessage(
      `✅ ${title} week moved to the next week.\n\n📅 ${formatExamWeekRange(updatedWeekStart)}`,
      threadID,
    );
    return;
  }

  if (subcommand === "exempt") {
    if (!entry.active || !entry.weekStart) {
      api.sendMessage(
        `❌ No active ${title.toLowerCase()} week found. Use ${PREFIX}${examType} first.`,
        threadID,
      );
      return;
    }

    const subjectInput = args.slice(1).join(" ").trim();
    if (!subjectInput) {
      api.sendMessage(`❌ Usage: ${PREFIX}${examType} exempt "THE SUBJECT"`, threadID);
      return;
    }

    const resolvedSubject = resolveScheduledSubject(subjectInput);
    if (!resolvedSubject) {
      api.sendMessage(`❌ Subject not found in class schedule: "${subjectInput}"`, threadID);
      return;
    }

    if (resolvedSubject.ambiguous) {
      const matches = resolvedSubject.matches.map((item) => `• ${item.code} - ${item.name}`).join("\n");
      api.sendMessage(
        `❌ Subject is ambiguous. Please use the exact code or full subject name.\n\n${matches}`,
        threadID,
      );
      return;
    }

    const updatedExemptions = { ...(entry.exemptions || {}) };
    updatedExemptions[resolvedSubject.code] = 1;
    const updatedCancelledSubjects = { ...(entry.cancelledSubjects || {}) };
    delete updatedCancelledSubjects[resolvedSubject.code];

    examState[examType] = {
      ...entry,
      active: true,
      exemptions: updatedExemptions,
      cancelledSubjects: updatedCancelledSubjects,
    };
    saveGroupExamState(threadID, examState);

    const exemptWeekStart = getExamWeekMoment(entry.weekStart).clone().add(1, "week").format("YYYY-MM-DD");
    api.sendMessage(
      `✅ ${label} exemption saved for ${resolvedSubject.code} - ${resolvedSubject.name}.\n\n📅 Exam reminder for this subject will move to ${formatExamWeekRange(exemptWeekStart)}.`,
      threadID,
    );
    return;
  }

  if (subcommand === "cancel") {
    const subjectInput = args.slice(1).join(" ").trim();

    if (subjectInput) {
      if (examType !== "midterm") {
        api.sendMessage(`❌ Specific-subject cancel is only available for ${PREFIX}midterm.`, threadID);
        return;
      }

      if (!entry.active || !entry.weekStart) {
        api.sendMessage(
          `❌ No active ${title.toLowerCase()} week found. Use ${PREFIX}${examType} first.`,
          threadID,
        );
        return;
      }

      const resolvedSubject = resolveScheduledSubject(subjectInput);
      if (!resolvedSubject) {
        api.sendMessage(`❌ Subject not found in class schedule: "${subjectInput}"`, threadID);
        return;
      }

      if (resolvedSubject.ambiguous) {
        const matches = resolvedSubject.matches.map((item) => `• ${item.code} - ${item.name}`).join("\n");
        api.sendMessage(
          `❌ Subject is ambiguous. Please use the exact code or full subject name.\n\n${matches}`,
          threadID,
        );
        return;
      }

      const updatedCancelledSubjects = { ...(entry.cancelledSubjects || {}) };
      if (updatedCancelledSubjects[resolvedSubject.code]) {
        api.sendMessage(
          `ℹ️ ${label} is already removed for ${resolvedSubject.code} - ${resolvedSubject.name}.`,
          threadID,
        );
        return;
      }

      const updatedExemptions = { ...(entry.exemptions || {}) };
      delete updatedExemptions[resolvedSubject.code];
      updatedCancelledSubjects[resolvedSubject.code] = true;

      examState[examType] = {
        ...entry,
        active: true,
        exemptions: updatedExemptions,
        cancelledSubjects: updatedCancelledSubjects,
      };
      saveGroupExamState(threadID, examState);

      api.sendMessage(
        `✅ ${label} removed for ${resolvedSubject.code} - ${resolvedSubject.name}.\n\nThis subject will no longer appear in ${PREFIX}activities and class reminders for the active ${title.toLowerCase()} week.`,
        threadID,
      );
      return;
    }

    if (!entry.active || !entry.weekStart) {
      api.sendMessage(`ℹ️ No active ${title.toLowerCase()} week to cancel.`, threadID);
      return;
    }

    examState[examType] = createDefaultExamEntry();
    saveGroupExamState(threadID, examState);

    api.sendMessage(`✅ ${title} week schedule cancelled.`, threadID);
    return;
  }

  api.sendMessage(buildExamUsageMessage(examType), threadID);
}

const HELP_DETAILS = {
  help: () => [
    `📘 ${PREFIX}help`,
    "",
    "Usage:",
    `${PREFIX}help`,
    `${PREFIX}help COMMAND`,
    "",
    "Examples:",
    `${PREFIX}help addact`,
    `${PREFIX}help midterm`,
  ].join("\n"),
  status: () => [
    `📘 ${PREFIX}status`,
    "",
    "Usage:",
    `${PREFIX}status`,
    "",
    "Shows bot uptime plus VPS CPU and RAM info.",
  ].join("\n"),
  activities: () => [
    `📘 ${PREFIX}activities`,
    "",
    "Usage:",
    `${PREFIX}activities [filters]`,
    "",
    "Filters:",
    "• today",
    "• tomorrow",
    "• 2days",
    "• thisweek",
    "• nextweek",
    "• subject:\"Subject Name\"",
    "• sort:latest",
  ].join("\n"),
  listsub: () => [
    `📘 ${PREFIX}listsub`,
    "",
    "Usage:",
    `${PREFIX}listsub`,
    "",
    "Shows all saved subjects.",
  ].join("\n"),
  confirm: () => [
    `📘 ${PREFIX}confirm`,
    "",
    "Usage:",
    `${PREFIX}confirm CODE`,
    "",
    "Confirms a pending action such as remove or extend.",
  ].join("\n"),
  cancel: () => [
    `📘 ${PREFIX}cancel`,
    "",
    "Usage:",
    `${PREFIX}cancel CODE`,
    "",
    "Cancels a pending confirmation request.",
  ].join("\n"),
  addact: () => [
    `📘 ${PREFIX}addact`,
    "",
    "Usage:",
    `${PREFIX}addact "Name" "Subject" [Date] [Time]`,
    "",
    "Example:",
    `${PREFIX}addact "Performance Task 3" "English" tomorrow 10pm`,
  ].join("\n"),
  removeact: () => [
    `📘 ${PREFIX}removeact`,
    "",
    "Usage:",
    `${PREFIX}removeact (#N | id:XXXXXX | "Name" "Subject")`,
    "",
    `Requires ${PREFIX}confirm CODE to continue.`,
  ].join("\n"),
  extend: () => [
    `📘 ${PREFIX}extend`,
    "",
    "Usage:",
    `${PREFIX}extend (#N | id:XXXXXX | "Name" "Subject") ([NewDate] [NewTime] | +2d/+3h/+30m)`,
    "",
    `Requires ${PREFIX}confirm CODE to continue.`,
  ].join("\n"),
  addsub: () => [
    `📘 ${PREFIX}addsub`,
    "",
    "Usage:",
    `${PREFIX}addsub "Subject"`,
  ].join("\n"),
  removesub: () => [
    `📘 ${PREFIX}removesub`,
    "",
    "Usage:",
    `${PREFIX}removesub "Subject"`,
    "",
    `Requires ${PREFIX}confirm CODE to continue.`,
  ].join("\n"),
  listgroups: () => [
    `📘 ${PREFIX}listgroups`,
    "",
    "Usage:",
    `${PREFIX}listgroups`,
  ].join("\n"),
  noclass: () => [
    `📘 ${PREFIX}noclass`,
    "",
    "Usage:",
    `${PREFIX}noclass <#>`,
    "",
    "Use the class number from the daily schedule list.",
  ].join("\n"),
  schedule: () => [
    `📘 ${PREFIX}schedule`,
    "",
    "Usage:",
    `${PREFIX}schedule`,
    "",
    "Shows the class schedule image and reminder note.",
  ].join("\n"),
  reminder: () => [
    `📘 ${PREFIX}reminder`,
    "",
    "Usage:",
    `${PREFIX}reminder "Message" [Date] Time <true/false>`,
    "",
    "Examples:",
    `${PREFIX}reminder "Check emails" 6pm true`,
    `${PREFIX}reminder "Meeting" tomorrow 2pm false`,
  ].join("\n"),
  reminderlist: () => [
    `📘 ${PREFIX}reminderlist`,
    "",
    "Usage:",
    `${PREFIX}reminderlist`,
  ].join("\n"),
  removereminder: () => [
    `📘 ${PREFIX}removereminder`,
    "",
    "Usage:",
    `${PREFIX}removereminder rem:XXXXXX`,
  ].join("\n"),
  midterm: () => buildExamUsageMessage("midterm"),
  finals: () => buildExamUsageMessage("finals"),
};

function buildMainHelpMessage() {
  return [
    "📋 Bot Commands",
    "",
    "Everyone:",
    `${PREFIX}help - Show commands`,
    `${PREFIX}status - View bot status`,
    `${PREFIX}activities - View pending activities`,
    `${PREFIX}listsub - View subjects`,
    `${PREFIX}confirm - Confirm pending action`,
    `${PREFIX}cancel - Cancel pending action`,
    `${PREFIX}schedule - View class schedule`,
    "",
    "PIO/Representative Only:",
    `${PREFIX}addact - Add activity`,
    `${PREFIX}removeact - Remove activity`,
    `${PREFIX}extend - Change deadline`,
    `${PREFIX}addsub - Add subject`,
    `${PREFIX}removesub - Remove subject`,
    `${PREFIX}listgroups - View tracked groups`,
    `${PREFIX}noclass - Mark a class as NO CLASS today`,
    `${PREFIX}reminder - Set a custom reminder`,
    `${PREFIX}reminderlist - List all reminders`,
    `${PREFIX}removereminder - Remove a reminder`,
    `${PREFIX}midterm - Manage midterm exam week`,
    `${PREFIX}finals - Manage finals exam week`,
    "",
    `💡 Use ${PREFIX}help COMMAND for detailed usage.`,
    `Examples: ${PREFIX}help addact  |  ${PREFIX}help midterm`,
  ].join("\n");
}

function resolveHelpTopic(input) {
  const raw = String(input || "").trim().toLowerCase();
  if (!raw) return null;
  return COMMAND_ALIASES[raw] || raw;
}

function getHelpMessage(args) {
  const topic = resolveHelpTopic(args && args[0]);
  if (!topic) {
    return buildMainHelpMessage();
  }

  const detailBuilder = HELP_DETAILS[topic];
  if (detailBuilder) {
    return detailBuilder();
  }

  return `❌ No detailed help found for "${args[0]}".\n\n${buildMainHelpMessage()}`;
}

function isAdmin(senderID) {
  return ADMINS.includes(senderID);
}

function isPIO(senderID) {
  return String(senderID || "") === String(PIO_ID);
}

function getCurrentTime() {
  return moment().tz(TIMEZONE);
}

function getBotStatusStartedAtMs() {
  let startedAtMs = BOT_STATUS_PROCESS_STARTED_AT_MS;

  try {
    if (fs.existsSync(APPSTATE_FILE_ABS)) {
      const stat = fs.statSync(APPSTATE_FILE_ABS);
      if (stat && Number.isFinite(stat.mtimeMs)) {
        startedAtMs = Math.max(startedAtMs, stat.mtimeMs);
      }
    }
  } catch (err) {
    console.error("Failed to read appstate mtime:", err.message);
  }

  return startedAtMs;
}

function formatDurationCompact(ms) {
  const totalSeconds = Math.max(0, Math.floor(Number(ms || 0) / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || parts.length > 0) parts.push(`${hours}h`);
  if (minutes > 0 || parts.length > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);

  return parts.join(" ");
}

function formatStatusBaseTime(ms) {
  return moment(ms).tz(TIMEZONE).format("MMM D, YYYY h:mm A");
}

function getFirstName(name) {
  const clean = String(name || "").trim();
  if (!clean) return "Someone";
  return clean.split(/\s+/)[0] || clean;
}


function getTimeGreeting() {
  const hour = getCurrentTime().hour();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function buildWelcomeMessage() {
  const greet = getTimeGreeting();
  return (
    `${greet}! I’m ${BOT_INTRO_NAME}, your Task Scheduler bot.\n\n` +
    `I’m built in JavaScript and run using community-maintained (unofficial) npm packages. ` +
    `${BOT_CREATOR_NAME} created me to help your class stay organized by tracking due dates and to-dos.\n\n` +
    `Type ${PREFIX}help to see my commands.`
  );
}





function getReminderDataPath(threadID) {
  return `${REMINDERS_DATA_DIR}/${threadID}.json`;
}

function getGroupReminders(threadID) {
  const filePath = getReminderDataPath(threadID);
  const data = loadJSON(filePath);
  if (!data || !data.reminders) return [];
  return data.reminders;
}

function saveGroupReminders(threadID, reminders) {
  const filePath = getReminderDataPath(threadID);
  saveJSON(filePath, {
    reminders,
    lastUpdated: getCurrentTime().toISOString(),
  });
}

function makeReminderId() {
  return "rem:" + Math.random().toString(36).slice(2, 8);
}

function formatReminderTime(hour, minute) {
  return moment().hour(hour).minute(minute).second(0).format("h:mm A");
}

function parseReminderArgs(args) {
  
  if (args.length < 2) return null;

  const message = args[0];
  const rest = args.slice(1);

  
  const lastArg = String(rest[rest.length - 1] || "").toLowerCase();
  let isRecurring = false;

  if (lastArg === "true" || lastArg === "false") {
    isRecurring = lastArg === "true";
    rest.pop();
  } else {
    return null; 
  }

  if (rest.length === 0) return null;

  
  const dateSeg = findDateSegment(rest, 0);
  let date = null;
  let timeTokens = [];

  if (dateSeg) {
    date = dateSeg.date;
    timeTokens = rest.slice(dateSeg.index + dateSeg.length);
  } else {
    timeTokens = rest;
  }

  
  const timeParsed = parseTimeFromTokens(timeTokens);
  if (!timeParsed) return null;

  const timeObj = parseFlexibleTime(timeParsed.timeStr);
  if (!timeObj) return null;

  return {
    message,
    date: date ? date.format("YYYY-MM-DD") : null,
    hour: timeObj.hour,
    minute: timeObj.minute,
    isRecurring,
  };
}

function getCountdown(deadline, hasTime) {
  const now = getCurrentTime();
  const deadlineMoment = moment(deadline).tz(TIMEZONE);

  const todayStart = now.clone().startOf("day");
  const deadlineStart = deadlineMoment.clone().startOf("day");

  const isToday = todayStart.isSame(deadlineStart, "day");

  let effectiveDeadline = deadlineMoment.clone();
  if (!hasTime) {
    effectiveDeadline = deadlineMoment.clone().endOf("day");
  }

  if (now.isAfter(effectiveDeadline)) {
    if (isToday) return "TODAY (PASSED)";
    return "PASSED";
  }

  if (isToday) {
    if (hasTime) {
      const duration = moment.duration(deadlineMoment.diff(now));
      const hours = Math.floor(duration.asHours());
      const minutes = duration.minutes();

      if (hours > 0) return `${hours}h ${minutes}m left`;
      if (minutes > 0) return `${minutes}m left`;
      return "< 1m left";
    }
    return "TODAY";
  }

  const tomorrowStart = todayStart.clone().add(1, "day");
  if (deadlineStart.isSame(tomorrowStart, "day")) return "TOMORROW";

  const duration = moment.duration(effectiveDeadline.diff(now));
  const totalDays = Math.floor(duration.asDays());
  const hours = duration.hours();
  const minutes = duration.minutes();

  let parts = [];
  if (totalDays > 0) parts.push(`${totalDays}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (totalDays === 0 && minutes > 0) parts.push(`${minutes}m`);

  return parts.length > 0 ? parts.join(" ") + " left" : "< 1m left";
}

function formatDeadline(activity) {
  const date = moment(activity.deadline).tz(TIMEZONE);
  let formatted = date.format("MMMM D, YYYY");
  if (activity.time) {
    formatted += ` at ${activity.time}`;
  }
  return formatted;
}

function getActivityDisplayName(name) {
  return String(name || "").replace(/_/g, " ");
}

function getYearWeek(date) {
  const d = moment(date).tz(TIMEZONE);
  return `${d.isoWeekYear()}-W${d.isoWeek()}`;
}

function formatTimeRemaining(deadline, hasTime) {
  const now = getCurrentTime();
  const deadlineMoment = moment(deadline).tz(TIMEZONE);

  let effectiveDeadline = deadlineMoment.clone();
  if (!hasTime) {
    effectiveDeadline = deadlineMoment.clone().endOf("day");
  }

  const duration = moment.duration(effectiveDeadline.diff(now));
  const totalDays = Math.floor(duration.asDays());
  const hours = duration.hours();
  const minutes = duration.minutes();

  let parts = [];
  if (totalDays > 0) parts.push(`${totalDays} day${totalDays > 1 ? "s" : ""}`);
  if (hours > 0) parts.push(`${hours} hour${hours > 1 ? "s" : ""}`);
  if (totalDays === 0 && minutes > 0)
    parts.push(`${minutes} minute${minutes > 1 ? "s" : ""}`);

  return parts.length > 0 ? parts.join(", ") : "less than a minute";
}

function isDeadlineNextWeek(deadline) {
  const now = getCurrentTime();
  const deadlineMoment = moment(deadline).tz(TIMEZONE);

  const nextMonday = now.clone().startOf("isoWeek").add(1, "week");
  const nextSunday = nextMonday.clone().endOf("isoWeek");

  return deadlineMoment.isBetween(nextMonday, nextSunday, "day", "[]");
}

function isDeadlineThisWeek(deadline) {
  const now = getCurrentTime();
  const deadlineMoment = moment(deadline).tz(TIMEZONE);

  const thisMonday = now.clone().startOf("isoWeek");
  const thisSaturday = thisMonday.clone().add(5, "days").endOf("day");

  return deadlineMoment.isBetween(thisMonday, thisSaturday, "day", "[]");
}

function wasCreatedThisWeek(createdAt) {
  const now = getCurrentTime();
  const createdMoment = moment(createdAt).tz(TIMEZONE);
  return getYearWeek(now) === getYearWeek(createdMoment);
}

function isDeadlineIn2Days(deadline) {
  const now = getCurrentTime();
  const deadlineMoment = moment(deadline).tz(TIMEZONE);

  const twoDaysFromNow = now.clone().add(2, "days").startOf("day");
  const twoDaysFromNowEnd = twoDaysFromNow.clone().endOf("day");

  return deadlineMoment.isBetween(twoDaysFromNow, twoDaysFromNowEnd, "day", "[]");
}


function sendSimpleMessage(api, threadID, messageBody) {
  return new Promise((resolve) => {
    api.sendMessage(messageBody, threadID, (err, messageInfo) => {
      if (err) {
        console.error(`Failed to send message to ${threadID}:`, err.message);
        resolve(null);
      } else {
        resolve(messageInfo);
      }
    });
  });
}

function sendMessageAsync(api, payload, threadID) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    const timeout = setTimeout(() => {
      console.error(`sendMessage timeout in thread ${threadID}`);
      finish(null);
    }, SEND_MESSAGE_TIMEOUT_MS);

    try {
      api.sendMessage(payload, threadID, (err, messageInfo) => {
        clearTimeout(timeout);
        if (err) {
          console.error(`Failed to send message to ${threadID}:`, err.message);
          finish(null);
        } else {
          finish(messageInfo || null);
        }
      });
    } catch (error) {
      clearTimeout(timeout);
      console.error(`sendMessage threw in thread ${threadID}:`, error.message);
      finish(null);
    }
  });
}

function sendAttachmentMessageAsync(api, filePath, threadID, options = {}) {
  const timeoutMs = Number(options.timeoutMs || SEND_MESSAGE_TIMEOUT_MS);
  const fileLabel = path.basename(String(filePath || ""));

  if (!filePath || !fs.existsSync(filePath)) {
    console.error(`Attachment file missing for thread ${threadID}: ${filePath}`);
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    let settled = false;
    let stream = null;

    const finish = (value) => {
      if (settled) return;
      settled = true;
      if (stream) {
        stream.removeAllListeners("error");
      }
      clearTimeout(timeout);
      resolve(value);
    };

    const timeout = setTimeout(() => {
      console.error(`Attachment send timeout in thread ${threadID}: ${fileLabel}`);
      try {
        if (stream) stream.destroy();
      } catch (_) {}
      finish(null);
    }, timeoutMs);

    try {
      stream = fs.createReadStream(filePath);
      stream.once("error", (err) => {
        console.error(`Attachment read error (${fileLabel}) in ${threadID}:`, err.message);
        finish(null);
      });

      console.log(`[POGI] sending attachment -> ${filePath}`);
      api.sendMessage({ body: " ", attachment: stream }, threadID, (err, messageInfo) => {
        if (err) {
          console.error(`Failed to send attachment (${fileLabel}) to ${threadID}:`, err.message);
          finish(null);
        } else {
          finish(messageInfo || null);
        }
      });
    } catch (error) {
      console.error(`Attachment send threw (${fileLabel}) in ${threadID}:`, error.message);
      finish(null);
    }
  });
}

function unsendMessageAsync(api, messageID, timeoutMs = 7000) {
  if (!messageID) return Promise.resolve(false);

  return new Promise((resolve) => {
    let settled = false;
    const finish = (ok) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(Boolean(ok));
    };

    const timer = setTimeout(() => {
      console.warn(`unsendMessage timeout for ${messageID}`);
      finish(false);
    }, timeoutMs);

    try {
      api.unsendMessage(messageID, (err) => {
        if (err) {
          console.warn(`unsendMessage failed for ${messageID}:`, err.message || err);
          finish(false);
        } else {
          finish(true);
        }
      });
    } catch (error) {
      console.warn(`unsendMessage threw for ${messageID}:`, error.message || error);
      finish(false);
    }
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickFromShuffleBag(map, key, items) {
  if (!Array.isArray(items) || items.length === 0) return null;

  let bag = map.get(key);
  if (!bag || bag.length === 0) {
    bag = shuffleArray(items);
  }

  const picked = bag.shift();
  map.set(key, bag);
  return picked;
}

function listImageFilesInDir(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) return [];
    return fs
      .readdirSync(dirPath, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => ({
        name: entry.name,
        fullPath: path.join(dirPath, entry.name),
        ext: path.extname(entry.name).toLowerCase(),
      }))
      .filter((f) => [".jpg", ".jpeg", ".png", ".gif", ".webp", ".jfif", ".bmp"].includes(f.ext))
      .map((f) => f.fullPath);
  } catch (error) {
    console.error(`Failed to read image files in ${dirPath}:`, error.message);
    return [];
  }
}

function loadPogiState() {
  if (pogiStateCache) return pogiStateCache;

  const loaded = loadJSON(POGI_STATE_FILE_ABS);
  pogiStateCache = loaded && typeof loaded === "object" ? loaded : {};
  if (!pogiStateCache.userStats || typeof pogiStateCache.userStats !== "object") {
    pogiStateCache.userStats = {};
  }
  return pogiStateCache;
}

function savePogiState() {
  if (!pogiStateCache) return;
  saveJSON(POGI_STATE_FILE_ABS, pogiStateCache);
}

function getPogiUserStats(threadID, senderID) {
  const state = loadPogiState();
  if (!state.userStats[threadID]) state.userStats[threadID] = {};
  if (!state.userStats[threadID][senderID]) {
    state.userStats[threadID][senderID] = {
      pullsSinceUltra: 0,
      totalPulls: 0,
      lastPulledAt: null,
      lastRarity: null,
    };
  }
  return state.userStats[threadID][senderID];
}

function getPogiThreadLock(threadID) {
  if (!pogiThreadLocks.has(threadID)) {
    pogiThreadLocks.set(threadID, {
      processing: false,
      processingSince: 0,
      activeUntil: 0,
      token: null,
    });
  }
  return pogiThreadLocks.get(threadID);
}

function isPogiProcessing(threadID) {
  const lock = getPogiThreadLock(threadID);

  if (
    lock.processing &&
    lock.processingSince &&
    Date.now() - Number(lock.processingSince) > POGI_PROCESSING_STALE_MS
  ) {
    console.warn(`Clearing stale /pogi processing lock for thread ${threadID}`);
    lock.processing = false;
    lock.processingSince = 0;
  }

  return Boolean(lock.processing);
}

function hasActivePogiResult(threadID) {
  const lock = getPogiThreadLock(threadID);
  return lock.activeUntil && lock.activeUntil > Date.now();
}

function getPogiRarityFolders() {
  if (!fs.existsSync(POGI_DATA_DIR_ABS)) return [];

  const dirs = fs
    .readdirSync(POGI_DATA_DIR_ABS, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => ({ name: d.name, normalized: normalizeKey(d.name) }));

  const matched = [];
  for (const def of POGI_RARITY_DEFS) {
    const dir = dirs.find((d) => def.aliases.some((alias) => normalizeKey(alias) === d.normalized));
    if (dir) {
      matched.push({
        key: def.key,
        label: def.label,
        baseWeight: def.baseWeight,
        folderName: dir.name,
        folderPath: path.join(POGI_DATA_DIR_ABS, dir.name),
      });
    }
  }

  return matched;
}

function weightedRandomPick(entries) {
  const total = entries.reduce((sum, item) => sum + item.weight, 0);
  if (total <= 0) return null;

  let roll = Math.random() * total;
  for (const item of entries) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }
  return entries[entries.length - 1] || null;
}

function selectPogiRarity(threadID, senderID, rarityFolders) {
  const stats = getPogiUserStats(threadID, senderID);
  const pityBefore = Number(stats.pullsSinceUltra || 0);

  const byKey = new Map(rarityFolders.map((r) => [r.key, r]));
  const ultraRarity = byKey.get("ultra") || null;

  const softPitySteps = Math.max(0, pityBefore - POGI_ULTRA_SOFT_PITY_START + 1);
  const softPityBonus = softPitySteps * POGI_ULTRA_SOFT_PITY_STEP;
  const hardPityNext = pityBefore + 1 >= POGI_ULTRA_HARD_PITY;

  let selected = null;
  let ultraChance = 0;

  if (ultraRarity) {
    ultraChance = Math.min(1, 0.01 + softPityBonus);

    if (hardPityNext) {
      selected = ultraRarity;
    } else {
      const nonUltra = rarityFolders.filter((r) => r.key !== "ultra");
      const baseNonUltraTotal = nonUltra.reduce((sum, r) => sum + r.baseWeight, 0);
      const remainingShare = Math.max(0, 1 - ultraChance);

      const weightedEntries = [];
      if (nonUltra.length > 0 && baseNonUltraTotal > 0) {
        for (const rarity of nonUltra) {
          weightedEntries.push({
            ...rarity,
            weight: (rarity.baseWeight / baseNonUltraTotal) * remainingShare,
          });
        }
      }

      weightedEntries.push({ ...ultraRarity, weight: ultraChance });
      selected = weightedRandomPick(weightedEntries);
    }
  } else {
    selected = weightedRandomPick(
      rarityFolders.map((rarity) => ({ ...rarity, weight: rarity.baseWeight })),
    );
  }

  if (!selected) return null;

  stats.totalPulls = Number(stats.totalPulls || 0) + 1;
  stats.lastPulledAt = getCurrentTime().toISOString();
  stats.lastRarity = selected.key;

  if (selected.key === "ultra") {
    stats.pullsSinceUltra = 0;
  } else {
    stats.pullsSinceUltra = pityBefore + 1;
  }

  savePogiState();

  return {
    rarity: selected,
    pityBefore,
    pityAfter: stats.pullsSinceUltra,
    hardPityTriggered: selected.key === "ultra" && hardPityNext,
    ultraChanceBeforeRoll: ultraRarity ? ultraChance : 0,
  };
}

function pickPogiPhoto(threadID, rarity) {
  const files = listImageFilesInDir(rarity.folderPath);
  if (files.length === 0) return null;
  const bagKey = `${threadID}:${rarity.key}`;
  return pickFromShuffleBag(pogiPhotoBags, bagKey, files);
}


function pickRandomItem(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return "";
  return arr[Math.floor(Math.random() * arr.length)];
}

const POGI_HYPE_LINES = {
  common: [
    "sakto lang, pang good vibes",
    "basic pull pero may dating",
    "common lang pero may aura",
    "warm-up roll pa lang yan",
    "di man rare, pogi pa rin",
  ],
  rare: [
    "uy rare, may konting yabang na yan",
    "solid pull, umaangat ang porma",
    "rare agad, may swerte ka today",
    "malinis na roll yan",
    "nice one, may dating ang hatak",
  ],
  epic: [
    "epic pull, gumagalaw ang baso",
    "grabe, epic agad",
    "angas ng roll mo dito",
    "ramdam yung swerte, epic yan",
    "uy epic, lumalakas na",
  ],
  legendary: [
    "legendary yan, umiinit na",
    "grabe ka, legendary pull",
    "paborito ka ata ng gacha",
    "solid na solid, legendary",
    "angas, legendary talaga",
  ],
  mythical: [
    "mythical pull, halimaw yung swerte",
    "sobrang rare neto, lupet mo",
    "pang malakasan yung roll mo",
    "mythical agad, todo porma",
    "grabe, mythical talaga",
  ],
  ultra: [
    "ULTRA SUPER GWAPO, jackpot ka boss",
    "ULTRA SUPER GWAPO, iba talaga dugo mo",
    "ULTRA SUPER GWAPO, pinakaangas na pull",
    "ULTRA SUPER GWAPO, panalo ka ngayong round",
    "ULTRA SUPER GWAPO, respeto sa swerte mo",
  ],
};

function getPogiResultLine(displayName, pullInfo) {
  const rarityKey = String(pullInfo && pullInfo.rarity && pullInfo.rarity.key ? pullInfo.rarity.key : "common").toLowerCase();
  const rarityLabel = pullInfo && pullInfo.rarity && pullInfo.rarity.label ? pullInfo.rarity.label : "COMMON";
  const baseLine = `${displayName} pulled ${rarityLabel}.`;

  let hypeLine = pickRandomItem(POGI_HYPE_LINES[rarityKey] || POGI_HYPE_LINES.common) || "solid pull.";

  if (rarityKey === "ultra" && pullInfo && pullInfo.hardPityTriggered) {
    hypeLine += " Hard pity proc.";
  } else if (rarityKey === "ultra" && Number(pullInfo.ultraChanceBeforeRoll || 0) > 0.01) {
    hypeLine += " Pity boost worked.";
  }

  return `${baseLine}
${hypeLine}`;
}

function getUserDisplayName(api, senderID) {
  return new Promise((resolve) => {
    if (userNameCache.has(senderID)) {
      resolve(userNameCache.get(senderID));
      return;
    }

    let settled = false;
    const finish = (name) => {
      if (settled) return;
      settled = true;
      resolve(name || "Someone");
    };

    const timeout = setTimeout(() => {
      console.warn(`[POGI] getUserInfo timeout for sender ${senderID}, using fallback name`);
      finish("Someone");
    }, 8000);

    try {
      api.getUserInfo(senderID, (err, data) => {
        clearTimeout(timeout);
        if (err || !data) {
          if (err) {
            console.warn(`[POGI] getUserInfo failed for ${senderID}: ${err.message || err}`);
          }
          finish("Someone");
          return;
        }

        const info = data[senderID] || Object.values(data)[0] || {};
        const name = info.name || info.fullName || "Someone";
        userNameCache.set(senderID, name);
        finish(name);
      });
    } catch (error) {
      clearTimeout(timeout);
      console.warn(`[POGI] getUserInfo threw for ${senderID}: ${error.message}`);
      finish("Someone");
    }
  });
}

function containsEveryoneCall(text) {
  const body = String(text || "");
  return /(^|[\s.,!?;:()\[\]{}"'`-])@everyone(?=$|[\s.,!?;:()\[\]{}"'`-])/i.test(body);
}

function containsCurseWord(text) {
  return CURSE_REGEX.test(String(text || ""));
}

function detectRandomAskReplyIntent(text) {
  const body = String(text || "").toLowerCase();
  if (!body.trim()) return "neutral";

  const negativePatterns = [
    /\b(hindi pa|di pa|wala pa|not yet)\b/,
    /\b(hindi|di|wala|ayaw|pass|busy|mamaya|nope|waley|pagod|antok)\b/,
  ];
  const positivePatterns = [
    /\b(oo|opo|yes|yup|yep|syempre|sige|oks|okay|okay na|meron|meron na|busog|kumain|nakatulog|nakapag|game|free|goods|ayos)\b/,
  ];

  if (negativePatterns.some((pattern) => pattern.test(body))) return "negative";
  if (positivePatterns.some((pattern) => pattern.test(body))) return "positive";
  return "neutral";
}

function getRandomAskQuestion() {
  return (
    pickFromShuffleBag(phraseShuffleBags, "random-ask:questions", RANDOM_ASK_PROMPTS) ||
    RANDOM_ASK_PROMPTS[0]
  );
}

function getRandomAskReply(state, replyText) {
  const topic = state && state.question && state.question.topic ? state.question.topic : "general";
  const intent = detectRandomAskReplyIntent(replyText);
  const topicBank = RANDOM_ASK_REPLY_BANK[topic] || RANDOM_ASK_REPLY_BANK.general;
  const pool = topicBank[intent] && topicBank[intent].length > 0 ? topicBank[intent] : topicBank.neutral;

  return (
    pickFromShuffleBag(phraseShuffleBags, `random-ask:reply:${topic}:${intent}`, pool) ||
    pool[0] ||
    "Ahh okay"
  );
}

function clearActiveRandomAsk(threadID) {
  const current = activeRandomAsks.get(threadID);
  if (current && current.timeoutHandle) {
    clearTimeout(current.timeoutHandle);
  }
  activeRandomAsks.delete(threadID);
  return current || null;
}

async function getThreadParticipantInfos(api, threadID) {
  if (typeof api.getThreadInfo !== "function") {
    return [];
  }

  return new Promise((resolve) => {
    let settled = false;

    const finish = (participants) => {
      if (settled) return;
      settled = true;
      resolve(Array.isArray(participants) ? participants : []);
    };

    const timeout = setTimeout(() => {
      console.warn(`getThreadInfo timeout for thread ${threadID}`);
      finish([]);
    }, 10000);

    try {
      api.getThreadInfo(threadID, (err, info) => {
        clearTimeout(timeout);

        if (err || !info) {
          if (err) {
            console.warn(`getThreadInfo failed for ${threadID}: ${err.message || err}`);
          }
          finish([]);
          return;
        }

        const participantIDs = Array.isArray(info.participantIDs)
          ? info.participantIDs.map((id) => String(id))
          : [];
        const nameMap = new Map();

        if (Array.isArray(info.userInfo)) {
          info.userInfo.forEach((user) => {
            const id = String(user && (user.id || user.userID || user.senderID) ? user.id || user.userID || user.senderID : "");
            const name = user && (user.name || user.fullName || user.firstName) ? user.name || user.fullName || user.firstName : "";
            if (id && name) {
              nameMap.set(id, name);
              userNameCache.set(id, name);
            }
          });
        } else if (info.userInfo && typeof info.userInfo === "object") {
          Object.entries(info.userInfo).forEach(([id, user]) => {
            const normalizedId = String(id || "");
            const name = user && (user.name || user.fullName || user.firstName) ? user.name || user.fullName || user.firstName : "";
            if (normalizedId && name) {
              nameMap.set(normalizedId, name);
              userNameCache.set(normalizedId, name);
            }
          });
        }

        finish(participantIDs.map((id) => ({ id, name: nameMap.get(id) || userNameCache.get(id) || "" })));
      });
    } catch (error) {
      clearTimeout(timeout);
      console.warn(`getThreadInfo threw for ${threadID}: ${error.message}`);
      finish([]);
    }
  });
}

function scheduleRandomAskTimeout(api, state) {
  const token = state.token;
  state.timeoutHandle = setTimeout(async () => {
    const current = activeRandomAsks.get(state.threadID);
    if (!current || current.token !== token) return;

    activeRandomAsks.delete(state.threadID);

    if (current.hasChatted) {
      return;
    }

    const noReplyLine =
      pickFromShuffleBag(phraseShuffleBags, "random-ask:no-reply", RANDOM_ASK_NO_REPLY_LINES) ||
      RANDOM_ASK_NO_REPLY_LINES[0];
    await sendMessageAsync(api, noReplyLine, state.threadID);
  }, RANDOM_ASK_REPLY_TIMEOUT_MS);
}

async function maybeHandleEveryoneCall(api, event) {
  if (!event.isGroup || !containsEveryoneCall(event.body)) return false;

  const threadID = event.threadID;
  const now = Date.now();
  const cooldownUntil = everyoneCallCooldowns.get(threadID) || 0;
  if (cooldownUntil > now) {
    return true;
  }

  const displayName = await getUserDisplayName(api, String(event.senderID || ""));
  everyoneCallCooldowns.set(threadID, now + EVERYONE_CALL_COOLDOWN_MS);
  await sendMessageAsync(api, `Tawag kayo ni ${displayName} mga alipin`, threadID);
  return true;
}

async function maybeHandleCurseWarning(api, event) {
  if (!containsCurseWord(event.body)) return false;

  const key = `${event.threadID}:${event.senderID}`;
  const nextCount = (curseWarningCounts.get(key) || 0) + 1;
  curseWarningCounts.set(key, nextCount);

  const warning = CURSE_WARNING_MESSAGES[(nextCount - 1) % CURSE_WARNING_MESSAGES.length];
  await sendMessageAsync(api, warning, event.threadID);
  return true;
}

async function maybeHandleRandomAskInteraction(api, event) {
  const threadID = event.threadID;
  const state = activeRandomAsks.get(threadID);
  if (!state) return false;

  const senderID = String(event.senderID || "");
  if (senderID !== state.targetID) return false;

  const reply = event.messageReply;
  const repliedToAsk =
    event.type === "message_reply" &&
    reply &&
    String(reply.messageID || "") === String(state.messageID || "");

  if (repliedToAsk) {
    clearActiveRandomAsk(threadID);
    const followUp = getRandomAskReply(state, event.body);
    await sendMessageAsync(api, followUp, threadID);
    return true;
  }

  state.hasChatted = true;
  return false;
}

async function maybeTriggerRandomAsk(api, event, botID, options = {}) {
  if (!event.isGroup || !event.threadID) return false;
  if (activeRandomAsks.has(event.threadID)) return false;
  if (isPogiProcessing(event.threadID) || hasActivePogiResult(event.threadID)) return false;

  const force = !!options.force;
  const now = Date.now();
  const cooldownUntil = randomAskCooldowns.get(event.threadID) || 0;
  if (!force && cooldownUntil > now) {
    return false;
  }

  if (!force && Math.random() >= RANDOM_ASK_TRIGGER_CHANCE) {
    return false;
  }

  const participants = await getThreadParticipantInfos(api, event.threadID);
  const candidates = participants.filter((participant) => participant && participant.id && String(participant.id) !== String(botID));

  let picked = null;
  if (candidates.length > 0) {
    picked = candidates[Math.floor(Math.random() * candidates.length)];
  } else {
    const fallbackId = String(event.senderID || "");
    if (!fallbackId || fallbackId === String(botID)) {
      return false;
    }
    picked = { id: fallbackId, name: userNameCache.get(fallbackId) || "" };
  }

  const targetName = picked.name || (await getUserDisplayName(api, picked.id));
  const mentionTag = `@${getFirstName(targetName)}`;
  const question = getRandomAskQuestion();
  const messageInfo = await sendMessageAsync(
    api,
    {
      body: `${mentionTag} ${question.text}`,
      mentions: [{ id: picked.id, tag: mentionTag }],
    },
    event.threadID,
  );

  if (!messageInfo || !messageInfo.messageID) {
    return false;
  }

  randomAskCooldowns.set(event.threadID, now + RANDOM_ASK_COOLDOWN_MS);

  const state = {
    token: `${Date.now()}:${Math.random()}`,
    threadID: event.threadID,
    targetID: String(picked.id),
    targetName,
    question,
    messageID: messageInfo.messageID,
    hasChatted: false,
    timeoutHandle: null,
  };

  activeRandomAsks.set(event.threadID, state);
  scheduleRandomAskTimeout(api, state);
  return true;
}

async function handlePogiCommand(api, event) {
  const threadID = event.threadID;
  const senderID = String(event.senderID || "");
  const lock = getPogiThreadLock(threadID);

  if (lock.processing) {
    return;
  }

  if (lock.activeUntil && lock.activeUntil > Date.now()) {
    const notice = await sendMessageAsync(
      api,
      "⏳ /pogi will be available after the recent result is gone.",
      threadID,
    );
    if (notice && notice.messageID) {
      setTimeout(() => {
        api.unsendMessage(notice.messageID, () => {});
      }, 5000);
    }
    return;
  }

  lock.processing = true;
  lock.processingSince = Date.now();
  let prepMessageID = null;

  try {
    const rarityFolders = getPogiRarityFolders();
    console.log(`[POGI] base=${POGI_DATA_DIR_ABS} rarities=${rarityFolders.map((r) => `${r.folderName}:${r.key}`).join(", ")}`);
    if (rarityFolders.length === 0) {
      await sendMessageAsync(
        api,
        `⚠️ No rarity folders found in ${POGI_DATA_DIR} (resolved: ${POGI_DATA_DIR_ABS}).`,
        threadID,
      );
      return;
    }

    const prep = await sendMessageAsync(api, "Sandali, random pogi pull muna...", threadID);
    prepMessageID = prep && prep.messageID ? prep.messageID : null;

    await sleep(POGI_PULL_PREPARE_DELAY_MS);
    if (prepMessageID) {
      console.log(`[POGI] unsending prep message ${prepMessageID}`);
      await unsendMessageAsync(api, prepMessageID, 4000);
      prepMessageID = null;
      console.log(`[POGI] continuing after prep unsend`);
    }

    const pullInfo = selectPogiRarity(threadID, senderID, rarityFolders);
    if (!pullInfo) {
      await sendMessageAsync(api, "⚠️ Walang available rarity pull right now.", threadID);
      return;
    }

    console.log(`[POGI] thread=${threadID} user=${senderID} rarity=${pullInfo.rarity.label} folder=${pullInfo.rarity.folderPath}`);
    const photoPath = pickPogiPhoto(threadID, pullInfo.rarity);
    if (!photoPath) {
      await sendMessageAsync(
        api,
        `⚠️ Walang image sa folder ng ${pullInfo.rarity.label}.`,
        threadID,
      );
      return;
    }

    console.log(`[POGI] picked file=${photoPath}`);
    console.log(`[POGI] resolving display name for ${senderID}`);
    const displayName = await getUserDisplayName(api, senderID);
    console.log(`[POGI] displayName=${displayName}`);

    const photoInfo = await sendAttachmentMessageAsync(api, photoPath, threadID, {
      timeoutMs: 25 * 1000,
    });

    if (!photoInfo || !photoInfo.messageID) {
      await sendMessageAsync(
        api,
        `⚠️ Hindi na-send yung file sa ${pullInfo.rarity.folderName} (${path.basename(photoPath)}). Check file format/path or try another image file.`,
        threadID,
      );
      return;
    }

    const pityLine =
      pullInfo.rarity.key === "ultra"
        ? "Pity reset."
        : `Ultra pity: ${pullInfo.pityAfter}/${POGI_ULTRA_HARD_PITY}`;

    const resultInfo = await sendMessageAsync(
      api,
      `${getPogiResultLine(displayName, pullInfo)}
${pityLine}`,
      threadID,
    );

    const token = `${Date.now()}-${Math.random()}`;
    lock.token = token;
    lock.activeUntil = Date.now() + POGI_RESULT_VISIBLE_MS;
    lock.processing = false;
    lock.processingSince = 0;

    setTimeout(async () => {
      await unsendMessageAsync(api, photoInfo && photoInfo.messageID);
      await unsendMessageAsync(api, resultInfo && resultInfo.messageID);

      const currentLock = getPogiThreadLock(threadID);
      if (currentLock.token === token) {
        currentLock.activeUntil = 0;
        currentLock.token = null;
      }
    }, POGI_RESULT_VISIBLE_MS);
  } catch (error) {
    console.error("/pogi error:", error);
    await sendMessageAsync(api, "⚠️ May error sa /pogi pull. Try ulit.", threadID);
  } finally {
    if (prepMessageID) {
      await unsendMessageAsync(api, prepMessageID);
    }
    lock.processing = false;
    lock.processingSince = 0;
  }
}

function pruneUnknownReplyTargets() {
  const now = Date.now();
  for (const [messageID, expiresAt] of unknownCommandReplyTargets.entries()) {
    if (!expiresAt || expiresAt <= now) {
      unknownCommandReplyTargets.delete(messageID);
    }
  }
}

function registerUnknownCommandSpam(threadID) {
  const now = Date.now();
  const hits = (unknownCommandSpamHits.get(threadID) || []).filter(
    (ts) => now - ts <= UNKNOWN_COMMAND_SPAM_WINDOW_MS,
  );
  hits.push(now);
  unknownCommandSpamHits.set(threadID, hits);

  if (hits.length >= UNKNOWN_COMMAND_SPAM_THRESHOLD) {
    unknownCommandCooldowns.set(threadID, now + UNKNOWN_COMMAND_COOLDOWN_MS);
    unknownCommandSpamHits.set(threadID, []);
    return true;
  }

  return false;
}

async function handleUnknownCommand(api, event) {
  const threadID = event.threadID;
  const now = Date.now();
  const cooldownUntil = unknownCommandCooldowns.get(threadID) || 0;

  if (cooldownUntil > now) {
    return;
  }

  const phrase = pickFromShuffleBag(
    phraseShuffleBags,
    `unknown:${threadID}`,
    UNKNOWN_COMMAND_PHRASES,
  );

  const hitCooldown = registerUnknownCommandSpam(threadID);
  const finalText = hitCooldown
    ? `${phrase}

Tama na muna, 2 hours cooldown sa maling commands.`
    : phrase;

  const info = await sendMessageAsync(api, finalText, threadID);
  if (info && info.messageID) {
    pruneUnknownReplyTargets();
    unknownCommandReplyTargets.set(info.messageID, now + UNKNOWN_REPLY_TRACK_TTL_MS);
  }
}

async function maybeHandleUnknownCommandReply(api, event, botID) {
  const reply = event.messageReply;
  if (!reply || !reply.messageID) return false;
  if (String(reply.senderID || "") !== String(botID)) return false;

  pruneUnknownReplyTargets();
  const expiresAt = unknownCommandReplyTargets.get(reply.messageID);
  if (!expiresAt || expiresAt <= Date.now()) {
    unknownCommandReplyTargets.delete(reply.messageID);
    return false;
  }

  const phrase = pickFromShuffleBag(
    phraseShuffleBags,
    `unknown-reply:${event.threadID}`,
    UNKNOWN_REPLY_PHRASES,
  );
  await sendMessageAsync(api, phrase, event.threadID);
  return true;
}

function isLaughTriggerText(body) {
  const raw = String(body || "").trim();
  if (!raw) return false;

  const noSpaces = raw.replace(/\s+/g, "");
  if (/(?:HA){3,}/.test(noSpaces)) {
    return true;
  }

  const lettersOnly = raw.toLowerCase().replace(/[^a-z]/g, "");
  if (!lettersOnly) return false;

  return /^(ha){5,}$/.test(lettersOnly);
}

async function maybeHandleLaughTrigger(api, event) {
  const threadID = event.threadID;
  const body = String(event.body || "");

  if (!isLaughTriggerText(body)) return false;

  const now = Date.now();
  const cooldownUntil = ltCooldowns.get(threadID) || 0;
  if (cooldownUntil > now) {
    return true;
  }

  if (isPogiProcessing(threadID) || hasActivePogiResult(threadID)) {
    return true;
  }

  const ltFiles = listImageFilesInDir(LT_DATA_DIR_ABS);
  if (ltFiles.length === 0) {
    return false;
  }

  ltCooldowns.set(threadID, now + LT_LAUGH_COOLDOWN_MS);

  const photoPath = ltFiles[Math.floor(Math.random() * ltFiles.length)];
  await sendMessageAsync(api, "hahaha LT", threadID);
  await sendAttachmentMessageAsync(api, photoPath, threadID, { timeoutMs: 20 * 1000 });
  return true;
}


function findSubjectMatchFromTokens(tokens, subjects) {
  const idx = buildSubjectIndex(subjects);
  const joined = tokens.join(" ");
  if (!joined.trim()) return null;

  let best = null;
  for (let len = tokens.length; len >= 1; len--) {
    const cand = tokens.slice(0, len).join(" ");
    const candKey = normalizeKey(cand);
    const found = idx.find((s) => s.key === candKey);
    if (found) {
      best = { subject: found.raw, consumed: len };
      break;
    }
  }
  return best;
}


function executeBatchAddact(args, senderID, threadID) {
  if (args.length < 3) {
    return {
      success: false,
      activityName: args[0] || "Unknown",
      error: "Invalid format",
    };
  }

  const subjects = getSubjects();

  const dateSeg = findDateSegment(args, 1);
  if (!dateSeg) {
    return { success: false, activityName: args[0], error: "No valid date" };
  }

  if (dateSeg.index < 2) {
    return { success: false, activityName: args[0], error: "Missing subject" };
  }

  const activityName = args[0];
  const subjectTokens = args.slice(1, dateSeg.index);

  const subjectResult = findSubjectMatchFromTokens(subjectTokens, subjects);
  if (!subjectResult) {
    const attemptedSubject = subjectTokens.join(" ");
    const suggestion = suggestClosestSubject(attemptedSubject, subjects);
    return {
      success: false,
      activityName: getActivityDisplayName(activityName),
      error: suggestion
        ? `Subject "${attemptedSubject}" not found (did you mean "${suggestion}"?)`
        : `Subject "${attemptedSubject}" not found`,
    };
  }

  const subjectMatch = subjectResult.subject;

  const afterDateTokens = args.slice(dateSeg.index + dateSeg.length);
  const timeParsed = parseTimeFromTokens(afterDateTokens);
  const timeStr = timeParsed ? timeParsed.timeStr : null;

  if (!isValidTime(timeStr)) {
    return {
      success: false,
      activityName: getActivityDisplayName(activityName),
      error: "Invalid time",
    };
  }

  const deadline = parseDateTimeFromParsedDate(dateSeg.date, timeStr);
  if (!deadline) {
    return {
      success: false,
      activityName: getActivityDisplayName(activityName),
      error: "Invalid date/time",
    };
  }

  const activities = getGroupActivities(threadID);

  const exists = activities.find(
    (a) =>
      normalizeKey(a.name) === normalizeKey(activityName) &&
      normalizeKey(a.subject) === normalizeKey(subjectMatch),
  );

  if (exists) {
    return {
      success: false,
      activityName: getActivityDisplayName(activityName),
      error: "Already exists",
    };
  }

  const formattedTime = formatTime(timeStr);
  const defaultFlags = getDefaultNotificationFlags();
  const newActivity = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
    name: activityName,
    subject: subjectMatch,
    deadline: deadline.toISOString(),
    time: formattedTime,
    createdBy: senderID,
    createdAt: getCurrentTime().toISOString(),
    ...defaultFlags,
    ended: false,
  };

  activities.push(newActivity);
  saveGroupActivities(threadID, activities);

  return { success: true, activityName: getActivityDisplayName(activityName) };
}




const commands = {
  help: {
    description: "Show all available commands",
    adminOnly: false,
    execute: (api, event, args) => {
      const helpMessage = getHelpMessage(args);

      api.sendMessage(helpMessage, event.threadID, (err, messageInfo) => {
        if (err) {
          console.error("Failed to send help message:", err.message);
          return;
        }
        if (!messageInfo || !messageInfo.messageID) return;

        setTimeout(() => {
          api.unsendMessage(messageInfo.messageID, (unsendErr) => {
            if (unsendErr) {
              console.error("Failed to unsend help message:", unsendErr.message);
            }
          });
        }, HELP_UNSEND_DELAY);
      });
    },
  },

  status: {
    description: "Show bot uptime and VPS info",
    adminOnly: false,
    execute: (api, event) => {
      const startedAtMs = getBotStatusStartedAtMs();
      const uptimeText = formatDurationCompact(Date.now() - startedAtMs);
      const startedAtText = formatStatusBaseTime(startedAtMs);

      const message =
        `📊 BOT STATUS\n\n` +
        `⏱️ Uptime: ${uptimeText}\n` +
        `🕒 Since: ${startedAtText}\n` +
        `🖥️ VPS CPU: ${STATUS_VPS_CPU}\n` +
        `💾 VPS RAM: ${STATUS_VPS_RAM}`;

      api.sendMessage(message, event.threadID);
    },
  },

  confirm: {
    description: "Confirm a pending action",
    adminOnly: false,
    execute: async (api, event, args) => {
      if (args.length < 1) {
        api.sendMessage(`❌ Usage: ${PREFIX}confirm CODE`, event.threadID);
        return;
      }
      const code = String(args[0] || "").toUpperCase();
      const entry = getPendingAction(code);
      if (!entry) {
        api.sendMessage(
          `❌ No pending action found for "${code}" (or it expired).`,
          event.threadID,
        );
        return;
      }
      if (entry.threadID !== event.threadID) {
        api.sendMessage(
          `❌ That confirmation code belongs to a different thread.`,
          event.threadID,
        );
        return;
      }
      if (entry.senderID !== event.senderID) {
        api.sendMessage(
          `❌ Only the person who requested it can confirm this action.`,
          event.threadID,
        );
        return;
      }

      pendingActions.delete(code);

      try {
        const resultMessage = await entry.action();
        api.sendMessage(resultMessage || "✅ Confirmed.", event.threadID);
      } catch (err) {
        console.error("Confirm action failed:", err);
        api.sendMessage("❌ Failed to run the confirmed action.", event.threadID);
      }
    },
  },

  cancel: {
    description: "Cancel a pending action",
    adminOnly: false,
    execute: (api, event, args) => {
      if (args.length < 1) {
        api.sendMessage(`❌ Usage: ${PREFIX}cancel CODE`, event.threadID);
        return;
      }
      const code = String(args[0] || "").toUpperCase();
      const entry = getPendingAction(code);
      if (!entry) {
        api.sendMessage(
          `❌ No pending action found for "${code}" (or it expired).`,
          event.threadID,
        );
        return;
      }
      if (entry.threadID !== event.threadID) {
        api.sendMessage(
          `❌ That cancellation code belongs to a different thread.`,
          event.threadID,
        );
        return;
      }
      if (entry.senderID !== event.senderID) {
        api.sendMessage(
          `❌ Only the person who requested it can cancel this action.`,
          event.threadID,
        );
        return;
      }

      cancelPendingAction(code);
      api.sendMessage(`✅ Cancelled action "${code}".`, event.threadID);
    },
  },

  activities: {
    description: "Show all pending activities",
    adminOnly: false,
    execute: (api, event, args) => {
      const threadID = event.threadID;

      if (!initializedGroups.has(threadID)) {
        initializeGroupData(threadID, false);
      }

      const parsed = parseActivitiesArgs(args);

      const activities = getGroupActivities(threadID);
      const subjects = getSubjects();
      const now = getCurrentTime();

      let pendingActivities = activities.filter((act) => isActivityPending(act, now));
      let virtualExamActivities = buildVirtualExamActivities(threadID, subjects, now);

      pendingActivities = filterActivitiesByTimeframe(pendingActivities, parsed.timeframe, now);
      virtualExamActivities = filterActivitiesByTimeframe(virtualExamActivities, parsed.timeframe, now);

      if (parsed.subject) {
        const subjectKey = normalizeKey(parsed.subject);
        pendingActivities = pendingActivities.filter(
          (activity) => normalizeKey(activity.subject) === subjectKey,
        );
        virtualExamActivities = virtualExamActivities.filter(
          (activity) => normalizeKey(activity.subject) === subjectKey,
        );
      }

      const totalDisplayedActivities = pendingActivities.length + virtualExamActivities.length;

      if (totalDisplayedActivities === 0) {
        const hint = `Try: ${PREFIX}activities (no filters)`;
        api.sendMessage(`📭 No pending activities.\n\n${hint}`, event.threadID);
        return;
      }

      if (parsed.sort === "latest") {
        pendingActivities.sort(
          (a, b) => moment(b.deadline).valueOf() - moment(a.deadline).valueOf(),
        );
      } else {
        pendingActivities.sort(
          (a, b) => moment(a.deadline).valueOf() - moment(b.deadline).valueOf(),
        );
      }

      const total = totalDisplayedActivities;
      const examHeaderLine =
        virtualExamActivities.length > 0
          ? `\n🔴 MIDTERM/FINALS entries are system-generated and always stay at the bottom of each subject`
          : "";
      const header =
        `📋 Pending Activities (${total})\n` +
        `${DIVIDER}\n` +
        `🗑️ Auto-removes in 10 minutes${examHeaderLine}\n` +
        `💡 Use:\n` +
        `${PREFIX}removeact #N\n` +
        `${PREFIX}removeact id:XXXXXX`;

      const grouped = {};
      subjects.forEach((sub) => {
        grouped[sub] = { manual: [], exams: [] };
      });

      pendingActivities.forEach((activity) => {
        const subject = activity.subject;
        if (!grouped[subject]) grouped[subject] = { manual: [], exams: [] };
        grouped[subject].manual.push(activity);
      });

      virtualExamActivities.forEach((activity) => {
        const subject = activity.subject;
        if (!grouped[subject]) grouped[subject] = { manual: [], exams: [] };
        grouped[subject].exams.push(activity);
      });

      const sections = [];
      const viewItems = [];
      let counter = 1;

      function formatActivityWithNumber(act, num) {
        const name = truncateText(getActivityDisplayName(act.name), 44);
        const deadlineMoment = moment(act.deadline).tz(TIMEZONE);
        const dayName = deadlineMoment.format("ddd");
        const dateStr = deadlineMoment.format("MMM D, YYYY");
        const timeStr = act.time ? ` • ${act.time}` : "";
        const countdown = getCountdown(act.deadline, !!act.time);
        const shortId = getShortId(act.id);

        return `#${num} • ${name}\n  ${dayName}, ${dateStr}${timeStr}\n  ⏳ ${countdown}\n  🔎 id:${shortId}`;
      }

      function formatExamActivity(act) {
        const deadlineMoment = moment(act.deadline).tz(TIMEZONE);
        const dayName = deadlineMoment.format("ddd");
        const dateStr = deadlineMoment.format("MMM D, YYYY");
        const timeStr = act.time ? ` • ${act.time}` : "";
        const countdown = getCountdown(act.deadline, true);
        const classLine = truncateText(`${act.classCode} - ${act.className}`, 44);

        return `🔴 ${act.examLabel}\n  ${classLine}\n  ${dayName}, ${dateStr}${timeStr}\n  ⏳ ${countdown}`;
      }

      for (const subject of subjects) {
        const bucket = grouped[subject] || { manual: [], exams: [] };
        const manualList = bucket.manual || [];
        const examList = bucket.exams || [];
        const sectionCount = manualList.length + examList.length;
        if (sectionCount === 0) continue;

        manualList.sort((a, b) => moment(a.deadline).valueOf() - moment(b.deadline).valueOf());
        examList.sort((a, b) => moment(a.deadline).valueOf() - moment(b.deadline).valueOf());

        const lines = [];
        lines.push(sectionHeader(`📚 ${subject} (${sectionCount})`));
        manualList.forEach((act) => {
          const num = counter++;
          lines.push(formatActivityWithNumber(act, num));
          viewItems.push({ num, id: act.id, shortId: getShortId(act.id) });
        });
        examList.forEach((act) => {
          lines.push(formatExamActivity(act));
        });
        sections.push(lines.join("\n\n"));
      }

      const listedSubjectsLower = subjects.map((s) => normalizeKey(s));
      const otherManualActs = pendingActivities.filter(
        (activity) => !listedSubjectsLower.includes(normalizeKey(activity.subject)),
      );
      const otherExamActs = virtualExamActivities.filter(
        (activity) => !listedSubjectsLower.includes(normalizeKey(activity.subject)),
      );

      if (otherManualActs.length > 0 || otherExamActs.length > 0) {
        otherManualActs.sort((a, b) => moment(a.deadline).valueOf() - moment(b.deadline).valueOf());
        otherExamActs.sort((a, b) => moment(a.deadline).valueOf() - moment(b.deadline).valueOf());
        const lines = [];
        lines.push(sectionHeader(`📚 Other (${otherManualActs.length + otherExamActs.length})`));
        otherManualActs.forEach((act) => {
          const num = counter++;
          lines.push(formatActivityWithNumber(act, num));
          viewItems.push({ num, id: act.id, shortId: getShortId(act.id) });
        });
        otherExamActs.forEach((act) => {
          lines.push(formatExamActivity(act));
        });
        sections.push(lines.join("\n\n"));
      }

      lastActivitiesView.set(threadID, {
        createdAt: Date.now(),
        items: viewItems,
      });

      const message = `${header}\n\n${safeJoinSections(sections)}`;

      api.sendMessage(message.trim(), event.threadID, (err, messageInfo) => {
        if (err) {
          console.error("Failed to send activities message:", err.message);
          return;
        }

        setTimeout(() => {
          api.unsendMessage(messageInfo.messageID, (unsendErr) => {
            if (unsendErr) {
              console.error("Failed to unsend activities message:", unsendErr.message);
            } else {
              console.log(`✅ Auto-unsent activities message in thread ${event.threadID}`);
            }
          });
        }, AUTO_UNSEND_DELAY);
      });
    },
  },

  addact: {
    description: "Add a new activity",
    adminOnly: true,
    execute: (api, event, args) => {
      const threadID = event.threadID;

      if (!initializedGroups.has(threadID)) {
        initializeGroupData(threadID, false);
      }

      if (args.length < 3) {
        api.sendMessage(
          `❌ Invalid format!\n\nUsage:\n${PREFIX}addact "Activity Name" "Subject" [Date] [Time]\n\nExamples:\n${PREFIX}addact "Performance Task 3" "English" 10/23/2025 10pm\n\n${PREFIX}addact Quiz_1 "Araling Panlipunan" tomorrow\n\n💡 Tips:\n• Quotes supported\n• Date formats: MM/DD/YYYY, YYYY-MM-DD, Dec 1 2025, tomorrow, next monday\n• Time formats: 10pm, 930pm, 21:30, 2130`,
          event.threadID,
        );
        return;
      }

      const subjects = getSubjects();

      const dateSeg = findDateSegment(args, 1);
      if (!dateSeg) {
        api.sendMessage(
          `❌ No valid date found!\n\nTry:\n• today\n\n• tomorrow\n\n• next monday\n\n• 2025-12-01\n\n• Dec 1 2025\n\nUsage:\n${PREFIX}addact "Name" "Subject" [Date] [Time]`,
          event.threadID,
        );
        return;
      }

      if (dateSeg.index < 2) {
        api.sendMessage(
          `❌ Missing subject!\n\nUsage:\n${PREFIX}addact "Name" "Subject" [Date] [Time]\n\nExample:\n${PREFIX}addact "Quiz 1" "English" tomorrow 10pm`,
          event.threadID,
        );
        return;
      }

      const activityName = args[0];
      const subjectTokens = args.slice(1, dateSeg.index);

      const subjectResult = findSubjectMatchFromTokens(subjectTokens, subjects);
      if (!subjectResult) {
        const attemptedSubject = subjectTokens.join(" ");
        const suggestion = suggestClosestSubject(attemptedSubject, subjects);
        const suggestLine = suggestion ? `\n\nDid you mean:\n• "${suggestion}"` : "";

        const addNew = `\n\nIf this is a NEW subject, add it:\n${PREFIX}addsub "${attemptedSubject}"`;

        const subjectsList = subjects.length
          ? `\n\nAvailable subjects:\n${subjects.map((s) => `• ${s}`).join("\n\n")}`
          : `\n\nAvailable subjects:\n• (none yet)`;

        api.sendMessage(
          `❌ Subject "${attemptedSubject}" not found!${suggestLine}${addNew}${subjectsList}`,
          event.threadID,
        );
        return;
      }

      const subjectMatch = subjectResult.subject;

      const afterDateTokens = args.slice(dateSeg.index + dateSeg.length);
      const timeParsed = parseTimeFromTokens(afterDateTokens);
      const timeStr = timeParsed ? timeParsed.timeStr : null;

      if (timeStr && !isValidTime(timeStr)) {
        api.sendMessage(
          `❌ Invalid time format!\n\nExamples:\n• 10pm\n\n• 9:30pm\n\n• 930pm\n\n• 21:30\n\n• 2130`,
          event.threadID,
        );
        return;
      }

      const deadline = parseDateTimeFromParsedDate(dateSeg.date, timeStr);
      if (!deadline) {
        api.sendMessage(
          `❌ Invalid date/time!\n\nTry:\n• tomorrow 10pm\n\n• 2025-12-01 21:30\n\n• Dec 1 2025 9am`,
          event.threadID,
        );
        return;
      }

      const activities = getGroupActivities(threadID);

      const exists = activities.find(
        (a) =>
          normalizeKey(a.name) === normalizeKey(activityName) &&
          normalizeKey(a.subject) === normalizeKey(subjectMatch),
      );

      if (exists) {
        api.sendMessage(
          `❌ Activity "${getActivityDisplayName(activityName)}" already exists for ${subjectMatch}!`,
          event.threadID,
        );
        return;
      }

      const formattedTime = timeStr ? formatTime(timeStr) : null;
      const defaultFlags = getDefaultNotificationFlags();
      const newActivity = {
        id: Date.now().toString(),
        name: activityName,
        subject: subjectMatch,
        deadline: deadline.toISOString(),
        time: formattedTime,
        createdBy: event.senderID,
        createdAt: getCurrentTime().toISOString(),
        ...defaultFlags,
      };

      activities.push(newActivity);
      saveGroupActivities(threadID, activities);

      const displayName = getActivityDisplayName(activityName);
      const formattedDeadline = formatDeadline(newActivity);
      api.sendMessage(
        `✅ Activity added successfully!\n\n📝 Activity: ${displayName}\n\n📚 Subject: ${subjectMatch}\n\n📅 Deadline: ${formattedDeadline}\n\n🔎 id:${getShortId(newActivity.id)}`,
        event.threadID,
      );
    },
  },

  removeact: {
    description: "Remove an activity",
    adminOnly: true,
    execute: (api, event, args) => {
      const threadID = event.threadID;

      if (!initializedGroups.has(threadID)) {
        initializeGroupData(threadID, false);
      }

      if (!args || args.length < 1) {
        api.sendMessage(
          `❌ Please provide the activity identifier.\n\nUsage:\n${PREFIX}removeact #N\n\n${PREFIX}removeact id:XXXXXX\n\n${PREFIX}removeact "Name" "Subject"`,
          event.threadID,
        );
        return;
      }

      const activities = getGroupActivities(threadID);

      const resolved = resolveActivityIdentifier(threadID, activities, args);
      if (resolved.error) {
        api.sendMessage(`❌ ${resolved.error}`, event.threadID);
        return;
      }

      const act = resolved.activity;

      const token = createPendingAction(threadID, event.senderID, async () => {
        const refreshed = getGroupActivities(threadID);
        const idx = refreshed.findIndex((a) => String(a.id) === String(act.id));
        if (idx === -1) return `❌ Activity no longer exists.`;

        const removed = refreshed.splice(idx, 1)[0];
        saveGroupActivities(threadID, refreshed);

        return `✅ Removed activity:\n\n📝 ${getActivityDisplayName(
          removed.name,
        )}\n\n📚 ${removed.subject}\n\n🔎 id:${getShortId(removed.id)}`;
      });

      api.sendMessage(
        `⚠️ Please confirm removal.\n\nActivity:\n📝 ${getActivityDisplayName(act.name)}\n📚 ${act.subject}\n🔎 id:${getShortId(act.id)}\n\nConfirm with:\n${PREFIX}confirm ${token}\n\nOr cancel:\n${PREFIX}cancel ${token}`,
        event.threadID,
      );
    },
  },

  extend: {
    description: "Extend or reschedule an activity deadline",
    adminOnly: true,
    execute: (api, event, args) => {
      const threadID = event.threadID;

      if (!initializedGroups.has(threadID)) {
        initializeGroupData(threadID, false);
      }

      if (!args || args.length < 2) {
        api.sendMessage(
          `❌ Invalid format!\n\nUsage:\n${PREFIX}extend #N [NewDate] [NewTime]\n\n${PREFIX}extend id:XXXXXX [NewDate] [NewTime]\n\n${PREFIX}extend "Name" "Subject" [NewDate] [NewTime]\n\nOr duration:\n${PREFIX}extend #N +2d\n${PREFIX}extend #N +3h\n${PREFIX}extend #N +30m`,
          event.threadID,
        );
        return;
      }

      const activities = getGroupActivities(threadID);

      const resolved = resolveActivityIdentifier(threadID, activities, args);
      if (resolved.error) {
        api.sendMessage(`❌ ${resolved.error}`, event.threadID);
        return;
      }

      const act = resolved.activity;
      const rest = args.slice(resolved.consumed);

      if (rest.length < 1) {
        api.sendMessage(
          `❌ Please provide a new date/time or a duration.\n\nExample:\n${PREFIX}extend #3 tomorrow 10pm\n\n${PREFIX}extend #3 +2d`,
          event.threadID,
        );
        return;
      }

      
      const dur = parseDurationToken(rest[0]);
      let newDeadlineMoment = null;
      let newTimeString = act.time || null;

      if (dur) {
        const moved = addDurationToDeadline(act.deadline, dur);
        if (!moved) {
          api.sendMessage(`❌ Failed to apply duration.`, event.threadID);
          return;
        }
        newDeadlineMoment = moved;
        if (act.time) {
          newTimeString = moved.clone().format("h:mm A");
        }
      } else {
        
        const dateSeg = findDateSegment(rest, 0);
        if (!dateSeg) {
          api.sendMessage(
            `❌ No valid date found.\n\nTry:\n• tomorrow\n\n• next monday\n\n• 2025-12-01\n\n• Dec 1 2025`,
            event.threadID,
          );
          return;
        }

        const afterDateTokens = rest.slice(dateSeg.index + dateSeg.length);
        const timeParsed = parseTimeFromTokens(afterDateTokens);
        const timeStr = timeParsed ? timeParsed.timeStr : null;

        if (timeStr && !isValidTime(timeStr)) {
          api.sendMessage(
            `❌ Invalid time format!\n\nExamples:\n• 10pm\n\n• 930pm\n\n• 21:30`,
            event.threadID,
          );
          return;
        }

        const dt = parseDateTimeFromParsedDate(dateSeg.date, timeStr);
        if (!dt) {
          api.sendMessage(`❌ Invalid date/time.`, event.threadID);
          return;
        }

        newDeadlineMoment = dt;
        newTimeString = timeStr ? formatTime(timeStr) : null;
      }

      const token = createPendingAction(threadID, event.senderID, async () => {
        const refreshed = getGroupActivities(threadID);
        const idx = refreshed.findIndex((a) => String(a.id) === String(act.id));
        if (idx === -1) return `❌ Activity no longer exists.`;

        const old = refreshed[idx];
        const oldDeadline = formatDeadline(old);

        refreshed[idx].deadline = newDeadlineMoment.toISOString();
        refreshed[idx].time = newTimeString;

        refreshed[idx].extended = true;
        refreshed[idx].extendedBy = event.senderID;
        refreshed[idx].extendedAt = getCurrentTime().toISOString();

        
        const resetFlags = getDefaultNotificationFlags();
        refreshed[idx].notifiedNextWeek = resetFlags.notifiedNextWeek;
        refreshed[idx].notifiedThisWeek = resetFlags.notifiedThisWeek;
        refreshed[idx].notified2Days = resetFlags.notified2Days;
        refreshed[idx].notifiedTomorrow = resetFlags.notifiedTomorrow;
        refreshed[idx].notifiedToday = resetFlags.notifiedToday;
        refreshed[idx].notified30Min = resetFlags.notified30Min;
        refreshed[idx].notified20Min = resetFlags.notified20Min;
        refreshed[idx].notified10Min = resetFlags.notified10Min;
        refreshed[idx].notifiedEnded = resetFlags.notifiedEnded;
        refreshed[idx].ended = false;

        saveGroupActivities(threadID, refreshed);

        const newFormatted = formatDeadline(refreshed[idx]);
        return (
          `✅ Deadline updated!\n\n` +
          `📝 Activity: ${getActivityDisplayName(refreshed[idx].name)}\n\n` +
          `📚 Subject: ${refreshed[idx].subject}\n\n` +
          `📅 Old Deadline: ${oldDeadline}\n\n` +
          `📅 New Deadline: ${newFormatted}\n\n` +
          `🔎 id:${getShortId(refreshed[idx].id)}`
        );
      });

      api.sendMessage(
        `⚠️ Please confirm updating the deadline.\n\nActivity:\n📝 ${getActivityDisplayName(act.name)}\n📚 ${act.subject}\n🔎 id:${getShortId(act.id)}\n\nConfirm with:\n${PREFIX}confirm ${token}\n\nOr cancel:\n${PREFIX}cancel ${token}`,
        event.threadID,
      );
    },
  },

  addsub: {
    description: "Add a new subject",
    adminOnly: true,
    execute: (api, event, args) => {
      if (!args || args.length < 1) {
        api.sendMessage(
          `❌ Please provide a subject name!\n\nUsage:\n${PREFIX}addsub "Subject Name"\n\nExample:\n${PREFIX}addsub "Araling Panlipunan"`,
          event.threadID,
        );
        return;
      }

      const subjectName = args.join(" ").trim();
      const subjects = getSubjects();

      const exists = subjects.find((s) => normalizeKey(s) === normalizeKey(subjectName));
      if (exists) {
        api.sendMessage(`❌ Subject "${subjectName}" already exists!`, event.threadID);
        return;
      }

      subjects.push(subjectName);
      saveSubjects(subjects);

      api.sendMessage(`✅ Subject "${subjectName}" added successfully!`, event.threadID);
    },
  },

  removesub: {
    description: "Remove a subject",
    adminOnly: true,
    execute: (api, event, args) => {
      if (!args || args.length < 1) {
        api.sendMessage(
          `❌ Please provide a subject name!\n\nUsage:\n${PREFIX}removesub "Subject Name"`,
          event.threadID,
        );
        return;
      }

      const subjectName = args.join(" ").trim();
      const subjects = getSubjects();
      const index = subjects.findIndex((s) => normalizeKey(s) === normalizeKey(subjectName));

      if (index === -1) {
        const suggestion = suggestClosestSubject(subjectName, subjects);
        const suggestLine = suggestion ? `\n\nDid you mean:\n• "${suggestion}"` : "";
        api.sendMessage(`❌ Subject "${subjectName}" not found!${suggestLine}`, event.threadID);
        return;
      }

      const token = createPendingAction(event.threadID, event.senderID, async () => {
        const latest = getSubjects();
        const idx = latest.findIndex((s) => normalizeKey(s) === normalizeKey(subjectName));
        if (idx === -1) return `❌ Subject "${subjectName}" no longer exists.`;

        const removed = latest.splice(idx, 1)[0];
        saveSubjects(latest);

        return `✅ Subject removed:\n\n📚 ${removed}`;
      });

      api.sendMessage(
        `⚠️ Please confirm removing this subject:\n\n📚 ${subjects[index]}\n\nConfirm with:\n${PREFIX}confirm ${token}\n\nOr cancel:\n${PREFIX}cancel ${token}`,
        event.threadID,
      );
    },
  },

listsub: {
  description: "List all subjects",
  adminOnly: false,
  execute: (api, event) => {
    const subjects = getSubjects();

    if (subjects.length === 0) {
      api.sendMessage("📭 No subjects registered yet!", event.threadID);
      return;
    }

    
    let message = "📚 ACTIVE SUBJECTS\n\n";
    subjects.forEach((sub, index) => {
      message += `${index + 1}. ${sub}\n`;
    });

    api.sendMessage(message.trim(), event.threadID);
  },
},

noclass: {
  description: "Mark a scheduled class as NO CLASS for today (by number)",
  adminOnly: true,
  execute: (api, event, args) => {
    const now = getCurrentTime();
    const todayDate = now.format("YYYY-MM-DD");
    const todaysClasses = getTodaysClasses(now);

    if (todaysClasses.length === 0) {
      api.sendMessage("📭 No classes scheduled for today.", event.threadID);
      return;
    }

    const threadID = event.threadID;
    const noClassSet = getNoClassSetForDate(threadID, todayDate);

    
    if (!args || args.length === 0) {
      let msg = `⚠️ Usage: ${PREFIX}noclass <#>\n\n`;
      msg += `Today's Classes:\n\n`;

      todaysClasses.forEach((cls, index) => {
        const startTime = formatClassTime(cls.startTime);
        const endTime = formatClassTime(cls.endTime);
        const mark = noClassSet.has(getClassKey(cls)) ? "  ❌ NO CLASS" : "";
        msg += `${index + 1}. ${cls.code} - ${cls.name}${mark}\n`;
        msg += `   🕐 ${startTime} - ${endTime}\n`;
        if (index < todaysClasses.length - 1) msg += "\n";
      });

      api.sendMessage(msg.trim(), threadID);
      return;
    }

    
    const parts = args.join(" ").split(/[\s,]+/).filter(Boolean);
    const nums = parts.map((p) => parseInt(p, 10)).filter((n) => Number.isInteger(n));

    if (nums.length === 0) {
      api.sendMessage(`❌ Invalid number. Use: ${PREFIX}noclass <#>`, threadID);
      return;
    }

    const added = [];
    const invalid = [];

    nums.forEach((n) => {
      if (n < 1 || n > todaysClasses.length) {
        invalid.push(n);
        return;
      }
      const cls = todaysClasses[n - 1];
      const key = getClassKey(cls);
      if (!noClassSet.has(key)) {
        noClassSet.add(key);
        added.push({ n, cls });
      }
    });

    if (noClassSet.size > 0) {
      saveNoClassSetForDate(threadID, todayDate, noClassSet);
    }

    if (added.length === 0 && invalid.length === 0) {
      api.sendMessage("ℹ️ Already marked as NO CLASS.", threadID);
      return;
    }

    let reply = "✅ NO CLASS set for today:\n\n";
    added.forEach(({ n, cls }) => {
      reply += `${n}. ${cls.code} - ${cls.name}\n`;
    });

    if (invalid.length > 0) {
      reply += `\n⚠️ Invalid #: ${invalid.join(", ")}\n`;
    }

    reply += "\nThis will stop class reminders for the marked classes today.";
    api.sendMessage(reply.trim(), threadID);
  },
},

  listgroups: {
    description: "List all tracked groups",
    adminOnly: true,
    execute: (api, event) => {
      if (groupThreadIDs.size === 0) {
        api.sendMessage(
          "📭 No groups registered yet!\n\nThe bot will automatically register groups when it receives messages from them.",
          event.threadID,
        );
        return;
      }

      
      let message = "📢 TRACKED GROUPS\n";
      message += "━".repeat(25) + "\n\n";
      message += `Total: ${groupThreadIDs.size} group(s)\n\n`;

      let index = 1;
      groupThreadIDs.forEach((threadID) => {
        const activities = getGroupActivities(threadID);
        message += `${index}. ${threadID}\n`;
        message += `   📋 Activities: ${activities.length}\n\n`;
        index++;
      });

      message = message.trim() + "\n\n" + "━".repeat(25);
      message += "\n\n💡 Each group has its own separate activities.";

      api.sendMessage(message, event.threadID);
    },
  },

  midterm: {
    description: "Manage the midterm exam week",
    adminOnly: true,
    execute: (api, event, args) => executeExamCommand(api, event, args, "midterm"),
  },

  finals: {
    description: "Manage the finals exam week",
    adminOnly: true,
    execute: (api, event, args) => executeExamCommand(api, event, args, "finals"),
  },

  testtherandomask: {
    description: "Trigger the random ask feature for testing",
    adminOnly: false,
    pioOnly: true,
    execute: async (api, event) => {
      if (!event.isGroup) {
        api.sendMessage("❌ This command only works in group chats.", event.threadID);
        return;
      }

      if (activeRandomAsks.has(event.threadID)) {
        api.sendMessage("ℹ️ A random ask is already active in this thread.", event.threadID);
        return;
      }

      const started = await maybeTriggerRandomAsk(api, event, api.getCurrentUserID(), { force: true });
      if (!started) {
        api.sendMessage("❌ Failed to start the random ask test right now.", event.threadID);
      }
    },
  },

  reminder: {
    description: "Set a custom reminder",
    adminOnly: true,
    execute: (api, event, args) => {
      const threadID = event.threadID;

      if (!initializedGroups.has(threadID)) {
        initializeGroupData(threadID, false);
      }

      const parsed = parseReminderArgs(args);

      if (!parsed) {
        const errorMsg =
          `❌ Invalid format!\n\n` +
          `Usage:\n` +
          `${PREFIX}reminder "Message" [Date] Time <true/false>\n\n` +
          `Examples:\n` +
          `${PREFIX}reminder "Check emails" 6pm true\n` +
          `${PREFIX}reminder "Meeting" tomorrow 2pm false\n` +
          `${PREFIX}reminder "Call" 01/25/2026 3pm true\n\n` +
          `💡 Date optional • true=daily, false=one-time`;
        api.sendMessage(errorMsg, threadID);
        return;
      }

      const reminders = getGroupReminders(threadID);
      const reminderId = makeReminderId();

      const now = getCurrentTime();
      const startDate = parsed.date || now.format("YYYY-MM-DD");

      const newReminder = {
        id: reminderId,
        message: parsed.message,
        hour: parsed.hour,
        minute: parsed.minute,
        startDate: startDate,
        isRecurring: parsed.isRecurring,
        createdBy: event.senderID,
        createdAt: now.toISOString(),
      };

      reminders.push(newReminder);
      saveGroupReminders(threadID, reminders);

      const timeStr = formatReminderTime(parsed.hour, parsed.minute);
      const dateStr = parsed.date
        ? moment(parsed.date).format("MMM D, YYYY")
        : "Today";
      const repeatStr = parsed.isRecurring ? "🔄 Repeats daily" : "⚡ One-time only";

      const successMsg =
        `✅ Reminder Set!\n\n` +
        `📝 "${parsed.message}"\n` +
        `⏰ ${timeStr} • 📅 ${dateStr}\n` +
        `${repeatStr}\n\n` +
        `ID: ${reminderId}`;

      api.sendMessage(successMsg, threadID);
    },
  },

  reminderlist: {
    description: "List all reminders",
    adminOnly: false,
    execute: (api, event) => {
      const threadID = event.threadID;

      if (!initializedGroups.has(threadID)) {
        initializeGroupData(threadID, false);
      }

      const reminders = getGroupReminders(threadID);

      if (reminders.length === 0) {
        api.sendMessage("📭 No reminders set yet!", threadID);
        return;
      }

      const recurring = reminders.filter((r) => r.isRecurring);
      const oneTime = reminders.filter((r) => !r.isRecurring);

      let message = `📌 Active Reminders (${reminders.length})\n\n`;

      if (recurring.length > 0) {
        message += `🔄 DAILY (${recurring.length})\n\n`;
        recurring.forEach((r, idx) => {
          const timeStr = formatReminderTime(r.hour, r.minute);
          const dateStr = moment(r.startDate).format("MMM D, YYYY");
          const msg = r.message.length > 30 ? r.message.slice(0, 30) + "…" : r.message;
          message += `#${idx + 1} • "${msg}"\n`;
          message += `⏰ ${timeStr} daily\n`;
          message += `📅 Since: ${dateStr}\n`;
          message += `ID: ${r.id}\n\n`;
        });
      }

      if (oneTime.length > 0) {
        message += `⚡ ONE-TIME (${oneTime.length})\n\n`;
        oneTime.forEach((r, idx) => {
          const timeStr = formatReminderTime(r.hour, r.minute);
          const dateStr = moment(r.startDate).format("MMM D, YYYY");
          const msg = r.message.length > 30 ? r.message.slice(0, 30) + "…" : r.message;
          message += `#${recurring.length + idx + 1} • "${msg}"\n`;
          message += `⏰ ${timeStr} • 📅 ${dateStr}\n`;
          message += `ID: ${r.id}\n\n`;
        });
      }

      message += `💡 ${PREFIX}removereminder rem:XXXXXX`;

      api.sendMessage(message.trim(), threadID, (err, messageInfo) => {
        if (err) {
          console.error("Failed to send reminder list:", err.message);
          return;
        }
        if (!messageInfo || !messageInfo.messageID) return;

        setTimeout(() => {
          api.unsendMessage(messageInfo.messageID, (unsendErr) => {
            if (unsendErr) {
              console.error("Failed to unsend reminder list:", unsendErr.message);
            }
          });
        }, REMINDERLIST_UNSEND_DELAY);
      });
    },
  },

  pogi: {
    description: "Random pogi gacha pull",
    adminOnly: false,
    execute: async (api, event) => {
      await handlePogiCommand(api, event);
    },
  },

  schedule: {
    description: "Show schedule photo (/schedule) or text (/schedule offline)",
    adminOnly: false,
    execute: async (api, event, args) => {
      const threadID = event.threadID;

      const now = Date.now();
      const existing = scheduleCooldowns.get(threadID);
      if (existing && existing.until && existing.until > now) {
        const remainingMs = existing.until - now;
        const mins = Math.floor(remainingMs / 60000);
        const secs = Math.floor((remainingMs % 60000) / 1000);

        api.sendMessage(
          `⏳ Schedule is unavailable at the moment.
Please try again in ${mins}m ${secs}s.`,
          threadID,
          (err, messageInfo) => {
            if (err || !messageInfo || !messageInfo.messageID) return;
            
            setTimeout(() => {
              api.unsendMessage(messageInfo.messageID, () => {});
            }, 15000);
          },
        );
        return;
      }

      const until = now + SCHEDULE_COOLDOWN_MS;
      scheduleCooldowns.set(threadID, {
        until,
        textMessageID: null,
        imageMessageID: null,
      });

      setTimeout(() => {
        const entry = scheduleCooldowns.get(threadID);
        if (!entry || entry.until !== until) return;

        const toUnsend = [entry.textMessageID, entry.imageMessageID].filter(Boolean);
        toUnsend.forEach((messageID) => {
          api.unsendMessage(messageID, (unsendErr) => {
            if (unsendErr) {
              console.error("Failed to unsend schedule message:", unsendErr.message);
            }
          });
        });

        scheduleCooldowns.delete(threadID);
      }, SCHEDULE_COOLDOWN_MS);

      try {
        const sub = args && args[0] ? String(args[0]).toLowerCase() : "";
        const isOffline = sub === "offline";

        
        if (isOffline) {
          const scheduleText = buildFullScheduleText();
          const textInfo = await sendSimpleMessage(api, threadID, scheduleText);
          if (textInfo && textInfo.messageID) {
            const entry = scheduleCooldowns.get(threadID);
            if (entry && entry.until === until) entry.textMessageID = textInfo.messageID;
          }
          return;
        }

        
        if (!fs.existsSync(SCHEDULE_IMAGE_PATH)) {
          
          scheduleCooldowns.delete(threadID);
          await sendSimpleMessage(
            api,
            threadID,
            `❌ Schedule image not found at: ${SCHEDULE_IMAGE_PATH}`,
          );
          return;
        }

        const imageInfo = await new Promise((resolve) => {
          api.sendMessage(
            {
              body:
                `📅 Our Schedule

` +
                `📌 If you have no internet connection, use ${PREFIX}schedule offline`,
              attachment: fs.createReadStream(SCHEDULE_IMAGE_PATH),
            },
            threadID,
            (err, messageInfo) => {
              if (err) {
                console.error("Failed to send schedule image:", err.message);
              }
              resolve(messageInfo || null);
            },
          );
        });

        if (imageInfo && imageInfo.messageID) {
          const entry = scheduleCooldowns.get(threadID);
          if (entry && entry.until === until) entry.imageMessageID = imageInfo.messageID;
        }
      } catch (err) {
        console.error("Schedule command error:", err);
      }
    },
  },

  removereminder: {
    description: "Remove a reminder",
    adminOnly: true,
    execute: (api, event, args) => {
      const threadID = event.threadID;

      if (!initializedGroups.has(threadID)) {
        initializeGroupData(threadID, false);
      }

      if (!args || args.length < 1) {
        api.sendMessage(
          `❌ Usage: ${PREFIX}removereminder rem:XXXXXX`,
          threadID,
        );
        return;
      }

      const reminderId = String(args[0] || "").trim();
      const reminders = getGroupReminders(threadID);

      const index = reminders.findIndex((r) => r.id === reminderId);

      if (index === -1) {
        api.sendMessage(
          `❌ Reminder "${reminderId}" not found!\n\n💡 Use ${PREFIX}reminderlist to see all IDs.`,
          threadID,
        );
        return;
      }

      const removed = reminders.splice(index, 1)[0];
      saveGroupReminders(threadID, reminders);

      api.sendMessage(
        `✅ Removed reminder:\n\n📝 "${removed.message}"\nID: ${removed.id}`,
        threadID,
      );
    },
  },
};


function getTodaysClasses(now) {
  const currentDay = now.day();
  return CLASS_SCHEDULE
    .filter((cls) => cls.day === currentDay)
    .sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)));
}


function buildFullScheduleText() {
  const dayNames = {
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday",
    6: "Saturday",
  };

  let message = "📅 BSIT 1-8 Class Schedule\n\n";
  const days = [1, 2, 3, 4, 5, 6];

  days.forEach((day) => {
    const classes = CLASS_SCHEDULE
      .filter((cls) => cls.day === day)
      .sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)));

    if (classes.length === 0) return;

    message += `🗓️ ${dayNames[day]}\n\n`;

    classes.forEach((cls, index) => {
      const duration = getClassDuration(cls.startTime, cls.endTime);
      const startTime = formatClassTime(cls.startTime);
      const endTime = formatClassTime(cls.endTime);

      message += `${index + 1}. ${cls.code} - ${cls.name}\n`;
      message += `   👨‍🏫 ${cls.instructor}\n`;
      message += `   🕐 ${startTime} - ${endTime} (${duration} hrs)\n`;
      message += `   📍 ${cls.venue}\n`;

      if (index < classes.length - 1) {
        message += "\n";
      }
    });

    message += "\n\n";
  });

  message = message.trim() + "\n\nStay safe - Von";
  return message;
}




function getNoClassFile(threadID) {
  return `${NOCLASS_DATA_DIR}/${threadID}.json`;
}

function getClassKey(classItem) {
  return `${classItem.code}|${classItem.startTime}`;
}

function getNoClassSetForDate(threadID, dateKey) {
  const data = loadJSON(getNoClassFile(threadID));
  if (!data || data.date !== dateKey || !Array.isArray(data.noClass)) return new Set();
  return new Set(data.noClass);
}

function saveNoClassSetForDate(threadID, dateKey, noClassSet) {
  const arr = Array.from(noClassSet || []);
  saveJSON(getNoClassFile(threadID), { date: dateKey, noClass: arr });
}



function getClassDuration(startTime, endTime) {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  const startMins = startHour * 60 + startMin;
  const endMins = endHour * 60 + endMin;
  const durationMins = endMins - startMins;
  const hours = Math.floor(durationMins / 60);
  return hours;
}


function formatClassTime(timeStr) {
  const [hour, minute] = timeStr.split(':').map(Number);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
}


function shouldSendClassReminder(now, classItem, reminderType, threadID) {
  const dateKey = now.format('YYYY-MM-DD');
  const reminderKey = `${threadID}:${classItem.code}:${dateKey}:${reminderType}`;
  
  if (sentClassReminders.has(reminderKey)) {
    return false;
  }
  
  const [classHour, classMinute] = classItem.startTime.split(':').map(Number);
  const classStartMoment = now.clone().hour(classHour).minute(classMinute).second(0);
  
  const minutesUntilClass = classStartMoment.diff(now, 'minutes');
  
  let shouldSend = false;
  
  
  if (reminderType === '1hour' && minutesUntilClass === 60) {
    shouldSend = true;
  } else if (reminderType === '15min' && minutesUntilClass === 15) {
    shouldSend = true;
  } else if (reminderType === 'start' && minutesUntilClass === 0) {
    shouldSend = true;
  }
  
  if (shouldSend) {
    sentClassReminders.set(reminderKey, Date.now());
    
    
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    for (const [key, timestamp] of sentClassReminders.entries()) {
      if (timestamp < oneDayAgo) {
        sentClassReminders.delete(key);
      }
    }
  }
  
  return shouldSend;
}


function formatClassReminder(classItem, reminderType, examLabels = []) {
  const duration = getClassDuration(classItem.startTime, classItem.endTime);
  const startTime = formatClassTime(classItem.startTime);
  const endTime = formatClassTime(classItem.endTime);
  const examLines = formatExamLines(examLabels);

  let emoji = '🔔';
  let title = 'Class Reminder';

  if (reminderType === '1hour') {
    emoji = '🔔';
    title = 'Class in 1 hour';
  } else if (reminderType === '15min') {
    emoji = '🔔';
    title = 'Class in 15 minutes';
  } else if (reminderType === 'start') {
    emoji = '🔔';
    title = 'Class starting now';
  }

  return `${emoji} ${title}

${examLines}📚 ${classItem.code} - ${classItem.name}
👨‍🏫 ${classItem.instructor}
🕐 ${startTime} - ${endTime} (${duration} hrs)
📍 ${classItem.venue}

Stay safe - Von`;
}


function formatMorningSchedule(now, classes, noClassSet = new Set()) {
  const dateStr = now.format('dddd, MMM D');
  
  let message = `☀️ Today's Classes - ${dateStr}\n\n`;
  
  classes.forEach((cls, index) => {
    const duration = getClassDuration(cls.startTime, cls.endTime);
    const startTime = formatClassTime(cls.startTime);
    const endTime = formatClassTime(cls.endTime);
    
    const isNoClass = noClassSet.has(getClassKey(cls));
    message += `${index + 1}. ${cls.code} - ${cls.name}${isNoClass ? "  ❌ NO CLASS" : ""}\n`;
    message += `   👨‍🏫 ${cls.instructor}\n`;
    message += `   🕐 ${startTime} - ${endTime}\n`;
    message += `   📍 ${cls.venue}\n`;
    if (index < classes.length - 1) {
      message += '\n';
    }
  });
  
  message += '\n\nStay safe - Von';
  
  return message;
}




function setupScheduledTasks(api) {
  let lastMotivationalTimeSlot = "";
  let sentMorningScheduleToday = null;

  function getCurrentSlot(hour, minute) {
    if (hour === 8 && minute === 0) return "morning";
    if (hour === 12 && minute === 0) return "noon";
    if (hour === 18 && minute === 0) return "evening";
    return null;
  }

  cron.schedule("* * * * *", async () => {
    if (groupThreadIDs.size === 0) return;

    const now = getCurrentTime();
    const currentMinute = now.minute();
    const currentHour = now.hour();
    const currentDay = now.day();
    const todayDate = now.format('YYYY-MM-DD');
    const currentTimeSlot = now.format("YYYY-MM-DD HH:mm");
    const currentSlotName = getCurrentSlot(currentHour, currentMinute);

    const isFriday = currentDay === 5;
    const isSaturday = currentDay === 6;
    const isSunday = currentDay === 0;
    const isFridayOrSaturday = isFriday || isSaturday;

    const groupsWithReminders = new Set();


    
    
    const currentDate = now.format("YYYY-MM-DD");
    
    console.log(`🔔 Checking reminders at ${currentHour}:${currentMinute} on ${currentDate}`);

    groupThreadIDs.forEach((threadID) => {
      const reminders = getGroupReminders(threadID);
      
      if (reminders.length === 0) {
        console.log(`  📭 Group ${threadID}: No reminders`);
        return;
      }
      
      console.log(`  📋 Group ${threadID}: ${reminders.length} reminder(s) found`);
      const toRemove = [];

      reminders.forEach((reminder) => {
        const dateMatch = reminder.startDate === currentDate;
        const recurringMatch = reminder.isRecurring && moment(reminder.startDate).isSameOrBefore(now, "day");
        const timeMatch = reminder.hour === currentHour && reminder.minute === currentMinute;
        
        const shouldTrigger = (dateMatch || recurringMatch) && timeMatch;

        if (shouldTrigger) {
          console.log(`       ✅ TRIGGERING REMINDER ${reminder.id}`);
          
          const timeStr = formatReminderTime(reminder.hour, reminder.minute);
          const dateStr = moment(reminder.startDate).format("MMM D, YYYY");
          const repeatInfo = reminder.isRecurring ? `🔄 Daily` : `⚡ One-time`;

          const message = `🔔 REMINDER\n\n📝 "${reminder.message}"\n⏰ ${timeStr} • 📅 ${dateStr}\n\n${repeatInfo}`;

          sendSimpleMessage(api, threadID, message);

          if (!reminder.isRecurring) {
            toRemove.push(reminder.id);
          }
        }
      });

      if (toRemove.length > 0) {
        const updated = reminders.filter((r) => !toRemove.includes(r.id));
        saveGroupReminders(threadID, updated);
        console.log(`  🗑️ Auto-removed ${toRemove.length} one-time reminder(s)`);
      }
    });







if (currentHour === 6 && currentMinute === 0 && sentMorningScheduleToday !== todayDate) {
  const todaysClasses = getTodaysClasses(now);

  if (todaysClasses.length > 0) {
    for (const threadID of groupThreadIDs) {
      const noClassSet = getNoClassSetForDate(threadID, todayDate);
      const morningMessage = formatMorningSchedule(now, todaysClasses, noClassSet);
      await sendSimpleMessage(api, threadID, morningMessage);
    }

    sentMorningScheduleToday = todayDate;
    console.log(`📅 Sent morning schedule to ${groupThreadIDs.size} groups`);
  }
}


const todaysClasses = getTodaysClasses(now);


for (const threadID of groupThreadIDs) {
  const noClassSet = getNoClassSetForDate(threadID, todayDate);
  const examState = getGroupExamState(threadID);

  for (const classItem of todaysClasses) {
    if (noClassSet.has(getClassKey(classItem))) continue;

    const examLabels = getActiveExamLabelsForClass(examState, now, classItem);

    
    if (shouldSendClassReminder(now, classItem, '1hour', threadID)) { 
      const message = formatClassReminder(classItem, '1hour', examLabels);
      await sendSimpleMessage(api, threadID, message);
      console.log(`📢 [${threadID}] Sent 1-hour reminder for ${classItem.code}`);
    }
    
    
    if (shouldSendClassReminder(now, classItem, '15min', threadID)) { 
      const message = formatClassReminder(classItem, '15min', examLabels);
      await sendSimpleMessage(api, threadID, message);
      console.log(`📢 [${threadID}] Sent 15-min reminder for ${classItem.code}`);
    }
    
    
    if (shouldSendClassReminder(now, classItem, 'start', threadID)) { 
      const message = formatClassReminder(classItem, 'start', examLabels);
      await sendSimpleMessage(api, threadID, message);
      console.log(`📢 [${threadID}] Sent start reminder for ${classItem.code}`);
    }
  }
}


    for (const threadID of groupThreadIDs) {
      if (!initializedGroups.has(threadID)) {
        initializeGroupData(threadID, false);
      }

      const activities = getGroupActivities(threadID);
      let updated = false;

      const consolidatedReminders = {
        nextWeek: [],
        thisWeek: [],
        twoDays: [],
        tomorrow: [],
        today: [],
        countdown: [],
        ended: [],
      };

      for (const activity of activities) {
        const deadline = moment(activity.deadline).tz(TIMEZONE);
        const deadlineDay = deadline.day();
        const todayStart = now.clone().startOf("day");
        const todayEnd = now.clone().endOf("day");
        const tomorrowStart = now.clone().add(1, "day").startOf("day");
        const tomorrowEnd = now.clone().add(1, "day").endOf("day");
        const dayAfterDeadline = deadline.clone().add(1, "day").startOf("day");

        const displayName = getActivityDisplayName(activity.name);
        const formattedDeadline = formatDeadline(activity);
        const timeRemaining = formatTimeRemaining(activity.deadline, !!activity.time);
        const deadlineDayName = deadline.format("dddd");

        const isToday = deadline.isBetween(todayStart, todayEnd, null, "[]");
        const isTomorrow = deadline.isBetween(tomorrowStart, tomorrowEnd, null, "[]");
        const is2Days = isDeadlineIn2Days(activity.deadline);
        const isThisWeekDeadline = isDeadlineThisWeek(activity.deadline) && deadlineDay !== 0;
        const isNextWeekDeadline = isDeadlineNextWeek(activity.deadline);

        if (currentSlotName) {
          if (isToday && !activity.notifiedToday[currentSlotName]) {
            consolidatedReminders.today.push({
              name: displayName,
              subject: activity.subject,
              deadline: formattedDeadline,
              timeRemaining: timeRemaining,
            });
            activity.notifiedToday[currentSlotName] = true;
            updated = true;
          } else if (
            isTomorrow &&
            !isToday &&
            !activity.notifiedTomorrow[currentSlotName]
          ) {
            consolidatedReminders.tomorrow.push({
              name: displayName,
              subject: activity.subject,
              deadline: formattedDeadline,
              timeRemaining: timeRemaining,
            });
            activity.notifiedTomorrow[currentSlotName] = true;
            updated = true;
          } else if (
            is2Days &&
            !isToday &&
            !isTomorrow &&
            !activity.notified2Days[currentSlotName]
          ) {
            consolidatedReminders.twoDays.push({
              name: displayName,
              subject: activity.subject,
              deadline: formattedDeadline,
              timeRemaining: timeRemaining,
            });
            activity.notified2Days[currentSlotName] = true;
            updated = true;
          } else if (
            isSunday &&
            isThisWeekDeadline &&
            !isToday &&
            !isTomorrow &&
            !is2Days &&
            !wasCreatedThisWeek(activity.createdAt) &&
            !activity.notifiedThisWeek[currentSlotName]
          ) {
            consolidatedReminders.thisWeek.push({
              name: displayName,
              subject: activity.subject,
              deadline: formattedDeadline,
              dayName: deadlineDayName,
              timeRemaining: timeRemaining,
            });
            activity.notifiedThisWeek[currentSlotName] = true;
            updated = true;
          } else if (
            isFridayOrSaturday &&
            isNextWeekDeadline &&
            !isToday &&
            !isTomorrow &&
            !is2Days &&
            !isThisWeekDeadline &&
            !activity.notifiedNextWeek[currentSlotName]
          ) {
            consolidatedReminders.nextWeek.push({
              name: displayName,
              subject: activity.subject,
              deadline: formattedDeadline,
              dayName: deadlineDayName,
              timeRemaining: timeRemaining,
            });
            activity.notifiedNextWeek[currentSlotName] = true;
            updated = true;
          }
        }

        let triggerTime;
        let reminderTimeDisplay;

        if (activity.time) {
          triggerTime = deadline.clone();
          reminderTimeDisplay = activity.time;
        } else {
          triggerTime = deadline.clone().hour(23).minute(59).second(59);
          reminderTimeDisplay = "11:59 PM (end of day)";
        }

        const minutesUntilTrigger = triggerTime.diff(now, "minutes");

        if (!activity.notified30Min && minutesUntilTrigger >= 28 && minutesUntilTrigger <= 31) {
          consolidatedReminders.countdown.push({
            name: displayName,
            subject: activity.subject,
            time: reminderTimeDisplay,
            minutesLeft: 30,
          });
          activity.notified30Min = true;
          updated = true;
        }

        if (!activity.notified20Min && minutesUntilTrigger >= 18 && minutesUntilTrigger <= 21) {
          consolidatedReminders.countdown.push({
            name: displayName,
            subject: activity.subject,
            time: reminderTimeDisplay,
            minutesLeft: 20,
          });
          activity.notified20Min = true;
          updated = true;
        }

        if (!activity.notified10Min && minutesUntilTrigger >= 8 && minutesUntilTrigger <= 11) {
          consolidatedReminders.countdown.push({
            name: displayName,
            subject: activity.subject,
            time: reminderTimeDisplay,
            minutesLeft: 10,
          });
          activity.notified10Min = true;
          updated = true;
        }

        let shouldEnd = false;
        if (activity.time) {
          if (now.isAfter(deadline)) shouldEnd = true;
        } else {
          if (now.isSameOrAfter(dayAfterDeadline)) shouldEnd = true;
        }

        if (!activity.notifiedEnded && shouldEnd) {
          consolidatedReminders.ended.push({
            name: displayName,
            subject: activity.subject,
          });
          activity.notifiedEnded = true;
          activity.ended = true;
          updated = true;
        }
      }

      
      const sections = [];
      const slotLabel = currentSlotName ? ` • ${titleCaseSlot(currentSlotName)}` : "";

      const counts = [];
      if (consolidatedReminders.today.length) counts.push(`Today: ${consolidatedReminders.today.length}`);
      if (consolidatedReminders.tomorrow.length) counts.push(`Tomorrow: ${consolidatedReminders.tomorrow.length}`);
      if (consolidatedReminders.twoDays.length) counts.push(`2 Days: ${consolidatedReminders.twoDays.length}`);
      if (consolidatedReminders.thisWeek.length) counts.push(`This Week: ${consolidatedReminders.thisWeek.length}`);
      if (consolidatedReminders.nextWeek.length) counts.push(`Next Week: ${consolidatedReminders.nextWeek.length}`);
      if (consolidatedReminders.countdown.length) counts.push(`Urgent: ${consolidatedReminders.countdown.length}`);

      const headerLines = [];
      headerLines.push(`⏰ Deadline Reminders${slotLabel}`);
      if (counts.length) headerLines.push(counts.join(" • "));
      headerLines.push(DIVIDER);

      if (consolidatedReminders.nextWeek.length > 0) {
        const lines = [];
        lines.push(sectionHeader(`📅 Next Week (${consolidatedReminders.nextWeek.length})`));
        consolidatedReminders.nextWeek.forEach((act) => {
          lines.push(
            `• ${truncateText(act.name, 44)} (${truncateText(act.subject, 28)})\n  📅 ${act.dayName}, ${act.deadline}\n  ⏳ ${act.timeRemaining}\n`,
          );
        });
        sections.push(lines.join("\n"));
      }

      if (consolidatedReminders.thisWeek.length > 0) {
        const lines = [];
        lines.push(sectionHeader(`📅 This Week (${consolidatedReminders.thisWeek.length})`));
        consolidatedReminders.thisWeek.forEach((act) => {
          lines.push(
            `• ${truncateText(act.name, 44)} (${truncateText(act.subject, 28)})\n  📅 ${act.dayName}, ${act.deadline}\n  ⏳ ${act.timeRemaining}\n`,
          );
        });
        sections.push(lines.join("\n"));
      }

      if (consolidatedReminders.twoDays.length > 0) {
        const lines = [];
        lines.push(sectionHeader(`⏳ Due in 2 Days (${consolidatedReminders.twoDays.length})`));
        consolidatedReminders.twoDays.forEach((act) => {
          lines.push(
            `• ${truncateText(act.name, 44)} (${truncateText(act.subject, 28)})\n  📅 ${act.deadline}\n  ⏳ ${act.timeRemaining}\n`,
          );
        });
        sections.push(lines.join("\n"));
      }

      if (consolidatedReminders.tomorrow.length > 0) {
        const lines = [];
        lines.push(sectionHeader(`🚨 Due Tomorrow (${consolidatedReminders.tomorrow.length})`));
        consolidatedReminders.tomorrow.forEach((act) => {
          lines.push(
            `• ${truncateText(act.name, 44)} (${truncateText(act.subject, 28)})\n  📅 ${act.deadline}\n  ⏳ ${act.timeRemaining}`,
          );
        });
        sections.push(lines.join("\n"));
      }

      if (consolidatedReminders.today.length > 0) {
        const lines = [];
        lines.push(sectionHeader(`🔴 Due Today (${consolidatedReminders.today.length})`));
        consolidatedReminders.today.forEach((act) => {
          lines.push(
            `• ${truncateText(act.name, 44)} (${truncateText(act.subject, 28)})\n  📅 ${act.deadline}\n  ⏳ ${act.timeRemaining}`,
          );
        });
        sections.push(lines.join("\n"));
      }

      if (consolidatedReminders.countdown.length > 0) {
        const lines = [];
        lines.push(sectionHeader(`⏰ Urgent Countdown (${consolidatedReminders.countdown.length})`));
        consolidatedReminders.countdown.forEach((act) => {
          lines.push(
            `• ${truncateText(act.name, 44)} (${truncateText(act.subject, 28)})\n  🔥 ${act.minutesLeft} min left • Due at ${act.time}`,
          );
        });
        lines.push("\n✅ Please submit ASAP.");
        sections.push(lines.join("\n"));
      }

      const messageBody = `${headerLines.join("\n")}\n\n${safeJoinSections(sections)}`.trim();

      if (sections.length > 0) {
        await sendSimpleMessage(api, threadID, messageBody);
        groupsWithReminders.add(threadID);
      }

      if (consolidatedReminders.ended.length > 0) {
        let endedMessage = "📢 DEADLINE MET\n\n";
        consolidatedReminders.ended.forEach((act) => {
          endedMessage += `📝 ${act.name}\n`;
          endedMessage += `📚 Subject: ${act.subject}\n\n`;
        });
        endedMessage +=
          "These activities have passed their deadlines and have been removed from the list.";

        await sendSimpleMessage(api, threadID, endedMessage.trim());
      }

      if (updated) {
        const activeActivities = activities.filter((a) => !a.ended);
        saveGroupActivities(threadID, activeActivities);
      }
    }

    if (groupsWithReminders.size > 0 && lastMotivationalTimeSlot !== currentTimeSlot) {
      lastMotivationalTimeSlot = currentTimeSlot;
      setTimeout(async () => {
        for (const threadID of groupsWithReminders) {
          await sendSimpleMessage(api, threadID, "Kumilos kilos kana wag tatamad-tamad 😇😇");
        }
      }, 3000);
    }
  });

  console.log("✅ Scheduled tasks initialized");
  console.log(`📢 Tracking ${groupThreadIDs.size} group(s) for reminders`);
  console.log(`📅 Class schedule reminders enabled for BSIT 1-8`);
}


function scanAndInitializeGroups(api) {
  console.log("🔍 Scanning groups and initializing data...");

  api.getThreadList(100, null, ["INBOX"], (err, threads) => {
    if (err) {
      console.error("Failed to get thread list:", err.message);
      return;
    }

    let groupCount = 0;

    threads.forEach((thread) => {
      if (thread.isGroup && thread.threadID) {
        if (!groupThreadIDs.has(thread.threadID)) {
          groupThreadIDs.add(thread.threadID);
          console.log(`📢 Found group: ${thread.name || thread.threadID}`);
        }

        initializeGroupData(thread.threadID, true);
        groupCount++;
      }
    });

    saveGroupThreads(groupThreadIDs);
    console.log(`✅ Initialized ${groupCount} groups`);
  });
}


function startBot() {
  const appState = loadJSON(APPSTATE_FILE);

  if (!appState || appState.length === 0) {
    console.log("⚠️ No appstate found!");
    console.log("Please add your Facebook appstate to appstate.json");
    console.log("\nTo get your appstate:");
    console.log("1. Install a browser extension like 'c3c-fbstate' or 'EditThisCookie'");
    console.log("2. Login to Facebook in your browser");
    console.log("3. Extract cookies and save them to appstate.json");
    console.log("\n⚠️ WARNING: Use a secondary/test account, NOT your main account!");
    console.log("Using unofficial APIs may result in account restrictions.");
    return;
  }

  console.log("🔄 Logging in...");

  login({ appState }, (err, api) => {
    if (err) {
      console.error("❌ Login failed:", err);
      return;
    }

    console.log("✅ Logged in successfully!");
    console.log(`🤖 Bot is now running with prefix: ${PREFIX}`);
    console.log(`⏰ Timezone: ${TIMEZONE} (Philippine Time)`);

    api.setOptions({
      listenEvents: true,
      selfListen: false,
    });

    fs.writeFileSync(APPSTATE_FILE, JSON.stringify(api.getAppState(), null, 2));

    scanAndInitializeGroups(api);
    setupScheduledTasks(api);

    const botID = api.getCurrentUserID();

    api.listenMqtt(async (err, event) => {
      if (err) {
        console.error("Listen error:", err);
        return;
      }

      
      if (event.isGroup && event.threadID) {
        const isNewGroup = !groupThreadIDs.has(event.threadID);
        if (isNewGroup) {
          groupThreadIDs.add(event.threadID);
          saveGroupThreads(groupThreadIDs);
          initializeGroupData(event.threadID, false);
          console.log(
            `📢 New group registered: ${event.threadID} (Total: ${groupThreadIDs.size} groups)`,
          );
        } else if (!initializedGroups.has(event.threadID)) {
          initializeGroupData(event.threadID, false);
        }
      }

      
      if (event.type === "event" && event.logMessageType === "log:subscribe") {
        const addedParticipants = event.logMessageData?.addedParticipants || [];
        const botWasAdded = addedParticipants.some((p) => String(p.userFbId) === String(botID));

        if (botWasAdded && event.threadID) {
          if (!groupThreadIDs.has(event.threadID)) {
            groupThreadIDs.add(event.threadID);
            saveGroupThreads(groupThreadIDs);
            initializeGroupData(event.threadID, false);
            console.log(
              `📢 Bot added to new group: ${event.threadID} (Total: ${groupThreadIDs.size} groups)`,
            );
          }

          api.changeNickname(BOT_NICKNAME, event.threadID, botID, (nickErr) => {
            if (nickErr) {
              console.error("Failed to set nickname:", nickErr);
            } else {
              console.log(`✅ Nickname set to "${BOT_NICKNAME}" in group ${event.threadID}`);
            }

            
            sendSimpleMessage(api, event.threadID, buildWelcomeMessage());
          });
        }
      }

      
      if (!["message", "message_reply"].includes(event.type) || !event.body) return;

      const body = String(event.body || "").trim();
      if (!body) return;

      if (await maybeHandleRandomAskInteraction(api, event)) {
        return;
      }

      if (await maybeHandleUnknownCommandReply(api, event, botID)) {
        return;
      }

      const lines = body
        .split(/\n/)
        .map((line) => line.trim())
        .filter((line) => line.startsWith(PREFIX));

      if (lines.length === 0) {
        if (await maybeHandleEveryoneCall(api, event)) {
          return;
        }

        if (await maybeHandleCurseWarning(api, event)) {
          return;
        }

        if (await maybeHandleLaughTrigger(api, event)) {
          return;
        }

        await maybeTriggerRandomAsk(api, event, botID);
        return;
      }

      if (isPogiProcessing(event.threadID)) {
        return;
      }

      if (lines.length > 1) {
        let successCount = 0;
        let failCount = 0;
        let results = [];

        for (const line of lines) {
          const raw = line.slice(PREFIX.length).trim();
          const tokens = tokenizeCommand(raw);
          const rawCmd = (tokens.shift() || "").toLowerCase();
          const commandName = COMMAND_ALIASES[rawCmd] || rawCmd;
          const command = commands[commandName];

          if (!command) {
            failCount++;
            results.push(`❌ ${rawCmd} - Unknown command`);
            continue;
          }

          if (command.adminOnly && !isAdmin(event.senderID)) {
            failCount++;
            results.push(`❌ ${rawCmd} - Admin only`);
            continue;
          }

          if (command.pioOnly && !isPIO(event.senderID)) {
            failCount++;
            results.push(`❌ ${rawCmd} - PIO only`);
            continue;
          }

          try {
            if (commandName === "addact") {
              const batchResult = executeBatchAddact(tokens, event.senderID, event.threadID);
              if (batchResult.success) {
                successCount++;
                results.push(`✅ ${batchResult.activityName} - Added`);
              } else {
                failCount++;
                results.push(
                  `❌ ${batchResult.activityName || "Unknown"} - ${batchResult.error}`,
                );
              }
            } else {
              await Promise.resolve(command.execute(api, event, tokens));
              successCount++;
            }
          } catch (error) {
            console.error(`Error executing ${commandName}:`, error);
            failCount++;
            results.push(`❌ ${rawCmd} - Error`);
          }
        }

        
        let summary = `📋 Batch Command Results\n`;
        summary += `━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        summary += results.join("\n\n");
        summary += `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        summary += `✅ Success: ${successCount} | ❌ Failed: ${failCount}`;

        api.sendMessage(summary, event.threadID);
        return;
      }

      
      const raw = lines[0].slice(PREFIX.length).trim();
      const tokens = tokenizeCommand(raw);
      const rawCmd = (tokens.shift() || "").toLowerCase();
      const commandName = COMMAND_ALIASES[rawCmd] || rawCmd;

      const command = commands[commandName];
      if (!command) {
        await handleUnknownCommand(api, event);
        return;
      }

      if (command.adminOnly && !isAdmin(event.senderID)) {
        api.sendMessage(
          "❌ Sorry, this command is only available for PIO and Representative!",
          event.threadID,
        );
        return;
      }

      if (command.pioOnly && !isPIO(event.senderID)) {
        api.sendMessage("❌ Sorry, this command is only available for the PIO!", event.threadID);
        return;
      }

      try {
        await Promise.resolve(command.execute(api, event, tokens));
      } catch (error) {
        console.error(`Error executing ${commandName}:`, error);
        api.sendMessage(
          "❌ An error occurred while executing this command. Please try again.",
          event.threadID,
        );
      }
    });
  });
}

console.log("🚀 Facebook Messenger Agenda Bot");
console.log("================================");
startBot();