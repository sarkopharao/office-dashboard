"use client";

import Image from "next/image";
import Clock from "./Clock";

export default function Header() {
  return (
    <header className="flex items-center justify-between px-8 py-4 bg-intumind-dark">
      <div className="flex items-center gap-4">
        <Image
          src="/intumind-design/intumind-logo-laenglich-white.png"
          alt="intumind"
          width={160}
          height={40}
          priority
        />
      </div>
      <div className="font-heading text-intumind-gray-light text-sm font-bold uppercase tracking-widest">
        Office Dashboard
      </div>
      <Clock />
    </header>
  );
}
