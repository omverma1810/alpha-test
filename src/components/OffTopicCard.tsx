import type { OffTopicReply } from "@/lib/types";
import NightLight from "./NightLight";

export default function OffTopicCard({ reply, onPick }: { reply: OffTopicReply; onPick: (text: string) => void }) {
  const rtl = reply.language === "ur" || reply.language === "ar";
  const font = reply.language === "ur" ? "urdu" : reply.language === "ar" ? "arabic" : "";

  return (
    <article
      dir={rtl ? "rtl" : "ltr"}
      lang={reply.language === "roman_ur" ? "ur-Latn" : reply.language}
      className={`flex gap-3 ${font}`}
    >
      <NightLight className="mt-0.5 size-7 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[16px] leading-relaxed">{reply.message}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {reply.examples.map((ex) => (
            <button
              key={ex}
              onClick={() => onPick(ex)}
              className="rounded-xl border border-line bg-paper px-3 py-2 text-start text-sm hover:border-indigo hover:text-indigo"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
    </article>
  );
}
