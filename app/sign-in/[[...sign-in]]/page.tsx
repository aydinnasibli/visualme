import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#0f1419] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="size-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white shadow-lg shadow-primary/30">
            <span className="material-symbols-outlined text-4xl font-bold">auto_awesome</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            VisualMe
          </h1>
          <p className="text-slate-400">Sign in to start visualizing</p>
        </div>
        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-[#1c1f27] border border-[#282e39] shadow-2xl",
            },
          }}
          afterSignInUrl="/dashboard"
          redirectUrl="/dashboard"
          signUpUrl="/sign-up"
        />
      </div>
    </div>
  );
}
