"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileCheck2, Home, Library, PlusCircle, ShieldCheck, UserRound } from "lucide-react";
import clsx from "clsx";
import { useI18n } from "@/i18n/provider";
import { Logo } from "./logo";
import { LanguageSwitcher } from "./language-switcher";

const desktopNav = [
  { href: "/", labelKey: "nav.home" },
  { href: "/resources", labelKey: "nav.resources" },
  { href: "/submit-resource", labelKey: "nav.publish" },
  { href: "/submit-demand", labelKey: "nav.demand" },
  { href: "/license-cooperation", labelKey: "nav.license" },
  { href: "/admin", labelKey: "nav.admin" }
];

const mobileNav = [
  { href: "/", labelKey: "nav.home", icon: Home },
  { href: "/resources", labelKey: "nav.resources", icon: Library },
  { href: "/submit-resource", labelKey: "nav.publish", icon: PlusCircle },
  { href: "/submit-demand", labelKey: "nav.demand", icon: FileCheck2 },
  { href: "/dashboard", labelKey: "nav.dashboard", icon: UserRound }
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-[#E9EEF5] text-slate-950">
      <header className="sticky top-0 z-40 bg-navy text-white shadow-lg shadow-slate-950/10">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />
          <nav className="hidden items-center gap-5 text-sm font-extrabold lg:flex">
            {desktopNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "transition hover:text-gold",
                  isActive(pathname, item.href) ? "text-gold" : "text-white/80"
                )}
              >
                {t(item.labelKey)}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact />
            <Link
              href="/login"
              className="hidden h-9 items-center rounded-xl border border-white/20 px-4 text-xs font-black text-white/90 md:inline-flex"
            >
              {t("nav.login")}
            </Link>
            <Link
              href="/submit-resource"
              className="hidden h-9 items-center gap-2 rounded-xl bg-gold px-4 text-xs font-black text-navy-700 md:inline-flex"
            >
              <ShieldCheck className="h-4 w-4" />
              {t("home.postResource")}
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl pb-24 md:pb-0">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-40 grid h-[68px] grid-cols-5 border-t border-line bg-white px-1 shadow-[0_-12px_30px_rgba(15,23,42,0.08)] md:hidden">
        {mobileNav.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex flex-col items-center justify-center gap-1 text-[10px] font-extrabold",
                isActive(pathname, item.href) ? "text-navy-700" : "text-slate-500"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="max-w-full truncate">{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
