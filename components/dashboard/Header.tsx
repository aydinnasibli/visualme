import type { UserResource } from '@clerk/types';
import Link from 'next/link';
import { Settings, FolderOpen } from 'lucide-react';
import ThemeToggle from '@/components/dashboard/ThemeToggle';

interface HeaderProps {
  user: UserResource | null;
}

const Header = ({ user }: HeaderProps) => {
  return (
    <header className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-6 z-20 pointer-events-none">
      <div className="flex items-center gap-3 pointer-events-auto">
        <div className="w-8 h-8 rounded-lg bg-surface-2 border border-edge flex items-center justify-center text-accent font-display font-semibold">V</div>
        <h1 className="font-display text-ink text-xl font-semibold leading-normal tracking-tight">VisualMe</h1>
        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-surface-1 text-ink-faint border border-edge ml-2">Playground</span>
      </div>
      <div className="flex items-center gap-3 pointer-events-auto">
        <ThemeToggle />
        <div className="surface-panel rounded-full px-2 py-1 flex items-center gap-1">
          <div className="w-8 h-8 rounded-full bg-surface-2 overflow-hidden relative cursor-pointer ring-1 ring-edge hover:ring-accent/50 transition-all">
            {user?.imageUrl ? (
              <img alt="User Profile" className="w-full h-full object-cover" src={user.imageUrl} />
            ) : (
              <div className="w-full h-full bg-surface-3 flex items-center justify-center text-ink-muted font-semibold">
                {user?.firstName?.[0] || 'A'}
              </div>
            )}
          </div>
          <Link href="/my-visualizations" className="w-8 h-8 rounded-full flex items-center justify-center text-ink-faint hover:text-ink hover:bg-surface-2 transition-colors" title="My Visualizations">
            <FolderOpen className="w-5 h-5" />
          </Link>
          <Link href="/dashboard/settings" className="w-8 h-8 rounded-full flex items-center justify-center text-ink-faint hover:text-ink hover:bg-surface-2 transition-colors" title="Settings">
            <Settings className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
