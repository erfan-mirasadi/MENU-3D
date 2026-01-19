import React, { useState, useRef, useEffect } from "react";

const SegmentedControl = ({ options, active, onChange, className = "" }) => {
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
  }, [active, options]);

  return (
    <div 
        ref={containerRef}
        className={`relative flex bg-[#1F1D2B] border border-[#393C49] rounded-lg p-1 w-fit select-none ${className}`}
    >
      {/* Animated Indicator */}
      <div
        className="absolute top-1 bottom-1 bg-[#EA7C69] rounded-md transition-all duration-300 ease-out shadow-sm"
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
            className={`relative z-10 px-4 py-2 text-sm font-medium transition-colors duration-200 cursor-pointer ${
              isActive
                ? "text-white"
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
