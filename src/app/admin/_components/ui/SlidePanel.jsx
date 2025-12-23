"use client";
import { useEffect, useState } from "react";
import { RiCloseLine } from "react-icons/ri";

export default function SlidePanel({ isOpen, onClose, title, children }) {
  const [show, setShow] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShow(true);
      document.body.style.overflow = "hidden";
      const timer = setTimeout(() => setAnimate(true), 10);
      return () => clearTimeout(timer);
    } else {
      setAnimate(false);
      document.body.style.overflow = "unset";
      const timer = setTimeout(() => setShow(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
          animate ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      <div
        className={`relative w-full md:max-w-xl h-full bg-dark-900 border-l border-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          animate
            ? "translate-y-0 md:translate-x-0"
            : "translate-y-full md:translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800 bg-dark-900/95 backdrop-blur z-10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors active:scale-95"
          >
            <RiCloseLine size={28} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar pb-24">
          {children}
        </div>
      </div>
    </div>
  );
}
