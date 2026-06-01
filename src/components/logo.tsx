import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="UzChina Connect">
      <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gold">
        <span className="h-5 w-5 rotate-45 rounded-full border-[5px] border-navy-700 border-r-white" />
      </span>
      <span className="leading-none">
        <span className="block text-lg font-black tracking-tight">UzChina</span>
        <span className="block text-[9px] font-semibold tracking-[0.32em] opacity-70">CONNECT</span>
      </span>
    </Link>
  );
}
