export type Language = "en" | "ur" | "roman_ur" | "ar";

export type Region = "ae" | "in" | "pk" | "other";

export type CrisisCategory = "emergency" | "abuse" | "self_harm" | "general";

export type Risk = "none" | "see_professional" | "crisis";

export interface CheckIn {
  question: string;
  when: string;
}

export interface PlanReply {
  kind: "plan";
  language: Language;
  risk: Exclude<Risk, "crisis">;
  summary: string;
  steps: string[];
  checkIn: CheckIn;
}

export interface Helpline {
  label: string;
  number: string;
  note?: string;
}

export interface EscalationReply {
  kind: "escalation";
  language: Language;
  category: CrisisCategory;
  /** "precheck" = caught by the keyword screen, "model" = flagged by the LLM */
  source: "precheck" | "model";
  title: string;
  message: string;
  steps: string[];
  helplines: Helpline[];
  checkIn: CheckIn;
}

export type CoachReply = PlanReply | EscalationReply;

export interface ChatTurn {
  role: "parent" | "coach";
  text: string;
}
