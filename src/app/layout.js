import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { RestaurantProvider } from "@/app/hooks/useRestaurantData";

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
  manifest: "/manifest.json",
  icons: {
    icon: "/logo-web.png",
    apple: "/logo-web.png",
  },
  openGraph: {
    title: "Menu 3D",
    description: "Pro Digital 3D Menu",
    images: [
      {
        url: "/logo-web.png",
        width: 800,
        height: 600,
        alt: "Menu 3D Logo",
      },
    ],
    locale: "en_US",
    type: "website",
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
        <RestaurantProvider>
        {children}
        </RestaurantProvider>

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
