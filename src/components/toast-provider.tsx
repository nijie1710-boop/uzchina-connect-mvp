"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";

type ToastContextValue = {
  showToast: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState("");

  const value = useMemo<ToastContextValue>(
    () => ({
      showToast(nextMessage) {
        setMessage(nextMessage);
        window.setTimeout(() => setMessage(""), 2200);
      }
    }),
    []
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {message ? (
        <div className="fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-navy px-4 py-3 text-sm font-semibold text-white shadow-strong md:bottom-6">
          <CheckCircle2 className="h-4 w-4 text-gold" />
          <span>{message}</span>
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const value = useContext(ToastContext);
  if (!value) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return value;
}
