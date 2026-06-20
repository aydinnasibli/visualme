import { SignIn } from '@clerk/nextjs';
import { History, Sparkles } from 'lucide-react';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

        {/* Left Side */}
        <div className="hidden lg:flex flex-col gap-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-surface-2 border border-edge flex items-center justify-center text-accent font-display font-bold text-2xl">V</div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-ink">Visuologia</h1>
          </div>

          <h2 className="font-display text-4xl font-bold leading-tight text-ink">
            Welcome back, <br /> Creator.
          </h2>

          <p className="text-lg text-ink-muted max-w-md">
            Continue where you left off. Your visualizations are waiting for you.
          </p>

          <div className="space-y-4 mt-4">
            <div className="flex items-center gap-4 p-4 rounded-xl surface-panel">
              <div className="w-10 h-10 rounded-lg bg-surface-2 border border-edge flex items-center justify-center text-accent shrink-0">
                <History size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-ink">Access History</h3>
                <p className="text-sm text-ink-muted">View and edit your past diagrams.</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl surface-panel">
              <div className="w-10 h-10 rounded-lg bg-surface-2 border border-edge flex items-center justify-center text-accent shrink-0">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-ink">More Tokens</h3>
                <p className="text-sm text-ink-muted">Check your monthly usage and limits.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex flex-col items-center justify-center">
          <div className="w-full max-w-md surface-panel p-1 rounded-2xl">
            <SignIn
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "bg-transparent border-none shadow-none w-full p-6",
                  headerTitle: "text-ink text-2xl font-bold",
                  headerSubtitle: "text-ink-muted",
                  socialButtonsBlockButton: "surface-control text-ink",
                  socialButtonsBlockButtonText: "text-ink font-medium",
                  dividerLine: "bg-edge",
                  dividerText: "text-ink-faint",
                  formFieldLabel: "text-ink-muted",
                  formFieldInput: "surface-control text-ink focus:border-accent/40",
                  formButtonPrimary: "bg-accent hover:bg-accent-hover text-surface-0",
                  footerActionText: "text-ink-faint",
                  footerActionLink: "text-accent hover:text-accent-hover",
                  identityPreviewText: "text-ink-muted",
                  identityPreviewEditButton: "text-accent hover:text-accent-hover",
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
