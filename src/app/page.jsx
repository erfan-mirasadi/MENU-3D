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
  RiMailLine
} from "react-icons/ri";

export const metadata = {
  title: "Menu 3D",
  description: "Experience the next generation of restaurant dining with our interactive 3D menu, seamless POS integration, and real-time waiter management.",
};

export default function Home() {
  return (
    <main className="min-h-screen bg-[#1f1d2b] text-white selection:bg-[#ea7c69] selection:text-white overflow-x-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#ea7c69] rounded-full blur-[120px] opacity-10 animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-purple-600 rounded-full blur-[120px] opacity-10 animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 md:py-20 flex flex-col gap-24">
        
        {/* --- HERO SECTION --- */}
        <section className="flex flex-col items-center text-center space-y-8 animate-fade-in-up">
          <div className="flex flex-col items-center gap-6">
             <div className="relative w-32 h-32 md:w-40 md:h-40 animate-float">
                <Image 
                  src="/logo-web.png" 
                  alt="Menu 3D Logo" 
                  fill 
                  className="object-contain drop-shadow-[0_0_15px_rgba(234,124,105,0.3)]"
                  priority
                />
             </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500">
                MENU
              </span>
              <span className="text-[#ea7c69] drop-shadow-[0_0_30px_rgba(234,124,105,0.4)]">
                3D
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Transform your restaurant with an immersive <span className="text-white font-semibold">Interactive 3D Menu</span>, integrated POS, and real-time kitchen syncing.
            </p>
          </div>

          <Link
            href="/liman-coast/T-01"
            className="group relative inline-flex items-center justify-center px-8 py-4 bg-[#ea7c69] hover:bg-[#ff8f7d] text-white font-bold text-lg rounded-xl transition-all duration-300 shadow-[0_10px_30px_-10px_rgba(234,124,105,0.5)] hover:shadow-[0_20px_40px_-10px_rgba(234,124,105,0.6)] hover:-translate-y-1 active:scale-95 gap-2"
          >
            <RiRocketLine className="text-2xl" />
            See Live Demo
          </Link>

          {/* 3D Mockup Visual (CSS only) */}
          <div className="w-full max-w-4xl aspect-video relative mt-4 perspective-1000">
             <div className="w-full h-full backdrop-filter rounded-4xl border border-white/5 shadow-xl transform rotate-x-6 hover:rotate-x-0 transition-all duration-700 ease-out p-2 flex items-center justify-center overflow-hidden relative">
                
                {/* Background Logo Texture */}
                <div className="absolute inset-0 opacity-80 blur-[5px] pointer-events-none select-none">
                  <Image 
                    src="/logo.png" 
                    alt="Card Background" 
                    fill 
                  />
                </div>

                <div className="absolute inset-0 bg-gradient-to-tr from-[#ea7c69]/10 to-transparent pointer-events-none"></div>
                <Link href="/liman-coast/T-01">
                
                <div className="text-center space-y-1 opacity-80 flex flex-col items-center relative z-10">
                   <div className="relative w-32 h-32 md:w-48 md:h-48 animate-bounce">
                     <Image 
                        src="/logo-web.png" 
                        alt="3D Logo" 
                        fill 
                        className="object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
                     />
                   </div>
                   <div className="text-sm font-mono text-[#ea7c69]">Interactive 3D Model Viewer</div>
                </div>
                </Link>
             </div> 
          </div>
        </section>


        {/* --- PORTAL / APPS SECTION --- */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          
          {/* WAITER APP */}
          <Link href="/waiter/dashboard" className="group">
            <div className="h-full bg-[#252836] hover:bg-[#2d303e] border border-white/5 hover:border-[#ea7c69]/30 rounded-3xl p-8 transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(234,124,105,0.15)] flex flex-col items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#ea7c69]/10 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform text-[#ea7c69]">
                <RiServiceLine />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Waiter App</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Real-time table management, instant order updates, and kitchen status tracking.
                </p>
              </div>
              <div className="mt-auto pt-4 flex items-center text-[#ea7c69] text-sm font-bold gap-2">
                Login <RiArrowRightLine className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* CASHIER APP */}
          <Link href="/cashier/dashboard" className="group">
            <div className="h-full bg-[#252836] hover:bg-[#2d303e] border border-white/5 hover:border-[#ea7c69]/30 rounded-3xl p-8 transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(234,124,105,0.15)] flex flex-col items-start gap-4">
               <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform text-purple-400">
                <RiBankCardLine />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Cashier POS</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                   Synchronized point of sale, detailed billing, and seamless checkout workflows.
                </p>
              </div>
               <div className="mt-auto pt-4 flex items-center text-purple-400 text-sm font-bold gap-2">
                Login <RiArrowRightLine className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* ADMIN DASHBOARD */}
          <Link href="/admin/dashboard" className="group">
            <div className="h-full bg-[#252836] hover:bg-[#2d303e] border border-white/5 hover:border-[#ea7c69]/30 rounded-3xl p-8 transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(234,124,105,0.15)] flex flex-col items-start gap-4">
               <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform text-blue-400">
                <RiDashboardLine />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Admin Panel</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                   Full restaurant control, menu editing, sales analytics, and QR code generation.
                </p>
              </div>
               <div className="mt-auto pt-4 flex items-center text-blue-400 text-sm font-bold gap-2">
                Dashboard <RiArrowRightLine className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </section>


        {/* --- FEATURES GRID --- */}
        <section className="bg-[#252836]/30 rounded-3xl p-8 md:p-12 border border-white/5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-3">
              <h4 className="text-white font-bold text-lg flex items-center gap-2">
                <RiMagicLine className="text-[#ea7c69] text-xl" /> Stunning 3D
              </h4>
              <p className="text-sm text-gray-400">High-fidelity 3D food models that make diners hungry instantly.</p>
            </div>
            <div className="space-y-3">
              <h4 className="text-white font-bold text-lg flex items-center gap-2">
                <RiFlashlightLine className="text-yellow-400 text-xl" /> Instant Sync
              </h4>
              <p className="text-sm text-gray-400">Powered by Supabase Realtime, everyone stays in sync. No delays.</p>
            </div>
            <div className="space-y-3">
              <h4 className="text-white font-bold text-lg flex items-center gap-2">
                 <RiSmartphoneLine className="text-blue-400 text-xl" /> Fully Responsive
              </h4>
              <p className="text-sm text-gray-400">Optimized for every device: iPhone, Android, Tablet, and Desktop.</p>
            </div>
            <div className="space-y-3">
              <h4 className="text-white font-bold text-lg flex items-center gap-2">
                <RiGlobalLine className="text-green-400 text-xl" /> Multi-Language
              </h4>
              <p className="text-sm text-gray-400">Built-in support for multiple languages to serve global customers.</p>
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
                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">WhatsApp</span>
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
                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Email</span>
                <span className="text-lg font-medium">erfan.mirasadi@gmail.com</span>
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
