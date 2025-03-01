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
    <main className="min-h-screen p-8 bg-gray-50" dir="rtl">
      <div className="max-w-5xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center mb-8">לוח פריטים</h1>
        
        {authError && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-center">
            {authError === 'no_code' && 'האימות נכשל: לא התקבל קוד אישור'}
            {authError === 'auth_failed' && 'האימות נכשל: אנא נסה שוב'}
            {authError !== 'no_code' && authError !== 'auth_failed' && `שגיאת אימות: ${authError}`}
          </div>
        )}

        <MondayBoard ref={boardRef} />
      </div>
    </main>
  );
}
