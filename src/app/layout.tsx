import "./globals.css";

export const metadata = { title: "CareerGPT", description: "AI-powered career guidance for students" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100">{children}</body>
    </html>
  );
}

