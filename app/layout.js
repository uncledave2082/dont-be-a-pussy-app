export const metadata = {
  title: 'Locked In',
  description: 'Daily execution tracker',
  themeColor: '#000000',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />

        {/* iOS support */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Locked In" />

        {/* App icon */}
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
