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
      className="flex items-end gap-2 rounded-2xl border border-line bg-paper p-1.5 focus-within:border-indigo"
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        rows={1}
        maxLength={1000}
        dir="auto"
        placeholder="My son won't sleep without..."
        aria-label="Your message"
        className={`max-h-40 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 placeholder:text-muted focus:outline-none focus-visible:outline-none field-sizing-content ${scriptClass(text)}`}
      />
      <button
        type="submit"
        disabled={disabled || !text.trim()}
        className="h-11 shrink-0 rounded-xl bg-indigo px-4 text-[15px] font-semibold text-white hover:bg-[#25306a] disabled:bg-indigo/35"
      >
        Send
      </button>
    </form>
  );
}
