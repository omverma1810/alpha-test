"use client";

import { useState, type KeyboardEvent } from "react";
import { scriptClass } from "@/lib/language";

export default function Composer({ onSend, disabled }: { onSend: (text: string) => void; disabled: boolean }) {
  const [text, setText] = useState("");

  function submit() {
    if (!text.trim() || disabled) return;
    onSend(text);
    setText("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex items-end gap-2 rounded-3xl border border-line bg-paper p-2 shadow-[0_6px_24px_-12px_rgba(47,42,37,0.25)] focus-within:border-sage"
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        rows={1}
        maxLength={1000}
        dir="auto"
        placeholder="Type your worry here"
        aria-label="Your message"
        className={`max-h-40 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 placeholder:text-muted/70 focus:outline-none field-sizing-content ${scriptClass(text)}`}
      />
      <button
        type="submit"
        disabled={disabled || !text.trim()}
        className="grid size-11 shrink-0 place-items-center rounded-full bg-clay text-white transition hover:brightness-95 disabled:opacity-40"
        aria-label="Send"
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M5 12h13M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </form>
  );
}
