import Header from "@/components/Header";
import SalesGrid from "@/components/SalesGrid";
import Slideshow from "@/components/Slideshow";
import MotivationalQuote from "@/components/MotivationalQuote";
import DashboardBackground from "@/components/DashboardBackground";

export default function DashboardPage() {
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-1 flex min-h-0 relative">
        {/* Wechselnder Hintergrund über gesamte Breite */}
        <DashboardBackground />

        {/* Left Side: Sales Data */}
        <div className="w-[42%] flex flex-col relative z-10">
          <SalesGrid />
          <div className="mt-auto">
            <MotivationalQuote />
          </div>
        </div>

        {/* Right Side: Team Slideshow */}
        <div className="flex-1 relative z-10">
          <Slideshow />
        </div>
      </main>
    </div>
  );
}
