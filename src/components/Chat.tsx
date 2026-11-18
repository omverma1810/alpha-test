"use client";

import { useEffect, useRef, useState } from "react";
import { REGIONS } from "@/lib/helplines";
import { isRtl, scriptClass } from "@/lib/language";
import type { ChatTurn, CoachReply, Region } from "@/lib/types";
import Composer from "./Composer";
import EscalationCard from "./EscalationCard";
import NightLight from "./NightLight";
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
  "ابني عمره أربع سنوات ولا ينام إلا بعد بكاء طويل كل ليلة.",
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
    <div className="mx-auto flex min-h-dvh w-full max-w-[640px] flex-col px-4 sm:px-6">
      <header className="flex items-center justify-between gap-3 py-4">
        <div className="flex items-center gap-2.5">
          <NightLight className="size-8" />
          <p className="font-display text-[17px] font-bold tracking-tight">Alpha Kids coach</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-muted">
          <span className="hidden sm:inline">Helplines for</span>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value as Region)}
            className="rounded-lg border border-line bg-paper px-2.5 py-1.5 text-sm text-ink"
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

      <main className="flex-1 pb-8">
        {empty ? (
          <section className="pt-10 sm:pt-16">
            <h1 className="font-display text-[2.5rem] leading-[1.05] font-bold tracking-tight text-indigo sm:text-[3.25rem]">
              What&apos;s happening with your child?
            </h1>
            <p className="mt-4 max-w-[34rem] text-[17px] leading-relaxed text-muted">
              Write it the way you&apos;d tell a friend, in English, اردو or العربية. You&apos;ll get two or three things
              to try, and a time to check back in.
            </p>

            <ul className="mt-10 divide-y divide-line border-y border-line" aria-label="Example worries">
              {STARTERS.map((s) => (
                <li key={s}>
                  <button
                    onClick={() => send(s)}
                    dir="auto"
                    className={`group flex w-full items-center gap-3 py-3.5 text-start text-[15px] text-ink hover:text-indigo ${scriptClass(s)}`}
                  >
                    <span className="size-1.5 shrink-0 rounded-full bg-line group-hover:bg-lamp" aria-hidden />
                    <span className="flex-1">{s}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <ol className="space-y-7 pt-4" aria-live="polite">
            {messages.map((m) => (
              <li key={m.id} className="settle">
                {m.role === "parent" && <ParentBubble text={m.text} />}
                {m.role === "coach" &&
                  (m.reply.kind === "plan" ? <PlanCard reply={m.reply} /> : <EscalationCard reply={m.reply} />)}
                {m.role === "error" && (
                  <p className="rounded-xl border border-line bg-paper px-4 py-3 text-sm text-muted">{m.text}</p>
                )}
              </li>
            ))}
            {sending && (
              <li className="flex items-center gap-3 text-sm text-muted">
                <NightLight className="glow size-7" />
                Reading what you wrote
              </li>
            )}
          </ol>
        )}
        <div ref={bottom} />
      </main>

      <div className="sticky bottom-0 -mx-4 bg-dusk/95 px-4 pt-3 pb-4 backdrop-blur sm:-mx-6 sm:px-6">
        <Composer onSend={send} disabled={sending} />
        <p className="mt-2.5 text-center text-xs leading-snug text-muted">
          General parenting ideas, not medical, legal or emergency advice. In an emergency, call your local emergency
          number.
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
        className={`max-w-[85%] rounded-2xl bg-indigo px-4 py-2.5 text-[15px] whitespace-pre-wrap text-white ${rtl ? `${scriptClass(text)} rounded-tl-sm` : "rounded-tr-sm"}`}
      >
        {text}
      </p>
    </div>
  );
}
