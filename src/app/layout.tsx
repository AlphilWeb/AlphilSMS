import "./globals.css";
import { QueryProvider } from "./providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
      >
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
