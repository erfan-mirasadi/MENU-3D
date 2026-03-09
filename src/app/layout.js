import "./globals.css";
import { Geist, Geist_Mono, Gulzar } from "next/font/google";
import { Toaster } from "react-hot-toast";
import RestaurantProvider from "@/app/hooks/useRestaurantData";
import { LanguageProvider } from "@/context/LanguageContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  preload: false,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false,
});

const gulzarFont = Gulzar({
  weight: "400",
  subsets: ["arabic"],
  variable: "--font-gulzar",
  display: "swap",
  preload: false,
});

export const metadata = {
  title: "Menu 3D",
  description: "Pro Digital 3D Menu",
  applicationName: "Menu 3D",
  appleWebApp: {
    capable: true,
    title: "Menu 3D",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
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
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1f1d2b",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning={true}
        className={`${geistSans.variable} ${geistMono.variable} ${gulzarFont.variable} antialiased bg-dark-900 text-white`}
      >
        <RestaurantProvider>
          <LanguageProvider>{children}</LanguageProvider>
        </RestaurantProvider>

        <Toaster
          position="bottom-center"
          reverseOrder={false}
          toastOptions={{
            duration: 4000,
            style: {
              background: "#252836",
              color: "#fff",
              border: "1px solid #2d303e",
              padding: "16px",
              borderRadius: "12px",
            },
            success: {
              iconTheme: {
                primary: "#10B981",
                secondary: "#fff",
              },
            },
            error: {
              iconTheme: {
                primary: "#EF4444",
                secondary: "#fff",
              },
            },
          }}
        />
      </body>
    </html>
  );
}
