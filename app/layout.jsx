export const metadata = {
  title: "Open Noillirk — The Common Answer Climb",
  description: "Seven prompts. Fifteen seconds each. Guess what the crowd would say and climb higher.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/style.css" />
        <link rel="preload" href="/assets/vt323-latin-400-normal.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="icon" href="/assets/favicon.png" type="image/png" />
      </head>
      <body data-phase="intro">{children}</body>
    </html>
  );
}
