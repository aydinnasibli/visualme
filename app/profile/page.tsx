'use client';

export default function ProfilePage() {
  const visualizations = [
    { title: 'Q3 Sales Performance', type: 'Bar Chart', badge: 'bar_chart', color: 'blue', edited: '2h ago' },
    { title: 'User Click Density', type: 'Heatmap', badge: 'blur_on', color: 'purple', edited: 'Yesterday' },
    { title: 'Social Connections', type: 'Network', badge: 'hub', color: 'green', edited: 'Oct 24, 2023' },
    { title: 'Market Share Distribution', type: 'Pie Chart', badge: 'pie_chart', color: 'orange', edited: 'Oct 20, 2023' },
    { title: 'Crypto Volatility Index', type: 'Scatter', badge: 'scatter_plot', color: 'pink', edited: 'Oct 18, 2023' },
    { title: 'Product Review Sentiment', type: 'Word Cloud', badge: 'cloud', color: 'teal', edited: 'Oct 15, 2023' },
  ];

  const badgeColors: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-800 dark:bg-primary/20 dark:text-blue-200',
    purple: 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-200',
    green: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-200',
    orange: 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-200',
    pink: 'bg-pink-100 text-pink-800 dark:bg-pink-500/20 dark:text-pink-200',
    teal: 'bg-teal-100 text-teal-800 dark:bg-teal-500/20 dark:text-teal-200',
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0f1419]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header & Stats */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">My Visualizations</h1>
            <p className="text-gray-400 text-base sm:text-lg">Manage, organize, and track your creative data output.</p>
          </div>
          <div className="flex gap-4 w-full lg:w-auto">
            <div className="flex-1 lg:flex-none lg:min-w-[160px] flex flex-col gap-1 rounded-xl p-4 bg-[#1a1f28] border border-[#282e39] shadow-sm">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-[20px]">bar_chart</span>
                <p className="text-xs font-bold uppercase tracking-wide">Total</p>
              </div>
              <p className="text-2xl font-bold text-white">42</p>
            </div>
            <div className="flex-1 lg:flex-none lg:min-w-[160px] flex flex-col gap-1 rounded-xl p-4 bg-[#1a1f28] border border-[#282e39] shadow-sm">
              <div className="flex items-center gap-2 text-purple-500">
                <span className="material-symbols-outlined text-[20px]">cloud</span>
                <p className="text-xs font-bold uppercase tracking-wide">Storage</p>
              </div>
              <p className="text-2xl font-bold text-white">120MB</p>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-1">
            <div className="relative w-full sm:max-w-xs group">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined text-[20px]">search</span>
              <input 
                className="w-full h-11 pl-10 pr-4 rounded-lg bg-[#1a1f28] border border-[#282e39] text-white placeholder:text-gray-500 focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all outline-none text-sm" 
                placeholder="Search your library..." 
                type="text"
              />
            </div>
            <div className="hidden sm:block w-px h-8 bg-[#282e39] mx-2"></div>
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
              <button className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#1a1f28] hover:bg-[#282e39] border border-[#282e39] text-gray-300 text-sm font-medium transition-colors whitespace-nowrap">
                <span>Type</span>
                <span className="material-symbols-outlined text-[16px]">expand_more</span>
              </button>
              <button className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#1a1f28] hover:bg-[#282e39] border border-[#282e39] text-gray-300 text-sm font-medium transition-colors whitespace-nowrap">
                <span>Date Created</span>
                <span className="material-symbols-outlined text-[16px]">expand_more</span>
              </button>
            </div>
          </div>
          <div className="flex items-center p-1 bg-[#1a1f28] rounded-lg border border-[#282e39]">
            <button className="size-8 flex items-center justify-center rounded bg-primary text-white shadow-sm transition-all">
              <span className="material-symbols-outlined text-[20px]">grid_view</span>
            </button>
            <button className="size-8 flex items-center justify-center rounded text-gray-500 hover:text-white transition-all">
              <span className="material-symbols-outlined text-[20px]">view_list</span>
            </button>
          </div>
        </div>

        {/* Visualization Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {visualizations.map((viz, idx) => (
            <div key={idx} className="group relative flex flex-col rounded-xl bg-[#1a1f28] border border-[#282e39] overflow-hidden hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-primary/5">
              <div className="relative aspect-[4/3] w-full bg-gradient-to-br from-[#282e39] to-[#1a1f28] overflow-hidden flex items-center justify-center">
                <span className="material-symbols-outlined text-6xl text-white/10 group-hover:scale-110 transition-transform duration-500">{viz.badge}</span>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="size-8 flex items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm hover:bg-primary transition-colors">
                    <span className="material-symbols-outlined text-[18px]">more_vert</span>
                  </button>
                </div>
                <div className="absolute top-3 left-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium backdrop-blur-md ${badgeColors[viz.color]}`}>
                    {viz.type}
                  </span>
                </div>
              </div>
              <div className="flex flex-col p-4 gap-2">
                <h3 className="text-lg font-bold text-white leading-tight group-hover:text-primary transition-colors cursor-pointer">{viz.title}</h3>
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-[#282e39]/50">
                  <span className="text-xs text-gray-500">Edited {viz.edited}</span>
                  <div className="flex items-center gap-2">
                    <button className="text-gray-400 hover:text-primary transition-colors" title="Download">
                      <span className="material-symbols-outlined text-[18px]">download</span>
                    </button>
                    <button className="text-gray-400 hover:text-primary transition-colors" title="Share">
                      <span className="material-symbols-outlined text-[18px]">share</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="flex justify-center mt-8 pb-12">
          <button className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#1a1f28] border border-[#282e39] text-white hover:bg-primary hover:border-primary transition-all text-sm font-bold">
            <span>Load More</span>
            <span className="material-symbols-outlined text-[18px]">expand_more</span>
          </button>
        </div>
      </div>
    </div>
  );
}
