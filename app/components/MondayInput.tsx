'use client';

import React, { useState } from 'react';
import mondaySdk from 'monday-sdk-js';

const monday = mondaySdk();

interface MondayInputProps {
  onSubmit?: (value: string) => void;
  onItemCreated?: () => void;
}

function MondayInput(props: MondayInputProps) {
  const { onSubmit, onItemCreated } = props;
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
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg" dir="rtl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="item-input" className="block text-sm font-medium text-gray-700">
            הוספת פריט חדש
          </label>
          <input
            id="item-input"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="הכנס טקסט..."
            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-right"
            required
            disabled={loading}
            dir="rtl"
          />
          <p className="mt-1 text-sm text-gray-500">
            הכנס את הטקסט שברצונך להוסיף ללוח
          </p>
        </div>
        {error && (
          <div className="text-red-600 text-sm text-right">
            {error}
          </div>
        )}
        <button
          type="submit"
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white ${
            loading 
              ? 'bg-blue-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          }`}
          disabled={loading}
        >
          {loading ? 'מוסיף...' : 'הוסף'}
        </button>
      </form>
    </div>
  );
}

export default MondayInput; 