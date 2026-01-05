"use client";

import React from "react";

const styles = `
  @keyframes liquid-pulse {
    0%, 100% { transform: scale(1); opacity: 0.5; }
    50% { transform: scale(1.5); opacity: 0.2; }
  }
  @keyframes liquid-rotate {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  .liquid-blob {
    animation: liquid-pulse 3s ease-in-out infinite alternate;
  }
  .glass-shimmer {
    background: linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.1) 25%, transparent 30%);
    background-size: 200% 100%;
    animation: shimmer 3s infinite linear;
  }
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;

export default function Loader({ className = "", active = true }) {
  if (!active) return null;

  return (
    <>
      <style>{styles}</style>
      <div className={`fixed inset-0 z-[200] flex items-center justify-center pointer-events-none ${className}`}>
        {/* Glass Container */}
        <div className="relative bg-black/30 backdrop-blur-3xl border border-white/20 rounded-[30px] p-8 shadow-2xl flex flex-col items-center gap-6 overflow-hidden">
          
          {/* Inner Liquid Core */}
          <div className="relative w-16 h-16 flex items-center justify-center">
            {/* Outer Glow Ring */}
            <div className="absolute inset-0 border-4 border-t-white/80 border-r-white/20 border-b-white/20 border-l-white/50 rounded-full animate-spin duration-1000" />
            
            {/* Inner "Liquid" Blob */}
            <div className="absolute w-8 h-8 bg-white/80 rounded-full blur-md liquid-blob shadow-[0_0_20px_rgba(255,255,255,0.5)]" />
          </div>

          {/* Loading Text */}
          <span className="text-white/80 text-[10px] uppercase font-bold tracking-[0.3em] animate-pulse">
            Loading
          </span>

          {/* Subtle Shimmer Overlay */}
          <div className="absolute inset-0 glass-shimmer pointer-events-none opacity-50" />
        </div>
      </div>
    </>
  );
}
