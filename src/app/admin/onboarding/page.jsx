"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { RiRocketLine, RiStore2Line } from "react-icons/ri";

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
  });

  // Check if user already has a restaurant
  useEffect(() => {
    const checkExistingRestaurant = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data: restaurants } = await supabase
          .from("restaurants")
          .select("id")
          .eq("owner_id", user.id)
          .limit(1);

        if (restaurants && restaurants.length > 0) {
          router.push("/admin/dashboard");
        }
      } catch (error) {
        console.error("Error checking restaurant:", error);
      }
    };

    checkExistingRestaurant();
  }, [router]);

  //slug auto update
  const handleNameChange = (e) => {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

    setFormData({ name, slug });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { error } = await supabase.from("restaurants").insert({
        name: formData.name,
        slug: formData.slug,
        owner_id: user.id,
        is_active: true,
        supported_languages: ["tr"],
        default_language: "tr",
      });

      if (error) {
        if (error.code === "23505") {
          throw new Error(
            "This URL slug is already taken. Please choose another."
          );
        }
        throw error;
      }

      toast.success("Restaurant created! 🚀");
      router.push("/admin/dashboard");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to create restaurant");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-dark-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary/20 text-primary rounded-3xl mx-auto flex items-center justify-center mb-4 shadow-xl shadow-primary/10">
            <RiRocketLine size={40} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Let&apos;s Get Started
          </h1>
          <p className="text-gray-400">
            Tell us about your restaurant to set up your digital menu.
          </p>
        </div>

        <div className="bg-dark-800 border border-gray-700 rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 ml-1">
                Restaurant Name
              </label>
              <div className="relative">
                <div className="absolute left-4 top-3.5 text-gray-500">
                  <RiStore2Line size={20} />
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tasty Burger"
                  value={formData.name}
                  onChange={handleNameChange}
                  className="w-full bg-dark-900 border border-gray-600 rounded-xl py-3 pl-12 pr-4 text-white focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Slug Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 ml-1">
                Menu URL
              </label>
              <div className="flex items-center bg-dark-900 border border-gray-600 rounded-xl px-4 py-3 text-gray-400 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                <span className="text-sm mr-1">app.com/menu/</span>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      slug: e.target.value.toLowerCase(),
                    })
                  }
                  className="bg-transparent border-none outline-none text-white w-full placeholder-gray-600"
                  placeholder="tasty-burger"
                />
              </div>
              <p className="text-xs text-gray-500 ml-1">
                This will be your unique link.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-orange-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95 mt-4 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-gray-400"
            >
              {loading ? "Creating..." : "Create Dashboard"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
