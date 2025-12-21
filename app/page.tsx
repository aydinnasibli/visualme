import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col">
      {/* Header */}
      <div className="w-full border-b border-solid border-border-dark bg-background-dark/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex justify-center w-full">
          <div className="flex max-w-[1280px] w-full items-center justify-between px-6 py-4 lg:px-10">
            <Link href="/" className="flex items-center gap-3 text-white cursor-pointer group">
              <div className="size-9 flex items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/20 transition-transform group-hover:scale-105">
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>auto_awesome</span>
              </div>
              <h2 className="text-xl font-bold leading-tight tracking-tight">VisualMe</h2>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <a className="text-sm font-medium text-slate-300 hover:text-primary transition-colors" href="#pricing">Pricing</a>
              <a className="text-sm font-medium text-slate-300 hover:text-primary transition-colors" href="#gallery">Gallery</a>
              <a className="text-sm font-medium text-slate-300 hover:text-primary transition-colors" href="#community">Community</a>
            </div>
            <div className="flex gap-3">
              <Link href="/sign-in" className="hidden sm:flex cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 hover:bg-border-dark transition-all text-sm font-bold tracking-wide text-slate-300">
                <span className="truncate">Log In</span>
              </Link>
              <Link href="/dashboard" className="flex cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-5 bg-primary hover:bg-blue-600 transition-all text-white text-sm font-bold tracking-wide shadow-lg shadow-primary/25 hover:shadow-primary/40 transform active:scale-95">
                <span className="truncate">Get Started</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="flex flex-col w-full justify-center items-center py-16 lg:py-24 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

        <div className="flex flex-col max-w-[960px] w-full px-6 lg:px-10 gap-10 z-10">
          <div className="flex flex-col gap-8 items-center text-center">
            <div className="flex flex-col gap-6 max-w-4xl">
              <div className="inline-flex mx-auto items-center gap-2 px-3 py-1 rounded-full bg-blue-900/20 border border-blue-800 text-blue-300 text-xs font-bold uppercase tracking-wider mb-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                Now available for Teams
              </div>

              <h1 className="text-5xl md:text-7xl font-black leading-[1.1] tracking-tight text-white">
                Visualize Anything.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">In Seconds.</span>
              </h1>

              <h2 className="text-slate-300 text-lg md:text-xl font-normal leading-relaxed max-w-2xl mx-auto">
                Transform ideas, raw data, or unstructured notes into professional diagrams. A refined workspace where your words become visuals instantly.
              </h2>
            </div>

            <Link href="/dashboard" className="flex flex-col h-16 w-full max-w-[640px] shadow-2xl shadow-primary/10 rounded-2xl transition-all duration-300 hover:shadow-primary/20 hover:-translate-y-1 mt-2">
              <div className="flex w-full flex-1 items-center rounded-2xl h-full border border-border-dark bg-surface-dark overflow-hidden hover:ring-2 hover:ring-primary/50 hover:border-primary transition-all p-1">
                <div className="text-slate-400 flex items-center justify-center pl-4 pr-2">
                  <span className="material-symbols-outlined">edit_note</span>
                </div>
                <div className="flex w-full min-w-0 flex-1 bg-transparent text-slate-400 h-full px-2 text-base font-medium items-center">
                  Draft a user flow for a coffee shop app...
                </div>
                <div className="pr-1">
                  <div className="flex items-center justify-center rounded-xl h-12 px-6 bg-primary hover:bg-blue-600 text-white text-base font-bold transition-all shadow-md">
                    <span>Create</span>
                  </div>
                </div>
              </div>
            </Link>

            <div className="flex flex-wrap justify-center gap-3 w-full max-w-[800px] mt-2">
              <p className="w-full text-center text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Try an example</p>
              <Link href="/dashboard?example=roadmap" className="group flex h-8 items-center justify-center gap-x-2 rounded-full border border-border-dark bg-surface-dark/50 px-3 transition-all hover:border-primary/30 hover:shadow-sm">
                <span className="material-symbols-outlined text-purple-500 text-[16px]">timeline</span>
                <span className="text-xs font-medium text-slate-300">Project Roadmap</span>
              </Link>
              <Link href="/dashboard?example=revenue" className="group flex h-8 items-center justify-center gap-x-2 rounded-full border border-border-dark bg-surface-dark/50 px-3 transition-all hover:border-primary/30 hover:shadow-sm">
                <span className="material-symbols-outlined text-blue-500 text-[16px]">pie_chart</span>
                <span className="text-xs font-medium text-slate-300">Revenue Dashboard</span>
              </Link>
              <Link href="/dashboard?example=org" className="group flex h-8 items-center justify-center gap-x-2 rounded-full border border-border-dark bg-surface-dark/50 px-3 transition-all hover:border-primary/30 hover:shadow-sm">
                <span className="material-symbols-outlined text-emerald-500 text-[16px]">account_tree</span>
                <span className="text-xs font-medium text-slate-300">Org Structure</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 19 Ways to Visualize Section */}
      <div className="flex flex-col items-center py-16 px-6 bg-surface-dark/20 border-y border-border-dark">
        <div className="max-w-[1100px] w-full flex flex-col gap-10">
          <div className="flex flex-col md:flex-row items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 text-white">19 Ways to Visualize</h2>
              <p className="text-slate-400 max-w-lg text-lg">Don&apos;t limit yourself. From simple flowcharts to complex data dashboards, we support the formats you use every day.</p>
            </div>
            <a className="group text-white text-sm font-bold flex items-center gap-2 border border-border-dark px-4 py-2 rounded-lg hover:bg-surface-dark transition-all" href="#types">
              View All Types
              <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 auto-rows-[280px]">
            {/* Featured Card */}
            <div className="md:col-span-2 md:row-span-2 rounded-2xl overflow-hidden relative group cursor-pointer border border-border-dark bg-surface-dark shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-600/20"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
              <div className="absolute bottom-0 left-0 p-8">
                <div className="inline-flex items-center gap-2 mb-3 px-2 py-1 bg-blue-600/90 rounded text-white text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
                  <span className="material-symbols-outlined text-[14px]">star</span> Featured
                </div>
                <h3 className="text-white text-3xl font-bold mb-2">Interactive Dashboards</h3>
                <p className="text-slate-200 text-base max-w-md">Turn spreadsheets or database exports into full executive dashboards instantly. No coding required.</p>
              </div>
            </div>

            {/* Small Cards */}
            <div className="rounded-2xl overflow-hidden relative group cursor-pointer border border-border-dark bg-surface-dark shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-emerald-800/20"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent opacity-80"></div>
              <div className="absolute bottom-0 left-0 p-6">
                <div className="flex items-center gap-2 mb-1 text-emerald-400">
                  <span className="material-symbols-outlined text-lg">share</span>
                </div>
                <h3 className="text-white text-lg font-bold">Mind Maps</h3>
                <p className="text-slate-400 text-xs mt-1">Brainstorming sessions visualized.</p>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden relative group cursor-pointer border border-border-dark bg-surface-dark shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-purple-800/20"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent opacity-80"></div>
              <div className="absolute bottom-0 left-0 p-6">
                <div className="flex items-center gap-2 mb-1 text-purple-400">
                  <span className="material-symbols-outlined text-lg">account_tree</span>
                </div>
                <h3 className="text-white text-lg font-bold">User Flows</h3>
                <p className="text-slate-400 text-xs mt-1">Map customer journeys.</p>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden relative group cursor-pointer border border-border-dark bg-surface-dark shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 to-orange-800/20"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent opacity-80"></div>
              <div className="absolute bottom-0 left-0 p-6">
                <div className="flex items-center gap-2 mb-1 text-orange-400">
                  <span className="material-symbols-outlined text-lg">corporate_fare</span>
                </div>
                <h3 className="text-white text-lg font-bold">Org Charts</h3>
                <p className="text-slate-400 text-xs mt-1">Visualize team structures.</p>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden relative group cursor-pointer border border-border-dark bg-surface-dark flex flex-col items-center justify-center p-6 text-center hover:bg-border-dark transition-colors">
              <div className="size-16 rounded-full bg-white/5 text-slate-400 flex items-center justify-center mb-4 shadow-sm">
                <span className="material-symbols-outlined text-3xl">apps</span>
              </div>
              <h3 className="text-white text-lg font-bold">Explore Library</h3>
              <p className="text-slate-500 text-xs mt-2 max-w-[120px]">Gantt, Sequence, ERD, and 12 more types.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Three Steps Section */}
      <div className="flex flex-col items-center py-20 px-6 bg-background-dark">
        <div className="max-w-[960px] w-full">
          <div className="flex flex-col gap-4 mb-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">Clarity in Three Steps</h2>
            <p className="text-slate-400 text-lg">No drag-and-drop fatigue. Just results.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-transparent via-border-dark to-transparent -z-10"></div>

            <div className="flex flex-col items-center text-center gap-6 group">
              <div className="size-20 rounded-2xl bg-surface-dark border border-border-dark shadow-sm flex items-center justify-center text-primary group-hover:scale-110 group-hover:border-primary/30 group-hover:shadow-primary/10 group-hover:shadow-lg transition-all duration-300">
                <span className="material-symbols-outlined text-4xl">keyboard</span>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-3 text-white">1. Describe</h3>
                <p className="text-sm text-slate-400 leading-relaxed px-4">Type a prompt, paste raw data, or upload a document. We interpret the context instantly.</p>
              </div>
            </div>

            <div className="flex flex-col items-center text-center gap-6 group">
              <div className="size-20 rounded-2xl bg-surface-dark border border-border-dark shadow-sm flex items-center justify-center text-purple-500 group-hover:scale-110 group-hover:border-purple-500/30 group-hover:shadow-purple-500/10 group-hover:shadow-lg transition-all duration-300">
                <span className="material-symbols-outlined text-4xl">auto_fix_high</span>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-3 text-white">2. Generate</h3>
                <p className="text-sm text-slate-400 leading-relaxed px-4">Our engine selects the best visualization type and constructs it in real-time.</p>
              </div>
            </div>

            <div className="flex flex-col items-center text-center gap-6 group">
              <div className="size-20 rounded-2xl bg-surface-dark border border-border-dark shadow-sm flex items-center justify-center text-emerald-500 group-hover:scale-110 group-hover:border-emerald-500/30 group-hover:shadow-emerald-500/10 group-hover:shadow-lg transition-all duration-300">
                <span className="material-symbols-outlined text-4xl">ios_share</span>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-3 text-white">3. Export</h3>
                <p className="text-sm text-slate-400 leading-relaxed px-4">Fine-tune the style, then export as high-res PNG, SVG, or editable code.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-20 px-6 bg-background-dark">
        <div className="max-w-[1080px] w-full mx-auto flex flex-col gap-12">
          <h2 className="text-3xl font-bold tracking-tight text-center text-white">Trusted by Creators</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col p-8 rounded-2xl bg-surface-dark border border-border-dark">
              <div className="flex text-yellow-400 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="material-symbols-outlined text-sm">star</span>
                ))}
              </div>
              <p className="text-slate-300 leading-relaxed mb-6">&quot;VisualMe has completely changed how I present data to stakeholders. I used to spend hours in PowerPoint, now I just type what I need.&quot;</p>
              <div className="mt-auto flex items-center gap-3">
                <div className="size-10 rounded-full bg-blue-900 flex items-center justify-center text-blue-300 font-bold">SJ</div>
                <div>
                  <p className="text-sm font-bold text-white">Sarah Jenkins</p>
                  <p className="text-xs text-slate-500">Product Manager</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col p-8 rounded-2xl bg-surface-dark border border-border-dark">
              <div className="flex text-yellow-400 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="material-symbols-outlined text-sm">star</span>
                ))}
              </div>
              <p className="text-slate-300 leading-relaxed mb-6">&quot;The ability to turn my messy meeting notes into a coherent flowchart instantly is basically magic. It&apos;s become an essential tool for our team.&quot;</p>
              <div className="mt-auto flex items-center gap-3">
                <div className="size-10 rounded-full bg-purple-900 flex items-center justify-center text-purple-300 font-bold">MT</div>
                <div>
                  <p className="text-sm font-bold text-white">Mike Torres</p>
                  <p className="text-xs text-slate-500">Tech Lead</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col p-8 rounded-2xl bg-surface-dark border border-border-dark">
              <div className="flex text-yellow-400 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="material-symbols-outlined text-sm">star</span>
                ))}
              </div>
              <p className="text-slate-300 leading-relaxed mb-6">&quot;I was skeptical about AI visualization, but the control you have over the output is amazing. The exported code is clean and usable.&quot;</p>
              <div className="mt-auto flex items-center gap-3">
                <div className="size-10 rounded-full bg-emerald-900 flex items-center justify-center text-emerald-300 font-bold">ER</div>
                <div>
                  <p className="text-sm font-bold text-white">Elena Rodriguez</p>
                  <p className="text-xs text-slate-500">UX Designer</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-border-dark bg-background-dark py-12">
        <div className="flex flex-col items-center justify-center px-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="size-8 flex items-center justify-center rounded-lg bg-primary text-white">
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>auto_awesome</span>
            </div>
            <span className="text-xl font-bold text-white">VisualMe</span>
          </div>

          <div className="flex flex-wrap justify-center gap-8 mb-8 text-sm font-medium text-slate-400">
            <a className="hover:text-primary transition-colors" href="#pricing">Pricing</a>
            <a className="hover:text-primary transition-colors" href="#gallery">Gallery</a>
            <a className="hover:text-primary transition-colors" href="#api">API Docs</a>
            <a className="hover:text-primary transition-colors" href="#community">Community</a>
            <a className="hover:text-primary transition-colors" href="#support">Support</a>
          </div>

          <div className="flex gap-6 mb-8">
            <a className="text-slate-400 hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined">public</span></a>
            <a className="text-slate-400 hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined">mail</span></a>
          </div>

          <p className="text-xs text-slate-500">© 2023 VisualMe AI Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
