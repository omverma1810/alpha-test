import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible_Next, Bricolage_Grotesque, Noto_Naskh_Arabic, Noto_Nastaliq_Urdu } from "next/font/google";
import "./globals.css";

// Bricolage for the few places that carry the voice; Atkinson for everything a tired parent reads.
const display = Bricolage_Grotesque({ variable: "--font-display", subsets: ["latin"], weight: ["500", "700"] });
const body = Atkinson_Hyperlegible_Next({ variable: "--font-body", subsets: ["latin"], weight: ["400", "600"] });
const urdu = Noto_Nastaliq_Urdu({ variable: "--font-urdu", subsets: ["arabic"], weight: ["400", "600"] });
const arabic = Noto_Naskh_Arabic({ variable: "--font-arabic", subsets: ["arabic"], weight: ["400", "600"] });

export const metadata: Metadata = {
  title: "Alpha Kids parenting coach",
  description: "Tell us what's going on with your child and get a short, practical plan. English, Urdu or Arabic.",
};

export const viewport: Viewport = {
  themeColor: "#edf0f7",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${urdu.variable} ${arabic.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
