import React, { useState } from 'react';
import { Search, Bell, MoreVertical, Sparkles } from 'lucide-react';
import type { UserProfile } from '../types';

interface HeaderProps {
  user: UserProfile | null;
  onSearch: (query: string) => void;
  onScanClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onSearch, onScanClick }) => {
  const [searchInput, setSearchInput] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch(searchInput);
    }
  };

  const displayName = (user?.full_name || 'Sophia').split(' ')[0].toUpperCase();

  return (
    <header style={{
      padding: '2rem 2.5rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1.5rem',
      flexWrap: 'wrap'
    }}>
      {/* Greeting */}
      <div>
        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '1.85rem',
          fontWeight: 800,
          letterSpacing: '0.06em',
          color: 'var(--text-dark)',
          textTransform: 'uppercase'
        }}>
          HELLO, {displayName}!
        </h1>
        <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '2px' }}>
          Personalized Label Intelligence & Ingredient Watchlist
        </p>
      </div>

      {/* Right Controls: Inset Pill Search + Notifications + Menu */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {/* Inset Search Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-full)',
          padding: '0.65rem 1.4rem',
          width: '320px',
          boxShadow: 'inset 0 2px 4px rgba(60, 48, 42, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.5)'
        }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              onSearch(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            placeholder="search ingredients, foods..."
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '0.9rem',
              color: 'var(--text-primary)',
              width: '100%',
              fontFamily: 'inherit'
            }}
          />
        </div>

        {/* Notification Bell with Badge */}
        <div 
          onClick={onScanClick}
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            position: 'relative',
            boxShadow: 'var(--shadow-soft)',
            border: '1px solid rgba(255, 255, 255, 0.6)'
          }}
          title="Scan Food Product"
        >
          <Bell size={18} color="var(--text-dark)" />
          <span style={{
            position: 'absolute',
            top: '9px',
            right: '9px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: 'var(--tangerine-warm)'
          }} />
        </div>

        {/* Options Menu Icon */}
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--text-dark)'
        }}>
          <MoreVertical size={20} />
        </div>
      </div>
    </header>
  );
};
