/** Small moon-and-star mark, used as the coach's avatar and in the header. */
export default function NightLight({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" className={className} aria-hidden>
      <circle cx="18" cy="18" r="18" fill="#2e3a7a" />
      <path d="M22.5 10.5a8 8 0 1 0 3.9 13.9 6.5 6.5 0 1 1-3.9-13.9Z" fill="#f2c14e" />
      <path d="m25.5 9 .7 1.6 1.6.7-1.6.7-.7 1.6-.7-1.6-1.6-.7 1.6-.7.7-1.6Z" fill="#fff4d6" />
    </svg>
  );
}
