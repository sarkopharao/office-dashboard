"use client";

import Clock from "./Clock";

export default function Header() {
  return (
    <header className="flex items-center justify-between px-8 py-4 bg-intumind-dark">
      <div className="flex items-center gap-4">
        <div className="text-intumind-white font-bold text-2xl tracking-tight">
          <span className="text-intumind-blue">intu</span>mind
        </div>
      </div>
      <div className="text-intumind-gray-light text-sm font-medium uppercase tracking-widest">
        Office Dashboard
      </div>
      <Clock />
    </header>
  );
}
