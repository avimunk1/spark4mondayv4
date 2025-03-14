'use client';

import React, { useCallback, useEffect, useState } from 'react';
import EmailTemplate from './EmailTemplate';

// Direct Monday.com API client implementation (same as in EmailTemplate)
const mondayApi = {
  token: '',
  setToken: (token: string) => {
    mondayApi.token = token;
  },
  query: async (query: string, options?: any) => {
    if (!mondayApi.token) {
      throw new Error('API token not set');
    }

    // Add a small delay to prevent rate limiting
    if (options?.delay) {
      await new Promise(resolve => setTimeout(resolve, options.delay));
    }
    
    const response = await fetch('https://api.monday.com/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': mondayApi.token,
        ...(options?.headers || {})
      },
      body: JSON.stringify({ query })
    });
    
    if (!response.ok) {
      throw new Error(`API call failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check for errors in the response
    if (data.errors && data.errors.length > 0) {
      const errorMessage = data.errors.map((e: any) => e.message).join(', ');
      console.error(`API returned errors: ${errorMessage}`);
      throw new Error(errorMessage);
    }
    
    return data;
  }
};

// Helper function to retry API calls
const retryApiCall = async (apiCall: () => Promise<any>, maxRetries = 2, delay = 500) => {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await apiCall();
      return result;
    } catch (err) {
      lastError = err;
      console.error(`API attempt ${attempt} failed:`, err);
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay));
        // Increase delay for next attempt but not too much
        delay = Math.min(delay * 1.5, 2000);
      }
    }
  }
  throw lastError;
};

interface MondayItemsListProps {
  boardId: number;
}

// Define interfaces for Monday.com data types
interface MondayColumnValue {
  id: string;
  text: string;
  column: {
    id: string;
    title: string;
  };
}

interface MondayItem {
  id: string;
  name: string;
  column_values: MondayColumnValue[];
}

const MondayItemsList: React.FC<MondayItemsListProps> = ({ boardId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<MondayItem[]>([]);
  const [allItems, setAllItems] = useState<MondayItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [useMockData, setUseMockData] = useState(false);
  const [showAllItems, setShowAllItems] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  // Function to toggle mock data mode
  const toggleMockDataMode = useCallback(() => {
    setUseMockData(prev => !prev);
    setError(null);
  }, []);

  // Function to toggle showing all items
  const toggleShowAllItems = useCallback(() => {
    setShowAllItems(prev => !prev);
  }, []);

  // Function to fetch items from Monday.com
  const fetchItems = useCallback(async () => {
    // Clear previous debug info
    setDebugInfo(null);
    
    if (useMockData) {
      // Use mock data with the numeric field
      const mockItems: MondayItem[] = [
        { id: "mock1", name: "Mock Project 1", column_values: [
          { id: "numeric_mknn4ekf", text: "5", column: { id: "numeric_mknn4ekf", title: "Numeric Field" } },
          { id: "status", text: "In Progress", column: { id: "status", title: "Status" } }
        ]},
        { id: "mock2", name: "Mock Project 2", column_values: [
          { id: "numeric_mknn4ekf", text: "", column: { id: "numeric_mknn4ekf", title: "Numeric Field" } },
          { id: "status", text: "Done", column: { id: "status", title: "Status" } }
        ]},
        { id: "mock3", name: "Mock Project 3", column_values: [
          { id: "numeric_mknn4ekf", text: "10", column: { id: "numeric_mknn4ekf", title: "Numeric Field" } },
          { id: "status", text: "Stuck", column: { id: "status", title: "Status" } }
        ]},
      ];
      
      setAllItems(mockItems);
      
      // Filter mock items where numeric_mknn4ekf is not null/empty
      const filteredMockItems = mockItems.filter((item: MondayItem) => {
        const numericColumn = item.column_values.find(col => col.id === "numeric_mknn4ekf");
        return numericColumn && numericColumn.text && numericColumn.text.trim() !== '';
      });
      
      setItems(filteredMockItems);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Set token
      const token = process.env.NEXT_PUBLIC_MONDAY_API_TOKEN;
      if (!token) {
        throw new Error('API token is missing! Check your environment variables.');
      }
      mondayApi.setToken(token);

      // Always use board 1720560988 regardless of what's passed
      const targetBoardId = 1720560988;
      
      // Implement proper pagination to fetch all items
      const pageSize = 500; // Increased page size for better performance
      let hasMoreItems = true;
      let cursor = null;
      let allFetchedItems: MondayItem[] = [];
      
      console.log('Starting pagination to fetch all items from board', targetBoardId);
      
      // Loop until we've fetched all items
      while (hasMoreItems) {
        // Build the query with cursor-based pagination
        const query = `query {
          boards(ids: [${targetBoardId}]) {
            items_page(limit: ${pageSize}${cursor ? `, cursor: "${cursor}"` : ''}) {
              cursor
              items {
                id
                name
                column_values {
                  id
                  text
                  column {
                    id
                    title
                  }
                }
              }
            }
          }
        }`;

        // Make API call with minimal delay
        const response = await retryApiCall(() => mondayApi.query(query, { delay: 100 }));
        
        if (!response?.data?.boards?.[0]?.items_page) {
          throw new Error('Failed to fetch items from board');
        }
        
        const itemsPage = response.data.boards[0].items_page;
        const fetchedItems = itemsPage.items || [];
        const nextCursor = itemsPage.cursor;
        
        console.log(`Retrieved ${fetchedItems.length} items from board ${targetBoardId} (page cursor: ${cursor || 'initial'})`);
        
        // Add the fetched items to our collection
        allFetchedItems = [...allFetchedItems, ...fetchedItems];
        
        // Check if we need to fetch more items
        if (nextCursor && fetchedItems.length === pageSize) {
          cursor = nextCursor;
          console.log(`More items available, continuing with cursor: ${cursor}`);
        } else {
          hasMoreItems = false;
          console.log(`No more items to fetch, total items: ${allFetchedItems.length}`);
        }
      }
      
      // Store all items for debugging
      setAllItems(allFetchedItems);
      
      // Build minimal debug info
      if (allFetchedItems.length > 0) {
        const firstItem = allFetchedItems[0];
        
        // Build debug info
        let debugText = `Found ${allFetchedItems.length} total items from board ${targetBoardId}\n\n`;
        
        // Look for any column that might be numeric
        const potentialNumericColumns = firstItem.column_values.filter((col: MondayColumnValue) => {
          const text = col.text || '';
          return !isNaN(parseFloat(text)) && text.trim() !== '';
        });
        
        if (potentialNumericColumns.length > 0) {
          debugText += "Potential numeric columns:\n";
          potentialNumericColumns.forEach((col: MondayColumnValue) => {
            debugText += `- ${col.id}: "${col.column?.title}" = "${col.text}"\n`;
          });
        }
        
        setDebugInfo(debugText);
      }
      
      // Filter items where color_mknv2m3p equals "Ready"
      const filteredItems = allFetchedItems.filter((item: MondayItem) => {
        const colorColumn = item.column_values.find(col => col.id === "color_mknv2m3p");
        return colorColumn && colorColumn.text === "Ready";
      });
      
      console.log(`Filtered to ${filteredItems.length} items with color_mknv2m3p = "Ready"`);
      setItems(filteredItems);
    } catch (err) {
      console.error('Error fetching items:', err);
      setError('Failed to fetch items: ' + (err instanceof Error ? err.message : String(err)) + 
        '\n\nTry enabling Mock Data Mode if Monday.com API is unavailable.');
    } finally {
      setLoading(false);
    }
  }, [useMockData]);

  // Fetch items on component mount
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Function to handle item selection
  const handleItemSelect = (itemId: string) => {
    setSelectedItemId(itemId);
  };

  // Function to go back to the list
  const handleBackToList = () => {
    setSelectedItemId(null);
  };

  // Function to clear errors
  const clearErrors = () => {
    setError(null);
  };

  // If an item is selected, show the email template
  if (selectedItemId) {
    return (
      <div>
        <button 
          onClick={handleBackToList}
          className="mb-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
        >
          ← Back to Items List
        </button>
        <EmailTemplate 
          boardId={boardId} 
          itemId={selectedItemId} 
          columnId="" 
        />
      </div>
    );
  }

  // Show loading spinner
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Monday.com Items</h2>
          <div>
            <button
              onClick={toggleMockDataMode}
              className={`px-4 py-2 ${useMockData ? 'bg-purple-600' : 'bg-gray-500'} text-white rounded hover:bg-purple-700 transition-colors`}
              disabled={loading}
            >
              {useMockData ? 'Mock Data: ON' : 'Mock Data: OFF'}
            </button>
          </div>
        </div>
        <div className="flex flex-col justify-center items-center h-[300px] p-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading items from Monday.com board...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
        </div>
      </div>
    );
  }

  // Show error message
  if (error) {
    return (
      <div className="text-red-600 p-4 rounded-lg bg-red-50 text-center">
        {error}
        <div className="mt-4">
          <button
            onClick={clearErrors}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Clear Error
          </button>
          <button
            onClick={toggleMockDataMode}
            className="ml-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
          >
            {useMockData ? 'Disable Mock Data' : 'Enable Mock Data'}
          </button>
          <button
            onClick={fetchItems}
            className="ml-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show items list
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-semibold">
          Monday.com Items 
          {!showAllItems && <span> (Filtered: color_mknv2m3p = "Ready")</span>}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={toggleShowAllItems}
            className={`px-4 py-2 ${showAllItems ? 'bg-orange-600' : 'bg-gray-500'} text-white rounded hover:bg-orange-700 transition-colors`}
          >
            {showAllItems ? 'Show Filtered' : 'Show All Items'}
          </button>
          <button
            onClick={toggleMockDataMode}
            className={`px-4 py-2 ${useMockData ? 'bg-purple-600' : 'bg-gray-500'} text-white rounded hover:bg-purple-700 transition-colors`}
          >
            {useMockData ? 'Mock Data: ON' : 'Mock Data: OFF'}
          </button>
          <button
            onClick={fetchItems}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Refresh Items
          </button>
        </div>
      </div>
      
      {debugInfo && (
        <div className="p-4 bg-gray-100 border-b text-xs font-mono whitespace-pre-wrap">
          <h3 className="font-bold mb-2">Debug Information:</h3>
          {debugInfo}
        </div>
      )}
      
      <div className="p-4">
        <div className="mb-4">
          <p className="text-gray-600">
            {showAllItems 
              ? 'Select an item to generate an email template (showing all items):'
              : 'Select an item to generate an email template (showing only items with Status = "Ready"):'}
          </p>
        </div>
        
        {(showAllItems ? allItems : items).length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            {showAllItems 
              ? 'No items found. Try refreshing or enabling mock data.'
              : 'No items found with Status = "Ready". Try showing all items to see what\'s available.'}
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {(showAllItems ? allItems : items).map(item => (
              <div 
                key={item.id}
                className="border rounded-lg p-4 hover:bg-blue-50 cursor-pointer transition-colors"
                onClick={() => handleItemSelect(item.id)}
              >
                <h3 className="font-semibold text-blue-700">{item.name}</h3>
                <div className="mt-2 text-sm text-gray-600">
                  {item.column_values
                    .filter((col: any) => col.text && col.column?.title)
                    .slice(0, 3) // Show only first 3 columns
                    .map((col: any) => (
                      <div key={col.id} className="flex justify-between">
                        <span>{col.column.title}:</span>
                        <span className="font-medium">{col.text}</span>
                      </div>
                    ))
                  }
                  {item.column_values.length > 3 && (
                    <div className="text-blue-500 text-right mt-1">
                      + {item.column_values.length - 3} more fields
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MondayItemsList;