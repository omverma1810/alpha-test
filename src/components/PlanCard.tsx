import type { PlanReply } from "@/lib/types";
import { LABELS } from "./labels";
import NightLight from "./NightLight";

export default function PlanCard({ reply }: { reply: PlanReply }) {
  const rtl = reply.language === "ur" || reply.language === "ar";
  const font = reply.language === "ur" ? "urdu" : reply.language === "ar" ? "arabic" : "";
  const t = LABELS[reply.language];

  return (
    <article
      dir={rtl ? "rtl" : "ltr"}
      lang={reply.language === "roman_ur" ? "ur-Latn" : reply.language}
      className={`flex gap-3 ${font}`}
    >
      <NightLight className="mt-0.5 size-7 shrink-0" />

      <div className="min-w-0 flex-1">
        {reply.risk === "see_professional" && (
          <p className="mb-2 inline-block rounded-md bg-indigo-soft px-2 py-0.5 text-[13px] font-semibold text-indigo">
            {t.professional}
          </p>
        )}

        <p className="text-[16px] leading-relaxed">{reply.summary}</p>

        <ol className="mt-4 space-y-3 rounded-2xl border border-line bg-paper p-4">
          {reply.steps.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="font-display text-lg leading-6 font-bold text-leaf tabular-nums">{i + 1}</span>
              <span className="text-[15px] leading-6">{step}</span>
            </li>
          ))}
        </ol>

        <CheckInTag question={reply.checkIn.question} when={reply.checkIn.when} />
      </div>
    </article>
  );
}

/** The night-light ticket: the one warm element on the page, because it's what the parent comes back to. */
function CheckInTag({ question, when }: { question: string; when: string }) {
  const whenText = when.charAt(0).toUpperCase() + when.slice(1);
  return (
    <div className="mt-3 rounded-2xl border border-lamp bg-lamp-soft px-4 py-3">
      <p className="flex items-center gap-1.5 text-[13px] font-semibold text-ink/70">
        <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
          <circle cx="8" cy="8" r="6.2" />
          <path d="M8 4.8V8l2.2 1.4" strokeLinecap="round" />
        </svg>
        {whenText}
      </p>
      <p className="mt-1 text-[15px] leading-6 font-semibold">{question}</p>
    </div>
  );
}
