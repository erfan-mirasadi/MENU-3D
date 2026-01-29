"use client";
import { useState, useEffect } from "react";
import Loader from "@/components/ui/Loader";

export default function OffersPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-dark-900/50 backdrop-blur-sm">
      <Loader />
    </div>
  );

  return (
    <div className="p-8 text-white">
      <h1 className="text-3xl font-bold mb-4">Special Offers</h1>
      <p className="text-gray-400">Manage your special offers and discounts here.</p>
    </div>
  );
}
