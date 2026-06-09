import type { UserResource } from '@clerk/types';
import Link from 'next/link';
import { Settings, FolderOpen, LayoutDashboard } from 'lucide-react';
import ThemeToggle from '@/components/dashboard/ThemeToggle';

interface HeaderProps {
  user: UserResource | null;
  label?: string;
  /** Page-specific action(s) rendered before the theme toggle (e.g. a tool launcher button). */
  actions?: React.ReactNode;
}

const Header = ({ user, label = 'Playground', actions }: HeaderProps) => {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 flex items-center justify-between px-6 z-20 border-b border-edge/60 bg-surface-0/70 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="flex items-center gap-3 group" title="Back to dashboard">
          <div className="w-8 h-8 rounded-lg bg-surface-2 border border-edge flex items-center justify-center text-accent font-display font-semibold group-hover:border-accent/40 transition-colors">V</div>
          <h1 className="font-display text-ink text-xl font-semibold leading-normal tracking-tight group-hover:text-accent transition-colors">VisualMe</h1>
        </Link>
        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-surface-1 text-ink-faint border border-edge ml-2">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <ThemeToggle />
        <div className="h-6 w-px bg-edge/70" />
        <Link href="/my-visualizations" className="w-9 h-9 rounded-lg flex items-center justify-center text-ink-faint hover:text-ink hover:bg-surface-2 transition-colors" title="My Visualizations">
          <FolderOpen className="w-[18px] h-[18px]" />
        </Link>
        <Link href="/dashboard/builder" className="w-9 h-9 rounded-lg flex items-center justify-center text-ink-faint hover:text-ink hover:bg-surface-2 transition-colors" title="Dashboard Builder">
          <LayoutDashboard className="w-[18px] h-[18px]" />
        </Link>
        <Link href="/dashboard/settings" className="w-9 h-9 rounded-lg flex items-center justify-center text-ink-faint hover:text-ink hover:bg-surface-2 transition-colors" title="Settings">
          <Settings className="w-[18px] h-[18px]" />
        </Link>
        <div className="w-9 h-9 rounded-full bg-surface-2 overflow-hidden relative cursor-pointer ring-1 ring-edge hover:ring-accent/50 transition-all">
          {user?.imageUrl ? (
            <img alt="User Profile" className="w-full h-full object-cover" src={user.imageUrl} />
          ) : (
            <div className="w-full h-full bg-surface-3 flex items-center justify-center text-ink-muted font-semibold text-sm">
              {user?.firstName?.[0] || 'A'}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
