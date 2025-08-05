import "./globals.css";
import {
  ClerkProvider,
} from '@clerk/nextjs'
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { shadesOfPurple } from "@clerk/themes";
import { ConvexClientProvider } from "./ConvexClientProvider";

// Only import in client side
const projectName = process.env.NEXT_PUBLIC_PROJECT_NAME;
const peojectDescription = process.env.NEXT_PUBLIC_PROJECT_DESCRIPTION;

export const metadata = {
  title: projectName,
  description: peojectDescription,
};

import ClientUserSync from "@/components/ClientUserSync";
export default function RootLayout({ children }) {
  return (

    <html lang="en" suppressHydrationWarning={true}>
      <head>
        <link rel="icon" href="/logo-text.png" sizes="any" />
      </head>
      <body >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <ClerkProvider
            publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
            appearance={{
              baseTheme: shadesOfPurple
            }}
          >
            <ConvexClientProvider>
              <ClientUserSync />
              <main className="bg-slate-900 min-h-screen text-white overflow-x-hidden">
                <Toaster richColors />
                {children}
              </main>
            </ConvexClientProvider>
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
