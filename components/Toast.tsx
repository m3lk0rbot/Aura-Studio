import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type?: 'info' | 'ok' | 'warn' | 'err';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 200); // Allow fade out
    }, 2500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    info: 'border-slate-700/70 bg-slate-900/90 text-slate-100',
    ok: 'border-emerald-700/60 bg-emerald-950/90 text-emerald-50',
    warn: 'border-amber-700/60 bg-amber-950/90 text-amber-50',
    err: 'border-rose-700/60 bg-rose-950/90 text-rose-50',
  };

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 rounded-xl border px-4 py-3 text-sm backdrop-blur-md transition-all duration-300 ${
        colors[type]
      } ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    >
      {message}
    </div>
  );
};