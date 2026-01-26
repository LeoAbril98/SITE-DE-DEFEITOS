import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-100 py-12 mt-12">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">

          {/* Logo */}
          <div className="flex items-center gap-2 opacity-40 grayscale">
            <img
              src="/LOGO.png"
              alt="Wheel Catalog"
              className="h-6 w-auto object-contain"
            />
            <span className="font-bold text-sm tracking-tight">
              WHEEL CATALOG
            </span>
          </div>

          {/* Copyright */}
          <p className="text-xs text-gray-400 font-medium text-center">
            © {new Date().getFullYear()} Precision Automotive Solutions.
            Todos os direitos reservados.
          </p>

          {/* Links */}
          <div className="flex items-center gap-6">
            <a
              href="#"
              className="text-[10px] font-bold text-gray-400 hover:text-black uppercase tracking-widest"
            >
              Privacidade
            </a>
            <a
              href="#"
              className="text-[10px] font-bold text-gray-400 hover:text-black uppercase tracking-widest"
            >
              Termos
            </a>
            <a
              href="#"
              className="text-[10px] font-bold text-gray-400 hover:text-black uppercase tracking-widest"
            >
              Contato
            </a>
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;
