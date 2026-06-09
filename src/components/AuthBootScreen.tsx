import React from 'react';
import logo from '../assets/Images/gaulaxmi-logo.png';

export function AuthBootScreen({
  variant = 'member',
  compact = false,
}: {
  variant?: 'member' | 'admin';
  compact?: boolean;
}) {
  const isAdmin = variant === 'admin';

  if (compact) {
    return (
      <div
        className={`w-full max-w-md mx-auto rounded-3xl border p-8 text-center ${
          isAdmin
            ? 'bg-white border-stone-200 shadow-soft'
            : 'bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl'
        }`}
        aria-live="polite"
        aria-busy="true"
      >
        <div
          className={`mx-auto mb-4 h-10 w-10 rounded-full border-2 border-t-transparent animate-spin ${
            isAdmin ? 'border-[#7f4e1c]' : 'border-gold'
          }`}
        />
        <p className={`text-sm font-medium ${isAdmin ? 'text-stone-600' : 'text-cream/90'}`}>
          Restoring your session…
        </p>
      </div>
    );
  }

  return (
    <div
      className={`flex min-h-screen min-h-[100dvh] w-full items-center justify-center p-6 ${
        isAdmin ? 'bg-gradient-warm' : 'bg-[#1c120c]'
      }`}
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className={`flex flex-col items-center text-center max-w-sm ${
          isAdmin ? 'text-stone-700' : 'text-cream'
        }`}
      >
        <img src={logo} alt="" className="h-14 w-14 object-contain mb-5 opacity-90" />
        <div
          className={`h-10 w-10 rounded-full border-2 border-t-transparent animate-spin mb-4 ${
            isAdmin ? 'border-[#7f4e1c]' : 'border-gold'
          }`}
        />
        <p className="text-sm font-semibold">Restoring your session…</p>
        <p className={`text-xs mt-1.5 ${isAdmin ? 'text-stone-500' : 'text-cream/60'}`}>
          Please wait a moment
        </p>
      </div>
    </div>
  );
}
