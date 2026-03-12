import { redirect } from "next/navigation";
import { getServerAuthContext } from "@/services/authServerService";
import ChefLayoutClient from "./ChefLayoutClient";

export const metadata = {
  title: "Menu 3D — Chef",
  applicationName: "Kitchen",
  manifest: "/manifests/chef.json",
  appleWebApp: {
    capable: true,
    title: "Kitchen",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/chef-icon.jpeg",
    apple: "/chef-icon.jpeg",
  },
};

export const viewport = {
  themeColor: "#1f1d2b",
};
export default async function chefLayout({ children }) {
  const { profile } = await getServerAuthContext();

  if (!profile || (profile.role !== "chef" && profile.role !== "owner")) {
    redirect("/login?role=chef");
  }

  return (
    <>
      <style>{`
        body { background-color: #1f1d2b !important; }
      `}</style>
      <ChefLayoutClient>{children}</ChefLayoutClient>
    </>
  );
}
