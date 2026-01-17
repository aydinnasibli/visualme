import Link from 'next/link';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { Sparkles, Edit3, Network, Share2, Activity, Calendar, BarChart2, Code, GraduationCap, Building } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="bg-[#101622] text-white overflow-hidden relative selection:bg-primary/30">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] opacity-30 animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] opacity-20 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 container mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/20">V</div>
          <span className="text-xl font-bold tracking-tight">VisualMe</span>
        </div>
        <div className="flex items-center gap-6">
           <SignedOut>
              <Link href="/sign-in" className="text-stone-300 hover:text-white transition-colors text-sm font-medium">Log In</Link>
              <Link href="/sign-up" className="px-5 py-2.5 bg-white text-black rounded-lg font-semibold text-sm hover:bg-stone-100 transition-colors shadow-lg shadow-white/5">
                Sign Up Free
              </Link>
           </SignedOut>
           <SignedIn>
              <Link href="/dashboard" className="px-5 py-2.5 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20">
                Go to Dashboard
              </Link>
              <UserButton afterSignOutUrl="/" />
           </SignedIn>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative z-10 container mx-auto px-6 pt-20 pb-32 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-stone-300 text-xs font-medium mb-8 backdrop-blur-sm animate-fade-in-up">
          <Sparkles size={16} />
          <span>AI-Powered Visualization Engine</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight max-w-4xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          Visualize Anything <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-primary to-purple-400">In Seconds</span>
        </h1>

        <p className="text-lg md:text-xl text-stone-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          Transform complex ideas, data, and notes into professional diagrams instantly. No drag-and-drop required—just describe it.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <Link href="/sign-up" className="px-8 py-4 bg-primary text-white rounded-xl font-semibold text-lg hover:bg-primary-hover transition-all hover:scale-105 shadow-xl shadow-primary/25 flex items-center gap-2 w-full sm:w-auto justify-center">
            <Edit3 size={20} />
            Start Visualizing Free
          </Link>
          <Link href="#features" className="px-8 py-4 bg-surface-dark border border-white/10 text-white rounded-xl font-semibold text-lg hover:bg-white/5 transition-all w-full sm:w-auto justify-center">
            View Examples
          </Link>
        </div>

        {/* Hero Visual */}
        <div className="mt-20 relative max-w-5xl mx-auto rounded-2xl border border-white/10 bg-[#161b22]/80 backdrop-blur-xl shadow-2xl overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <div className="absolute top-0 left-0 w-full h-8 bg-white/5 border-b border-white/5 flex items-center px-4 gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/20"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/20"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/20"></div>
          </div>
          <div className="p-1 min-h-[400px] flex items-center justify-center relative">
             {/* Mock Visualization Elements */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full p-10 flex items-center justify-center opacity-80">
                {/* Central Node */}
                <div className="w-32 h-32 rounded-full border-2 border-primary/50 flex items-center justify-center bg-primary/10 backdrop-blur-md relative z-10">
                    <span className="font-bold text-primary">Core Idea</span>
                    {/* Connecting Lines */}
                    <div className="absolute top-1/2 left-full w-24 h-0.5 bg-gradient-to-r from-primary/50 to-transparent"></div>
                    <div className="absolute top-1/2 right-full w-24 h-0.5 bg-gradient-to-l from-primary/50 to-transparent"></div>
                    <div className="absolute left-1/2 bottom-full h-24 w-0.5 bg-gradient-to-t from-primary/50 to-transparent"></div>
                </div>

                {/* Satellite Nodes */}
                <div className="absolute top-20 left-20 p-4 rounded-xl bg-surface-dark border border-white/10 flex items-center gap-3 shadow-lg animate-float">
                    <Activity size={16} className="text-purple-500" />
                    <span className="text-sm font-medium">Timeline</span>
                </div>
                 <div className="absolute bottom-32 right-32 p-4 rounded-xl bg-surface-dark border border-white/10 flex items-center gap-3 shadow-lg animate-float" style={{ animationDelay: '1.5s' }}>
                    <BarChart2 size={16} className="text-blue-500" />
                    <span className="text-sm font-medium">Charts</span>
                </div>
                 <div className="absolute top-32 right-20 p-4 rounded-xl bg-surface-dark border border-white/10 flex items-center gap-3 shadow-lg animate-float" style={{ animationDelay: '0.8s' }}>
                    <Network size={16} className="text-emerald-500" />
                    <span className="text-sm font-medium">Mind Map</span>
                </div>
             </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-[#161b22] to-transparent"></div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="py-24 bg-surface-darker/50 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need to Visualize</h2>
            <p className="text-stone-400 max-w-2xl mx-auto">From project planning to brainstorming, our AI engine understands your intent and generates the perfect diagram.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Smart Text-to-Graph",
                desc: "Paste your notes, reports, or rough ideas. Our AI analyzes the structure and relationships to build accurate visualizations instantly.",
                icon: Sparkles,
                color: "text-blue-400"
              },
              {
                title: "Interactive Editing",
                desc: "Don't like the color? Want to expand a node? Just chat with the AI assistant to refine your diagram in real-time.",
                icon: Edit3,
                color: "text-purple-400"
              },
              {
                title: "Multi-Format Support",
                desc: "Generate mind maps, flowcharts, timelines, Gantt charts, and more. One prompt, endless possibilities.",
                icon: Network,
                color: "text-emerald-400"
              }
            ].map((feature, i) => (
              <div key={i} className="p-8 rounded-2xl bg-surface-dark border border-white/5 hover:border-primary/30 transition-all group">
                <div className={`w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center mb-6 ${feature.color} group-hover:scale-110 transition-transform`}>
                   <feature.icon size={32} />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-stone-400 leading-relaxed text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row items-center gap-16">
                <div className="flex-1">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">Built for Every Workflow</h2>
                    <div className="space-y-6">
                        {[
                            { title: "Project Managers", desc: "Turn project briefs into Gantt charts and timelines instantly.", icon: Calendar },
                            { title: "Researchers", desc: "Visualize complex relationships and knowledge graphs from papers.", icon: Network },
                            { title: "Students", desc: "Create study guides and mind maps from your lecture notes.", icon: GraduationCap },
                            { title: "Developers", desc: "Generate architecture diagrams and flowcharts from code logic.", icon: Code }
                        ].map((item, i) => (
                            <div key={i} className="flex gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors cursor-default group">
                                <div className="w-12 h-12 rounded-lg bg-surface-dark flex items-center justify-center text-stone-400 group-hover:text-primary transition-colors border border-white/5">
                                    <item.icon size={24} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white mb-1">{item.title}</h4>
                                    <p className="text-sm text-stone-400">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex-1 relative">
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-purple-500/20 blur-[100px] rounded-full"></div>
                    <div className="relative bg-[#161b22] border border-white/10 rounded-2xl p-6 shadow-2xl">
                         {/* Code/Prompt Example */}
                         <div className="font-mono text-sm space-y-4">
                            <div className="flex gap-2 text-stone-500 border-b border-white/5 pb-2 mb-4">
                                <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                            </div>
                            <div className="text-stone-400">
                                <span className="text-primary">User:</span> Create a timeline of the Space Race highlights.
                            </div>
                            <div className="text-stone-300 pl-4 border-l-2 border-primary/30">
                                <span className="text-purple-400">AI:</span> Generating timeline visualization...
                                <div className="mt-2 p-3 bg-surface-dark rounded border border-white/5 flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                        <span className="text-xs">1957: Sputnik 1 Launched</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                        <span className="text-xs">1961: Yuri Gagarin in Space</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                        <span className="text-xs">1969: Apollo 11 Moon Landing</span>
                                    </div>
                                </div>
                            </div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface-darker border-t border-white/5 py-12">
        <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold">V</div>
                    <span className="font-bold">VisualMe</span>
                </div>
                <div className="flex gap-8 text-sm text-stone-400">
                    <a href="#" className="hover:text-white transition-colors">Privacy</a>
                    <a href="#" className="hover:text-white transition-colors">Terms</a>
                    <a href="#" className="hover:text-white transition-colors">Contact</a>
                </div>
                <div className="text-sm text-stone-500">
                    © 2024 VisualMe. All rights reserved.
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
}
