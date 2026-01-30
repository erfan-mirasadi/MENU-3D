"use client";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { RiLogoutBoxLine } from "react-icons/ri";
import toast from "react-hot-toast";

export default function ChefLayoutClient({ children }) {
  const router = useRouter();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        toast.error("Logout failed");
    } else {
        router.push("/login");
    }
  };

  return (
    <div className="relative w-full h-[100dvh] bg-dark-900 text-text-light font-sans overflow-hidden">
      {/* Main Content */}
      <div className="w-full h-full">
          {children}
      </div>

      {/* Floating Logout Button */}
      <button
        onClick={handleLogout}
        className="fixed bottom-6 right-6 p-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl border border-red-500/20 transition-all duration-300 shadow-xl z-50 flex items-center group backdrop-blur-sm cursor-pointer"
        title="Logout"
      >
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 text-sm font-bold whitespace-nowrap opacity-0 group-hover:opacity-100">
            Exit
        </span>
        <RiLogoutBoxLine size={20} className="group-hover:ml-2 transition-all duration-300" />
      </button>
    </div>
  );
}
