'use client';

import React from 'react';
import MondayItemsList from './components/MondayItemsList';

export default function Home() {
  // Use your actual board ID here
  const boardId = 1720560983; // This is passed but MondayItemsList uses 1720560988 internally

  return (
    <main className="min-h-screen p-4 md:p-8 bg-gray-100">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Monday.com Email Generator</h1>
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800">
            <strong>Note:</strong> Using board ID 1720560988 and only showing items where the <code>color_mknv2m3p</code> field equals "Ready".
            This helps filter out items that are not ready for email generation.
          </p>
        </div>
        <MondayItemsList boardId={boardId} />
      </div>
    </main>
  );
}
