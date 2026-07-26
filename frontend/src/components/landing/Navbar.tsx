import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { useAuth } from '../../auth/AuthContext';
import { DragonflyLogo } from '../ui/DragonflyLogo';

export const Navbar: React.FC = () => {
  const { status, user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  // Clean, uncluttered Swiss Editorial navigation links
  const navLinks = [
    { label: 'PROTOCOL', href: '#how-it-works', num: '01' },
    { label: 'SCIENCE', href: '#science', num: '02' },
    { label: 'BENCHMARKS', href: '#precision', num: '03' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
        scrolled
          ? 'bg-[#F6F4EF]/95 backdrop-blur-md border-[#E5E0D8] shadow-sm py-4'
          : 'bg-transparent border-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 flex items-center justify-between">
        {/* Brand Logo - >|< Bold Dragonfly Symbol */}
        <Link to="/">
          <DragonflyLogo size="md" />
        </Link>

        {/* Uncluttered Navigation Links - Monospace Technical Numbers */}
        <nav className="hidden md:flex items-center gap-10 font-mono-tech text-xs">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 text-[#4C6072] hover:text-[#26384B] transition-colors group"
            >
              <span className="text-[#C67C5A] font-bold opacity-80 group-hover:opacity-100">
                /{link.num}
              </span>
              <span className="tracking-widest uppercase">{link.label}</span>
            </a>
          ))}
        </nav>

        {/* Clean Action Controls (Zero clutter) */}
        <div className="flex items-center gap-5">
          {status === 'authenticated' ? (
            <>
              <Link to={user?.role === 'admin' ? '/admin' : '/app'}>
                <Button
                  variant="primary"
                  size="sm"
                  className="rounded-none px-6 py-2 bg-[#26384B] text-[#F6F4EF] font-mono-tech text-xs tracking-wider hover:bg-[#1F3142]"
                >
                  [ DASHBOARD ]
                </Button>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="font-mono-tech text-xs text-[#4C6072] hover:text-[#26384B] underline-offset-4 hover:underline transition-all tracking-wider"
              >
                LOGOUT
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hidden sm:inline-block">
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-none px-5 py-2 border border-[#E5E0D8] bg-transparent text-[#26384B] font-mono-tech text-xs tracking-wider hover:bg-[#26384B] hover:text-[#F6F4EF] hover:border-[#26384B]"
                >
                  LOGIN
                </Button>
              </Link>
              <Link to="/signup">
                <Button
                  variant="primary"
                  size="sm"
                  className="rounded-none px-6 py-2 bg-[#26384B] text-[#F6F4EF] font-mono-tech text-xs tracking-wider shadow-sm hover:bg-[#1F3142] transition-all"
                >
                  [ START ANALYSIS ]
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
