export const metadata = {
  title: "Don't be a pussy",
  description: "Fat loss tracker",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
