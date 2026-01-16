const Toolbar = () => {
  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 glass-panel p-1.5 rounded-full shadow-2xl transition-transform hover:scale-105">
      <button className="w-9 h-9 flex items-center justify-center hover:bg-white/5 rounded-full text-stone-400 hover:text-white transition-colors tooltip" title="Pan Tool">
        <span className="material-symbols-outlined text-[20px]">pan_tool</span>
      </button>
      <div className="w-px h-4 bg-white/10 mx-1"></div>
      <button className="w-9 h-9 flex items-center justify-center hover:bg-white/5 rounded-full text-stone-400 hover:text-white transition-colors">
        <span className="material-symbols-outlined text-[20px]">zoom_out</span>
      </button>
      <span className="text-xs text-stone-300 font-mono px-2 min-w-[3rem] text-center">100%</span>
      <button className="w-9 h-9 flex items-center justify-center hover:bg-white/5 rounded-full text-stone-400 hover:text-white transition-colors">
        <span className="material-symbols-outlined text-[20px]">zoom_in</span>
      </button>
      <div className="w-px h-4 bg-white/10 mx-1"></div>
      <button className="w-9 h-9 flex items-center justify-center hover:bg-white/5 rounded-full text-stone-400 hover:text-white transition-colors">
        <span className="material-symbols-outlined text-[20px]">refresh</span>
      </button>
    </div>
  );
};

export default Toolbar;
