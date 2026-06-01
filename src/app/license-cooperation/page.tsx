"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileCheck2 } from "lucide-react";
import { useI18n } from "@/i18n/provider";
import { useToast } from "@/components/toast-provider";
import { FormField } from "@/components/form-field";
import { createLicenseApplication } from "@/actions/licenses";

export default function LicenseCooperationPage() {
  const { t } = useI18n();
  const { showToast } = useToast();
  const router = useRouter();
  const [form, setForm] = useState({
    applicantName: t("mock.userName"),
    country: t("mock.resources.licenseTashkent.country"),
    city: t("mock.resources.licenseTashkent.city"),
    partnership: t("mock.license.agency"),
    contact: "wechat: uzchina_demo"
  });

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async () => {
    const result = await createLicenseApplication({
      name: form.applicantName,
      country: form.country,
      city: form.city,
      cooperationType: form.partnership,
      contactWechat: form.contact,
      note: form.contact,
      hasTeam: true
    });
    if (!result.ok) {
      showToast(result.error);
      if (result.error.includes("登录")) router.push("/login");
      return;
    }
    showToast(t("forms.submittedLicense"));
    router.push("/dashboard");
  };

  return (
    <div className="mobile-screen">
      <div className="border-b border-line bg-white px-4 py-5 sm:px-6 lg:px-8">
        <h1 className="section-title">{t("forms.licenseTitle")}</h1>
        <p className="section-subtitle">{t("forms.licenseSubtitle")}</p>
      </div>
      <div className="px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <section className="rounded-3xl bg-navy p-6 text-white shadow-strong lg:p-8">
          <h2 className="text-2xl font-black">{t("home.licenseTitle")}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-white/70">{t("home.licenseSubtitle")}</p>
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {["agency", "distribution", "equity", "compliance"].map((key) => (
              <div key={key} className="rounded-2xl border border-white/15 bg-white/[0.08] p-4">
                <FileCheck2 className="mb-3 h-5 w-5 text-gold" />
                <b className="text-sm">{t(`mock.license.${key}`)}</b>
              </div>
            ))}
          </div>
        </section>

        <section className="panel mt-6 p-5 lg:p-7">
          <h2 className="text-lg font-black">{t("forms.partnerApply")}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <FormField label={t("forms.name")} value={form.applicantName} onChange={(value) => update("applicantName", value)} />
            <FormField label={t("forms.countryCity")} value={form.country} onChange={(value) => update("country", value)} />
            <FormField label={t("forms.city")} value={form.city} onChange={(value) => update("city", value)} />
            <FormField label={t("forms.expectedPartnership")} value={form.partnership} onChange={(value) => update("partnership", value)} />
            <div className="sm:col-span-2">
              <FormField label={t("forms.contact")} value={form.contact} onChange={(value) => update("contact", value)} />
            </div>
          </div>
          <button onClick={submit} className="btn-primary mt-6 w-full sm:w-auto">
            {t("forms.submitApplication")}
          </button>
        </section>
      </div>
    </div>
  );
}
