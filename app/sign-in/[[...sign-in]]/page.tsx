import { SignIn } from '@clerk/nextjs';
import { History, Sparkles } from 'lucide-react';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#101622] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] opacity-30 animate-pulse-slow"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] opacity-20 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">

        {/* Left Side: Branding / Info */}
        <div className="hidden lg:flex flex-col gap-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-primary/20">V</div>
                <h1 className="text-3xl font-bold tracking-tight text-white">VisualMe</h1>
            </div>

            <h2 className="text-4xl font-bold leading-tight text-white">
                Welcome back, <br/> Creator.
            </h2>

            <p className="text-lg text-stone-400 max-w-md">
                Continue where you left off. Your visualizations are waiting for you.
            </p>

            {/* Feature Highlights */}
            <div className="space-y-4 mt-4">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-dark border border-white/5">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <History size={20} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">Access History</h3>
                        <p className="text-sm text-stone-400">View and edit your past diagrams.</p>
                    </div>
                </div>
                 <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-dark border border-white/5">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
                        <Sparkles size={24} className="font-bold" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">More Tokens</h3>
                        <p className="text-sm text-stone-400">Check your monthly usage and limits.</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Right Side: Sign In Form */}
        <div className="flex flex-col items-center justify-center">
             <div className="w-full max-w-md bg-surface-dark border border-white/10 p-1 rounded-2xl shadow-2xl">
                 <SignIn
                    appearance={{
                        elements: {
                            rootBox: "w-full",
                            card: "bg-surface-dark border-none shadow-none w-full p-6",
                            headerTitle: "text-white text-2xl font-bold",
                            headerSubtitle: "text-stone-400",
                            socialButtonsBlockButton: "bg-white/5 border border-white/10 hover:bg-white/10 text-white",
                            socialButtonsBlockButtonText: "text-white font-medium",
                            dividerLine: "bg-white/10",
                            dividerText: "text-stone-500",
                            formFieldLabel: "text-stone-300",
                            formFieldInput: "bg-surface-darker border-white/10 text-white focus:border-primary/50",
                            formButtonPrimary: "bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/20",
                            footerActionText: "text-stone-400",
                            footerActionLink: "text-primary hover:text-primary-hover",
                            identityPreviewText: "text-stone-300",
                            identityPreviewEditButton: "text-primary hover:text-primary-hover"
                        },
                        layout: {
                            socialButtonsPlacement: 'bottom',
                            socialButtonsVariant: 'blockButton',
                        }
                    }}
                 />
             </div>
        </div>
      </div>
    </div>
  );
}
