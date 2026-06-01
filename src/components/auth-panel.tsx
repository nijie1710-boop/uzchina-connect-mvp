"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import { useI18n } from "@/i18n/provider";
import { login, register } from "@/actions/auth";
import { useToast } from "./toast-provider";
import { FormField } from "./form-field";

export function AuthVisual({ mode }: { mode: "login" | "register" }) {
  const { t } = useI18n();
  return (
    <section className="hidden bg-navy p-10 text-white lg:block">
      <div className="max-w-md">
        <span className="inline-flex rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1.5 text-xs font-black text-yellow-700">
          {t("home.badge")}
        </span>
        <h1 className="mt-5 text-4xl font-black leading-tight">{mode === "login" ? t("auth.loginHero") : t("auth.registerHero")}</h1>
        <p className="mt-4 text-sm leading-7 text-white/70">{mode === "login" ? t("auth.loginHeroText") : t("auth.registerHeroText")}</p>
        <div className="mt-8 grid grid-cols-2 gap-3">
          {[
            [t("auth.emailLogin"), Mail],
            [t("auth.phoneOtp"), Phone],
            ["Telegram", MessageCircle],
            ["Google", ShieldCheck]
          ].map(([label, Icon]) => {
            const TypedIcon = Icon as typeof Mail;
            return (
              <div key={label as string} className="rounded-2xl border border-white/15 bg-white/[0.08] p-4">
                <TypedIcon className="mb-3 h-5 w-5 text-gold" />
                <b className="text-sm">{label as string}</b>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function LoginForm() {
  const { t } = useI18n();
  const { showToast } = useToast();
  const router = useRouter();
  const [email, setEmail] = useState("demo@uzchina-connect.com");
  const [password, setPassword] = useState("demo123456");
  const [pending, setPending] = useState(false);

  const submit = async () => {
    setPending(true);
    const result = await login({ email, password });
    setPending(false);
    if (!result.ok) {
      showToast(result.error);
      return;
    }
    showToast(t("toast.loggedIn"));
    router.push("/dashboard");
  };

  return (
    <div className="mx-auto w-full max-w-md p-5 lg:p-10">
      <h2 className="text-3xl font-black">{t("auth.welcome")}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">{t("auth.loginSubtitle")}</p>
      <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-1">
        <button className="h-10 rounded-xl bg-white text-sm font-black text-navy-700 shadow-sm">{t("auth.emailLogin")}</button>
        <button className="h-10 rounded-xl text-sm font-black text-slate-500">{t("auth.phoneOtp")}</button>
      </div>
      <div className="mt-5 grid gap-4">
        <FormField label={t("auth.email")} value={email} onChange={setEmail} type="email" />
        <FormField label={t("auth.password")} value={password} onChange={setPassword} type="password" />
      </div>
      <button onClick={submit} disabled={pending} className="btn-dark mt-6 w-full disabled:opacity-60">
        {pending ? t("common.pending") : t("auth.loginButton")}
      </button>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <button className="btn-outline h-11">Telegram</button>
        <button className="btn-outline h-11">Google</button>
      </div>
      <p className="mt-4 rounded-2xl border border-yellow-200 bg-yellow-50 p-3 text-xs font-semibold leading-5 text-yellow-800">
        {t("auth.oauthNote")}
      </p>
      <p className="mt-5 text-center text-sm font-semibold text-slate-500">
        {t("auth.noAccount")}{" "}
        <Link href="/register" className="font-black text-navy-700">
          {t("auth.createAccount")}
        </Link>
      </p>
    </div>
  );
}

export function RegisterForm() {
  const { t } = useI18n();
  const { showToast } = useToast();
  const router = useRouter();
  const [email, setEmail] = useState("new-user@uzchina-connect.com");
  const [phone, setPhone] = useState("+998 90 000 0000");
  const [messaging, setMessaging] = useState("@new_user");
  const [password, setPassword] = useState("new123456");
  const [role, setRole] = useState<"supplier" | "buyer" | "service_provider">("supplier");
  const [pending, setPending] = useState(false);

  const submit = async () => {
    setPending(true);
    const result = await register({ email, password, phone, messaging, role });
    setPending(false);
    if (!result.ok) {
      showToast(result.error);
      return;
    }
    showToast(t("toast.registered"));
    router.push("/dashboard");
  };

  return (
    <div className="mx-auto w-full max-w-md p-5 lg:p-10">
      <h2 className="text-3xl font-black">{t("auth.registerTitle")}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">{t("auth.registerSubtitle")}</p>
      <div className="mt-5 grid grid-cols-3 gap-2">
        {[
          [t("auth.supplier"), "supplier"],
          [t("auth.buyer"), "buyer"],
          [t("auth.service"), "service_provider"]
        ].map(([label, value]) => (
          <button
            key={value}
            onClick={() => setRole(value as typeof role)}
            className={role === value ? "rounded-2xl border border-gold bg-yellow-50 p-3 text-xs font-black text-yellow-800" : "rounded-2xl border border-line bg-white p-3 text-xs font-black text-slate-500"}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="mt-5 grid gap-4">
        <FormField label={t("auth.email")} value={email} onChange={setEmail} type="email" />
        <FormField label={t("auth.phone")} value={phone} onChange={setPhone} />
        <FormField label={t("auth.messaging")} value={messaging} onChange={setMessaging} />
        <FormField label={t("auth.setPassword")} value={password} onChange={setPassword} type="password" />
      </div>
      <button onClick={submit} disabled={pending} className="btn-primary mt-6 w-full disabled:opacity-60">
        {pending ? t("common.pending") : t("auth.registerButton")}
      </button>
      <p className="mt-5 text-center text-sm font-semibold text-slate-500">
        {t("auth.hasAccount")}{" "}
        <Link href="/login" className="font-black text-navy-700">
          {t("auth.goLogin")}
        </Link>
      </p>
    </div>
  );
}
