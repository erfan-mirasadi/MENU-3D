import { redirect } from "next/navigation";
import WaiterLayoutClient from "./WaiterLayoutClient";
import { getServerAuthContext } from "@/services/authServerService";

export const metadata = {
  title: "Menu 3D — Waiter",
  applicationName: "Waiter",
  manifest: "/manifests/waiter.json",
  appleWebApp: {
    capable: true,
    title: "Waiter",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/waiter-icon.jpeg",
    apple: "/waiter-icon.jpeg",
  },
};

export const viewport = {
  themeColor: "#1f1d2b",
};

export default async function WaiterLayout({ children }) {
  const { profile } = await getServerAuthContext();

  if (!profile || (profile.role !== "waiter" && profile.role !== "owner")) {
    redirect("/login?role=waiter");
  }

  return (
    <>
      <style>{`
        body { background-color: #1f1d2b !important; }
      `}</style>
      <WaiterLayoutClient>{children}</WaiterLayoutClient>
    </>
  );
}
