// intumind Office Dashboard – Once UI Configuration

const baseURL = process.env.NEXT_PUBLIC_BASE_URL || "https://dashboard.intumind.de";

// Fonts: Lora (heading) + Outfit (body/label)
import { Outfit, Lora } from "next/font/google";

const heading = Lora({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
});

const body = Outfit({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const label = Outfit({
  variable: "--font-label",
  subsets: ["latin"],
  display: "swap",
});

const code = Outfit({
  variable: "--font-code",
  subsets: ["latin"],
  display: "swap",
});

const fonts = {
  heading,
  body,
  label,
  code,
};

// Style defaults
const style = {
  theme: "light",         // Dashboard läuft immer im Light-Mode
  neutral: "gray",        // gray | sand | slate
  brand: "cyan",          // Wir überschreiben mit custom CSS → intumind teal
  accent: "green",        // Grün-Akzent für Erfolg/Club
  solid: "color",         // color | contrast | inverse
  solidStyle: "flat",     // flat | plastic
  border: "playful",      // rounded | playful | conservative
  surface: "translucent", // filled | translucent
  transition: "all",      // all | micro | macro
  scaling: "100",         // 90 | 95 | 100 | 105 | 110
};

// Data theme (nicht genutzt, aber benötigt für Provider)
const dataStyle = {
  variant: "flat",
  mode: "categorical",
  height: 24,
  axis: {
    stroke: "var(--neutral-alpha-weak)",
  },
  tick: {
    fill: "var(--neutral-on-background-weak)",
    fontSize: 11,
    line: false,
  },
};

const meta = {
  home: {
    path: "/",
    title: "intumind Office Dashboard",
    description: "Live Sales Dashboard für intumind",
    image: "",
    canonical: baseURL,
    robots: "noindex,nofollow",
    alternates: [],
  },
};

const schema = {
  logo: "",
  type: "Organization",
  name: "intumind",
  description: meta.home.description,
  email: "",
};

const social = {};

export { baseURL, fonts, style, meta, schema, social, dataStyle };
