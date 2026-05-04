import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DroneSeg | Semantic Segmentation for Aerial Imagery",
  description: "Advanced land-cover identification platform using SegFormer-B2 and AI vision.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={outfit.className}>{children}</body>
    </html>
  );
}
