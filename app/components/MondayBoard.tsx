'use client';

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import mondaySdk from 'monday-sdk-js';

const monday = mondaySdk();

// Initialize the SDK with the API token
monday.setToken(process.env.NEXT_PUBLIC_MONDAY_API_TOKEN || '');

interface BoardItem {
  id: string;
  name: string;
  column_values: {
    id: string;
    text: string;
    value: string;
    column: {
      title: string;
    };
  }[];
}

interface Board {
  name: string;
  columns: {
    id: string;
    title: string;
    type: string;
  }[];
  items_page: {
    items: BoardItem[];
  };
}

interface Context {
  boardId?: number;
  theme?: string;
}

const MondayBoard = forwardRef((props, ref) => {
  const [board, setBoard] = useState<Board | null>(null);
  const [items, setItems] = useState<BoardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [context, setContext] = useState<Context | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const fetchItems = async (boardId: number) => {
    try {
      console.log('Fetching items for board:', boardId);
      setLoading(true);
      
      const response = await monday.api(`
        query {
          boards(ids: ${boardId}) {
            name
            columns {
              id
              title
              type
            }
            items_page {
              items {
                id
                name
                column_values {
                  id
                  text
                  value
                  column {
                    title
                  }
                }
              }
            }
          }
        }
      `);

      console.log('API Response:', response);

      if (response.data?.boards && response.data.boards.length > 0) {
        const boardData = response.data.boards[0];
        setBoard(boardData);
        if (boardData.items_page?.items) {
          console.log('Found items:', boardData.items_page.items.length);
          setItems(boardData.items_page.items);
        } else {
          console.log('No items in board');
          setItems([]);
        }
      } else {
        console.log('No board data found');
        throw new Error('Board not found or inaccessible');
      }
    } catch (err) {
      console.error('Detailed error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch items');
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    fetchItems
  }));

  useEffect(() => {
    // Check if we're in the Monday.com environment
    monday.listen("context", (res) => {
      console.log("Context changed:", res.data);
      const contextData = res.data as Context;
      setContext(contextData);
      setIsAuthenticated(true);
      if (contextData.boardId) {
        fetchItems(contextData.boardId);
      }
    });

    // Initialize authentication
    monday.get("sessionToken").then((res) => {
      console.log("Session token response:", res);
      if (res.data) {
        setIsAuthenticated(true);
        const defaultBoardId = process.env.NEXT_PUBLIC_MONDAY_BOARD_ID;
        if (defaultBoardId) {
          setContext({ boardId: Number(defaultBoardId) });
          fetchItems(Number(defaultBoardId));
        }
      } else {
        setLoading(false);
      }
    }).catch((err) => {
      console.error("Session token error:", err);
      setLoading(false);
    });
  }, []);

  const handleAuth = () => {
    const clientId = process.env.NEXT_PUBLIC_MONDAY_CLIENT_ID;
    const redirectUri = encodeURIComponent('https://spark4monday.vercel.app/api/auth/callback');
    
    if (!clientId) {
      console.error('Client ID not configured');
      return;
    }

    window.location.href = `https://auth.monday.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">Please authenticate with Monday.com to continue</p>
        <button
          onClick={handleAuth}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Connect to Monday.com
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 p-4 rounded-lg bg-red-50 text-center">
        <p className="font-semibold">Error loading board items:</p>
        <p>{error}</p>
        <button
          onClick={() => context?.boardId && fetchItems(context.boardId)}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!context?.boardId) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Waiting for board context...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">
            {board?.name || 'Board Items'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Board ID: {context?.boardId}
          </p>
        </div>
        <button
          onClick={() => context?.boardId && fetchItems(context.boardId)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>
      
      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No items found in this board</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-lg">{item.name}</h3>
                  <span className="text-sm text-gray-500">ID: {item.id}</span>
                </div>
                {item.column_values.length > 0 && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {item.column_values.map((column) => (
                      column.text && (
                        <div key={column.id} className="text-sm">
                          <span className="text-gray-600">{column.column.title}: </span>
                          <span>{column.text}</span>
                        </div>
                      )
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

MondayBoard.displayName = 'MondayBoard';

export default MondayBoard; 