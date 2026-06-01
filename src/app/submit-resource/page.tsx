"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileCheck2, LockKeyhole } from "lucide-react";
import { useI18n } from "@/i18n/provider";
import { useToast } from "@/components/toast-provider";
import { FormField } from "@/components/form-field";
import { createResource } from "@/actions/resources";

export default function SubmitResourcePage() {
  const { t, tArray } = useI18n();
  const { showToast } = useToast();
  const router = useRouter();
  const categories = tArray("mock.categories");
  const [form, setForm] = useState({
    title: t("mock.resources.pendingTrade.title"),
    category: categories[2] ?? "",
    country: t("mock.resources.pendingTrade.country"),
    city: t("mock.resources.pendingTrade.city"),
    cooperation: t("mock.resources.pendingTrade.cooperation"),
    description: t("mock.resources.pendingTrade.desc"),
    contactName: t("mock.userName"),
    phone: "+998 93 000 0000",
    email: "trade@uzchina-connect.com",
    telegram: "@samarkand_trade",
    whatsapp: "+998 93 000 0000",
    wechat: "samarkand_trade"
  });

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async () => {
    const result = await createResource({
      title: form.title,
      category: form.category,
      country: form.country,
      city: form.city,
      cooperationMode: form.cooperation,
      description: form.description,
      contactName: form.contactName,
      contactPhone: form.phone,
      contactEmail: form.email,
      contactTelegram: form.telegram,
      contactWhatsapp: form.whatsapp,
      contactWechat: form.wechat,
      longTerm: true,
      hasBusinessLicense: true,
      hasQualification: true
    });
    if (!result.ok) {
      showToast(result.error);
      if (result.error.includes("登录")) router.push("/login");
      return;
    }
    showToast(t("forms.submittedResource"));
    router.push("/dashboard");
  };

  return (
    <div className="mobile-screen">
      <div className="border-b border-line bg-white px-4 py-5 sm:px-6 lg:px-8">
        <h1 className="section-title">{t("forms.publishTitle")}</h1>
        <p className="section-subtitle">{t("forms.publishSubtitle")}</p>
      </div>

      <div className="grid gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[1fr_340px] lg:px-8 lg:py-8">
        <section className="panel p-5 lg:p-7">
          <div className="flex gap-3 overflow-x-auto border-b border-slate-100 pb-5">
            {tArray("forms.steps").map((step, index) => (
              <div
                key={step}
                className={index === 0 ? "flex shrink-0 items-center gap-2 text-sm font-black text-navy-700" : "flex shrink-0 items-center gap-2 text-sm font-black text-slate-400"}
              >
                <span className={index === 0 ? "flex h-8 w-8 items-center justify-center rounded-full bg-navy-700 text-white" : "flex h-8 w-8 items-center justify-center rounded-full bg-slate-100"}>
                  {index + 1}
                </span>
                {step}
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <FormField label={t("forms.resourceTitle")} value={form.title} onChange={(value) => update("title", value)} />
            <FormField label={t("forms.category")} value={form.category} onChange={(value) => update("category", value)} />
            <FormField label={t("forms.countryCity")} value={form.country} onChange={(value) => update("country", value)} />
            <FormField label={t("forms.city")} value={form.city} onChange={(value) => update("city", value)} />
            <FormField label={t("forms.cooperationType")} value={form.cooperation} onChange={(value) => update("cooperation", value)} />
            <FormField label={t("forms.contactName")} value={form.contactName} onChange={(value) => update("contactName", value)} />
            <div className="sm:col-span-2">
              <FormField label={t("forms.description")} value={form.description} onChange={(value) => update("description", value)} multiline />
            </div>
          </div>

          <div className="mt-7">
            <h2 className="text-lg font-black">{t("forms.documents")}</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {tArray("forms.steps")
                .slice(0, 3)
                .map((item) => (
                  <div key={item} className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-bold text-slate-500">
                    <FileCheck2 className="mb-2 h-5 w-5 text-navy-700" />
                    {item}
                  </div>
                ))}
            </div>
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            <FormField label={t("forms.wechat")} value={form.wechat} onChange={(value) => update("wechat", value)} />
            <FormField label={t("forms.phone")} value={form.phone} onChange={(value) => update("phone", value)} />
            <FormField label={t("forms.email")} value={form.email} onChange={(value) => update("email", value)} />
            <FormField label={t("forms.telegram")} value={form.telegram} onChange={(value) => update("telegram", value)} />
            <FormField label={t("forms.whatsapp")} value={form.whatsapp} onChange={(value) => update("whatsapp", value)} />
          </div>

          <div className="mt-6 rounded-2xl bg-sky-50 p-4 text-sm font-semibold leading-6 text-sky-800">{t("forms.safety")}</div>
          <button onClick={submit} className="btn-dark mt-5 w-full sm:w-auto">
            {t("common.submitReview")}
          </button>
        </section>

        <aside className="space-y-4">
          <div className="rounded-3xl bg-navy p-5 text-white shadow-soft">
            <LockKeyhole className="h-8 w-8 text-gold" />
            <h2 className="mt-4 text-xl font-black">{t("forms.publishTitle")}</h2>
            <p className="mt-3 text-sm leading-7 text-white/70">{t("forms.publishSubtitle")}</p>
          </div>
          <div className="panel p-5">
            <h3 className="font-black">{t("common.contactManaged")}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">{t("forms.safety")}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
