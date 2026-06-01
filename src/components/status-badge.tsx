import clsx from "clsx";
import type { MatchRequestStatus, SubmissionStatus, Translate } from "@/lib/domain";
import { matchStatusLabel, statusLabel } from "@/lib/domain";

const statusTone: Record<SubmissionStatus | MatchRequestStatus, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  rejected: "border-rose-200 bg-rose-50 text-rose-700",
  needs_more_info: "border-sky-200 bg-sky-50 text-sky-700",
  featured: "border-yellow-200 bg-yellow-50 text-yellow-700",
  high_risk: "border-red-200 bg-red-50 text-red-700",
  contacted: "border-indigo-200 bg-indigo-50 text-indigo-700",
  contact_unlocked: "border-teal-200 bg-teal-50 text-teal-700"
};

export function StatusBadge({
  status,
  t,
  className
}: {
  status: SubmissionStatus | MatchRequestStatus;
  t: Translate;
  className?: string;
}) {
  const label =
    status === "contact_unlocked" || status === "approved"
      ? status === "contact_unlocked"
        ? matchStatusLabel(status, t)
        : statusLabel(status, t)
      : status in statusTone
        ? statusLabel(status as SubmissionStatus, t)
        : String(status);

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-black",
        statusTone[status],
        className
      )}
    >
      {label}
    </span>
  );
}
