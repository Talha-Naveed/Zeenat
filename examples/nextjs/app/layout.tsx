import { Zeenat } from "zeenat";
import type { ReactNode } from "react";
import "./globals.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Zeenat preset="bunting" flag="pakistan" orientation="vertical" />
        {children}
      </body>
    </html>
  );
}
