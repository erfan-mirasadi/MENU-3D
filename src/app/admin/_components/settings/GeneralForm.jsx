"use client";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { useRestaurantData } from "@/app/hooks/useRestaurantData"; 
import toast from "react-hot-toast";
import { RiCloseLine, RiUploadCloud2Line } from "react-icons/ri";
import Loader from "@/components/ui/Loader";

export default function GeneralForm() {
  const { restaurant, loading: contextLoading, refetch } = useRestaurantData(); 
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    wifi_pass: "",
    instagram: "",
    website: "",
    logo: "",
    bg_image: "",
  });

  // State for upload progress
  const [logoUploading, setLogoUploading] = useState(false);
  const [bgUploading, setBgUploading] = useState(false);

  const logoInputRef = useRef(null);
  const bgInputRef = useRef(null);

  useEffect(() => {
    if (restaurant) {
      setFormData({
        name: restaurant.name || "",
        slug: restaurant.slug || "",
        wifi_pass: restaurant.wifi_pass || "",
        instagram: restaurant.social_links?.instagram || "",
        website: restaurant.social_links?.website || "",
        logo: restaurant.logo || "",
        bg_image: restaurant.bg_image || "",
      });
    }
  }, [restaurant]);

  const handleUpload = async (file, field) => {
    // 1. Validate
    if (!file) return;
    const isLogo = field === "logo";
    
    // Size check (2MB for logo, 5MB for bg)
    const maxSize = isLogo ? 2 : 5;
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`File too large. Max ${maxSize}MB.`);
      return;
    }

    if (!formData.slug) {
      toast.error("Restaurant slug is undefined. Cannot upload.");
      return;
    }

    // Set loading state
    if (isLogo) setLogoUploading(true);
    else setBgUploading(true);

    try {
      // 2. Get Presigned URL
      const subfolderName = isLogo ? "logo" : "background";
      
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          restaurantSlug: formData.slug,
          subfolder: subfolderName,
        }),
      });

      if (!res.ok) throw new Error("Failed to get upload URL");
      const { uploadUrl, publicUrl } = await res.json();

      // 3. Upload to R2
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl, true);
      xhr.setRequestHeader("Content-Type", file.type);
      
      xhr.onload = () => {
        if (xhr.status === 200) {
          setFormData(prev => ({ ...prev, [field]: publicUrl }));
          toast.success("Image uploaded!");
        } else {
          toast.error("Upload failed.");
        }
        if (isLogo) setLogoUploading(false);
        else setBgUploading(false);
      };

      xhr.onerror = () => {
        toast.error("Upload error.");
        if (isLogo) setLogoUploading(false);
        else setBgUploading(false);
      };

      xhr.send(file);

    } catch (err) {
      console.error(err);
      toast.error("Error starting upload.");
      if (isLogo) setLogoUploading(false);
      else setBgUploading(false);
    }
  };

  const handleRemoveImage = (field) => {
    setFormData(prev => ({ ...prev, [field]: "" }));
  };

  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();

    if (!restaurant?.owner_id) {
      toast.error("User not authenticated.");
      return;
    }

    setSaving(true);

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
          logo: formData.logo,
          bg_image: formData.bg_image,
        })
        .eq("owner_id", restaurant?.owner_id);

      if (error) reject(error);
      else resolve();
    });

    toast.promise(savePromise, {
      loading: "Updating restaurant info...",
      success: "Changes saved successfully!",
      error: "Error updating information.",
    })
    .then(() => {
        refetch(restaurant.id); // Update global context
    })
    .finally(() => setSaving(false));
  };

  if (contextLoading) return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-dark-900/50 backdrop-blur-sm">
      <Loader />
    </div>
  );

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {/* Images Section */}
      <div className="flex gap-6 items-end">
        
        {/* LOGO UPLOAD */}
        <div className="relative group">
           <div 
             onClick={() => logoInputRef.current?.click()}
             className={`
               w-24 h-24 rounded-full overflow-hidden shrink-0 cursor-pointer relative transition-all
               ${formData.logo ? 'border-4 border-dark-800' : 'border-2 border-dashed border-gray-600 hover:border-primary hover:bg-dark-800'}
             `}
           >
             {formData.logo ? (
                <Image
                  src={formData.logo}
                  alt="Restaurant Logo"
                  fill
                  className="object-cover"
                  sizes="96px"
                />
             ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-xs text-gray-500 gap-1">
                  {logoUploading ? (
                    <Loader variant="inline" className="w-5 h-5 text-gray-500" />
                  ) : (
                    <>
                      <RiUploadCloud2Line className="text-xl" />
                      <span>Logo</span>
                    </>
                  )}
                </div>
             )}
             
             {/* Upload Overlay on Hover (if image exists) */}
             {formData.logo && !logoUploading && (
               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <RiUploadCloud2Line className="text-white text-xl" />
               </div>
             )}
           </div>
           
           {/* Remove Button */}
           {formData.logo && (
             <button
               type="button"
               onClick={() => handleRemoveImage('logo')}
               className="absolute -top-1 -right-1 bg-gray-700 text-gray-300 p-1 rounded-full shadow-lg hover:bg-gray-600 hover:text-white transition-transform hover:scale-110 border border-gray-600"
             >
               <RiCloseLine size={14} />
             </button>
           )}

           <input 
             ref={logoInputRef}
             type="file" 
             accept="image/png, image/jpeg, image/webp"
             className="hidden"
             onChange={(e) => handleUpload(e.target.files[0], 'logo')}
           />
        </div>

        {/* COVER IMAGE UPLOAD */}
        <div className="flex-1 relative group">
          <label className="block text-sm font-medium mb-2 text-gray-400">
            Cover Image
          </label>
          
          <div 
            onClick={() => bgInputRef.current?.click()}
            className={`
               h-24 w-full rounded-xl overflow-hidden relative border transition-colors cursor-pointer
               ${formData.bg_image ? 'border-gray-700 bg-gray-800' : 'border-dashed border-gray-600 hover:border-primary hover:bg-dark-800'}
            `}
          >
            {formData.bg_image ? (
              <Image
                src={formData.bg_image}
                alt="Cover Background"
                fill
                className="object-cover opacity-60 group-hover:opacity-40 transition-opacity"
                sizes="(max-width: 768px) 100vw, 700px"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-xs text-gray-500 gap-2">
                 {bgUploading ? (
                    <Loader variant="inline" className="w-6 h-6 text-gray-500" />
                 ) : (
                    <>
                       <RiUploadCloud2Line className="text-2xl" />
                       <span>Upload Cover Image (Max 5MB)</span>
                    </>
                 )}
              </div>
            )}

             {/* Upload Overlay on Hover (if image exists) */}
             {formData.bg_image && !bgUploading && (
               <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-black/50 px-3 py-1 rounded-full text-white text-xs flex items-center gap-2">
                     <RiUploadCloud2Line /> Change Cover
                  </div>
               </div>
             )}
          </div>

          {/* Remove Button */}
          {formData.bg_image && (
             <button
               type="button"
               onClick={() => handleRemoveImage('bg_image')}
               className="absolute top-2 right-2 bg-gray-700/80 backdrop-blur-sm text-gray-300 p-1.5 rounded-full shadow-lg hover:bg-gray-600 hover:text-white transition-transform hover:scale-110 z-10 border border-gray-600"
             >
               <RiCloseLine size={16} />
             </button>
           )}

          <input 
             ref={bgInputRef}
             type="file" 
             accept="image/png, image/jpeg, image/webp"
             className="hidden"
             onChange={(e) => handleUpload(e.target.files[0], 'bg_image')}
           />
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
          disabled={saving}
          className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-orange-600 transition shadow-lg shadow-primary/20 active:scale-95 border-2 border-gray-500 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {saving ? <Loader variant="inline" className="w-5 h-5 text-white" /> : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
