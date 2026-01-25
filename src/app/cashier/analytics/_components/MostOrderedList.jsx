import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

const MostOrderedList = ({ items, loading, filter }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { content } = useLanguage();

  return (
    <div className="bg-[#252836] p-6 rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-white text-lg font-bold">Most Ordered</h2>

      </div>

      <div className="flex flex-col gap-6">
        {loading ? (
             Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-start gap-4 animate-pulse">
                    <div className="w-12 h-12 rounded-full bg-gray-700 flex-shrink-0"></div>
                    <div className="flex-1">
                        <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                    </div>
                </div>
            ))
        ) : items.length === 0 ? (
             <p className="text-[#ABBBC2] text-sm text-center py-4">No top items yet.</p>
        ) : (
            items.slice(0, isExpanded ? 15 : 3).map((item, index) => (
            <div key={index} className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
                {item.image ? (
                    <img src={item.image} alt="Food" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gray-600 flex items-center justify-center text-xs text-white">?</div>
                )}
                </div>
                <div>
                <h4 className="text-white text-sm font-medium mb-1 leading-snug line-clamp-2">
                    {content(item.name)}
                </h4>
                <p className="text-[#ABBBC2] text-xs">{item.count} dishes ordered</p>
                </div>
            </div>
            ))
        )}
      </div>
       <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full mt-8 py-3 rounded-lg border border-[#EA7C69] text-[#EA7C69] text-sm font-bold hover:bg-[#EA7C69]/10 transition-colors cursor-pointer"
       >
        {isExpanded ? "View Less" : "View All"}
      </button>
    </div>
  );
};

export default MostOrderedList;
