
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-stone-900 text-stone-400 text-center py-12 px-4 mt-12">
      <div className="container mx-auto">
        <p className="text-sm">&copy; {new Date().getFullYear()} <a href="https://github.com/iazkue">@iazkue</a>, eskubide guztiak erreserbatuta.</p>
        <p className="text-xs mt-2 opacity-50 italic">Euskara eta umorea uztartuz.</p>
      </div>
    </footer>
  );
};

export default Footer;
