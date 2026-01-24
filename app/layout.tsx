import "./globals.css";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { AuthProvider } from "../components/auth/auth-provider";
import { ThemeProvider } from "../components/theme/theme-provider";
import { ThemeToggle } from "../components/theme/theme-toggle";

export const metadata = {
  title: "Unsaid",
  description: "Anonymous Q&A with polls and reactions"
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
          <AuthProvider>{props.children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
