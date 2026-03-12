"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getRestaurantByOwnerId } from "@/services/restaurantService";
import {
  getCurrentUser,
  getCurrentUserProfile,
  signInWithPassword,
  signOutLocal,
} from "@/services/authService";
import toast from "react-hot-toast";
import {
  RiMailLine,
  RiLock2Line,
  RiArrowRightLine,
  RiEyeLine,
  RiEyeOffLine,
  RiUserStarLine,
  RiHome4Line,
} from "react-icons/ri";
import { BiDish } from "react-icons/bi";
import { FaCashRegister } from "react-icons/fa6";
import Link from "next/link";
import { PiChefHat } from "react-icons/pi";
import Loader from "@/components/ui/Loader";
import SegmentedControl from "@/app/cashier/_components/SegmentedControl";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState(() =>
    ["owner", "cashier", "waiter", "chef"].includes(roleParam)
      ? roleParam
      : "owner",
  );
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleRoleChange = useCallback(
    (newRole) => {
      setRole(newRole);
      const params = new URLSearchParams(searchParams.toString());
      params.set("role", newRole);
      router.replace(`/login?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      const checkExistingSession = async () => {
        const user = await getCurrentUser();
        if (!user) return;
        const profile = await getCurrentUserProfile(user.id);
        if (!profile) return;

        // Owner can access any panel; staff can only go to their own
        const roleRoutes = {
          owner: "/admin/dashboard",
          cashier: "/cashier/dashboard",
          waiter: "/waiter/dashboard",
          chef: "/chef/dashboard",
        };

        if (profile.role === "owner") {
          const target = roleParam || "owner";
          router.replace(roleRoutes[target] || "/admin/dashboard");
        } else {
          router.replace(roleRoutes[profile.role] || "/login");
        }
      };
      checkExistingSession();
    }
  }, [router, roleParam]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const authData = await signInWithPassword(
        formData.email,
        formData.password,
      );
      const profile = await getCurrentUserProfile(authData.user.id);
      if (!profile) throw new Error("Profile access denied.");

      if (profile.role !== "owner") {
        if (profile.role === "waiter" && role !== "waiter") {
          throw new Error("Please log in using the Waiter tab.");
        }

        if (profile.role === "cashier" && role !== "cashier") {
          throw new Error("Please log in using the Cashier tab.");
        }

        if (profile.role === "chef" && role !== "chef") {
          throw new Error("Please log in using the Chef tab.");
        }
      }

      toast.success(`Welcome back, ${role}!`);

      let destination = "/admin/dashboard";
      if (role === "owner") {
        const restaurant = await getRestaurantByOwnerId(authData.user.id);
        destination = restaurant ? "/admin/dashboard" : "/admin/onboarding";
      } else if (role === "cashier") {
        destination = "/cashier/dashboard";
      } else if (role === "waiter") {
        destination = "/waiter/dashboard";
      } else if (role === "chef") {
        destination = "/chef/dashboard";
      }

      router.replace(destination);
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Login failed");
      await signOutLocal();
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh w-full bg-dark-900 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-blue-500/5 rounded-full blur-[80px]" />
      </div>

      <div className="absolute top-6 right-6 z-50">
        <Link
          href="/"
          className="flex items-center justify-center p-2 bg-dark-800/80 backdrop-blur-md hover:bg-dark-700 rounded-2xl border border-gray-800 text-gray-400 hover:text-white transition-all shadow-lg active:scale-95"
          title="Back to Home"
        >
          <RiHome4Line size={18} />
        </Link>
      </div>

      {/* Content Container with Blur transition */}
      <div
        className={`w-full max-w-sm z-10 flex flex-col gap-8 transition-all duration-1000 animate-fade-in-up ${loading ? "blur-sm opacity-50 pointer-events-none" : ""}`}
      >
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-dark-800 border border-gray-800 shadow-2xl shadow-black/50 mb-2 animate-float">
            <Image
              src="/logo-web.png"
              alt="logo"
              width={100}
              height={100}
              priority
            />
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
          <p className="text-[10px] text-gray-500/60 font-bold tracking-widest mb-3 ml-1">
            Select Role :
          </p>
          <SegmentedControl
            fullWidth
            active={role}
            onChange={handleRoleChange}
            options={[
              {
                value: "owner",
                label: (
                  <div className="flex items-center justify-center gap-1 md:gap-2">
                    <RiUserStarLine
                      size={20}
                      className="md:w-[18px] md:h-[18px]"
                    />{" "}
                    <span className="text-[10px] md:text-sm font-bold">
                      Manager
                    </span>
                  </div>
                ),
              },
              {
                value: "cashier",
                label: (
                  <div className="flex items-center justify-center gap-1 md:gap-2">
                    <FaCashRegister
                      size={16}
                      className="md:w-[18px] md:h-[18px]"
                    />{" "}
                    <span className="text-[10px] md:text-sm font-bold">
                      Cashier
                    </span>
                  </div>
                ),
              },
              {
                value: "waiter",
                label: (
                  <div className="flex items-center justify-center gap-1 md:gap-2">
                    <BiDish size={16} className="md:w-[18px] md:h-[18px]" />{" "}
                    <span className="text-[10px] md:text-sm font-bold">
                      Waiter
                    </span>
                  </div>
                ),
              },
              {
                value: "chef",
                label: (
                  <div className="flex items-center justify-center gap-1 md:gap-2">
                    <PiChefHat size={16} className="md:w-[18px] md:h-[18px]" />{" "}
                    <span className="text-[10px] md:text-sm font-bold">
                      Chef
                    </span>
                  </div>
                ),
              },
            ]}
          />
        </div>

        {/* Login Card */}
        <div className="bg-dark-800 border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/40">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label
                  htmlFor="email"
                  className="text-xs font-bold text-gray-400 uppercase tracking-wider"
                >
                  Email
                </label>
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-4 text-gray-500 group-focus-within:text-primary transition-colors">
                  <RiMailLine size={20} />
                </div>
                <input
                  id="email"
                  name="email"
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
                <label
                  htmlFor="password"
                  className="text-xs font-bold text-gray-400 uppercase tracking-wider"
                >
                  Password
                </label>
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-4 text-gray-500 group-focus-within:text-primary transition-colors">
                  <RiLock2Line size={20} />
                </div>
                <input
                  id="password"
                  name="password"
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
