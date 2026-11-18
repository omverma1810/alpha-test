import type { EscalationReply } from "@/lib/types";
import { LABELS } from "./labels";

export default function EscalationCard({ reply }: { reply: EscalationReply }) {
  const rtl = reply.language === "ur" || reply.language === "ar";
  const font = reply.language === "ur" ? "urdu" : reply.language === "ar" ? "arabic" : "";
  const t = LABELS[reply.language];

  return (
    <article
      role="alert"
      dir={rtl ? "rtl" : "ltr"}
      lang={reply.language === "roman_ur" ? "ur-Latn" : reply.language}
      className={`max-w-[92%] rounded-3xl border border-alert/25 bg-alert-soft p-5 ${font}`}
    >
      <div className="flex items-center gap-2 text-alert">
        <svg viewBox="0 0 24 24" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M12 3 2.5 20h19L12 3Z" strokeLinejoin="round" />
          <path d="M12 10v4.5M12 17.5v.01" strokeLinecap="round" />
        </svg>
        <h2 className="font-display text-lg font-semibold">{reply.title}</h2>
      </div>

      <p className="mt-2 text-[15px]">{reply.message}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {reply.helplines.map((h) =>
          h.number ? (
            <a
              key={h.label + h.number}
              href={`tel:${h.number.replace(/[^\d+]/g, "")}`}
              className="flex items-center gap-2 rounded-2xl bg-alert px-4 py-2.5 text-white transition hover:brightness-110"
            >
              <span className="text-lg font-bold tabular-nums" dir="ltr">
                {h.number}
              </span>
              <span className="text-xs leading-tight opacity-90" dir="ltr">
                {h.label}
                {h.note ? <><br />{h.note}</> : null}
              </span>
            </a>
          ) : (
            <p key={h.label} className="rounded-2xl bg-paper px-4 py-2.5 text-sm font-semibold text-alert" dir="ltr">
              {t.call}: {h.label}
            </p>
          ),
        )}
      </div>

      <ol className="mt-4 space-y-1.5 text-[15px]">
        {reply.steps.map((s, i) => (
          <li key={i} className="flex gap-2">
            <span className="font-bold text-alert">{i + 1}.</span>
            <span>{s}</span>
          </li>
        ))}
      </ol>

      <p className="mt-4 border-t border-alert/15 pt-3 text-sm">
        <span className="font-semibold">{reply.checkIn.question}</span>{" "}
        <span className="text-muted">{reply.checkIn.when}</span>
      </p>
    </article>
  );
}
