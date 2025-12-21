'use client';

export default function HelpPage() {
  return (
    <div className="flex-1 overflow-y-auto bg-[#0f1419]">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm mb-8">
          <a className="text-gray-400 hover:text-primary transition-colors" href="/dashboard">Dashboard</a>
          <span className="material-symbols-outlined text-[14px] text-gray-400">chevron_right</span>
          <span className="text-white font-medium">Help Center</span>
        </div>

        {/* Hero Search Section */}
        <section className="relative overflow-hidden rounded-2xl bg-[#141922] border border-[#282e39] p-8 md:p-16 text-center mb-8">
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{backgroundImage: 'radial-gradient(#135bec 1px, transparent 1px)', backgroundSize: '32px 32px'}}></div>
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center gap-6">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white leading-tight">
              How can we help you <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">visualize</span> today?
            </h1>
            <p className="text-gray-400 text-lg font-light max-w-lg">
              Search for articles, guides, or visualization types to get started.
            </p>
            <div className="w-full relative mt-4">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-gray-400 text-[24px]">search</span>
              </div>
              <input 
                className="w-full h-14 pl-12 pr-32 bg-[#1c1f27] border border-[#282e39] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-lg text-base" 
                placeholder="e.g., 'How to import CSV data'" 
                type="text"
              />
              <button className="absolute right-2 top-2 bottom-2 bg-primary hover:bg-blue-600 text-white font-medium px-6 rounded-lg text-sm transition-colors">
                Search
              </button>
            </div>
            <div className="flex gap-3 text-sm text-gray-400 mt-2 flex-wrap justify-center">
              <span>Popular:</span>
              <a className="hover:text-primary underline decoration-1 underline-offset-2" href="#">JSON Format</a>
              <a className="hover:text-primary underline decoration-1 underline-offset-2" href="#">Exporting SVG</a>
              <a className="hover:text-primary underline decoration-1 underline-offset-2" href="#">API Keys</a>
            </div>
          </div>
        </section>

        {/* Feature/Topic Grid */}
        <section className="mt-8">
          <div className="flex flex-col gap-2 mb-6">
            <h2 className="text-2xl font-bold text-white">Browse by Topic</h2>
            <p className="text-gray-400">Explore our comprehensive guides categorized for your needs.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <a className="group flex flex-col p-6 rounded-xl border border-[#282e39] bg-[#141922] hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5" href="#">
              <div className="size-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[28px]">rocket_launch</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-primary transition-colors">Getting Started</h3>
              <p className="text-sm text-gray-400 leading-relaxed">Account setup, platform overview, and creating your first visualization.</p>
            </a>

            <a className="group flex flex-col p-6 rounded-xl border border-[#282e39] bg-[#141922] hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5" href="#">
              <div className="size-12 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[28px]">dataset</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-500 transition-colors">Data Inputs</h3>
              <p className="text-sm text-gray-400 leading-relaxed">Supported file types (CSV, JSON), API connections, and formatting rules.</p>
            </a>

            <a className="group flex flex-col p-6 rounded-xl border border-[#282e39] bg-[#141922] hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5" href="#">
              <div className="size-12 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[28px]">monitoring</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-500 transition-colors">Viz Library</h3>
              <p className="text-sm text-gray-400 leading-relaxed">In-depth guides and best practices for all 19 visualization types.</p>
            </a>

            <a className="group flex flex-col p-6 rounded-xl border border-[#282e39] bg-[#141922] hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5" href="#">
              <div className="size-12 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[28px]">build</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-orange-500 transition-colors">Troubleshooting</h3>
              <p className="text-sm text-gray-400 leading-relaxed">Solutions for common errors, slow rendering, and export issues.</p>
            </a>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mt-12 mb-16">
          <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
          <div className="flex flex-col gap-4">
            <details className="group rounded-xl border border-[#282e39] bg-[#141922] overflow-hidden">
              <summary className="flex items-center justify-between p-5 cursor-pointer list-none font-medium text-white hover:bg-white/5 transition-colors">
                <span>What happens if my data file is too large?</span>
                <span className="material-symbols-outlined transition-transform group-open:rotate-180 text-gray-400">keyboard_arrow_down</span>
              </summary>
              <div className="px-5 pb-5 pt-0 text-gray-400 text-sm leading-relaxed border-t border-transparent group-open:border-[#282e39]/50 group-open:pt-4">
                For free tier users, the limit is 50MB per file. Pro users can upload up to 500MB. If your dataset exceeds this, try splitting it into smaller chunks or using our API for stream-based ingestion.
              </div>
            </details>

            <details className="group rounded-xl border border-[#282e39] bg-[#141922] overflow-hidden">
              <summary className="flex items-center justify-between p-5 cursor-pointer list-none font-medium text-white hover:bg-white/5 transition-colors">
                <span>Can I export visualizations to PowerPoint?</span>
                <span className="material-symbols-outlined transition-transform group-open:rotate-180 text-gray-400">keyboard_arrow_down</span>
              </summary>
              <div className="px-5 pb-5 pt-0 text-gray-400 text-sm leading-relaxed border-t border-transparent group-open:border-[#282e39]/50 group-open:pt-4">
                Yes! You can export any visualization as a high-resolution PNG, SVG, or directly as an editable PowerPoint slide (.pptx) if you are on the Business plan.
              </div>
            </details>

            <details className="group rounded-xl border border-[#282e39] bg-[#141922] overflow-hidden">
              <summary className="flex items-center justify-between p-5 cursor-pointer list-none font-medium text-white hover:bg-white/5 transition-colors">
                <span>How do I change the color theme of a chart?</span>
                <span className="material-symbols-outlined transition-transform group-open:rotate-180 text-gray-400">keyboard_arrow_down</span>
              </summary>
              <div className="px-5 pb-5 pt-0 text-gray-400 text-sm leading-relaxed border-t border-transparent group-open:border-[#282e39]/50 group-open:pt-4">
                In the editor mode, navigate to the "Appearance" tab on the right sidebar. You can select from our preset palettes or define custom HEX codes for your series data.
              </div>
            </details>
          </div>
        </section>

        {/* Support Footer */}
        <section className="mb-16 rounded-xl bg-gradient-to-r from-[#141922] to-[#161b26] border border-[#282e39] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col gap-2 text-center md:text-left">
            <h2 className="text-2xl font-bold text-white">Still need help?</h2>
            <p className="text-gray-400 max-w-md">Our support team is available 24/7 to assist you with any issues or questions you might have.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-bold transition-colors">
              <span className="material-symbols-outlined text-[20px]">mail</span>
              Contact Support
            </button>
            <button className="flex items-center gap-2 bg-transparent border border-[#282e39] hover:bg-white/5 text-white px-6 py-3 rounded-lg font-bold transition-colors">
              <span className="material-symbols-outlined text-[20px]">forum</span>
              Community Forum
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
