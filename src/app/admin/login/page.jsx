"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import {
  RiRestaurant2Fill,
  RiMailLine,
  RiLock2Line,
  RiArrowRightLine,
  RiEyeLine,
  RiEyeOffLine,
} from "react-icons/ri";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. اول لاگین کن
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      // 2. حالا سریع چک کن ببین رستوران داره یا نه؟
      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("id") // فقط آیدی رو بگیر که سبک باشه
        .eq("owner_id", user.id)
        .maybeSingle();

      toast.success("Welcome back!");

      // 3. تصمیم‌گیری هوشمند برای ریدارکت
      if (restaurant) {
        // اگه رستوران داشت -> داشبورد
        router.push("/admin/dashboard");
      } else {
        // اگه نداشت -> آنبوردینگ
        router.push("/admin/onboarding");
      }

      // 4. رفرش برای اینکه هدرهای سرور آپدیت بشن
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-dark-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Ambience (Subtle) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-blue-500/5 rounded-full blur-[80px]" />
      </div>

      <div className="w-full max-w-sm z-10 flex flex-col gap-8">
        {/* 1. Header & Logo */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-dark-800 border border-gray-800 shadow-2xl shadow-black/50 mb-2">
            <RiRestaurant2Fill className="text-primary text-4xl drop-shadow-md" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Welcome
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Manage your restaurant efficiently
            </p>
          </div>
        </div>

        {/* 2. Main Login Card */}
        <div className="bg-dark-800 border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/40">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
                Email
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-4 text-gray-500 group-focus-within:text-primary transition-colors">
                  <RiMailLine size={20} />
                </div>
                <input
                  type="email"
                  required
                  className="w-full bg-dark-900 border border-gray-700 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all font-medium"
                  placeholder="admin@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-4 text-gray-500 group-focus-within:text-primary transition-colors">
                  <RiLock2Line size={20} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full bg-dark-900 border border-gray-700 rounded-2xl py-4 pl-12 pr-12 text-white placeholder-gray-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all font-medium"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-4 text-gray-500 hover:text-white transition-colors p-1"
                >
                  {showPassword ? (
                    <RiEyeOffLine size={20} />
                  ) : (
                    <RiEyeLine size={20} />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button - HIGH VISIBILITY */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary border-2 border-gray-500 hover:bg-orange-600 text-white font-bold text-lg py-4 rounded-2xl shadow-lg shadow-primary/30 transition-all active:scale-95 flex items-center justify-center gap-3 mt-4 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {loading ? (
                "Signing in..."
              ) : (
                <>
                  Sign In
                  <RiArrowRightLine className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 text-xs">
          © 2025 Digital Menu. System v1.0
        </p>
      </div>
    </div>
  );
}
