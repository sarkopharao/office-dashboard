import Header from "@/components/Header";
import SalesGrid from "@/components/SalesGrid";
import Slideshow from "@/components/Slideshow";
import MotivationalQuote from "@/components/MotivationalQuote";

export default function DashboardPage() {
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-1 flex min-h-0">
        {/* Left Side: Sales Data */}
        <div className="w-[42%] flex flex-col border-r border-gray-200">
          <SalesGrid />
          <div className="mt-auto border-t border-gray-100">
            <MotivationalQuote />
          </div>
        </div>

        {/* Right Side: Team Slideshow */}
        <div className="flex-1">
          <Slideshow />
        </div>
      </main>
    </div>
  );
}
