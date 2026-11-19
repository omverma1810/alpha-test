/**
 * Cheap, no-LLM filter for requests that are obviously not about parenting:
 * code to debug, SQL, stack traces, or asks to write software. These get a
 * fixed redirect without spending a model call. Anything subtler is left to
 * the model's on_topic flag.
 */
const CODE_OR_TECH = [
  /```/,
  /\b(function|const|let|var)\s+\w+\s*(=|\()/,
  /=>\s*\{/,
  /\bconsole\.log\b|\bprint\s*\(|\bSystem\.out\b/,
  /\bimport\s+[\w{}*,\s]+\s+from\s+['"]/,
  /\bdef\s+\w+\s*\(|\bclass\s+\w+\s*[:({]/,
  /#include\s*</,
  /\b(select\s+[\w*,\s]+\s+from|insert\s+into|update\s+\w+\s+set|delete\s+from|drop\s+table|union\s+select)\b/i,
  /<\/?(script|div|html|body|style)\b/i,
  /\b(traceback|stack ?trace|segmentation fault|null ?pointer|undefined is not a function|syntaxerror|typeerror)\b/i,
  /\b(debug|fix|refactor|review|optimi[sz]e|write)\b.{0,30}\b(my|this|the|a|some)\b.{0,15}\b(code|bug|script|function|program|query|regex|api|app|website|sql)\b/i,
  /\b(ignore|disregard|forget)\b.{0,30}\b(previous|above|prior|your|system)\b.{0,20}\b(instructions?|prompt|rules)\b/i,
  /\b(system prompt|developer mode|jailbreak|you are now|act as an? (?!parent))/i,
];

export function looksOffTopic(text: string): boolean {
  return CODE_OR_TECH.some((rule) => rule.test(text));
}
