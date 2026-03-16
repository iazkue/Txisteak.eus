
import React from 'react';
import logo from './logo.svg';
import Button from './Button';
import { PlusCircle } from 'lucide-react';

interface HeaderProps {
  onOpenSubmitModal: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenSubmitModal }) => {
  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-20 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-basque-red p-2 rounded-xl flex items-center justify-center">
            <img src="/components/logo.svg" alt="Logo" className="w-6 h-6 invert brightness-0" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Txisteak.eus</h1>
        </div>
        <Button onClick={onOpenSubmitModal} variant="primary" size="md" className="gap-2">
          <PlusCircle size={18} />
          <span className="hidden sm:inline">Zure Txistea Bidali</span>
          <span className="sm:hidden">Bidali</span>
        </Button>
      </div>
    </header>
  );
};

export default Header;
