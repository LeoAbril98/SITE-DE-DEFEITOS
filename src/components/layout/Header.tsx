import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 z-40">
      <div className="max-w-[1440px] mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">

        <a
          href="/"
          className="flex items-center gap-3 group transition-opacity hover:opacity-80 active:scale-95"
        >
          <img
            src="/LOGO.png"
            alt="Wheel Catalog"
            className="h-14 w-auto object-contain"
          />

          <span className="font-bold text-lg tracking-tight">
            WHEEL CATALOG
          </span>
        </a>

        <nav className="hidden md:flex items-center gap-6">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Inventário Premium de Defeitos v1.0
          </span>
        </nav>
      </div>
    </header>
  );
};

export default Header;
