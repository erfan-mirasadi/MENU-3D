import { redirect } from "next/navigation";

// Middleware handles / → /{lang} redirect.
export default function Home() {
  redirect("/en");
}
