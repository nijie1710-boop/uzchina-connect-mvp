"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n/provider";
import { useToast } from "@/components/toast-provider";
import { FormField } from "@/components/form-field";
import { createDemand } from "@/actions/demands";

export default function SubmitDemandPage() {
  const { t } = useI18n();
  const { showToast } = useToast();
  const router = useRouter();
  const [form, setForm] = useState({
    title: t("mock.demand.title"),
    category: t("mock.demand.category"),
    country: t("mock.resources.logisticsAlmaty.country"),
    city: t("mock.resources.logisticsAlmaty.city"),
    budget: "USD 2,000 - 5,000",
    cooperation: t("mock.resources.logisticsAlmaty.cooperation"),
    description: t("mock.demand.desc")
  });

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async () => {
    const result = await createDemand({
      title: form.title,
      category: form.category,
      country: form.country,
      city: form.city,
      budgetRange: form.budget,
      cooperationMode: form.cooperation,
      description: form.description
    });
    if (!result.ok) {
      showToast(result.error);
      if (result.error.includes("登录")) router.push("/login");
      return;
    }
    showToast(t("forms.submittedDemand"));
    router.push("/dashboard");
  };

  return (
    <div className="mobile-screen">
      <div className="border-b border-line bg-white px-4 py-5 sm:px-6 lg:px-8">
        <h1 className="section-title">{t("forms.demandTitle")}</h1>
        <p className="section-subtitle">{t("forms.demandSubtitle")}</p>
      </div>
      <div className="grid gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[1fr_340px] lg:px-8 lg:py-8">
        <section className="panel p-5 lg:p-7">
          <h2 className="text-lg font-black">{t("forms.needInfo")}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <FormField label={t("forms.needTitle")} value={form.title} onChange={(value) => update("title", value)} />
            <FormField label={t("forms.category")} value={form.category} onChange={(value) => update("category", value)} />
            <FormField label={t("forms.targetCountry")} value={form.country} onChange={(value) => update("country", value)} />
            <FormField label={t("forms.city")} value={form.city} onChange={(value) => update("city", value)} />
            <FormField label={t("forms.budget")} value={form.budget} onChange={(value) => update("budget", value)} />
            <FormField label={t("forms.cooperationType")} value={form.cooperation} onChange={(value) => update("cooperation", value)} />
            <div className="sm:col-span-2">
              <FormField label={t("forms.detailInfo")} value={form.description} onChange={(value) => update("description", value)} multiline />
            </div>
          </div>
          <button onClick={submit} className="btn-dark mt-6 w-full sm:w-auto">
            {t("forms.demandTitle")}
          </button>
        </section>
        <aside className="rounded-3xl bg-navy p-5 text-white shadow-soft">
          <h2 className="text-xl font-black">{t("forms.demandTitle")}</h2>
          <p className="mt-3 text-sm leading-7 text-white/70">{t("forms.demandSubtitle")}</p>
        </aside>
      </div>
    </div>
  );
}
