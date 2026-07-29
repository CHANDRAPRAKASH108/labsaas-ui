import Link from "next/link";

type LogoProps = {
  href?: string | null;
  size?: "sm" | "md" | "lg";
  tone?: "light" | "dark";
  showWordmark?: boolean;
  className?: string;
};

const sizes = {
  sm: { mark: 28, text: "text-lg" },
  md: { mark: 36, text: "text-xl" },
  lg: { mark: 48, text: "text-3xl" },
};

export function LogoMark({
  size = 36,
  tone = "light",
}: {
  size?: number;
  tone?: "light" | "dark";
}) {
  const ink = tone === "dark" ? "#ecfdf5" : "#134e4a";
  const accent = tone === "dark" ? "#7dd3fc" : "#0e7490";
  const fill = tone === "dark" ? "#0f766e" : "#ccfbf1";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect x="2" y="2" width="44" height="44" rx="12" fill={fill} />
      <path
        d="M18 12h12v4.2c0 1.1-.4 2.1-1.1 2.9L24.5 24l4.4 4.9c.7.8 1.1 1.8 1.1 2.9V40H18v-8.2c0-1.1.4-2.1 1.1-2.9L23.5 24l-4.4-4.9A4.2 4.2 0 0 1 18 16.2V12Z"
        stroke={ink}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="31.5" r="2.4" fill={accent} />
      <path d="M21 16.5h6" stroke={accent} strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({
  href = "/",
  size = "md",
  tone = "light",
  showWordmark = true,
  className = "",
}: LogoProps) {
  const dims = sizes[size];
  const word =
    tone === "dark"
      ? "text-teal-50"
      : "text-teal-900";

  const content = (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={dims.mark} tone={tone} />
      {showWordmark ? (
        <span
          className={`font-[family-name:var(--font-display)] font-semibold tracking-tight ${dims.text} ${word}`}
        >
          LabSaaS
        </span>
      ) : null}
    </span>
  );

  if (!href) return content;

  return (
    <Link href={href} className="inline-flex rounded-lg outline-offset-4" aria-label="LabSaaS home">
      {content}
    </Link>
  );
}
