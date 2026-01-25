import "./globals.css";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AuthProvider } from "../components/auth/auth-provider";
import { ThemeProvider } from "../components/theme/theme-provider";
import { ThemeToggle } from "../components/theme/theme-toggle";
import { PageTransition } from "../components/ui/motion";

export const metadata: Metadata = {
  title: "Unsaid",
  description: "Anonymous Q&A with polls and reactions",
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
            <PageTransition>{props.children}</PageTransition>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
