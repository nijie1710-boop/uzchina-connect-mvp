import Link from "next/link";

export function LogoMark({ className = "h-11 w-11" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 96 96" role="img" aria-label="UzChina Connect logo mark">
      <path
        d="M18 15V51c0 24 18 39 39 30 13-6 21-17 21-33"
        fill="none"
        stroke="#061F43"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="14"
      />
      <path
        d="M73 34a24 24 0 1 0 0 32"
        fill="none"
        stroke="#D6A84F"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="12"
      />
      <path d="M69 48 87 35v26Z" fill="#0F766E" />
      <circle cx="61" cy="48" r="4" fill="#FFFFFF" opacity="0.95" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="UzChina Connect">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-white/70">
        <LogoMark className="h-9 w-9" />
      </span>
      <span className="leading-none">
        <span className="block text-xl font-black tracking-tight text-white">UzChina</span>
        <span className="block text-[11px] font-black tracking-[0.34em] text-[#3BC0AC]">Connect</span>
      </span>
    </Link>
  );
}
