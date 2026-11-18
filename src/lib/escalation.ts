import { helplinesFor } from "./helplines";
import type { CrisisCategory, EscalationReply, Language, Region } from "./types";

/**
 * Crisis replies are written by hand, not generated. When a parent describes
 * an emergency we want the same calm, tested words every time.
 */

type Copy = { title: string; message: string; steps: string[]; question: string; when: string };

const COPY: Record<Language, Record<CrisisCategory, Copy>> = {
  en: {
    emergency: {
      title: "This sounds like an emergency",
      message: "Please call emergency services now. I'm not able to help with this here, and every minute matters.",
      steps: [
        "Call the number above right now.",
        "Stay with your child and follow what the call handler tells you.",
        "If someone else is with you, ask them to make the call while you stay close.",
      ],
      question: "Is help on the way?",
      when: "Come back once your child is safe",
    },
    self_harm: {
      title: "Your child's safety comes first",
      message: "What you're describing is serious, and you don't have to handle it alone. Please reach out for help now.",
      steps: [
        "If there is any chance they could act on it now, call emergency services.",
        "Stay with them and keep anything they could hurt themselves with out of reach.",
        "Listen calmly. You don't need the perfect words, just stay close.",
      ],
      question: "Is your child with you and safe right now?",
      when: "Come back after you've spoken to someone",
    },
    abuse: {
      title: "Thank you for telling me",
      message: "A child being hurt is never okay, and it is not your child's fault. This needs people who can act, not a coach.",
      steps: [
        "If your child is in danger right now, call the police.",
        "Keep your child away from the person and with someone you trust.",
        "Contact the child protection line above. They can guide you on what to do next.",
      ],
      question: "Are you and your child somewhere safe right now?",
      when: "Come back once you're both safe",
    },
    general: {
      title: "Let's get you real help",
      message: "This sounds like more than parenting tips can cover, and I don't want to get it wrong. Please reach out to someone who can help directly.",
      steps: [
        "If anyone is in danger right now, call emergency services.",
        "Talk to your child's doctor or a trusted professional as soon as you can.",
      ],
      question: "Is everyone safe right now?",
      when: "Come back after you've spoken to someone",
    },
  },
  ur: {
    emergency: {
      title: "یہ ایمرجنسی لگتی ہے",
      message: "براہِ کرم ابھی ایمرجنسی سروس کو فون کریں۔ میں یہاں اس میں مدد نہیں کر سکتا، اور ہر منٹ اہم ہے۔",
      steps: [
        "اوپر دیا گیا نمبر ابھی ملائیں۔",
        "اپنے بچے کے پاس رہیں اور فون پر بتائی گئی ہدایات پر عمل کریں۔",
        "اگر کوئی اور ساتھ ہے تو اسے فون کرنے کو کہیں اور خود بچے کے قریب رہیں۔",
      ],
      question: "کیا مدد آ رہی ہے؟",
      when: "بچہ محفوظ ہو جائے تو دوبارہ آئیں",
    },
    self_harm: {
      title: "آپ کے بچے کی حفاظت سب سے پہلے",
      message: "آپ جو بتا رہے ہیں وہ سنجیدہ بات ہے، اور آپ کو یہ اکیلے نہیں سنبھالنا۔ براہِ کرم ابھی مدد حاصل کریں۔",
      steps: [
        "اگر ذرا سا بھی خطرہ ہے کہ وہ ابھی کچھ کر لے گا تو ایمرجنسی سروس کو فون کریں۔",
        "اس کے ساتھ رہیں اور ایسی ہر چیز دور رکھیں جس سے وہ خود کو نقصان پہنچا سکے۔",
        "سکون سے سنیں۔ صحیح الفاظ ضروری نہیں، بس قریب رہیں۔",
      ],
      question: "کیا آپ کا بچہ ابھی آپ کے ساتھ اور محفوظ ہے؟",
      when: "کسی سے بات کرنے کے بعد دوبارہ آئیں",
    },
    abuse: {
      title: "بتانے کا شکریہ",
      message: "کسی بچے کو تکلیف دینا کبھی ٹھیک نہیں، اور اس میں آپ کے بچے کا کوئی قصور نہیں۔ اس کے لیے ایسے لوگوں کی ضرورت ہے جو فوراً قدم اٹھا سکیں۔",
      steps: [
        "اگر آپ کا بچہ ابھی خطرے میں ہے تو پولیس کو فون کریں۔",
        "بچے کو اس شخص سے دور اور کسی قابلِ اعتماد شخص کے پاس رکھیں۔",
        "اوپر دی گئی چائلڈ پروٹیکشن لائن سے رابطہ کریں، وہ آگے کی رہنمائی کریں گے۔",
      ],
      question: "کیا آپ اور آپ کا بچہ ابھی محفوظ جگہ پر ہیں؟",
      when: "دونوں محفوظ ہو جائیں تو دوبارہ آئیں",
    },
    general: {
      title: "آئیے آپ کو صحیح مدد تک پہنچائیں",
      message: "یہ بات پیرنٹنگ مشوروں سے آگے کی لگتی ہے، اور میں غلطی نہیں کرنا چاہتا۔ براہِ کرم کسی ایسے شخص سے رابطہ کریں جو براہِ راست مدد کر سکے۔",
      steps: [
        "اگر کوئی ابھی خطرے میں ہے تو ایمرجنسی سروس کو فون کریں۔",
        "جلد از جلد بچے کے ڈاکٹر یا کسی قابلِ اعتماد ماہر سے بات کریں۔",
      ],
      question: "کیا ابھی سب محفوظ ہیں؟",
      when: "کسی سے بات کرنے کے بعد دوبارہ آئیں",
    },
  },
  roman_ur: {
    emergency: {
      title: "Yeh emergency lagti hai",
      message: "Please abhi emergency service ko call karein. Main yahan is mein madad nahi kar sakta, aur har minute zaroori hai.",
      steps: [
        "Upar diya gaya number abhi milayein.",
        "Apne bachay ke paas rahein aur call par batayi gayi hidayat par amal karein.",
        "Agar koi aur saath hai to usay call karne ko kahein aur khud bachay ke qareeb rahein.",
      ],
      question: "Kya madad aa rahi hai?",
      when: "Bacha mehfooz ho jaye to dobara aayein",
    },
    self_harm: {
      title: "Aap ke bachay ki hifazat sab se pehle",
      message: "Aap jo bata rahe hain woh sanjeeda baat hai, aur aap ko yeh akelay nahi sambhalna. Please abhi madad lein.",
      steps: [
        "Agar zara bhi khatra hai ke woh abhi kuch kar lega to emergency service ko call karein.",
        "Us ke saath rahein aur aisi har cheez door rakhein jis se woh khud ko nuqsan pohncha sake.",
        "Sukoon se sunein. Sahi alfaaz zaroori nahi, bas qareeb rahein.",
      ],
      question: "Kya aap ka bacha abhi aap ke saath aur mehfooz hai?",
      when: "Kisi se baat karne ke baad dobara aayein",
    },
    abuse: {
      title: "Batane ka shukriya",
      message: "Kisi bachay ko takleef dena kabhi theek nahi, aur is mein aap ke bachay ka koi qasoor nahi. Is ke liye aise logon ki zaroorat hai jo foran qadam utha sakein.",
      steps: [
        "Agar aap ka bacha abhi khatre mein hai to police ko call karein.",
        "Bachay ko us shakhs se door aur kisi qabil-e-aitmaad shakhs ke paas rakhein.",
        "Upar di gayi child protection line se rabta karein, woh aage ki rehnumai karenge.",
      ],
      question: "Kya aap aur aap ka bacha abhi mehfooz jagah par hain?",
      when: "Dono mehfooz ho jayein to dobara aayein",
    },
    general: {
      title: "Aayein aap ko sahi madad tak pohnchayein",
      message: "Yeh baat parenting mashwaron se aage ki lagti hai, aur main ghalti nahi karna chahta. Please kisi aise shakhs se rabta karein jo seedha madad kar sake.",
      steps: [
        "Agar koi abhi khatre mein hai to emergency service ko call karein.",
        "Jald az jald bachay ke doctor ya kisi qabil-e-aitmaad mahir se baat karein.",
      ],
      question: "Kya abhi sab mehfooz hain?",
      when: "Kisi se baat karne ke baad dobara aayein",
    },
  },
};

export function buildEscalation(
  category: CrisisCategory,
  language: Language,
  region: Region,
  source: EscalationReply["source"],
): EscalationReply {
  const copy = COPY[language][category];
  return {
    kind: "escalation",
    language,
    category,
    source,
    title: copy.title,
    message: copy.message,
    steps: copy.steps,
    helplines: helplinesFor(region, category),
    checkIn: { question: copy.question, when: copy.when },
  };
}
