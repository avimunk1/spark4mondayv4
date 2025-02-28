'use client';

import { useState, useEffect } from 'react';
import mondaySdk from 'monday-sdk-js';

const monday = mondaySdk();

export default function MondayInput() {
  const [inputValue, setInputValue] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    // Initialize Monday SDK
    monday.listen('context', (res) => {
      console.log('Context changed:', res);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Sending...');
    
    try {
      // Example: Create a new item in Monday.com
      const response = await monday.api(`
        mutation {
          create_item (
            board_id: ${process.env.NEXT_PUBLIC_MONDAY_BOARD_ID}, 
            item_name: "${inputValue}"
          ) {
            id
          }
        }
      `);
      
      setStatus('Success! Item created');
      setInputValue('');
    } catch (error) {
      setStatus('Error creating item');
      console.error('Error:', error);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="item-input" className="block text-sm font-medium text-gray-700">
            New Item Name
          </label>
          <input
            id="item-input"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Enter item name"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Create Item
        </button>
        {status && (
          <p className={`text-sm ${status.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
            {status}
          </p>
        )}
      </form>
    </div>
  );
} 