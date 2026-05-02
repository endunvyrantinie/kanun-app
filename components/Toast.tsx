"use client";

import { useEffect, useState } from "react";

export interface ToastMessage {
  id: number;
  text: string;
  level?: number;
}

interface Props {
  message: ToastMessage | null;
}

export function Toast({ message }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!message) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 1800);
    return () => clearTimeout(t);
  }, [message]);

  if (!message) return null;

  return (
    <div className="fixed left-0 right-0 top-[80px] flex justify-center pointer-events-none z-[60]">
      <div
        className={`bg-ink text-white px-3.5 py-2.5 rounded-full text-[13px] shadow-lg inline-flex items-center gap-2 transition-all duration-200 ${
          visible ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"
        }`}
      >
        {message.level != null && (
          <span className="bg-accent text-white px-2 py-0.5 rounded-full font-bold text-[11px]">
            LV {message.level}
          </span>
        )}
        {message.text}
      </div>
    </div>
  );
}
