import { redirect } from "next/navigation";
import { getServerAuthContext } from "@/services/authServerService";

export default async function LoginLayout({ children }) {
  const { user, profile } = await getServerAuthContext();

  if (user) {
    if (profile?.role === "waiter") {
      redirect("/waiter/dashboard");
    } else if (profile?.role === "chef") {
      redirect("/chef/dashboard");
    } else if (profile?.role === "cashier") {
      redirect("/cashier/dashboard");
    }
  }

  return <>{children}</>;
}
