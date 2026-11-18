import type { CrisisCategory } from "./types";

/**
 * First safety layer. Runs before the model sees anything.
 *
 * It is deliberately simple and deliberately cautious: a false alarm shows a
 * parent some helpline numbers, a miss could leave a child in danger. The LLM
 * still gets a second look at everything that passes (see coach.ts).
 */

export interface CrisisMatch {
  category: Exclude<CrisisCategory, "general">;
  pattern: string;
}

export function normalize(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[‘’ʼ]/g, "'")
    // Urdu diacritics (zer, zabar, pesh, etc.) and tatweel
    .replace(/[ً-ٰٟـ]/g, "")
    // Arabic letter variants people type on different keyboards
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\s+/g, " ")
    .trim();
}

const CHILD = "(child|kid|son|daughter|baby|toddler|boy|girl|teen|teenager|infant)";
const ADULT =
  "(husband|wife|partner|boyfriend|girlfriend|father|dad|mother|stepfather|stepdad|stepmother|stepmom|uncle|aunt|grandfather|grandpa|grandmother|grandma|teacher|tutor|nanny|maid|driver|coach|neighbou?r|relative|cousin|someone|an adult|a man|a woman)";
const HURT_ACT =
  "(hit|hits|hitting|beat|beats|beating|slap|slaps|slapping|kick|kicks|kicking|burn|burns|burned|choke|chokes|choked|touch|touches|touched|touching|abuse|abuses|abused|abusing|molest|molests|molested|hurt|hurts|hurting|punch|punches|punched)";

const RULES: Record<CrisisMatch["category"], RegExp[]> = {
  self_harm: [
    /\bsuicid/,
    /\b(kill|kills|killing|hurt|hurts|hurting|harm|harms|harming|cut|cuts|cutting)\s+(my|him|her|them)sel(f|ves)\b/,
    /\bself[- ]?harm/,
    /\b(want|wants|wanted|wanting) to die\b/,
    /\b(end|take|ending|taking) (his|her|their|my) (own )?life\b/,
    /\b(doesn't|does not|don't|do not) want to (live|be alive)\b/,
    /\bno reason to live\b/,
    /\bbetter off dead\b/,
    // Roman Urdu
    /\bkhud ?ku?shi\b/,
    /\bmarna chaht[aie]\b/,
    /\bmar jana chaht[aie]\b/,
    /\bkhud ko (nuqsan|nuksan|nuqsaan|maar|mar|zakhmi)/,
    /\bjeena nahi?n? chaht[aie]\b/,
    // Urdu script
    /خود ?کشی/,
    /مرنا چاہت/,
    /مر جانا چاہت/,
    /خود کو (نقصان|مار|زخمی)/,
    /جینا نہیں چاہت/,
  ],
  emergency: [
    /\b(not|isn't|is not|can't|cannot|stopped|struggling|trouble) breathing\b/,
    /\bunconscious\b/,
    /\bpassed out\b/,
    /\b(won't|will not|doesn't|does not|can't) wake up\b/,
    /\bseizure/,
    /\bconvuls/,
    /\bchok(ing|ed)\b/,
    /\b(swallowed|ate|drank|drunk)\b.{0,40}\b(pills?|tablets?|medicine|medication|bleach|poison|batter(y|ies)|detergent|chemicals?|cleaner|kerosene)\b/,
    /\bpoison(ed|ing)?\b/,
    /\bbleeding\b.{0,20}\b(a lot|heavily|badly|won't stop|will not stop|non ?stop)\b/,
    /\b(fell|fallen|falling)\b.{0,15}\b(roof|balcony|window|stairs|building)\b/,
    /\b(turning|turned|going) (blue|purple|grey|gray)\b/,
    /\bdrown/,
    /\bnot responding\b/,
    /\b(severe|bad) (allergic reaction|burn)\b/,
    /\bhigh fever\b.{0,30}\b(baby|newborn|infant|month old)\b/,
    // Roman Urdu
    /\bsaa?ns? (nahi|nahin|nai|ruk)/,
    /\bbe ?hosh\b/,
    /\bzeh?e?r\b/,
    /\bdora (para|pada|parha)\b/,
    /\b(golian|goliyan|dawai) kha (li|lin|gaya|gayi)\b/,
    // Urdu script
    /سانس (نہیں|رک)/,
    /بے ?ہوش/,
    /زہر/,
    /دورہ پڑ/,
    /گولیاں کھا/,
    /ڈوب/,
  ],
  abuse: [
    new RegExp(`\\b${ADULT}\\b[^.!?]{0,40}\\b${HURT_ACT}\\b\\s+(my|our|the|his|her|their)?\\s*${CHILD}`),
    new RegExp(`\\b${ADULT}\\b[^.!?]{0,40}\\b${HURT_ACT}\\b\\s+(him|her|them)\\b`),
    /\bsexual(ly)?\b.{0,20}\b(abus|touch|assault)/,
    /\bmolest/,
    /\b(touched|touches|touching)\b.{0,20}\b(private|inappropriately|wrong way)/,
    /\b(is|was|being|been) (abused|molested|assaulted)\b/,
    /\b(afraid|scared|worried) (that )?i('ll| will| might| may) (hurt|hit|harm|shake) (my|the) (baby|child|kid|son|daughter|toddler)\b/,
    /\bshook (my|the) baby\b/,
    /\bbruises?\b[^.!?]{0,40}\b(hit|beat|beaten|slapped|kicked)\b/,
    /\b(hit|beat|beaten|slapped|kicked)\b[^.!?]{0,40}\bbruises?\b/,
    // Roman Urdu
    /\b(shohar|abbu|baap|chacha|mamu|mamoon|ustad|teacher|naukar|driver|rishtedar)\b.{0,40}\b(maarta|marta|maarti|peet|peetta|pitai|chhoota|chhuta|chhuti)\b/,
    /\bghalat (tareeq?e|tarah) se (chhoo|chhu|chu)/,
    /\bjinsi\b/,
    // Urdu script
    /(شوہر|ابو|باپ|چچا|ماموں|استاد|ٹیچر|نوکر|ڈرائیور|رشتہ دار).{0,40}(مارتا|مارتی|پیٹتا|پیٹتی|چھوتا|چھوتی)/,
    /جنسی/,
    /زیادتی/,
    /غلط طریقے سے چھو/,
  ],
};

// Order matters only when a message hits more than one category:
// a medical emergency is the most time-critical, then self-harm, then abuse.
const ORDER: CrisisMatch["category"][] = ["emergency", "self_harm", "abuse"];

export function screenForCrisis(text: string): CrisisMatch | null {
  const t = normalize(text);
  for (const category of ORDER) {
    for (const rule of RULES[category]) {
      if (rule.test(t)) return { category, pattern: rule.source };
    }
  }
  return null;
}
