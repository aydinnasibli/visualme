import type { UserResource } from '@clerk/types';
import { Settings } from 'lucide-react';

interface HeaderProps {
  user: UserResource | null;
}

const Header = ({ user }: HeaderProps) => {
  return (
    <header className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-6 z-20 pointer-events-none">
      <div className="flex items-center gap-3 pointer-events-auto">
        <div className="w-8 h-8 rounded-lg bg-surface-dark border border-white/10 flex items-center justify-center text-primary font-bold shadow-lg">V</div>
        <h1 className="text-stone-100 text-xl font-bold leading-normal tracking-tight drop-shadow-md">VisualMe</h1>
        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-surface-darker/80 text-stone-400 border border-white/5 backdrop-blur-sm ml-2">Playground</span>
      </div>
      <div className="flex items-center gap-3 pointer-events-auto">
        <div className="glass-panel rounded-full px-2 py-1 flex items-center gap-1">
          <div className="w-8 h-8 rounded-full bg-stone-800 overflow-hidden relative cursor-pointer ring-1 ring-white/10 hover:ring-primary/50 transition-all">
            {user?.imageUrl ? (
              <img alt="User Profile" className="w-full h-full object-cover" src={user.imageUrl} />
            ) : (
              <div className="w-full h-full bg-stone-700 flex items-center justify-center text-stone-400 font-bold">
                {user?.firstName?.[0] || 'A'}
              </div>
            )}
          </div>
          <button className="w-8 h-8 rounded-full flex items-center justify-center text-stone-500 hover:text-stone-200 hover:bg-white/5 transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
