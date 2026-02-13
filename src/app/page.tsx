import Header from "@/components/Header";
import SalesGrid from "@/components/SalesGrid";
import Slideshow from "@/components/Slideshow";
import DashboardBackground from "@/components/DashboardBackground";

export default function DashboardPage() {
  return (
    <div className="dashboard-layout">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Wechselnder Hintergrund über gesamte Breite */}
        <DashboardBackground />

        {/* Left Side: Sales Data */}
        <div className="sales-column">
          <SalesGrid />
        </div>

        {/* Right Side: Team Slideshow */}
        <div className="slideshow-column">
          <Slideshow />
        </div>
      </div>
    </div>
  );
}
