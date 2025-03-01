'use client';

import React, { useRef, useEffect, useState } from 'react';
import MondayBoard from './components/MondayBoard';

export default function Home() {
  const boardRef = useRef<{ fetchItems: (boardId: number) => void }>();
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Check for authentication errors in URL
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    if (error) {
      setAuthError(error);
      // Clear the error from URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center mb-8">לוח פריטים</h1>
        
        {authError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Authentication Error: </strong>
            <span className="block sm:inline">{authError}</span>
          </div>
        )}

        <MondayBoard ref={boardRef} />
      </div>
    </main>
  );
}
