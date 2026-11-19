"use client";

import { useEffect, useRef, useState } from "react";
import { REGIONS } from "@/lib/helplines";
import { isRtl, scriptClass } from "@/lib/language";
import type { ChatTurn, CoachReply, Region } from "@/lib/types";
import Composer from "./Composer";
import EscalationCard from "./EscalationCard";
import NightLight from "./NightLight";
import OffTopicCard from "./OffTopicCard";
import ReplySkeleton from "./ReplySkeleton";
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

// Kept in sessionStorage: it survives a refresh, and disappears when the tab is
// closed. Nothing is sent to a server or stored anywhere else.
const STORAGE_KEY = "alpha-coach-conversation-v1";
const MAX_STORED = 40;

function loadSaved(): { messages: Message[]; region: Region } | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!Array.isArray(data?.messages)) return null;
    const messages = (data.messages as Message[]).filter(
      (m) => (m.role === "parent" && typeof m.text === "string") || (m.role === "coach" && m.reply && typeof m.reply.kind === "string"),
    );
    const region = REGIONS.some((r) => r.value === data.region) ? (data.region as Region) : "ae";
    return { messages, region };
  } catch {
    return null;
  }
}

function save(messages: Message[], region: Region) {
  try {
    // Errors aren't part of the conversation, so they aren't kept.
    const kept = messages.filter((m) => m.role !== "error").slice(-MAX_STORED);
    if (kept.length === 0) sessionStorage.removeItem(STORAGE_KEY);
    else sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ messages: kept, region }));
  } catch {
    // Storage can be full or blocked (private mode); the chat still works without it.
  }
}

/** What the model sees of earlier coach turns: the words, not the UI. */
function toTurn(m: Message): ChatTurn | null {
  if (m.role === "parent") return { role: "parent", text: m.text };
  if (m.role === "coach") {
    const r = m.reply;
    if (r.kind === "off_topic") return { role: "coach", text: r.message };
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
  const restored = useRef(false);

  // Restore after mount: sessionStorage doesn't exist during server rendering.
  useEffect(() => {
    const saved = loadSaved();
    if (saved) {
      nextId.current = saved.messages.reduce((max, m) => Math.max(max, m.id), 0) + 1;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore from browser storage
      setMessages(saved.messages);
      setRegion(saved.region);
    }
    restored.current = true;
  }, []);

  useEffect(() => {
    if (restored.current) save(messages, region);
  }, [messages, region]);

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

  function startOver() {
    setMessages([]);
  }

  const empty = messages.length === 0;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[640px] flex-col px-4 sm:px-6">
      <header className="flex items-center justify-between gap-3 py-4">
        <div className="flex items-center gap-2.5">
          <NightLight className="size-8" />
          <p className="font-display text-[17px] font-bold tracking-tight whitespace-nowrap">Alpha Kids coach</p>
        </div>
        <div className="flex items-center gap-2">
        {!empty && (
          <button
            onClick={startOver}
            disabled={sending}
            className="rounded-lg px-2 py-1.5 text-sm whitespace-nowrap text-muted hover:bg-indigo-soft hover:text-indigo disabled:opacity-50"
          >
            Start over
          </button>
        )}
        <label className="flex items-center gap-2 text-sm text-muted">
          <span className="hidden sm:inline">Helplines for</span>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value as Region)}
            className="max-w-28 rounded-lg border border-line bg-paper px-2 py-1.5 text-sm text-ink sm:max-w-none"
            aria-label="Country for helpline numbers"
          >
            {REGIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        </div>
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
                  (m.reply.kind === "plan" ? (
                    <PlanCard reply={m.reply} />
                  ) : m.reply.kind === "escalation" ? (
                    <EscalationCard reply={m.reply} />
                  ) : (
                    <OffTopicCard reply={m.reply} onPick={send} />
                  ))}
                {m.role === "error" && (
                  <p className="rounded-xl border border-line bg-paper px-4 py-3 text-sm text-muted">{m.text}</p>
                )}
              </li>
            ))}
            {sending && (
              <li>
                <ReplySkeleton />
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
