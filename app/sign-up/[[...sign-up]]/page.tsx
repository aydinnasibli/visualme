import { SignUp } from '@clerk/nextjs';
import { Quote } from 'lucide-react';

export default function SignUpPage() {
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
                Join thousands of users <br/> visualizing ideas instantly.
            </h2>

            <p className="text-lg text-stone-400 max-w-md">
                Create unlimited diagrams, access premium visualization types, and collaborate with your team.
            </p>

            <div className="grid grid-cols-2 gap-4 mt-4">
                 <div className="bg-surface-dark border border-white/5 p-4 rounded-xl">
                    <div className="text-2xl font-bold text-white mb-1">10k+</div>
                    <div className="text-sm text-stone-400">Visualizations Created</div>
                 </div>
                 <div className="bg-surface-dark border border-white/5 p-4 rounded-xl">
                    <div className="text-2xl font-bold text-white mb-1">4.9/5</div>
                    <div className="text-sm text-stone-400">User Rating</div>
                 </div>
            </div>

             {/* Testimonial */}
             <div className="mt-8 bg-surface-darker/50 backdrop-blur-sm p-6 rounded-2xl border border-white/5 relative">
                <div className="absolute -top-3 left-6 bg-primary text-white p-1 rounded-full">
                   <Quote size={16} />
                </div>
                <p className="text-stone-300 italic mb-4">"This tool has completely changed how I plan my projects. The ability to just type and see a Gantt chart is like magic."</p>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-stone-700"></div>
                    <div>
                        <div className="text-sm font-semibold text-white">Alex Morgan</div>
                        <div className="text-xs text-stone-500">Product Manager</div>
                    </div>
                </div>
             </div>
        </div>

        {/* Right Side: Sign Up Form */}
        <div className="flex flex-col items-center justify-center">
             <div className="w-full max-w-md bg-surface-dark border border-white/10 p-1 rounded-2xl shadow-2xl">
                 <SignUp
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
