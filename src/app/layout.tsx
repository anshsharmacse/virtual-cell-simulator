import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VirtualCell-Simulator | AI Framework for Cellular Perturbation Prediction",
  description: "AI virtual cell framework using Variational Autoencoders (VAE), Contrastive Learning, and Multi-Task Learning to predict protein abundance changes under drug perturbations. Developed by ANSH SHARMA.",
  keywords: ["VirtualCell", "AI", "Machine Learning", "VAE", "Proteomics", "Drug Discovery", "Cellular Simulation", "Bioinformatics", "ANSH SHARMA"],
  authors: [{ name: "ANSH SHARMA" }],
  icons: {
    icon: "/logo.png",
  },
  openGraph: {
    title: "VirtualCell-Simulator",
    description: "AI Framework for Cellular Perturbation Response Prediction with 78% correlation to experimental data",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VirtualCell-Simulator",
    description: "AI Framework for Cellular Perturbation Response Prediction",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
