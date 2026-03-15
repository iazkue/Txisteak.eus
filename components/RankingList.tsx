
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
    <div className="space-y-4">
      {isLoading && items.length === 0 && (
        <div className="py-12 flex justify-center">
          <LoadingSpinner />
        </div>
      )}
      
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}
      
      {!isLoading && !error && items.length === 0 && (
        <p className="text-stone-400 italic text-center py-8">Ez dago daturik sailkapen honetarako.</p>
      )}
      
      {items.length > 0 && (
        <ul className="divide-y divide-stone-100">
          <AnimatePresence initial={false}>
            {items.map((item, index) => (
              <motion.li
                key={(item as any).id || index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="py-4 first:pt-0 last:pb-0"
              >
                {renderItem(item, index)}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
      
      {onLoadMore && hasMore && (
        <div className="mt-8 text-center">
          <Button 
            onClick={onLoadMore} 
            variant="ghost" 
            size="sm"
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? 'Kargatzen...' : 'Gehiago Ikusi'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default RankingList;
