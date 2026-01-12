export default function OrderSection({
  title,
  count,
  children,
  accentColor,
  icon,
  action
}) {
  const colorClass =
    accentColor === "orange" ? "text-[#ea7c69]" : "text-blue-400";
  const borderClass =
    accentColor === "orange" ? "border-[#ea7c69]" : "border-blue-500/50";

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className={`flex items-center justify-between mb-3 px-1 ${colorClass}`}>
        <div className="flex items-center gap-2">
            {icon}
            <h3 className="font-bold text-xs uppercase tracking-widest">
            {title} ({count})
            </h3>
        </div>
        {action}
      </div>
      <div className={`pl-2 border-l-2 ${borderClass} space-y-3`}>
        {children}
      </div>
    </div>
  );
}
