import React, { useState, useEffect } from 'react';
import { SubmitJokePayload } from '../types';
import Button from './Button';

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
  const [pueblo, setPueblo] = useState(''); // New state for town/city
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset form and feedback when modal opens
      setTestua('');
      setEmail('');
      setIzena('');
      setAbizenak('');
      setPueblo(''); // Reset herria
      setFeedback(null);
      setFeedbackType(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testua.trim() || !email.trim() || !izena.trim() || !abizenak.trim() || !pueblo.trim()) {
      setFeedback('Beharrezko eremu guztiak bete behar dituzu (Txistea, Izena, Abizenak, Herria, Posta Elektronikoa).');
      setFeedbackType('error');
      return;
    }
    setIsSubmitting(true);
    setFeedback('Bidaltzen...');
    setFeedbackType(null);

    const result = await onSubmit({ testua, email, izena, abizenak, pueblo }); // Include pueblo in submission
    setIsSubmitting(false);
    if (result) {
        setFeedback(result.message);
        setFeedbackType(result.success ? 'success' : 'error');
        if (result.success) {
            setTimeout(() => {
                onClose(); // Close modal on success after a short delay
            }, 2000);
        }
    } else { // If onSubmit doesn't return specific feedback (e.g. throws error caught by parent)
        setFeedback('Errore bat gertatu da bidalketan.');
        setFeedbackType('error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out">
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl w-full max-w-lg transform transition-all duration-300 ease-in-out scale-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-red-600">Bidali Zure Txistea</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="txisteBerriaTestua" className="block text-sm font-medium text-gray-700 mb-1">Txistea</label>
            <textarea
              id="txisteBerriaTestua"
              value={testua}
              onChange={(e) => setTestua(e.target.value)}
              placeholder="Idatzi hemen zure txistea..."
              rows={4}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
              required
              aria-required="true"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="izena" className="block text-sm font-medium text-gray-700 mb-1">Izena</label>
              <input
                type="text"
                id="izena"
                value={izena}
                onChange={(e) => setIzena(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                required
                aria-required="true"
              />
            </div>
            <div>
              <label htmlFor="abizenak" className="block text-sm font-medium text-gray-700 mb-1">Abizenak</label>
              <input
                type="text"
                id="abizenak"
                value={abizenak}
                onChange={(e) => setAbizenak(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                required
                aria-required="true"
              />
            </div>
          </div>
           <div className="mb-4">
            <label htmlFor="pueblo" className="block text-sm font-medium text-gray-700 mb-1">Herria</label>
            <input
              type="text"
              id="pueblo"
              value={pueblo}
              onChange={(e) => setPueblo(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
              required
              aria-required="true"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Posta Elektronikoa</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
              required
              aria-required="true"
            />
          </div>
          {feedback && (
            <p className={`mb-4 text-sm ${feedbackType === 'success' ? 'text-green-600' : feedbackType === 'error' ? 'text-red-600' : 'text-gray-600'}`}>
              {feedback}
            </p>
          )}
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Utzi
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Bidaltzen...' : 'Bidali'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitJokeModal;