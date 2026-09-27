// Adapt into app/layout.tsx; keep existing providers, metadata, fonts, and markup.
import type { ReactNode } from "react";
import { Zeenat } from "zeenat";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Zeenat
          preset="bunting"
          flag="PK"
          navbar="auto"
          intensity="low"
          activeFrom="2027-08-12T00:00:00+05:00"
          activeUntil="2027-08-16T00:00:00+05:00"
        />
        {children}
      </body>
    </html>
  );
}
