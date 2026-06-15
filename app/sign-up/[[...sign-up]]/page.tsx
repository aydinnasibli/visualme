import { SignUp } from '@clerk/nextjs';
import { Quote } from 'lucide-react';

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

        {/* Left Side */}
        <div className="hidden lg:flex flex-col gap-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-surface-2 border border-edge flex items-center justify-center text-accent font-display font-bold text-2xl">V</div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-ink">VisualMe</h1>
          </div>

          <h2 className="font-display text-4xl font-bold leading-tight text-ink">
            Join thousands of users <br /> visualizing ideas instantly.
          </h2>

          <p className="text-lg text-ink-muted max-w-md">
            Create unlimited diagrams, access premium visualization types, and collaborate with your team.
          </p>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="surface-panel p-4 rounded-xl">
              <div className="text-2xl font-bold text-ink mb-1">10k+</div>
              <div className="text-sm text-ink-muted">Visualizations Created</div>
            </div>
            <div className="surface-panel p-4 rounded-xl">
              <div className="text-2xl font-bold text-ink mb-1">4.9/5</div>
              <div className="text-sm text-ink-muted">User Rating</div>
            </div>
          </div>

          <div className="mt-8 surface-panel p-6 rounded-2xl relative">
            <div className="absolute -top-3 left-6 bg-accent text-surface-0 p-1 rounded-full">
              <Quote size={16} />
            </div>
            <p className="text-ink-muted italic mb-4">&ldquo;This tool has completely changed how I plan my projects. The ability to just type and see a Gantt chart is like magic.&rdquo;</p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-surface-3" />
              <div>
                <div className="text-sm font-semibold text-ink">Alex Morgan</div>
                <div className="text-xs text-ink-faint">Product Manager</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex flex-col items-center justify-center">
          <div className="w-full max-w-md surface-panel p-1 rounded-2xl">
            <SignUp
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
