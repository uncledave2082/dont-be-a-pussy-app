export const metadata = {
  title: "Locked In",
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
