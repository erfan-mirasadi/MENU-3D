import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#1F1D2B] text-white p-4 font-sans">
      <h1 className="text-4xl md:text-6xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-[#ea7c69] to-orange-400">
        Future Menu
      </h1>
      <p className="text-gray-400 mb-12 text-lg">Next Gen QR Menu System</p>
      <Link
        href="/liman-coast/T-01"
        className="group relative bg-[#ea7c69] hover:bg-[#ff8f7d] text-white px-10 py-5 rounded-2xl font-bold text-xl transition-all duration-300 shadow-[0_10px_40px_-10px_rgba(234,124,105,0.5)] hover:shadow-[0_20px_60px_-15px_rgba(234,124,105,0.6)] hover:-translate-y-1 active:scale-95 flex items-center gap-3"
      >
        <span>🚀</span>
        <span>ورود به دمو (Liman Coast)</span>
        <span className="group-hover:translate-x-1 transition-transform">
          →
        </span>
      </Link>

      <div className="mt-16 text-xs text-gray-600 font-mono bg-[#252836] px-4 py-2 rounded-lg border border-white/5">
        Dev Route: /liman-coast/T-01
      </div>
    </div>
  );
}
