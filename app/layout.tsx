import "./globals.css";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AuthProvider } from "../components/auth/auth-provider";
import { ThemeProvider } from "../components/theme/theme-provider";
import { ThemeToggle } from "../components/theme/theme-toggle";
import { PageTransition } from "../components/ui/motion";
import { Navbar } from "../components/ui/navbar";

const baseUrl = "https://unsaid.app";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "UnSaid | Anonymous Messege Sender",
  description: "Anonymous Q&A with polls and reactions",
  openGraph: {
    title: "UnSaid | Anonymous Messege Sender",
    description: "Anonymous Q&A with polls and reactions",
    url: baseUrl,
    siteName: "UnSaid",
    images: [
      {
        url: "/favicon.png",
        width: 512,
        height: 512,
        alt: "Unsaid"
      }
    ],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "UnSaid | Anonymous Messege Sender",
    description: "Anonymous Q&A with polls and reactions",
    images: ["/favicon.png"]
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png"
  }
};

export default function RootLayout(props: { children: ReactNode }) {
  const themeCookie = cookies().get("theme")?.value;
  const resolvedTheme =
    themeCookie === "light" || themeCookie === "dark" ? themeCookie : "system";

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider initialTheme={resolvedTheme}>
          <ThemeToggle />
          <AuthProvider>
            <Navbar />
            <PageTransition>{props.children}</PageTransition>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
