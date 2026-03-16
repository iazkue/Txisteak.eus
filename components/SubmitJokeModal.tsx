import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SubmitJokePayload } from '../types';
import Button from './Button';
import { X } from 'lucide-react';

interface SubmitJokeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SubmitJokePayload) => Promise<{ success: boolean; message: string } | void>;
}

const SubmitJokeModal: React.FC<SubmitJokeModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [testua, setTestua] = useState('');
  const [email, setEmail] = useState('');
  const [izena, setIzena] = useState('');
  const [abizenak, setAbizenak] = useState('');
  const [pueblo, setPueblo] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitCooldown, setSubmitCooldown] = useState<number>(0);

  useEffect(() => {
    if (submitCooldown > 0) {
      const timer = setTimeout(() => setSubmitCooldown(submitCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [submitCooldown]);

  useEffect(() => {
    if (isOpen) {
      setTestua('');
      setEmail('');
      setIzena('');
      setAbizenak('');
      setPueblo('');
      setFeedback(null);
      setFeedbackType(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitCooldown > 0) return;
    if (!testua.trim() || !email.trim() || !izena.trim() || !abizenak.trim() || !pueblo.trim()) {
      setFeedback('Beharrezko eremu guztiak bete behar dituzu.');
      setFeedbackType('error');
      return;
    }
    setIsSubmitting(true);
    setFeedback('Bidaltzen...');
    setFeedbackType(null);

    const result = await onSubmit({ testua, email, izena, abizenak, pueblo });
    setIsSubmitting(false);
    if (result) {
      setFeedback(result.message);
      setFeedbackType(result.success ? 'success' : 'error');
      if (result.success) {
        setSubmitCooldown(5);
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } else {
      setFeedback('Errore bat gertatu da bidalketan.');
      setFeedbackType('error');
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-[100]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-basque-red" />

        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-stone-900">Bidali Zure Txistea</h2>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 transition-colors"
            aria-label="Itxi"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="txisteBerriaTestua" className="block text-sm font-semibold text-stone-700 mb-2">Txistea</label>
            <textarea
              id="txisteBerriaTestua"
              value={testua}
              onChange={(e) => setTestua(e.target.value)}
              placeholder="Idatzi hemen zure txistea..."
              rows={4}
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl shadow-sm focus:ring-2 focus:ring-basque-red focus:border-transparent transition-all outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="izena" className="block text-sm font-semibold text-stone-700 mb-2">Izena</label>
              <input
                type="text"
                id="izena"
                value={izena}
                onChange={(e) => setIzena(e.target.value)}
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl shadow-sm focus:ring-2 focus:ring-basque-red focus:border-transparent transition-all outline-none"
                required
              />
            </div>
            <div>
              <label htmlFor="abizenak" className="block text-sm font-semibold text-stone-700 mb-2">Abizenak</label>
              <input
                type="text"
                id="abizenak"
                value={abizenak}
                onChange={(e) => setAbizenak(e.target.value)}
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl shadow-sm focus:ring-2 focus:ring-basque-red focus:border-transparent transition-all outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="pueblo" className="block text-sm font-semibold text-stone-700 mb-2">Herria</label>
              <input
                type="text"
                id="pueblo"
                value={pueblo}
                onChange={(e) => setPueblo(e.target.value)}
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl shadow-sm focus:ring-2 focus:ring-basque-red focus:border-transparent transition-all outline-none"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-stone-700 mb-2">Posta Elektronikoa</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl shadow-sm focus:ring-2 focus:ring-basque-red focus:border-transparent transition-all outline-none"
                required
              />
            </div>
          </div>

          <AnimatePresence>
            {(feedback || submitCooldown > 0) && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`text-sm font-medium ${feedbackType === 'success' ? 'text-emerald-600' : feedbackType === 'error' ? 'text-red-600' : 'text-stone-500'}`}
              >
                {submitCooldown > 0 ? `Itxaron ${submitCooldown} segundo...` : feedback}
              </motion.p>
            )}
          </AnimatePresence>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting || submitCooldown > 0}>
              Utzi
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting || submitCooldown > 0} className="min-w-[100px]">
              {submitCooldown > 0 ? `Itxaron (${submitCooldown})` : (isSubmitting ? 'Bidaltzen...' : 'Bidali')}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default SubmitJokeModal;