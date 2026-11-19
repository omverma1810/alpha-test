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
  /**
   * "precheck" = this message tripped the keyword screen,
   * "history"  = an earlier message in the conversation did,
   * "model"    = the LLM flagged it.
   */
  source: "precheck" | "history" | "model";
  title: string;
  message: string;
  steps: string[];
  helplines: Helpline[];
  checkIn: CheckIn;
}

/** Fixed reply for anything that isn't about parenting. */
export interface OffTopicReply {
  kind: "off_topic";
  language: Language;
  /** "precheck" = caught by the code/injection filter without a model call */
  source: "precheck" | "model";
  message: string;
  examples: string[];
}

export type CoachReply = PlanReply | EscalationReply | OffTopicReply;

export interface ChatTurn {
  role: "parent" | "coach";
  text: string;
}
