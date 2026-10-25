import React from 'react';
import { 
  Scan, 
  Layers, 
  Sliders, 
  BarChart3, 
  FlaskConical, 
  Home, 
  Search, 
  Bookmark, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  user: UserProfile | null;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, user }) => {
  const navItems = [
    { id: 'landing', label: 'Overview', icon: Home },
    { id: 'dashboard', label: 'Dashboard', icon: Search },
    { id: 'scan', label: 'Scan & OCR', icon: Scan },
    { id: 'compare', label: 'Compare', icon: Layers },
    { id: 'preferences', label: 'Preferences', icon: Sliders },
    { id: 'history', label: 'History & Lists', icon: Bookmark },
    { id: 'evaluation', label: 'AI Evaluation', icon: FlaskConical },
  ];

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--slate-200)',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0.75rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        {/* Brand Logo */}
        <div 
          onClick={() => setCurrentTab('landing')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--forest-800) 0%, var(--forest-600) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(27, 67, 50, 0.25)',
            position: 'relative'
          }}>
            <Scan size={20} color="#000000" strokeWidth={2.4} />
            <span style={{
              position: 'absolute',
              top: '-3px',
              right: '-3px',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: 'var(--orange-500)',
              border: '2px solid #000000'
            }} />
          </div>
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}>
              <span style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '1.35rem',
                fontWeight: 800,
                color: 'var(--forest-900)',
                letterSpacing: '-0.03em'
              }}>
                Label<span style={{ color: 'var(--orange-600)' }}>Lens</span>
              </span>
              <span className="badge badge-forest" style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem' }}>
                AI Core
              </span>
            </div>
            <p style={{
              fontSize: '0.7rem',
              color: 'var(--slate-500)',
              fontWeight: 500,
              marginTop: '-3px'
            }}>
              Intelligent Food Label Understanding
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          backgroundColor: 'var(--cream-100)',
          padding: '0.3rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--cream-200)',
          overflowX: 'auto'
        }}>
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
                  gap: '0.4rem',
                  padding: '0.45rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  fontWeight: active ? 700 : 500,
                  color: active ? '#000000' : 'var(--slate-700)',
                  backgroundColor: active ? 'var(--forest-subtle)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                  boxShadow: active ? 'var(--shadow-sm)' : 'none'
                }}
              >
                <Icon size={16} color={active ? '#000000' : 'var(--slate-500)'} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User Status / Quick Profile */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          {user ? (
            <div 
              onClick={() => setCurrentTab('preferences')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.35rem 0.75rem',
                backgroundColor: 'var(--white)',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--slate-200)',
                cursor: 'pointer'
              }}
              title="Click to view & configure dietary preferences"
            >
              <div style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                backgroundColor: 'var(--orange-100)',
                color: 'var(--orange-700)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700
              }}>
                {user.full_name ? user.full_name.charAt(0) : 'U'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-800)', lineHeight: 1.1 }}>
                  {user.full_name || user.username}
                </span>
                <span style={{ fontSize: '0.65rem', color: 'var(--forest-600)', fontWeight: 600 }}>
                  {user.preferences?.diet?.[0] || 'Vegetarian'} • {user.preferences?.allergens_to_avoid?.length || 2} allergies
                </span>
              </div>
            </div>
          ) : null}

          <button
            onClick={() => setCurrentTab('scan')}
            className="btn btn-accent"
            style={{ padding: '0.5rem 0.95rem', fontSize: '0.85rem' }}
          >
            <Scan size={16} />
            Scan Label
          </button>
        </div>
      </div>
    </header>
  );
};
