"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase"; // کلاینت سمت کاربر
import { RiCheckLine, RiGlobalLine } from "react-icons/ri";
import toast from "react-hot-toast";

const AVAILABLE_LANGUAGES = [
  { code: "tr", name: "Türkçe", flag: "🇹🇷" },
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "fa", name: "فارسی", flag: "🇮🇷" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
];

export default function LanguageSettings() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  // State for language preferences
  const [selectedLangs, setSelectedLangs] = useState(["en"]);
  const [defaultLang, setDefaultLang] = useState("en");

  useEffect(() => {
    async function initData() {
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
          .select("supported_languages, default_language")
          .eq("owner_id", user.id)
          .single();

        if (data) {
          setSelectedLangs(data.supported_languages || ["en"]);
          setDefaultLang(data.default_language || "en");
        }
      } catch (error) {
        console.error("Error loading languages:", error);
        toast.error("Failed to load language settings.");
      } finally {
        setLoading(false);
      }
    }

    initData();
  }, []);

  const toggleLanguage = (code) => {
    if (selectedLangs.includes(code)) {
      if (code === defaultLang) {
        toast.error(
          "Cannot remove the default language. Change default first."
        );
        return;
      }
      setSelectedLangs(selectedLangs.filter((l) => l !== code));
    } else {
      setSelectedLangs([...selectedLangs, code]);
    }
  };

  const handleSave = async () => {
    if (!userId) {
      toast.error("User not identified.");
      return;
    }

    const savePromise = new Promise(async (resolve, reject) => {
      const { error } = await supabase
        .from("restaurants")
        .update({
          supported_languages: selectedLangs,
          default_language: defaultLang,
        })
        .eq("owner_id", userId);

      if (error) reject(error);
      else resolve();
    });

    toast.promise(savePromise, {
      loading: "Saving language preferences...",
      success: "Settings updated successfully!",
      error: "Could not save settings.",
    });
  };

  if (loading)
    return <div className="p-4 text-gray-400">Loading settings...</div>;

  return (
    <div className="bg-dark-800 rounded-2xl p-6 border border-gray-800">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg text-primary">
          <RiGlobalLine size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Language Support</h2>
          <p className="text-sm text-gray-400">
            Select available languages for your menu
          </p>
        </div>
      </div>

      {/* Grid of Available Languages */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {AVAILABLE_LANGUAGES.map((lang) => {
          const isSelected = selectedLangs.includes(lang.code);
          const isDefault = defaultLang === lang.code;

          return (
            <div
              key={lang.code}
              onClick={() => toggleLanguage(lang.code)}
              className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all ${
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-gray-700 bg-gray-800 hover:border-gray-600"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{lang.flag}</span>
                  <span
                    className={`font-medium ${
                      isSelected ? "text-white" : "text-gray-400"
                    }`}
                  >
                    {lang.name}
                  </span>
                </div>
                {isSelected && (
                  <div className="text-primary bg-primary/20 rounded-full p-1">
                    <RiCheckLine size={14} />
                  </div>
                )}
              </div>

              {/* Default Language Controls */}
              {isSelected && (
                <div className="mt-4 pt-3 border-t border-dashed border-gray-700">
                  {isDefault ? (
                    <span className="text-xs font-bold text-green-400 flex items-center gap-1">
                      ● Default Language
                    </span>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent toggling the card
                        setDefaultLang(lang.code);
                      }}
                      className="text-xs text-text-dim hover:text-white underline"
                    >
                      Set as Default
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="bg-white text-black px-6 py-2 rounded-lg font-bold hover:bg-gray-200 transition active:scale-95"
        >
          Save Language Settings
        </button>
      </div>
    </div>
  );
}
