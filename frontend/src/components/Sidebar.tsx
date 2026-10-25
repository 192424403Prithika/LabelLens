import React from 'react';
import { 
  LayoutGrid, 
  Scan, 
  Apple, 
  Layers, 
  SlidersHorizontal, 
  Bookmark, 
  FlaskConical, 
  LogOut,
  Sparkles
} from 'lucide-react';
import type { UserProfile } from '../types';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  user: UserProfile | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab, user }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
    { id: 'scan', label: 'Scan Product', icon: Scan },
    { id: 'landing', label: 'Food Overview', icon: Apple },
    { id: 'compare', label: 'Compare Foods', icon: Layers },
    { id: 'preferences', label: 'My Preferences', icon: SlidersHorizontal },
    { id: 'history', label: 'Saved & History', icon: Bookmark },
    { id: 'evaluation', label: 'AI Evaluation', icon: FlaskConical },
  ];

  return (
    <aside style={{
      width: '260px',
      minWidth: '260px',
      backgroundColor: 'var(--bg-sidebar)',
      minHeight: '100vh',
      padding: '2rem 1.25rem 2rem 1.75rem',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid rgba(116, 103, 94, 0.08)'
    }}>
      {/* Brand Title */}
      <div 
        onClick={() => setCurrentTab('dashboard')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          cursor: 'pointer',
          marginBottom: '2rem',
          userSelect: 'none'
        }}
      >
        <span style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '1.75rem',
          fontWeight: 700,
          color: 'var(--text-dark)',
          letterSpacing: '-0.02em'
        }}>
          Label<span style={{ color: 'var(--tangerine-warm)' }}>Lens</span>
        </span>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: 'var(--forest-deep)',
          marginTop: '6px'
        }} />
      </div>

      {/* User Profile Card */}
      <div 
        onClick={() => setCurrentTab('preferences')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.9rem',
          marginBottom: '2.25rem',
          cursor: 'pointer',
          padding: '0.25rem'
        }}
        title="View profile & dietary preferences"
      >
        <div style={{
          width: '54px',
          height: '54px',
          borderRadius: '50%',
          overflow: 'hidden',
          backgroundColor: '#dfcfc2',
          border: '2px solid rgba(255, 255, 255, 0.8)',
          boxShadow: 'var(--shadow-soft)',
          flexShrink: 0
        }}>
          <img 
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80" 
            alt="User profile" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: '1.05rem',
            fontWeight: 700,
            color: 'var(--text-dark)',
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {user?.full_name || 'Sophia Tompson'}
          </div>
          <div style={{
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            marginTop: '2px',
            fontWeight: 500
          }}>
            {user?.preferences?.diet?.[0] || 'Vegetarian'} Shopper
          </div>
        </div>
      </div>

      {/* Nav List */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', flex: 1 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.9rem',
                padding: '0.75rem 1.1rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.925rem',
                fontWeight: active ? 700 : 500,
                color: active ? 'var(--text-dark)' : 'var(--text-secondary)',
                backgroundColor: active ? 'var(--sidebar-active)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.18s ease',
                boxShadow: active ? '0 4px 12px rgba(60, 48, 42, 0.06)' : 'none',
                transform: active ? 'translateX(2px)' : 'none'
              }}
            >
              <Icon 
                size={19} 
                color={active ? 'var(--text-dark)' : 'var(--text-secondary)'} 
                strokeWidth={active ? 2.5 : 2}
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Logout / Mode */}
      <div style={{ paddingTop: '1.5rem', borderTop: '1px solid rgba(116, 103, 94, 0.1)' }}>
        <button
          onClick={() => setCurrentTab('landing')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            fontSize: '0.9rem',
            fontWeight: 500,
            cursor: 'pointer',
            padding: '0.5rem 0.75rem'
          }}
        >
          <LogOut size={18} />
          <span>Exit / Reset Demo</span>
        </button>
      </div>
    </aside>
  );
};
