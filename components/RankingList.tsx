
import React from 'react';
import { Joke, Submitter } from '../types';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';

interface RankingListProps<T extends Joke | Submitter> {
  title: string;
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  isLoading: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  error?: string | null;
}

const RankingList = <T extends Joke | Submitter,>({
  title,
  items,
  renderItem,
  isLoading,
  onLoadMore,
  hasMore,
  error,
}: RankingListProps<T>) => {
  return (
    <section className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-red-600">{title}</h2>
      {isLoading && items.length === 0 && <LoadingSpinner />}
      {error && <p className="text-red-500">{error}</p>}
      {!isLoading && !error && items.length === 0 && (
        <p className="text-gray-500">Ez dago daturik sailkapen honetarako.</p>
      )}
      {items.length > 0 && (
        <ol className="space-y-3 list-decimal list-inside">
          {items.map((item, index) => renderItem(item, index))}
        </ol>
      )}
      {onLoadMore && hasMore && !isLoading && (
        <div className="mt-6 text-center">
          <Button onClick={onLoadMore} variant="secondary">
            Gehiago Ikusi
          </Button>
        </div>
      )}
      {isLoading && items.length > 0 && <LoadingSpinner />}
    </section>
  );
};

export default RankingList;
