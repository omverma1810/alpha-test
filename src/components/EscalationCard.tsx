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
      className={`rounded-2xl border-2 border-alert bg-alert-soft p-5 ${font}`}
    >
      <h2 className="font-display text-xl leading-tight font-bold text-alert">{reply.title}</h2>
      <p className="mt-2 text-[15px] leading-relaxed">{reply.message}</p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {reply.helplines.map((h) =>
          h.number ? (
            <a
              key={h.label + h.number}
              href={`tel:${h.number.replace(/[^\d+]/g, "")}`}
              dir="ltr"
              className="flex items-center gap-3 rounded-xl bg-alert px-4 py-3 text-white hover:bg-[#9a1d13]"
            >
              <PhoneIcon />
              <span>
                <span className="block font-display text-xl leading-none font-bold tabular-nums">{h.number}</span>
                <span className="mt-1 block text-[13px] leading-tight text-white/85">
                  {h.label}
                  {h.note ? `, ${h.note}` : ""}
                </span>
              </span>
            </a>
          ) : (
            <p key={h.label} dir="ltr" className="rounded-xl border border-alert/30 bg-paper px-4 py-3 text-sm font-semibold text-alert">
              {t.call}: {h.label}
            </p>
          ),
        )}
      </div>

      <ol className="mt-5 space-y-2">
        {reply.steps.map((s, i) => (
          <li key={i} className="flex gap-3 text-[15px] leading-6">
            <span className="font-display font-bold text-alert tabular-nums">{i + 1}</span>
            <span>{s}</span>
          </li>
        ))}
      </ol>

      {reply.source === "history" && (
        <p className="mt-4 text-sm text-muted" dir="ltr">
          Showing this again because of something you shared earlier. If you want to talk about something else, use
          Start over.
        </p>
      )}

      <p className="mt-5 border-t border-alert/20 pt-3 text-[15px]">
        <span className="font-semibold">{reply.checkIn.question}</span>
        <span className="block text-sm text-muted">{reply.checkIn.when}</span>
      </p>
    </article>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 shrink-0" fill="currentColor" aria-hidden>
      <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2Z" />
    </svg>
  );
}
