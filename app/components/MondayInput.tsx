'use client';

import { useState } from 'react';
import mondaySdk from 'monday-sdk-js';

const monday = mondaySdk();

interface MondayInputProps {
  onSubmit?: (value: string) => void;
  onItemCreated?: () => void;
}

export default function MondayInput({ onSubmit, onItemCreated }: MondayInputProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const boardId = process.env.NEXT_PUBLIC_MONDAY_BOARD_ID;
      
      if (!boardId) {
        throw new Error('Board ID not configured');
      }

      // Create a new item on the board
      const response = await monday.api(`
        mutation {
          create_item (
            board_id: ${boardId},
            item_name: "${text}",
            column_values: "{}"
          ) {
            id
          }
        }
      `);

      if (!response.data || !response.data.create_item) {
        throw new Error('Failed to create item');
      }

      if (onSubmit) {
        onSubmit(text);
      }

      if (onItemCreated) {
        onItemCreated();
      }

      // Clear the input after successful submission
      setText('');
      setError('');
    } catch (err) {
      console.error('Error creating item:', err);
      setError(err instanceof Error ? err.message : 'Failed to create item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="item-input" className="block text-sm font-medium text-gray-700">
            Text Input
          </label>
          <input
            id="item-input"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter text..."
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
            disabled={loading}
          />
          <p className="mt-1 text-sm text-gray-500">
            Enter the text you want to add to the board
          </p>
        </div>
        {error && (
          <div className="text-red-600 text-sm">
            {error}
          </div>
        )}
        <button
          type="submit"
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            loading 
              ? 'bg-blue-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          }`}
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Submit'}
        </button>
      </form>
    </div>
  );
} 