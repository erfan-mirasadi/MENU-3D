import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Menu 3D",
  description: "Pro Digital 3D Menu ",
  icons: {
    icon: "/logo-web.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>

      </head>
      <body
        suppressHydrationWarning={true}
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white`}
      >
        {children}

        {/* Global Toast Notification Component */}
        <Toaster
          position="bottom-center"
          reverseOrder={false}
          toastOptions={{
            duration: 4000,
            style: {
              background: "#252836", // Matches dark-800
              color: "#fff",
              border: "1px solid #2d303e",
              padding: "16px",
              borderRadius: "12px",
            },
            success: {
              iconTheme: {
                primary: "#10B981", // Modern emerald green
                secondary: "#fff",
              },
            },
            error: {
              iconTheme: {
                primary: "#EF4444", // Red for errors
                secondary: "#fff",
              },
            },
          }}
        />
      </body>
    </html>
  );
}
