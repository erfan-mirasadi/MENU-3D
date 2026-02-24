"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  RiRocketLine,
  RiRestaurantFill,
  RiServiceLine,
  RiBankCardLine,
  RiDashboardLine,
  RiArrowRightLine,
  RiMagicLine,
  RiFlashlightLine,
  RiSmartphoneLine,
  RiGlobalLine,
  RiWhatsappLine,
  RiMailLine,
  RiEarthLine,
  RiCheckLine
} from "react-icons/ri";
import { translations } from "@/components/landing/landingTranslations";

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'fa', label: 'فارسی' },
  { code: 'ar', label: 'العربية' },
  { code: 'de', label: 'Deutsch' },
  { code: 'ru', label: 'Русский' }
];

export default function LandingClient() {
  const [lang, setLang] = useState("en");
  const [showLangMenu, setShowLangMenu] = useState(false);
  const t = translations[lang];
  const isRtl = lang === "fa" || lang === "ar";

  // Check saved language on mount
  useEffect(() => {
    const saved = localStorage.getItem("landing_lang");
    if (saved && translations[saved]) {
      setLang(saved);
    }
  }, []);

  const handleLangChange = (code) => {
    setLang(code);
    localStorage.setItem("landing_lang", code);
    setShowLangMenu(false);
  };

  return (
    <main 
      className={`min-h-screen bg-[#1f1d2b] text-white selection:bg-[#ea7c69] selection:text-white overflow-x-hidden ${isRtl ? "dir-rtl" : "dir-ltr"}`}
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#ea7c69] rounded-full blur-[120px] opacity-10 animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-purple-600 rounded-full blur-[120px] opacity-10 animate-pulse delay-1000"></div>
      </div>

      {/* Language Switcher */}
      <div className="absolute top-6 right-6 md:top-10 md:right-10 z-50">
        <div className="relative">
            <button 
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-2 px-4 py-2 bg-[#252836] hover:bg-[#2D303E] rounded-full border border-white/10 text-gray-300 hover:text-white transition-all shadow-lg"
            >
                <RiEarthLine size={18} className="text-[#ea7c69]" />
                <span className="font-medium text-sm">{LANGUAGES.find(l => l.code === lang)?.label}</span>
            </button>

            {showLangMenu && (
                <div className="absolute right-0 top-full mt-2 w-40 bg-[#252836] border border-[#393C49] rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                    {LANGUAGES.map((l) => (
                        <button
                            key={l.code}
                            onClick={() => handleLangChange(l.code)}
                            className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-[#2D303E] transition-colors flex items-center justify-between"
                        >
                            {l.label}
                            {lang === l.code && <RiCheckLine className="text-[#ea7c69]" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 md:py-24 flex flex-col gap-24">
        {/* --- HERO SECTION --- */}
        <section className="flex flex-col items-center text-center space-y-8 animate-fade-in-up">
          <div className="flex flex-col items-center gap-6">
            <div className="relative w-32 h-32 md:w-40 md:h-40 animate-float">
              <Image
                src="/logo-web.png"
                alt="Menu 3D Logo"
                fill
                sizes="(max-width: 768px) 128px, 160px"
                className="object-contain drop-shadow-[0_0_15px_rgba(234,124,105,0.3)]"
                priority
              />
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter flex gap-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500">
                {t.heroTitle1}
              </span>
              <span className="text-[#ea7c69] drop-shadow-[0_0_30px_rgba(234,124,105,0.4)]">
                {t.heroTitle2}
              </span>
            </h1>
            <p className="text-lg md:text-2xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              {t.heroSubtitle}
            </p>
          </div>

          <Link
            href="/liman-coast/T-01"
            className="group relative inline-flex items-center justify-center px-8 py-4 bg-[#ea7c69] hover:bg-[#ff8f7d] text-white font-bold text-lg rounded-xl transition-all duration-300 shadow-[0_10px_30px_-10px_rgba(234,124,105,0.5)] hover:shadow-[0_20px_40px_-10px_rgba(234,124,105,0.6)] hover:-translate-y-1 active:scale-95 gap-2"
          >
            <RiRocketLine className="text-2xl" />
            {t.seeLiveDemo}
          </Link>
        </section>

        {/* --- PREMIUM FEATURE SHOWCASES --- */}
        <section className="flex flex-col gap-32 md:gap-40 w-full py-8">
          
          {/* 1. CUSTOMER 3D MENU */}
          <div className={`flex flex-col lg:flex-row items-center gap-12 lg:gap-24 group`}>
            <div className="flex-1 space-y-6 lg:px-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#ea7c69]/10 text-[#ea7c69] font-bold text-sm tracking-wide border border-[#ea7c69]/20">
                <RiMagicLine /> {t.forCustomers}
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-white leading-tight">
                {t.customerTitle1} <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ea7c69] to-[#ffb194]">{t.customerTitle2}</span>
              </h2>
              <p className="text-lg md:text-xl text-gray-400 leading-relaxed">
                {t.customerDesc}
              </p>
              <Link href="/liman-coast/T-01" className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-[#ea7c69] text-white font-bold text-lg hover:bg-[#d96a56] transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 active:scale-95 mt-4 w-full md:w-auto">
                {t.exploreDemo} <RiArrowRightLine className={`transition-transform ${isRtl ? "group-hover:-translate-x-2 rotate-180" : "group-hover:translate-x-2"}`} />
              </Link>
            </div>
            <div className="flex-1 w-full max-w-[320px] mx-auto relative lg:mx-0">
              <div className="absolute inset-0 bg-[#ea7c69] blur-[100px] opacity-20 group-hover:opacity-40 transition-opacity duration-700"></div>
              <div className="relative rounded-[2.5rem] overflow-hidden border-[6px] border-[#252836] shadow-[0_30px_60px_rgba(0,0,0,0.6)] transform group-hover:-translate-y-2 transition-transform duration-500 bg-black">
                <Image src="/images/menu.png" alt="Customer Digital Menu 3D" width={888} height={1922} className="w-full h-auto object-cover" sizes="(max-width: 1024px) 320px, 400px" />
              </div>
            </div>
          </div>

          {/* 2. WAITER APP */}
          <div className={`flex flex-col ${isRtl ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-12 lg:gap-24 group`}>
            <div className="flex-1 space-y-6 lg:px-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-sm tracking-wide border border-emerald-500/20">
                <RiServiceLine /> {t.forWaiter}
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-white leading-tight">
                {t.waiterTitle1} <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">{t.waiterTitle2}</span>
              </h2>
              <p className="text-lg md:text-xl text-gray-400 leading-relaxed">
                {t.waiterDesc}
              </p>
              <Link href="/waiter/dashboard" className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-emerald-500 text-white font-bold text-lg hover:bg-emerald-600 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 active:scale-95 mt-4 w-full md:w-auto">
                <RiServiceLine size={22} className={isRtl ? "ml-1" : "mr-1"}/> {t.launchWaiter}
              </Link>
            </div>
            <div className="flex-1 w-full max-w-[320px] mx-auto relative lg:mx-0">
              <div className="absolute inset-0 bg-emerald-500 blur-[100px] opacity-20 group-hover:opacity-40 transition-opacity duration-700"></div>
              <div className="relative rounded-[2.5rem] overflow-hidden border-[6px] border-[#252836] shadow-[0_30px_60px_rgba(0,0,0,0.6)] transform group-hover:-translate-y-2 transition-transform duration-500 bg-black">
                <Image src="/images/waiter.png" alt="Waiter Table Management App" width={760} height={1648} className="w-full h-auto object-cover" sizes="(max-width: 1024px) 320px, 400px" />
              </div>
            </div>
          </div>

          {/* 3. CHEF DISPLAY */}
          <div className={`flex flex-col lg:flex-row items-center gap-12 lg:gap-24 group`}>
            <div className="flex-1 space-y-6 lg:px-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 text-yellow-400 font-bold text-sm tracking-wide border border-yellow-500/20">
                <RiRestaurantFill /> {t.forKitchen}
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-white leading-tight">
                {t.kitchenTitle1} <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-200">{t.kitchenTitle2}</span>
              </h2>
              <p className="text-lg md:text-xl text-gray-400 leading-relaxed">
                {t.kitchenDesc}
              </p>
              <Link href="/chef/dashboard" className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-yellow-500 text-black font-bold text-lg hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-500/20 hover:shadow-xl hover:-translate-y-1 active:scale-95 mt-4 w-full md:w-auto">
                <RiRestaurantFill size={22} className={isRtl ? "ml-1" : "mr-1"}/> {t.launchChef}
              </Link>
            </div>
            <div className="flex-[1.5] w-full relative">
              <div className="absolute inset-0 bg-yellow-400 blur-[100px] opacity-10 group-hover:opacity-20 transition-opacity duration-700"></div>
              <div className="relative rounded-2xl overflow-hidden border border-[#393C49] shadow-[0_30px_60px_rgba(0,0,0,0.6)] transform group-hover:scale-[1.02] transition-transform duration-500 bg-[#1F1D2B]">
                <Image src="/images/chef.png" alt="Chef Kitchen Display App" width={3456} height={1922} className="w-full h-auto object-cover" sizes="(max-width: 1024px) 100vw, 60vw" />
              </div>
            </div>
          </div>

          {/* 4. CASHIER POS */}
          <div className={`flex flex-col ${isRtl ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-12 lg:gap-24 group`}>
            <div className="flex-1 space-y-6 lg:px-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 text-purple-400 font-bold text-sm tracking-wide border border-purple-500/20">
                <RiBankCardLine /> {t.forFrontDesk}
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-white leading-tight">
                {t.cashierTitle1} <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-300">{t.cashierTitle2}</span>
              </h2>
              <p className="text-lg md:text-xl text-gray-400 leading-relaxed">
                {t.cashierDesc}
              </p>
              <Link href="/cashier/dashboard" className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-purple-500 text-white font-bold text-lg hover:bg-purple-600 transition-all shadow-lg shadow-purple-500/20 hover:shadow-xl hover:-translate-y-1 active:scale-95 mt-4 w-full md:w-auto">
                <RiBankCardLine size={22} className={isRtl ? "ml-1" : "mr-1"}/> {t.launchCashier} 
              </Link>
            </div>
            <div className="flex-[1.5] w-full relative">
              <div className="absolute inset-0 bg-purple-500 blur-[100px] opacity-10 group-hover:opacity-20 transition-opacity duration-700"></div>
              <div className="relative rounded-2xl overflow-hidden border border-[#393C49] shadow-[0_30px_60px_rgba(0,0,0,0.6)] transform group-hover:scale-[1.02] transition-transform duration-500 bg-[#1F1D2B]">
                <Image src="/images/cashier.png" alt="Cashier POS System" width={3456} height={1922} className="w-full h-auto object-cover" sizes="(max-width: 1024px) 100vw, 60vw" />
              </div>
            </div>
          </div>

          {/* 5. ADMIN REPORTS */}
          <div className={`flex flex-col lg:flex-row items-center gap-12 lg:gap-24 group`}>
            <div className="flex-1 space-y-6 lg:px-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-400 font-bold text-sm tracking-wide border border-blue-500/20">
                <RiDashboardLine /> {t.forOwners}
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-white leading-tight">
                {t.adminTitle1} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">{t.adminTitle2}</span>
              </h2>
              <p className="text-lg md:text-xl text-gray-400 leading-relaxed">
                {t.adminDesc}
              </p>
              <Link href="/admin/dashboard" className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-blue-500 text-white font-bold text-lg hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 hover:shadow-xl hover:-translate-y-1 active:scale-95 mt-4 w-full md:w-auto">
                <RiDashboardLine size={22} className={isRtl ? "ml-1" : "mr-1"}/> {t.launchAdmin} 
              </Link>
            </div>
            <div className="flex-[1.5] w-full relative">
              <div className="absolute inset-0 bg-blue-500 blur-[100px] opacity-10 group-hover:opacity-20 transition-opacity duration-700"></div>
              <div className="relative rounded-2xl overflow-hidden border border-[#393C49] shadow-[0_30px_60px_rgba(0,0,0,0.6)] transform group-hover:scale-[1.02] transition-transform duration-500 bg-[#1F1D2B]">
                <Image src="/images/reports.png" alt="Admin Analytics and Reporting Panel" width={3456} height={1922} className="w-full h-auto object-cover" sizes="(max-width: 1024px) 100vw, 60vw" />
              </div>
            </div>
          </div>

        </section>

        {/* --- FEATURES GRID --- */}
        <section className="bg-[#252836]/30 rounded-3xl p-8 md:p-12 border border-white/5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-3">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <RiMagicLine className="text-[#ea7c69] text-xl" /> Stunning 3D
              </h3>
              <p className="text-sm text-gray-400">
                High-fidelity 3D food models that make diners hungry instantly.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <RiFlashlightLine className="text-yellow-400 text-xl" /> Instant
                Sync
              </h3>
              <p className="text-sm text-gray-400">
                Powered by Supabase Realtime, everyone stays in sync. No delays.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <RiSmartphoneLine className="text-blue-400 text-xl" /> Fully
                Responsive
              </h3>
              <p className="text-sm text-gray-400">
                Optimized for every device: iPhone, Android, Tablet, and
                Desktop.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <RiGlobalLine className="text-green-400 text-xl" />{" "}
                Multi-Language
              </h3>
              <p className="text-sm text-gray-400">
                Built-in support for multiple languages to serve global
                customers.
              </p>
            </div>
          </div>
        </section>

        {/* CONTACT & FOOTER */}
        <section className="flex flex-col items-center gap-6 pb-20 pt-10">
          <div className="flex flex-col md:flex-row gap-6 md:gap-12">
            <a
              href="https://wa.me/905073542097"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-gray-400 hover:text-[#25D366] transition-colors group"
            >
              <div className="w-12 h-12 rounded-full bg-[#25D366]/10 flex items-center justify-center group-hover:bg-[#25D366]/20 transition-colors">
                <RiWhatsappLine className="text-2xl" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                  WhatsApp
                </span>
                <span className="text-lg font-medium">+90 507 354 2097</span>
              </div>
            </a>

            <a
              href="mailto:erfan.mirasadi@gmail.com"
              className="flex items-center gap-3 text-gray-400 hover:text-[#ea7c69] transition-colors group"
            >
              <div className="w-12 h-12 rounded-full bg-[#ea7c69]/10 flex items-center justify-center group-hover:bg-[#ea7c69]/20 transition-colors">
                <RiMailLine className="text-2xl" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                  Email
                </span>
                <span className="text-lg font-medium">
                  erfan.mirasadi@gmail.com
                </span>
              </div>
            </a>
          </div>

          <div className="w-full h-px bg-white/5 max-w-lg mt-8 mb-4"></div>

          <footer className="text-center text-gray-600 text-sm">
            &copy; {new Date().getFullYear()} Menu 3D. All rights reserved.
          </footer>
        </section>
      </div>
    </main>
  );
}
