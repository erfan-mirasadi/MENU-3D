"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { RiLogoutBoxRLine } from "react-icons/ri";
import GeneralForm from "@/app/admin/_components/settings/GeneralForm";
import LanguageSettings from "@/app/admin/_components/settings/LanguageSettings";
import FeatureSettings from "@/app/admin/_components/settings/FeatureSettings";
import Loader from "@/components/ui/Loader";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // --- Logout Function ---
  const handleLogout = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast.success("Logged out successfully");
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout Error:", error);
      toast.error("Failed to log out");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-dark-900 text-white overflow-hidden">
      {/* Header */}
      <div className="p-8 pb-6 border-b border-gray-800">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-text-dim text-sm mt-1">
          Manage restaurant details and languages
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 pb-20">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* 1. General Info */}
          <section>
            <GeneralForm />
          </section>

          {/* Divider */}
          <div className="border-t border-gray-800" />

          {/* 2. Languages */}
          <section>
            <LanguageSettings />
          </section>

          {/* Divider */}
          <div className="border-t border-gray-800" />

          {/* 3. Features */}
          <section>
            <FeatureSettings />
          </section>

          {/* Divider */}
          <div className="border-t border-gray-800" />

          {/* 3. LOGOUT ZONE (Big Red Button) */}
          <section className="pt-4 pb-12">
            <button
              onClick={handleLogout}
              disabled={loading}
              className="w-full group relative flex items-center justify-center gap-3 py-5 rounded-2xl border border-red-500/30 bg-red-500/5 text-red-500 font-bold text-lg transition-all hover:bg-red-600 hover:text-white hover:shadow-xl hover:shadow-red-600/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader variant="inline" className="w-6 h-6 text-red-500" />
              ) : (
                <>
                  <RiLogoutBoxRLine
                    size={24}
                    className="group-hover:scale-110 transition-transform"
                  />
                  Log Out
                </>
              )}
            </button>

            <p className="text-center text-gray-600 text-xs mt-4">
              You will be redirected to the login screen.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
