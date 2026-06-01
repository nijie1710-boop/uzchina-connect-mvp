"use client";

export function FormField({
  label,
  value,
  onChange,
  type = "text",
  multiline = false,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  multiline?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-black text-slate-700">
      <span>{label}</span>
      {multiline ? (
        <textarea className="field min-h-32 resize-none" value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input className="field" type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}
