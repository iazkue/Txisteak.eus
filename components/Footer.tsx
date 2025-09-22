
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-gray-200 text-center p-6 mt-8">
      <p>&copy; {new Date().getFullYear()} <a target='_blank' href="https://github.com/iazkue/">@iazkue</a> . Eskubide guztiak erreserbatuta.</p>
    </footer>
  );
};

export default Footer;
