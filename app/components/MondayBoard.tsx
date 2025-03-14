'use client';

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import mondaySdk from 'monday-sdk-js';
import EmailTemplate from './EmailTemplate';

const monday = mondaySdk();

interface ColumnValue {
  id: string;
  text: string;
  value: string;
  column: {
    id: string;
    title: string;
    type: string;
  };
}

interface BoardItem {
  id: string;
  name: string;
  column_values: ColumnValue[];
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

// Helper function to retry API calls
const retryApiCall = async (apiCall: () => Promise<any>, maxRetries = 3, delay = 1000) => {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`API call attempt ${attempt}/${maxRetries}`);
      return await apiCall();
    } catch (err) {
      lastError = err;
      console.error(`Attempt ${attempt} failed:`, err);
      if (attempt < maxRetries) {
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        // Increase delay for next attempt
        delay *= 2;
      }
    }
  }
  throw lastError;
};

const MondayBoard = forwardRef((props, ref) => {
  const [board, setBoard] = useState<Board | null>(null);
  const [items, setItems] = useState<BoardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [context, setContext] = useState<Context | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedItem, setSelectedItem] = useState<BoardItem | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);

  const fetchItems = async (boardId: number) => {
    try {
      // Always use board 1720560988 regardless of what's passed
      const targetBoardId = 1720560988;
      console.log('Fetching items for board:', targetBoardId);
      setLoading(true);

      // Verify token is set
      const token = process.env.NEXT_PUBLIC_MONDAY_API_TOKEN;
      if (!token) {
        throw new Error('Monday.com API token not found');
      }
      console.log('API Token available:', token.substring(0, 10) + '...' + token.substring(token.length - 5));

      // Initialize SDK with token
      console.log('Setting token in SDK');
      monday.setToken(token);
      
      // Add Authorization header explicitly
      const apiOptions = {
        apiVersion: '2024-01',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      };
      
      // Test API connection first with a simpler query
      console.log('Testing API connection with simple query');
      const testResponse = await retryApiCall(() => monday.api(`
        query {
          me {
            name
            email
          }
        }
      `, apiOptions));

      console.log('Authentication test raw response:', JSON.stringify(testResponse));

      if (!testResponse?.data?.me) {
        console.error('Authentication test failed:', testResponse);
        throw new Error('Failed to authenticate with Monday.com API');
      }

      console.log('Authentication successful as:', testResponse.data.me.name);
      
      // Implement proper pagination to fetch all items
      const pageSize = 500; // Maximum page size
      let hasMoreItems = true;
      let cursor: string | null = null;
      let allItems: BoardItem[] = [];
      
      console.log('Starting pagination to fetch all items from board', targetBoardId);
      
      // Loop until we've fetched all items
      while (hasMoreItems) {
        // Fetch board data with explicit API version and pagination
        const response = await retryApiCall(() => monday.api(`
          query {
            boards(ids: ${targetBoardId}) {
              name
              columns {
                id
                title
                type
              }
              items_page(limit: ${pageSize}${cursor ? `, cursor: "${cursor}"` : ''}) {
                cursor
                items {
                  id
                  name
                  column_values {
                    id
                    text
                    value
                    column {
                      id
                      title
                      type
                    }
                  }
                }
              }
            }
          }
        `, apiOptions));

        // Log the raw response for debugging
        console.log('Raw API Response for page:', cursor || 'initial');

        if (!response?.data) {
          console.error('Invalid API response:', response);
          throw new Error('Invalid response from Monday.com API');
        }

        if (!response.data?.boards || response.data.boards.length === 0) {
          console.error('No board data in response:', response);
          throw new Error('Board not found or inaccessible');
        }

        const boardData = response.data.boards[0];
        
        // Only set board data on the first page
        if (allItems.length === 0) {
          setBoard(boardData);
        }
        
        if (!boardData.items_page?.items) {
          console.error('No items found in board:', boardData);
          throw new Error('No items found in board');
        }

        const pageItems = boardData.items_page.items;
        const nextCursor = boardData.items_page.cursor;
        
        console.log(`Fetched ${pageItems.length} items from board (page cursor: ${cursor || 'initial'})`);
        
        // Add the fetched items to our collection
        allItems = [...allItems, ...pageItems];
        
        // Check if we need to fetch more items
        if (nextCursor && pageItems.length === pageSize) {
          cursor = nextCursor;
          console.log(`More items available, continuing with cursor: ${cursor}`);
        } else {
          hasMoreItems = false;
          console.log(`No more items to fetch, total items: ${allItems.length}`);
        }
      }
      
      console.log(`Fetched a total of ${allItems.length} items from board`);
      
      // Filter items where color_mknv2m3p equals "Ready"
      const filteredItems = allItems.filter((item: BoardItem) => {
        const colorColumn = item.column_values.find((col: ColumnValue) => col.id === 'color_mknv2m3p');
        
        // Log the color field value for debugging
        if (colorColumn) {
          console.log(`Item ${item.id} - ${item.name} has color_mknv2m3p value:`, colorColumn.text);
        }
        
        // Check if the field exists and has value "Ready"
        return colorColumn && colorColumn.text === 'Ready';
      });
      
      console.log(`Filtered to ${filteredItems.length} items with color_mknv2m3p = "Ready"`);
      
      // Set filtered items
      setItems(filteredItems);
      
      if (filteredItems.length > 0) {
        const firstItem = filteredItems[0];
        console.log('Sample columns from first item:', firstItem.column_values.map((col: ColumnValue) => ({
          id: col.id,
          title: col.column.title,
          text: col.text
        })));
      }

    } catch (err) {
      console.error('Detailed error:', err);
      let errorMessage = err instanceof Error ? err.message : 'Failed to fetch items';
      
      // Check if the error is HTML (authentication error)
      if (typeof errorMessage === 'string' && errorMessage.toLowerCase().includes('<!doctype')) {
        errorMessage = 'Authentication failed. Please check your Monday.com API token.';
      }
      
      console.error('Error details:', {
        message: errorMessage,
        boardId,
        token: process.env.NEXT_PUBLIC_MONDAY_API_TOKEN ? 'Present' : 'Missing'
      });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    fetchItems
  }));

  useEffect(() => {
    // Initialize the SDK
    const token = process.env.NEXT_PUBLIC_MONDAY_API_TOKEN || '';
    console.log('Initializing Monday SDK with token:', token ? `${token.substring(0, 10)}...${token.substring(token.length - 5)}` : 'No token');
    monday.setToken(token);
    
    // Check if we're running inside Monday.com
    const isEmbedded = window.location.hostname.includes('monday.com');
    console.log('Running in embedded mode:', isEmbedded);
    
    if (isEmbedded) {
      // When embedded in Monday.com, use their context
      monday.listen("context", (res) => {
        console.log("Context changed:", res.data);
        const contextData = res.data as Context;
        setContext(contextData);
        setIsAuthenticated(true);
        if (contextData.boardId) {
          fetchItems(contextData.boardId);
        }
      });
    } else {
      // When running standalone, check for authentication
      const token = process.env.NEXT_PUBLIC_MONDAY_API_TOKEN;
      const defaultBoardId = process.env.NEXT_PUBLIC_MONDAY_BOARD_ID;
      
      if (token && defaultBoardId) {
        // Only set as authenticated if we have both token and board ID
        setIsAuthenticated(true);
        setContext({ boardId: Number(defaultBoardId) });
        fetchItems(Number(defaultBoardId));
      } else {
        setLoading(false);
        // Don't set error, just leave isAuthenticated as false to show auth button
      }
    }
  }, []);

  const handleAuth = () => {
    const clientId = process.env.NEXT_PUBLIC_MONDAY_CLIENT_ID;
    const mondayRedirectUrl = process.env.NEXT_PUBLIC_MONDAY_REDIRECT_URL;
    
    if (!clientId) {
      console.error('Client ID not configured');
      setError('Client ID not configured');
      return;
    }

    // For Monday.com apps, we need to use their installation flow
    const redirectUri = mondayRedirectUrl || `${window.location.origin}/api/auth/callback`;
    const installUrl = `https://auth.monday.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=boards:read`;
    
    // When running locally, we need to handle this differently
    if (window.location.hostname === 'localhost') {
      // For local development, open Monday.com in a new tab
      window.open('https://monday.com/apps/installed', '_blank');
      setError('Please install and access this app from within Monday.com');
    } else {
      window.location.href = installUrl;
    }
  };

  const handleItemClick = (item: BoardItem) => {
    console.log('Item clicked:', item.id);
    console.log('Item columns:', item.column_values.map(col => ({
      id: col.id,
      title: col.column.title,
      text: col.text
    })));
    setSelectedItem(item);
    // Don't reset column selection when selecting a new item
    // setSelectedColumn(null);
  };

  const handleColumnClick = (e: React.MouseEvent, item: BoardItem, columnId: string) => {
    e.stopPropagation(); // Prevent item click from triggering
    console.log('Column clicked:', columnId, 'for item:', item.id);
    console.log('Column data:', item.column_values.find(col => col.id === columnId));
    
    setSelectedItem(item);
    setSelectedColumn(columnId);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const isLocalhost = window.location.hostname === 'localhost';
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">
          {isLocalhost 
            ? 'This app needs to be accessed from within Monday.com' 
            : 'Please authenticate with Monday.com to continue'}
        </p>
        <button
          onClick={handleAuth}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          {isLocalhost ? 'Open Monday.com Apps' : 'Connect to Monday.com'}
        </button>
        {isLocalhost && (
          <p className="mt-4 text-sm text-gray-500">
            After installing the app in Monday.com, please access it through their platform
          </p>
        )}
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
      <div className="flex justify-between items-center mb-6" dir="rtl">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold">
            {board?.name || 'לוח פריטים'}
          </h2>
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
            מזהה לוח: {context?.boardId}
          </span>
        </div>
      </div>

      {selectedItem && selectedColumn && context?.boardId && (
        <div className="mb-8">
          <EmailTemplate
            boardId={context.boardId}
            itemId={selectedItem.id}
            columnId={selectedColumn}
            boardItems={items}
          />
        </div>
      )}
      
      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">לא נמצאו פריטים בלוח</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {items.map((item) => {
              const filteredColumns = item.column_values.filter((col: ColumnValue) => {
                // Log all column titles to help with debugging
                console.log(`Column title: "${col.column.title}", id: ${col.column.id}, has text: ${!!col.text}`);
                
                // Include the 4 columns: 2 existing + 2 query columns
                const isRelevant = 
                  // 2 existing columns
                  col.column.title === '❗ סקטסט אנגלית' || 
                  col.column.title === '❗טקטסט אנגלית' ||
                  col.column.title.includes('טקסט') && col.column.title.includes('אנגלית') ||
                  col.column.title === '🔸שם עסק מקורי מבעל העסק' ||
                  col.column.title.includes('שם עסק מקורי') ||
                  
                  // 2 query columns
                  col.column.id === 'connect_boards' ||
                  col.column.id === 'status';
                
                return isRelevant;
              });

              // Log the filtered columns for this item
              console.log(`Item ${item.name} has ${filteredColumns.length} filtered columns:`, 
                filteredColumns.map(col => col.column.title));

              return (
                <div
                  key={item.id}
                  className={`p-4 border rounded-lg hover:shadow-md transition-shadow ${
                    selectedItem?.id === item.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => handleItemClick(item)}
                  dir="rtl"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-medium text-lg">{item.name}</h3>
                  </div>
                  {filteredColumns.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {filteredColumns.map((column) => (
                        <div 
                          key={column.id}
                          className={`text-sm p-3 rounded-lg cursor-pointer border ${
                            selectedItem?.id === item.id && selectedColumn === column.id
                              ? 'bg-blue-100 border-blue-300 ring-2 ring-blue-500'
                              : selectedItem?.id === item.id
                              ? 'hover:bg-blue-50 border-gray-300'
                              : 'hover:bg-gray-50 border-gray-200'
                          }`}
                          onClick={(e) => handleColumnClick(e, item, column.id)}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-700 mb-1">{column.column.title}</span>
                            <span className="text-gray-900 whitespace-pre-wrap">{column.text || 'No content'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No relevant columns found</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

MondayBoard.displayName = 'MondayBoard';

export default MondayBoard; 