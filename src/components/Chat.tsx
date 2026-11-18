"use client";

import { useEffect, useRef, useState } from "react";
import { REGIONS } from "@/lib/helplines";
import { isRtl } from "@/lib/language";
import type { ChatTurn, CoachReply, Region } from "@/lib/types";
import Composer from "./Composer";
import EscalationCard from "./EscalationCard";
import PlanCard from "./PlanCard";

type Message =
  | { id: number; role: "parent"; text: string }
  | { id: number; role: "coach"; reply: CoachReply }
  | { id: number; role: "error"; text: string };

const STARTERS = [
  "My 3-year-old has a meltdown every night at bedtime.",
  "My 10-year-old won't put the tablet down and gets angry when I take it.",
  "میرا بیٹا ہر صبح اسکول جانے سے پہلے روتا ہے۔",
  "Meri beti khana nahi khaati aur bohat ziddi ho gayi hai.",
];

/** What the model sees of earlier coach turns: the words, not the UI. */
function toTurn(m: Message): ChatTurn | null {
  if (m.role === "parent") return { role: "parent", text: m.text };
  if (m.role === "coach") {
    const r = m.reply;
    const body = r.kind === "plan" ? [r.summary, ...r.steps] : [r.title, r.message];
    return { role: "coach", text: [...body, `Check-in: ${r.checkIn.question} (${r.checkIn.when})`].join("\n") };
  }
  return null;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);
  const [region, setRegion] = useState<Region>("ae");
  const nextId = useRef(1);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || sending) return;

    const history = messages.map(toTurn).filter((t): t is ChatTurn => t !== null);
    setMessages((prev) => [...prev, { id: nextId.current++, role: "parent", text: message }]);
    setSending(true);

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message, history, region }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.reply) throw new Error(data.error || "Something went wrong. Please try again.");
      setMessages((prev) => [...prev, { id: nextId.current++, role: "coach", reply: data.reply }]);
    } catch (err) {
      const text = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setMessages((prev) => [...prev, { id: nextId.current++, role: "error", text }]);
    } finally {
      setSending(false);
    }
  }

  const empty = messages.length === 0;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 sm:px-6">
      <header className="flex items-center justify-between gap-3 py-5">
        <div className="flex items-center gap-3">
          <Mark />
          <div>
            <p className="font-display text-lg leading-tight font-semibold">Parenting coach</p>
            <p className="text-xs text-muted">
              Alpha Kids<span className="hidden sm:inline"> · English or Urdu</span>
            </p>
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs text-muted">
          <span className="hidden sm:inline">Helplines for</span>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value as Region)}
            className="rounded-full border border-line bg-paper px-3 py-1.5 text-sm text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-sage/40"
            aria-label="Country for helpline numbers"
          >
            {REGIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
      </header>

      <main className="flex-1 pb-6">
        {empty ? (
          <section className="rise pt-6 sm:pt-12">
            <h1 className="font-display text-3xl leading-snug font-medium sm:text-4xl">
              What&apos;s going on with your little one?
            </h1>
            <p className="mt-3 max-w-lg text-muted">
              Tell me in a sentence or two. I&apos;ll suggest a few small things to try, and we&apos;ll check in on how
              it went.
            </p>
            <p className="mt-8 text-xs font-semibold tracking-wide text-muted uppercase">Or start with one of these</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  dir="auto"
                  className={`rounded-2xl border border-line bg-paper px-4 py-2.5 text-start text-sm transition hover:border-sage hover:bg-sage-soft ${isRtl(s) ? "urdu" : ""}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </section>
        ) : (
          <ol className="space-y-5 pt-2" aria-live="polite">
            {messages.map((m) => (
              <li key={m.id} className="rise">
                {m.role === "parent" && <ParentBubble text={m.text} />}
                {m.role === "coach" &&
                  (m.reply.kind === "plan" ? <PlanCard reply={m.reply} /> : <EscalationCard reply={m.reply} />)}
                {m.role === "error" && (
                  <p className="rounded-2xl border border-line bg-paper px-4 py-3 text-sm text-muted">{m.text}</p>
                )}
              </li>
            ))}
            {sending && (
              <li className="flex items-center gap-2 px-1 text-sm text-muted">
                <span className="flex gap-1" aria-hidden>
                  <span className="dot size-1.5 rounded-full bg-sage" />
                  <span className="dot size-1.5 rounded-full bg-sage" />
                  <span className="dot size-1.5 rounded-full bg-sage" />
                </span>
                Thinking it through
              </li>
            )}
          </ol>
        )}
        <div ref={bottom} />
      </main>

      <div className="sticky bottom-0 bg-gradient-to-t from-cream from-70% to-transparent pt-4 pb-4">
        <Composer onSend={send} disabled={sending} />
        <p className="mt-2 px-1 text-center text-[11px] text-muted">
          General parenting ideas only. Not medical, legal or emergency advice. In an emergency, call your local
          emergency number.
        </p>
      </div>
    </div>
  );
}

function ParentBubble({ text }: { text: string }) {
  const rtl = isRtl(text);
  return (
    <div className="flex justify-end">
      <p
        dir="auto"
        className={`max-w-[85%] rounded-3xl rounded-br-md bg-sage px-4 py-2.5 whitespace-pre-wrap text-white ${rtl ? "urdu rounded-br-3xl rounded-bl-md" : ""}`}
      >
        {text}
      </p>
    </div>
  );
}

function Mark() {
  return (
    <svg viewBox="0 0 40 40" className="size-10" aria-hidden>
      <rect width="40" height="40" rx="14" fill="#e6eee5" />
      <path
        d="M20 29c-5.5-3.6-9-7-9-11a4.6 4.6 0 0 1 9-1.6A4.6 4.6 0 0 1 29 18c0 4-3.5 7.4-9 11Z"
        fill="#c9714a"
      />
      <circle cx="27.5" cy="12" r="2.5" fill="#5f7f68" />
    </svg>
  );
}
