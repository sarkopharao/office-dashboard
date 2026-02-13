"use client";

interface SalesCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  subvalue?: string | number;
  variant?: "default" | "highlight";
}

export default function SalesCard({
  label,
  value,
  sublabel,
  subvalue,
  variant = "default",
}: SalesCardProps) {
  const isHighlight = variant === "highlight";

  return (
    <div
      className={`rounded-2xl p-6 flex flex-col justify-center items-center text-center min-h-[140px] ${
        isHighlight
          ? "text-white shadow-lg"
          : "bg-white shadow-sm"
      }`}
      style={isHighlight ? { background: "linear-gradient(to bottom right, #009399, #007a7f)" } : undefined}
    >
      <span
        className={`text-4xl font-extrabold tracking-tight leading-none number-transition ${
          isHighlight ? "text-white" : "text-intumind-dark"
        }`}
      >
        {typeof value === "number" ? value.toLocaleString("de-DE") : value}
      </span>
      <span
        className={`text-xs font-semibold tracking-widest uppercase mt-2 ${
          isHighlight ? "text-white/80" : "text-intumind-gray-light"
        }`}
      >
        {label}
      </span>

      {sublabel && subvalue !== undefined && (
        <>
          <div className={`w-8 h-px my-3 ${isHighlight ? "bg-white/30" : "bg-gray-200"}`} />
          <span
            className={`text-2xl font-bold leading-none ${
              isHighlight ? "text-white" : "text-intumind-dark"
            }`}
          >
            {typeof subvalue === "number" ? subvalue.toLocaleString("de-DE") : subvalue}
          </span>
          <span
            className={`text-xs font-semibold tracking-widest uppercase mt-1 ${
              isHighlight ? "text-white/60" : "text-intumind-gray-light"
            }`}
          >
            {sublabel}
          </span>
        </>
      )}
    </div>
  );
}
