import Header from "@/components/Header";
import SalesGrid from "@/components/SalesGrid";
import Slideshow from "@/components/Slideshow";
import MotivationalQuote from "@/components/MotivationalQuote";
import DashboardBackground from "@/components/DashboardBackground";

export default function DashboardPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100vw", overflow: "hidden" }}>
      {/* Header */}
      <Header />

      {/* Main Content */}
      <div style={{ display: "flex", flex: 1, minHeight: 0, position: "relative" }}>
        {/* Wechselnder Hintergrund über gesamte Breite */}
        <DashboardBackground />

        {/* Left Side: Sales Data + Quote (scrollbar) */}
        <div
          className="dashboard-scroll"
          style={{
            width: "42%",
            position: "relative",
            zIndex: 10,
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          <SalesGrid />
          <MotivationalQuote />
        </div>

        {/* Right Side: Team Slideshow */}
        <div
          style={{
            flex: 1,
            position: "relative",
            zIndex: 10,
            display: "flex",
            minHeight: 0,
          }}
        >
          <Slideshow />
        </div>
      </div>
    </div>
  );
}
