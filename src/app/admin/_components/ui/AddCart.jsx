export default function AddCard() {
  return (
    <button className="group h-full min-h-[280px] w-full rounded-2xl border-2 border-dashed border-primary/40 bg-dark-900/50 flex flex-col items-center justify-center gap-4 hover:bg-dark-900 hover:border-primary transition-all cursor-pointer">
      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </div>
      <span className="text-primary font-semibold">Add new dish</span>
    </button>
  );
}
