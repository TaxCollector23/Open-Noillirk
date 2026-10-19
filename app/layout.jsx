import "./globals.css";

export const metadata = {
  title: "Open Noillirk — Guess the Most Common Answer",
  description: "An independent, open-source survey climb game.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
