"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getRestaurantByOwnerId } from "@/services/restaurantService";
import { getUserProfile } from "@/services/userService";
import toast from "react-hot-toast";
import {
  RiMailLine,
  RiLock2Line,
  RiArrowRightLine,
  RiEyeLine,
  RiEyeOffLine,
  RiUserStarLine,
  RiServiceLine,
  RiMoneyDollarCircleLine,
} from "react-icons/ri";
import { PiChefHat } from "react-icons/pi";
import Loader from "@/components/ui/Loader";
import SegmentedControl from "@/app/cashier/_components/SegmentedControl";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("owner");
  const [formData, setFormData] = useState({ email: "", password: "" });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const roleParam = params.get("role");
      if (roleParam && ["owner", "cashier", "waiter", "chef"].includes(roleParam)) {
        setRole(roleParam);
      }
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Authenticate with Email/Password
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

      if (authError) throw authError;

      // 2. Fetch User Profile to check Role
      const profile = await getUserProfile(supabase, authData.user.id);

      if (!profile) throw new Error("Profile access denied.");

      // 3. Role Enforcement
      // 3. Role Enforcement (Owners have master access)
      if (profile.role !== "owner") {
            if (profile.role === "waiter" && role !== "waiter") {
                throw new Error("Please log in using the Waiter tab.")
            } 

            if (profile.role === "cashier" && role !== "cashier") {
                throw new Error("Please log in using the Cashier tab.")
            } 
            
            if (profile.role === "chef" && role !== "chef") {
                throw new Error("Please log in using the Chef tab.")
            }
      }
      // If owner, we allow them to proceed with ANY selected role. 


      toast.success(`Welcome back, ${role}!`);
      if (role === "owner") {
        const restaurant = await getRestaurantByOwnerId(authData.user.id);
        router.push(restaurant ? "/admin/dashboard" : "/admin/onboarding");
      } else if (role === "cashier") {
        router.push("/cashier/dashboard");
      } else if (role === "waiter") {
        router.push("/waiter/dashboard");
      } else if (role === "chef") {
        router.push("/chef/dashboard");
      }

      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Login failed");
      await supabase.auth.signOut({ scope: 'local' }) 
      setLoading(false); 
    } 
  };

  return (
    <div className="min-h-[100dvh] w-full bg-dark-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-blue-500/5 rounded-full blur-[80px]" />
      </div>

      {/* Content Container with Blur transition */}
      <div className={`w-full max-w-sm z-10 flex flex-col gap-8 transition-all duration-1000 ${loading ? 'blur-sm opacity-50 pointer-events-none' : ''}`}>
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-dark-800 border border-gray-800 shadow-2xl shadow-black/50 mb-2">
          <img src="logo-web.png" alt="logo" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Welcome
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Select your role to continue
            </p>
          </div>
        </div>

        {/* Role Tabs */}
        <div className="w-full">
            <p className="text-[10px] text-gray-500/60 font-bold tracking-widest mb-3 ml-1">Select Role :</p>
            <SegmentedControl
                fullWidth
                active={role}
                onChange={setRole}
                options={[
                    { value: "owner", label: <div className="flex items-center justify-center gap-1 md:gap-2"><RiUserStarLine size={16} className="md:w-[18px] md:h-[18px]" /> <span className="text-[10px] md:text-sm font-bold">Manager</span></div> },
                    { value: "cashier", label: <div className="flex items-center justify-center gap-1 md:gap-2"><RiMoneyDollarCircleLine size={16} className="md:w-[18px] md:h-[18px]" /> <span className="text-[10px] md:text-sm font-bold">Cashier</span></div> },
                    { value: "waiter", label: <div className="flex items-center justify-center gap-1 md:gap-2"><RiServiceLine size={16} className="md:w-[18px] md:h-[18px]" /> <span className="text-[10px] md:text-sm font-bold">Waiter</span></div> },
                    { value: "chef", label: <div className="flex items-center justify-center gap-1 md:gap-2"><PiChefHat size={16} className="md:w-[18px] md:h-[18px]" /> <span className="text-[10px] md:text-sm font-bold">Chef</span></div> },
                ]}
            />
        </div>

        {/* Login Card */}
        <div className="bg-dark-800 border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/40">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Email
                </label>
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-4 text-gray-500 group-focus-within:text-primary transition-colors">
                  <RiMailLine size={20} />
                </div>
                <input
                  type="email"
                  required
                  className="w-full bg-dark-900 border border-gray-700 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all font-medium"
                  placeholder={
                    role === "owner"
                      ? "admin@example.com"
                      : role === "cashier"
                      ? "cashier@example.com"
                      : role === "waiter"
                      ? "waiter@example.com"
                      : "chef@example.com"  
                  }
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            </div>

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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary border-2 border-gray-500 hover:bg-accent/40 text-white font-bold text-lg py-4 rounded-2xl shadow-lg shadow-primary/30 transition-all active:scale-95 flex items-center justify-center gap-3 mt-4 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
            >
              {loading
                ? "Verifying..."
                : `Enter as ${
                    role === "owner"
                      ? "Manager"
                      : role === "cashier"  
                      ? "Cashier"
                      : role === "chef"
                      ? "Chef"
                      : "Waiter"
                  }`}
              <RiArrowRightLine className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        </div>

        <p className="text-center text-gray-600 text-xs">
          © 2026 Digital Menu. System v1.0
        </p>
      </div>

      <Loader active={loading} />
    </div>
  );
}
