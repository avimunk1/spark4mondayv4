'use client';

import { useRef } from 'react';
import MondayBoard from './components/MondayBoard';
import MondayInput from './components/MondayInput';

export default function Home() {
  const boardRef = useRef<{ fetchItems: (boardId: number) => void }>();

  const handleItemCreated = () => {
    const boardId = process.env.NEXT_PUBLIC_MONDAY_BOARD_ID;
    if (boardId && boardRef.current) {
      boardRef.current.fetchItems(Number(boardId));
    }
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center mb-8">Monday.com Board Items</h1>
        <MondayInput onItemCreated={handleItemCreated} />
        <MondayBoard ref={boardRef} />
      </div>
    </main>
  );
}
