import type { PlanReply } from "@/lib/types";
import { LABELS } from "./labels";

export default function PlanCard({ reply }: { reply: PlanReply }) {
  const rtl = reply.language === "ur";
  const t = LABELS[reply.language];

  return (
    <article
      dir={rtl ? "rtl" : "ltr"}
      lang={reply.language === "en" ? "en" : "ur"}
      className={`max-w-[92%] rounded-3xl rounded-bl-md border border-line bg-paper p-5 ${rtl ? "urdu rounded-bl-3xl rounded-br-md" : ""}`}
    >
      {reply.risk === "see_professional" && (
        <p className="mb-3 inline-block rounded-full bg-clay-soft px-3 py-1 text-xs font-semibold text-clay">
          {t.professional}
        </p>
      )}

      <p className="text-[15px]">{reply.summary}</p>

      <p className="mt-4 text-xs font-semibold tracking-wide text-sage uppercase">{t.tryThis}</p>
      <ol className="mt-2 space-y-2">
        {reply.steps.map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-sage-soft text-xs font-bold text-sage">
              {i + 1}
            </span>
            <span className="text-[15px]">{step}</span>
          </li>
        ))}
      </ol>

      <div className="mt-5 flex gap-3 rounded-2xl bg-cream p-3">
        <svg viewBox="0 0 24 24" className="mt-0.5 size-5 shrink-0 text-clay" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5V12l3 2" strokeLinecap="round" />
        </svg>
        <div className="text-sm">
          <p className="font-semibold">{t.checkIn}</p>
          <p className="mt-0.5">{reply.checkIn.question}</p>
          <p className="mt-0.5 text-muted">{reply.checkIn.when}</p>
        </div>
      </div>
    </article>
  );
}
