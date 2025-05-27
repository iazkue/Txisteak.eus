
import React from 'react';
import Button from './Button';

interface HeaderProps {
  onOpenSubmitModal: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenSubmitModal }) => {
  return (
    <header className="bg-red-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center">
        <h1 className="text-3xl font-bold mb-2 sm:mb-0">Txisteak.eus</h1>
        <Button onClick={onOpenSubmitModal} variant="secondary" size="md">
          Zure Txistea Bidali
        </Button>
      </div>
    </header>
  );
};

export default Header;
