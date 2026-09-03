import { cn } from "@/lib/utils";

type DudiyaMarkProps = {
  className?: string;
  /** Accessible name; omit when the nearby text already names the brand. */
  title?: string;
  decorative?: boolean;
};

/** Brand mark: navy circle with saffron "दू" — matches favicon / public SVG. */
export function DudiyaMark({
  className,
  title = "dudiya",
  decorative = false,
}: DudiyaMarkProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      fill="none"
      className={cn("h-9 w-9 shrink-0", className)}
      role="img"
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : title}
    >
      {!decorative ? <title>{title}</title> : null}
      <circle cx="32" cy="32" r="32" fill="#1A365D" />
      <text
        x="32"
        y="33"
        fill="#F0A202"
        fontFamily="var(--font-devanagari), Noto Sans Devanagari, Nirmala UI, Mangal, sans-serif"
        fontSize="30"
        fontWeight="700"
        textAnchor="middle"
        dominantBaseline="central"
      >
        दू
      </text>
    </svg>
  );
}
