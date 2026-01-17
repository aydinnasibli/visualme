import React from 'react';
import { BarChart2 } from 'lucide-react';

const Canvas = () => {
  return (
    <div className="w-full h-full flex items-center justify-center opacity-30 select-none pointer-events-none">
      <div className="flex flex-col items-center gap-4 text-center max-w-md">
        <div className="w-24 h-24 rounded-3xl bg-surface-dark border border-white/5 flex items-center justify-center rotate-12 shadow-2xl">
          <BarChart2 className="w-12 h-12 text-stone-700" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-stone-600">Start Visualizing</h2>
          <p className="text-stone-600">Enter a prompt below or choose a template to begin your visualization journey.</p>
        </div>
      </div>
    </div>
  );
};

export default Canvas;
