import { redirect } from "next/navigation";
import { getServerAuthContext } from "@/services/authServerService";
import CashierLayoutClient from "./CashierLayoutClient";

export const metadata = {
  title: "Menu 3D — Cashier",
  applicationName: "Cashier",
  manifest: "/manifests/cashier.json",
  appleWebApp: {
    capable: true,
    title: "Cashier",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/cashier-icon.jpeg",
    apple: "/cashier-icon.jpeg",
  },
};

export const viewport = {
  themeColor: "#1f1d2b",
};

export default async function CashierLayout({ children }) {
  const { profile } = await getServerAuthContext();

  if (!profile || (profile.role !== "cashier" && profile.role !== "owner")) {
    redirect("/login?role=cashier");
  }

  return (
    <>
      <style>{`
        body { background-color: #1f1d2b !important; }
      `}</style>
      <CashierLayoutClient>{children}</CashierLayoutClient>
    </>
  );
}
