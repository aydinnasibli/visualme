import { SignIn } from '@clerk/nextjs';
import { History, Sparkles } from 'lucide-react';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[120px] opacity-30 animate-pulse-slow" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] opacity-20 animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">

        {/* Left Side */}
        <div className="hidden lg:flex flex-col gap-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-linear-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-indigo-500/20">V</div>
            <h1 className="text-3xl font-bold tracking-tight text-white">VisualMe</h1>
          </div>

          <h2 className="text-4xl font-bold leading-tight text-white">
            Welcome back, <br /> Creator.
          </h2>

          <p className="text-lg text-zinc-400 max-w-md">
            Continue where you left off. Your visualizations are waiting for you.
          </p>

          <div className="space-y-4 mt-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800 border border-white/5">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <History size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-white">Access History</h3>
                <p className="text-sm text-zinc-400">View and edit your past diagrams.</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800 border border-white/5">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
                <Sparkles size={24} className="font-bold" />
              </div>
              <div>
                <h3 className="font-semibold text-white">More Tokens</h3>
                <p className="text-sm text-zinc-400">Check your monthly usage and limits.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex flex-col items-center justify-center">
          <div className="w-full max-w-md bg-slate-800 border border-white/10 p-1 rounded-2xl shadow-2xl">
            <SignIn
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "bg-slate-800 border-none shadow-none w-full p-6",
                  headerTitle: "text-white text-2xl font-bold",
                  headerSubtitle: "text-zinc-400",
                  socialButtonsBlockButton: "bg-white/5 border border-white/10 hover:bg-white/10 text-white",
                  socialButtonsBlockButtonText: "text-white font-medium",
                  dividerLine: "bg-white/10",
                  dividerText: "text-zinc-500",
                  formFieldLabel: "text-zinc-300",
                  formFieldInput: "bg-slate-900 border-white/10 text-white focus:border-indigo-500/50",
                  formButtonPrimary: "bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20",
                  footerActionText: "text-zinc-400",
                  footerActionLink: "text-indigo-400 hover:text-indigo-300",
                  identityPreviewText: "text-zinc-300",
                  identityPreviewEditButton: "text-indigo-400 hover:text-indigo-300",
                },
                options: {
                  socialButtonsPlacement: 'bottom',
                  socialButtonsVariant: 'blockButton',
                },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
