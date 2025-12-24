"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

export default function GeneralForm() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    wifi_pass: "",
    instagram: "", // Stored in social_links JSON
    website: "", // Stored in social_links JSON
    logo: "", // Read-only for now
    bg_image: "", // Read-only for now
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        setUserId(user.id);

        const { data, error } = await supabase
          .from("restaurants")
          .select("*")
          .eq("owner_id", user.id)
          .single();

        if (data) {
          setFormData({
            name: data.name || "",
            slug: data.slug || "",
            wifi_pass: data.wifi_pass || "",
            instagram: data.social_links?.instagram || "",
            website: data.social_links?.website || "",
            logo: data.logo || "",
            bg_image: data.bg_image || "",
          });
        }
      } catch (error) {
        console.error("Error fetching general info:", error);
        toast.error("Failed to load restaurant info.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);
  const handleSave = async (e) => {
    e.preventDefault();

    if (!userId) {
      toast.error("User not authenticated.");
      return;
    }

    const savePromise = new Promise(async (resolve, reject) => {
      const socialJson = {
        instagram: formData.instagram,
        website: formData.website,
      };

      const { error } = await supabase
        .from("restaurants")
        .update({
          name: formData.name,
          slug: formData.slug,
          wifi_pass: formData.wifi_pass,
          social_links: socialJson,
        })
        .eq("owner_id", userId);

      if (error) reject(error);
      else resolve();
    });

    toast.promise(savePromise, {
      loading: "Updating restaurant info...",
      success: "Changes saved successfully!",
      error: "Error updating information.",
    });
  };

  if (loading) return <div className="text-white">Loading settings...</div>;

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {/* Images Section (Read-Only Preview) */}
      <div className="flex gap-6 items-end">
        {/* Logo Preview */}
        <div className="relative w-24 h-24 rounded-full border-4 border-dark-800 overflow-hidden bg-gray-800 shrink-0">
          {formData.logo ? (
            <Image
              src={formData.logo}
              alt="Restaurant Logo"
              fill
              className="object-cover"
              sizes="96px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
              No Logo
            </div>
          )}
        </div>

        {/* Cover Image Preview */}
        <div className="flex-1">
          <label className="block text-sm font-medium mb-2 text-gray-400">
            Cover Image Preview
          </label>
          <div className="h-24 w-full rounded-xl bg-gray-800 overflow-hidden relative border border-gray-700">
            {formData.bg_image && (
              <Image
                src={formData.bg_image}
                alt="Cover Background"
                fill
                className="object-cover opacity-50"
                sizes="(max-width: 768px) 100vw, 700px"
              />
            )}
            <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500 z-10">
              Image upload coming soon
            </div>
          </div>
        </div>
      </div>

      {/* Basic Information Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-300">
            Restaurant Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-dark-800 border border-gray-700 rounded-xl p-3 text-white focus:border-primary focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-300">
            URL Slug
          </label>
          <div className="flex items-center bg-dark-800 border border-gray-700 rounded-xl px-3 focus-within:border-primary transition-colors">
            <span className="text-gray-500 text-sm">app/</span>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) =>
                setFormData({ ...formData, slug: e.target.value })
              }
              className="w-full bg-transparent p-3 text-white focus:outline-none"
            />
          </div>
        </div>
      </div>

      <hr className="border-gray-800" />

      {/* WiFi and Social Media Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-300">
            WiFi Password
          </label>
          <input
            type="text"
            value={formData.wifi_pass}
            onChange={(e) =>
              setFormData({ ...formData, wifi_pass: e.target.value })
            }
            className="w-full bg-dark-800 border border-gray-700 rounded-xl p-3 text-white focus:border-primary focus:outline-none transition-colors"
            placeholder="No WiFi set"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-300">
            Instagram ID
          </label>
          <div className="flex items-center bg-dark-800 border border-gray-700 rounded-xl px-3 focus-within:border-primary transition-colors">
            <span className="text-gray-500 text-sm">@</span>
            <input
              type="text"
              value={formData.instagram}
              onChange={(e) =>
                setFormData({ ...formData, instagram: e.target.value })
              }
              className="w-full bg-transparent p-3 text-white focus:outline-none"
              placeholder="username"
            />
          </div>
        </div>

        {/* Website Field */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-300">
            Website URL
          </label>
          <div className="flex items-center bg-dark-800 border border-gray-700 rounded-xl px-3 focus-within:border-primary transition-colors">
            <span className="text-gray-500 text-sm">🌐</span>
            <input
              type="url"
              value={formData.website}
              onChange={(e) =>
                setFormData({ ...formData, website: e.target.value })
              }
              className="w-full bg-transparent p-3 text-white focus:outline-none"
              placeholder="https://example.com"
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-4">
        <button
          type="submit"
          className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-orange-600 transition shadow-lg shadow-primary/20 active:scale-95"
        >
          Save Changes
        </button>
      </div>
    </form>
  );
}
