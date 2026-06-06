import type { UserResource } from '@clerk/types';
import Link from 'next/link';
import { Settings, FolderOpen } from 'lucide-react';

interface HeaderProps {
  user: UserResource | null;
}

const Header = ({ user }: HeaderProps) => {
  return (
    <header className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-6 z-20 pointer-events-none">
      <div className="flex items-center gap-3 pointer-events-auto">
        <div className="w-8 h-8 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center text-indigo-400 font-bold shadow-lg">V</div>
        <h1 className="text-zinc-100 text-xl font-bold leading-normal tracking-tight drop-shadow-md">VisualMe</h1>
        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-900/80 text-zinc-400 border border-white/5 backdrop-blur-sm ml-2">Playground</span>
      </div>
      <div className="flex items-center gap-3 pointer-events-auto">
        <div className="glass-panel rounded-full px-2 py-1 flex items-center gap-1">
          <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden relative cursor-pointer ring-1 ring-white/10 hover:ring-indigo-500/50 transition-all">
            {user?.imageUrl ? (
              <img alt="User Profile" className="w-full h-full object-cover" src={user.imageUrl} />
            ) : (
              <div className="w-full h-full bg-zinc-700 flex items-center justify-center text-zinc-400 font-bold">
                {user?.firstName?.[0] || 'A'}
              </div>
            )}
          </div>
          <Link href="/my-visualizations" className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-colors" title="My Visualizations">
            <FolderOpen className="w-5 h-5" />
          </Link>
          <Link href="/dashboard/settings" className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-colors" title="Settings">
            <Settings className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
