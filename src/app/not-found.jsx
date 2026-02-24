import Link from "next/link";
import Image from "next/image";
import { RiArrowLeftLine } from "react-icons/ri";

export const metadata = {
  title: "404 - Page Not Found | Menu 3D",
  description: "The page you are looking for does not exist.",
};

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#1f1d2b] text-white selection:bg-[#ea7c69] selection:text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#ea7c69] rounded-full blur-[120px] opacity-10 animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-purple-600 rounded-full blur-[120px] opacity-10 animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center text-center space-y-8 max-w-2xl animate-fade-in-up">
        <div className="relative w-32 h-32 md:w-40 md:h-40 animate-float">
          <Image
            src="/logo-web.png"
            alt="Menu 3D Logo"
            fill
            sizes="(max-width: 768px) 128px, 160px"
            className="object-contain drop-shadow-[0_0_15px_rgba(234,124,105,0.3)] filter grayscale opacity-50"
            priority
          />
        </div>
        
        <h1 className="text-8xl md:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-600">
          404
        </h1>
        
        <div className="space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Page Not Found
          </h2>
          <p className="text-lg md:text-xl text-gray-400 leading-relaxed max-w-lg mx-auto">
            Oops! It looks like the page you are looking for has been moved, deleted, or never existed in the first place.
          </p>
        </div>

        <Link
          href="/"
          className="group relative inline-flex items-center justify-center px-8 py-4 bg-[#ea7c69] hover:bg-[#ff8f7d] text-white font-bold text-lg rounded-xl transition-all duration-300 shadow-[0_10px_30px_-10px_rgba(234,124,105,0.5)] hover:shadow-[0_20px_40px_-10px_rgba(234,124,105,0.6)] hover:-translate-y-1 active:scale-95 gap-2 mt-8"
        >
          <RiArrowLeftLine className="text-2xl group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>
      </div>
    </main>
  );
}
