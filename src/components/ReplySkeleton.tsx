import NightLight from "./NightLight";

/** Placeholder in the shape of a reply: summary line, the steps card, the check-in tag. */
export default function ReplySkeleton() {
  return (
    <div role="status" aria-label="The coach is writing a reply" className="flex gap-3">
      <NightLight className="glow mt-0.5 size-7 shrink-0" />
      <div className="min-w-0 flex-1 animate-pulse motion-reduce:animate-none" aria-hidden>
        <div className="h-4 w-11/12 rounded bg-line" />
        <div className="mt-2 h-4 w-2/3 rounded bg-line" />
        <div className="mt-4 space-y-3 rounded-2xl border border-line bg-paper p-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="h-5 w-3 rounded bg-indigo-soft" />
              <div className="h-4 flex-1 rounded bg-dusk" />
            </div>
          ))}
        </div>
        <div className="mt-3 h-16 rounded-2xl border border-lamp/50 bg-lamp-soft/70" />
      </div>
      <span className="sr-only">Writing a reply</span>
    </div>
  );
}
