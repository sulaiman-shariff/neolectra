import { Inter } from "next/font/google";
import "./globals.css";
import { Metadata } from "next";
import { MapsAPIProvider } from "@/components/MapAPIProvider";
import { ReduxProvider } from "@/components/ReduxProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Neolectra - Solar Power & Rainwater Harvesting Solutions",
  description: "Smart solar planning and rainwater harvesting designed for impact, optimized by data, and beautiful on any rooftop.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyCi7e3FMADhQYOlwO0CjoAS4SeWGuhwXz8";

  return (
    <html lang="en">
      <body className={inter.className}>
        <ReduxProvider>
          <MapsAPIProvider apiKey={googleMapsApiKey}>
            {children}
          </MapsAPIProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
