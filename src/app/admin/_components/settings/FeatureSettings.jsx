"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRestaurantData } from "@/app/hooks/useRestaurantData";
import Loader from "@/components/ui/Loader";
import toast from "react-hot-toast";
import { 
  FaUserTie, 
  FaCashRegister, 
  FaUtensils, 
  FaMobileAlt, 
  FaSave,
  FaCheck,
  FaTimes
} from "react-icons/fa";

export default function FeatureSettings() {
  const { restaurant, refetch } = useRestaurantData();
  const [features, setFeatures] = useState({
    menu: true,
    waiter: true,
    cashier: true,
    kitchen: true,
    ordering_enabled: true
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Initialize state from restaurant data
  useEffect(() => {
    if (restaurant?.features) {
      setFeatures(restaurant.features);
      setInitialLoading(false);
    }
  }, [restaurant]);

  const handleToggle = (key) => {
    setFeatures(prev => {
      const newState = { ...prev, [key]: !prev[key] };
      
      // Automatic Rule: ordering_enabled is strictly derived.
      // If ANY app (waiter, cashier, kitchen) is enabled -> ordering_enabled = true
      // If ALL apps are disabled -> ordering_enabled = false
      if (key === 'waiter' || key === 'cashier' || key === 'kitchen') {
        const anyAppEnabled = newState.waiter || newState.cashier || newState.kitchen;
        newState.ordering_enabled = anyAppEnabled;
      }
      
      return newState;
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("restaurants")
        .update({ features: features })
        .eq("id", restaurant.id);

      if (error) throw error;

      toast.success("Features updated successfully!");
      refetch(); // Refresh context
    } catch (error) {
      console.error("Error updating features:", error);
      toast.error("Failed to update features");
    } finally {
      setLoading(false);
    }
  };

  if (!restaurant && initialLoading) return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-dark-900/50 backdrop-blur-sm">
      <Loader />
    </div>
  );

  return (
    <div className="bg-[#2d303e] rounded-2xl p-6 border border-gray-800">
       <div className="flex items-center justify-between mb-6">
        <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FaMobileAlt className="text-[#ea7c69]" />
            App Modules & Features
            </h2>
            <p className="text-sm text-gray-400 mt-1">
            Enable or disable specific modules for your restaurant.
            </p>
        </div>
        
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 border-b border-gray-800 pb-6 mb-6">
        {/* Waiter App */}
        <FeatureCard 
            icon={<FaUserTie />}
            title="Waiter App"
            description="Allow staff to take orders at tables."
            active={features.waiter}
            onClick={() => handleToggle('waiter')}
            color="text-blue-400"
        />

        {/* Cashier App */}
        <FeatureCard 
            icon={<FaCashRegister />}
            title="Cashier App"
            description="Manage payments and billing."
            active={features.cashier}
            onClick={() => handleToggle('cashier')}
            color="text-green-400"
        />

        {/* Kitchen App */}
        <FeatureCard 
            icon={<FaUtensils />}
            title="Kitchen Display"
            description="Send orders directly to chefs."
            active={features.kitchen}
            onClick={() => handleToggle('kitchen')}
            color="text-yellow-400"
        />
      </div>

      <div className="flex justify-end">
        <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-3 bg-[#ea7c69] hover:bg-[#d96b58] text-white font-bold rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-orange-900/20 active:scale-95"
        >
            {loading ? <Loader active={true} variant="inline" className="w-4 h-4" /> : <FaSave />}
            Save Changes
        </button>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description, active, onClick, color, disabled }) {
    return (
        <button 
            onClick={onClick}
            disabled={disabled}
            className={`flex items-start gap-4 p-4 rounded-xl border transition-all text-left ${
                active 
                ? "bg-[#252836] border-[#ea7c69] shadow-[0_0_15px_rgba(234,124,105,0.1)]" 
                : "bg-[#252836]/50 border-gray-800 opacity-80 hover:opacity-100"
            } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
        >
            <div className={`p-3 rounded-lg bg-[#2d303e] ${active ? color : "text-gray-500"}`}>
                <div className="text-2xl">{icon}</div>
            </div>
            <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                    <h3 className={`font-bold ${active ? "text-white" : "text-gray-400"}`}>{title}</h3>
                    <div className={`text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1 ${
                        active ? "bg-green-500/20 text-green-400" : "bg-gray-700 text-gray-500"
                    }`}>
                        {active ? <><FaCheck size={10} /> ON</> : <><FaTimes size={10} /> OFF</>}
                    </div>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
            </div>
        </button>
    )
}
