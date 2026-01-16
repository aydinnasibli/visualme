const Canvas = () => {
  return (
    <div className="w-full h-full bg-[#0c0a09] grid-bg relative flex items-center justify-center overflow-hidden">
      <div className="flex flex-col items-center justify-center gap-4 opacity-20 select-none pointer-events-none">
        <div className="w-24 h-24 rounded-2xl border-2 border-stone-700 border-dashed flex items-center justify-center">
          <span className="material-symbols-outlined text-5xl text-stone-700">add_chart</span>
        </div>
        <p className="text-stone-500 font-mono text-sm uppercase tracking-widest">Canvas Empty</p>
      </div>
    </div>
  );
};

export default Canvas;
