"use client";

interface SalesCardProps {
  label: string;
  value: string | number;
  icon: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}

export default function SalesCard({
  label,
  value,
  icon,
  trend,
  trendValue,
}: SalesCardProps) {
  const trendColor =
    trend === "up"
      ? "text-green-500"
      : trend === "down"
        ? "text-red-400"
        : "text-intumind-gray-light";

  const trendArrow =
    trend === "up" ? "↑" : trend === "down" ? "↓" : "";

  return (
    <div className="bg-intumind-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-intumind-gray text-sm font-medium">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-3xl font-bold text-intumind-dark number-transition">
          {typeof value === "number"
            ? value.toLocaleString("de-DE")
            : value}
        </span>
        {trend && trendValue && (
          <span className={`text-sm font-medium ${trendColor}`}>
            {trendArrow} {trendValue}
          </span>
        )}
      </div>
    </div>
  );
}
