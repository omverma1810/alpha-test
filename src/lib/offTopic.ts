import type { Language, OffTopicReply } from "./types";

const COPY: Record<Language, { message: string; examples: string[] }> = {
  en: {
    message: "I can only help with parenting: your child's behaviour, sleep, eating, school, screens, feelings and family life. Tell me what's going on with your child and I'll suggest a few things to try.",
    examples: ["My toddler bites other kids at daycare.", "How do I get my teenager to talk to me more?"],
  },
  ur: {
    message: "میں صرف پیرنٹنگ میں مدد کر سکتا ہوں: بچے کا رویہ، نیند، کھانا، اسکول، اسکرین، جذبات اور گھریلو زندگی۔ بتائیں آپ کے بچے کے ساتھ کیا ہو رہا ہے۔",
    examples: ["میرا بیٹا ہوم ورک کرنے سے انکار کرتا ہے۔", "میری بیٹی رات کو ڈر کر اٹھ جاتی ہے۔"],
  },
  roman_ur: {
    message: "Main sirf parenting mein madad kar sakta hoon: bachay ka rawaiya, neend, khana, school, screen, jazbaat aur ghar ki zindagi. Batayein aap ke bachay ke saath kya ho raha hai.",
    examples: ["Mera beta homework karne se inkaar karta hai.", "Meri beti raat ko darr kar uth jaati hai."],
  },
  ar: {
    message: "أستطيع المساعدة في التربية فقط: سلوك طفلك ونومه وأكله ومدرسته والشاشات ومشاعره والحياة العائلية. أخبرني ما الذي يحدث مع طفلك.",
    examples: ["ابني يرفض أداء واجباته المدرسية.", "ابنتي تستيقظ خائفة في الليل."],
  },
};

export function buildOffTopic(language: Language, source: OffTopicReply["source"]): OffTopicReply {
  return { kind: "off_topic", language, source, ...COPY[language] };
}
