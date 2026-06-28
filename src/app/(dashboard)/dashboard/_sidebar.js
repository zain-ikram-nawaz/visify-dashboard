'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { logoutUser } from '../../../../lib/auth';

function IconGrid() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function IconWrench() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

const NAV = [
  { label: 'Overview', href: '/dashboard', icon: IconGrid },
  { label: 'Configurators', href: '/dashboard/configurator', icon: IconWrench },
  { label: 'Analytics', href: '/dashboard/analytics', icon: IconChart },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href);

  return (
    <aside className="w-56 shrink-0 min-h-screen bg-surface border-r border-rim flex flex-col">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-rim">
        <div className="text-[17px] font-bold tracking-tight text-snow">
          VI<span className="text-volt">SI</span>FY
        </div>
        <div className="text-[10px] text-dim tracking-widest mt-0.5 font-medium">
          STUDIO
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 pt-4">
        {NAV.map(({ label, href, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg mb-0.5 text-[13px] font-medium transition-colors no-underline ${
                active
                  ? 'bg-volt/10 text-glow'
                  : 'text-muted hover:text-snow hover:bg-white/[0.04]'
              }`}
            >
              <span className={active ? 'text-volt' : 'text-current'}>
                <Icon />
              </span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="p-3 border-t border-rim">
        <button
          onClick={() => logoutUser(router)}
          className="flex items-center gap-2.5 px-3 py-2.5 w-full rounded-lg text-[13px] font-medium text-muted hover:text-bad hover:bg-bad/[0.08] transition-colors text-left"
        >
          <IconLogout />
          Sign out
        </button>
      </div>
    </aside>
  );
}
