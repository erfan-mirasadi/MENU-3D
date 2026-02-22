"use client";

export default function ChefLayoutClient({ children }) {
  return (
    <div className="relative w-full h-[100dvh] bg-dark-900 text-text-light font-sans overflow-hidden">
      {/* Main Content */}
      <div className="w-full h-full">
          {children}
      </div>
    </div>
  );
}
