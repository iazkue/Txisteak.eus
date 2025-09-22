import React, { useState } from 'react';
import Button from './Button';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <section id="bilaketa-atala" className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-red-600">Bilatu Txisteak</h2>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <label htmlFor="search-input" className="sr-only">
          Bilatu txisteak
        </label>
        <input
          id="search-input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Bilatu txiste bat..."
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 flex-grow"
        />
        <Button type="submit" variant="primary" size="md">
          Bilatu
        </Button>
      </form>
    </section>
  );
};

export default SearchBar;
