import type { Metadata } from "next";
import { Suspense } from "react";
import Script from "next/script";
import { Quicksand, Inter } from "next/font/google";
import "./globals.css";
import { PostHogProvider } from "./providers/PostHogProvider";
import { PageviewTracker } from "./providers/PageviewTracker";

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

/** Meta (Facebook) Pixel — init ID from env so Vercel can override without a deploy if needed. */
const META_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID || "943508228261211";

export const metadata: Metadata = {
  metadataBase: new URL(metadataBase),
  icons: { icon: '/smartly-icon.png' },
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
        <Script
          id="meta-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');
            `.trim(),
          }}
        />
        <noscript>
          <img
            height={1}
            width={1}
            style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>
        <PostHogProvider>
          <Suspense fallback={null}>
            <PageviewTracker />
          </Suspense>
          {children}
        </PostHogProvider>
      </body>
    </html>
  );
}

