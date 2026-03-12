import type { Metadata } from "next";
import { Quicksand, Inter } from "next/font/google";
import "./globals.css";

const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600"],
});

const metadataBase =
  process.env.NEXT_PUBLIC_APP_URL || 'https://www.signupsmartly.com';

export const metadata: Metadata = {
  metadataBase: new URL(metadataBase),
  icons: { icon: '/icon' },
  title: "SignupSmartly — Organize volunteers smartly",
  description:
    "A modern, ad-free way to coordinate volunteer roles and time slots for events",
  openGraph: {
    title: "SignupSmartly — Organize volunteers smartly",
    description:
      "A modern, ad-free way to coordinate volunteer roles and time slots for events",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SignupSmartly — Organize volunteers smartly",
    description:
      "A modern, ad-free way to coordinate volunteer roles and time slots for events",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${quicksand.variable} ${inter.variable}`}>
      <body className="antialiased font-body text-charcoal bg-sand">
        {children}
      </body>
    </html>
  );
}

