import React, { useState, useRef, useEffect } from "react";

const SegmentedControl = ({ options, active, onChange, className = "", fullWidth = false }) => {
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const containerRef = useRef(null);
  const itemsRef = useRef([]);

  useEffect(() => {
    const activeIndex = options.findIndex((opt) => 
      (typeof opt === "object" ? opt.value : opt) === active
    );

    if (activeIndex !== -1 && itemsRef.current[activeIndex]) {
      const currentTab = itemsRef.current[activeIndex];
      setIndicatorStyle({
        left: currentTab.offsetLeft,
        width: currentTab.clientWidth,
      });
    }
  }, [active, options, fullWidth]); // Recalculate if fullWidth changes

  return (
    <div 
        ref={containerRef}
        className={`relative flex bg-[#1F1D2B] border border-[#393C49] rounded-lg p-1 select-none overflow-hidden ${fullWidth ? 'w-full' : 'w-fit'} ${className}`}
    >
      {/* Animated Indicator */}
      <div
        className="absolute top-1 bottom-1 bg-[#EA7C69] rounded-md transition-all duration-350 ease-out shadow-sm"
        style={{
          left: indicatorStyle.left,
          width: indicatorStyle.width,
        }}
      />

      {options.map((opt, index) => {
        const isObject = typeof opt === "object";
        const value = isObject ? opt.value : opt;
        const label = isObject ? opt.label : opt;
        const isActive = active === value;
        
        return (
          <button
            key={value}
            ref={(el) => (itemsRef.current[index] = el)}
            onClick={() => onChange(value)}
            className={`relative z-10 px-2 py-2 text-sm font-medium transition-all duration-600 cursor-pointer text-center min-w-0 ${fullWidth ? 'flex-1 w-full' : ''} ${
              isActive
                ? "text-white scale-110 shadow-lg transform"
                : "text-[#ABBBC2] hover:text-white"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};

export default SegmentedControl;
