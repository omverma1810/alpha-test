import type { Metadata, Viewport } from "next";
import { Fraunces, Noto_Naskh_Arabic, Noto_Nastaliq_Urdu, Nunito } from "next/font/google";
import "./globals.css";

const display = Fraunces({ variable: "--font-display", subsets: ["latin"], weight: ["500", "600"] });
const body = Nunito({ variable: "--font-body", subsets: ["latin"] });
const urdu = Noto_Nastaliq_Urdu({ variable: "--font-urdu", subsets: ["arabic"], weight: ["400", "600"] });
const arabic = Noto_Naskh_Arabic({ variable: "--font-arabic", subsets: ["arabic"], weight: ["400", "600"] });

export const metadata: Metadata = {
  title: "Parenting coach · Alpha Kids",
  description: "Tell us what's going on with your child and get a short, practical plan. English, Urdu or Arabic.",
};

export const viewport: Viewport = {
  themeColor: "#fbf6ee",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${urdu.variable} ${arabic.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
