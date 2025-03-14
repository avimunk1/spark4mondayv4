'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { generateEmailFromTemplate } from '../utils/emailUtils';

interface EmailTemplateProps {
  boardId: number;
  itemId: string;
  columnId: string;
  boardItems?: any[];
}

// Direct Monday.com API client implementation
const mondayApi = {
  token: '',
  setToken: (token: string) => {
    mondayApi.token = token;
    console.log('Token set in direct API client');
  },
  query: async (query: string, options?: any) => {
    if (!mondayApi.token) {
      throw new Error('API token not set');
    }

    // Add a small delay to prevent rate limiting
    if (options?.delay) {
      await new Promise(resolve => setTimeout(resolve, options.delay));
    }

    console.log('Making direct API call to Monday.com');
    
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

// Helper function to retry API calls with improved error handling
const retryApiCall = async (apiCall: () => Promise<any>, maxRetries = 3, delay = 1000) => {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`API call attempt ${attempt}/${maxRetries}`);
      const result = await apiCall();
      return result;
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

const EmailTemplate: React.FC<EmailTemplateProps> = ({ boardId, itemId, columnId, boardItems }) => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [emailHtml, setEmailHtml] = React.useState<string | null>(null);
  const [headerImage, setHeaderImage] = React.useState<string | null>(null);
  const [impactImage, setImpactImage] = React.useState<string | null>(null);
  const [headerImageEmail, setHeaderImageEmail] = React.useState<string | null>(null);
  const [impactImageEmail, setImpactImageEmail] = React.useState<string | null>(null);
  const [lenderEmails, setLenderEmails] = React.useState<string | null>(null);
  const previewRef = useRef<HTMLIFrameElement>(null);
  const headerInputRef = useRef<HTMLInputElement>(null);
  const impactInputRef = useRef<HTMLInputElement>(null);
  const [iframeReady, setIframeReady] = React.useState(false);
  const [previewHtml, setPreviewHtml] = React.useState<string | null>(null);
  const [useMockData, setUseMockData] = React.useState(false);
  const [debugMode, setDebugMode] = React.useState(false);
  const [debugInfo, setDebugInfo] = React.useState<string | null>(null);

  // Function to toggle debug mode
  const toggleDebugMode = useCallback(() => {
    setDebugMode(prev => !prev);
    setDebugInfo(null);
  }, []);

  // Function to log debug information
  const logDebugInfo = useCallback((message: string, data?: any) => {
    if (debugMode) {
      const timestamp = new Date().toISOString();
      const formattedData = data ? JSON.stringify(data, null, 2) : '';
      const logEntry = `[${timestamp}] ${message}\n${formattedData}\n\n`;
      
      setDebugInfo(prev => (prev ? prev + logEntry : logEntry));
      console.log(`[DEBUG] ${message}`, data);
    }
  }, [debugMode]);

  // Enhanced API call function
  const enhancedApiCall = useCallback(async (query: string, maxRetries = 3) => {
    // Log the query in debug mode
    logDebugInfo('API Query:', query);
    
    try {
      // Add a small delay to the first call to prevent rate limiting
      const result = await retryApiCall(() => mondayApi.query(query, { delay: 500 }), maxRetries, 1000);
      logDebugInfo('API call successful', result);
      return result;
    } catch (error) {
      const apiError = error as Error;
      logDebugInfo('API call failed:', apiError);
      throw apiError;
    }
  }, [logDebugInfo]);

  // Function to update iframe content
  const updateIframeContent = useCallback((html: string) => {
    if (!previewRef.current) {
      console.log('Waiting for iframe to be available...');
      return;
    }

    try {
      const iframe = previewRef.current;
      iframe.setAttribute('srcDoc', html);
      
      // Set a timeout to mark as ready after content is likely loaded
      setTimeout(() => {
        setIframeReady(true);
        console.log('Iframe marked as ready');
      }, 500);

    } catch (err) {
      console.error('Error updating iframe:', err);
      setIframeReady(true);
    }
  }, []);

  // Effect to update iframe when previewHtml changes
  useEffect(() => {
    if (previewHtml) {
      console.log('Preview HTML updated, length:', previewHtml.length);
      setIframeReady(false);
      updateIframeContent(previewHtml);
    }
  }, [previewHtml, updateIframeContent]);

  // Modify generateEmailPreview to use our direct API client
  const generateEmailPreview = useCallback(async (newHeaderImage?: string | null, newImpactImage?: string | null) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Starting email preview generation for item:', itemId);

      const query = `query {
        items (ids: [${itemId}]) {
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
      }`;

      // Use enhanced API call with direct fetch
      const response = await enhancedApiCall(query);
      
      if (!response?.data?.items?.[0]) {
        throw new Error('No item data found');
      }

      const item = response.data.items[0];
      const html = generateEmailFromTemplate({
        item: {
          name: item.name,
          columnValues: item.column_values
        },
        headerImage: newHeaderImage !== undefined ? newHeaderImage : headerImage,
        impactImage: newImpactImage !== undefined ? newImpactImage : impactImage
      });

      setEmailHtml(html);
    } catch (err) {
      console.error('Error in generateEmailPreview:', err);
      setError('Failed to generate email: ' + (err instanceof Error ? err.message : String(err)) + 
        '\n\nTry enabling Mock Data Mode if Monday.com API is unavailable.');
    } finally {
      setLoading(false);
    }
  }, [itemId, headerImage, impactImage, enhancedApiCall]);

  // Modify handleSave to just log for now
  const handleSave = useCallback(async () => {
    if (!emailHtml) return;
    console.log('Save functionality temporarily disabled');
    setError('Save functionality coming soon');
  }, [emailHtml]);

  // Add a function to toggle mock data mode
  const toggleMockDataMode = useCallback(() => {
    setUseMockData(prev => !prev);
    setError(null);
  }, []);

  // Add a function to get mock lender emails
  const getMockLenderEmails = useCallback(() => {
    try {
      setLoading(true);
      setError(null);
      setLenderEmails(null); // Clear previous results
      console.log('Using mock data for lender emails');

      // Simulate a delay
      setTimeout(() => {
        // Mock data for demonstration
        const mockMatchValue = "MOCK-123";
        const mockEmails = [
          { name: "Mock Lender 1", email: "lender1@example.com" },
          { name: "Mock Lender 2", email: "lender2@example.com" },
          { name: "Mock Lender 3", email: "lender3@example.com" }
        ];

        // Create a simple table format with the mock items and emails
        const tableHeader = 'Item Name | Match Value | Email';
        const separator = '-'.repeat(tableHeader.length);
        
        const tableRows = mockEmails.map(item => 
          `${item.name} | ${mockMatchValue} | ${item.email}`
        );
        
        const tableOutput = [tableHeader, separator, ...tableRows].join('\n');
        const emailsOnly = mockEmails.map(item => item.email).join('; ');
        
        setLenderEmails(tableOutput + '\n\n' + 'Emails for copying: ' + emailsOnly);
        setLoading(false);
      }, 1000);
    } catch (err) {
      console.error('Error with mock data:', err);
      setError('Error with mock data: ' + (err instanceof Error ? err.message : String(err)));
      setLoading(false);
    }
  }, []);

  // Modify getLenderEmails to use our direct API client
  const getLenderEmails = useCallback(async () => {
    // If in mock data mode, use mock data instead of API
    if (useMockData) {
      getMockLenderEmails();
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setLenderEmails(null); // Clear previous results
      console.log('Starting to fetch lender emails...');

      // Step 0: Get the current item data
      const itemQuery = `query {
        items (ids: [${itemId}]) {
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
      }`;

      console.log('Fetching current item data');
      
      // Use enhanced API call with direct fetch
      const itemResponse = await enhancedApiCall(itemQuery);
      
      console.log('Current item response:', itemResponse);

      if (!itemResponse?.data?.items?.[0]) {
        throw new Error('Item data not found');
      }

      const currentItem = itemResponse.data.items[0];
      const itemName = currentItem.name;
      
      // Log all column values to find the project name field
      console.log('All columns for item:', itemName);
      currentItem.column_values.forEach((col: any) => {
        console.log(`Column ID: ${col.id}, Title: ${col.column?.title || 'No title'}, Value: ${col.text || 'No value'}`);
      });
      
      // Get the business name from the column "🔸שם עסק מקורי מבעל העסק"
      const businessName = currentItem.column_values
        .find((col: any) => col.column?.title === '🔸שם עסק מקורי מבעל העסק')?.text;

      // Get the project name from the specific field ID 1814231990
      const projectNameByFieldId = currentItem.column_values
        .find((col: any) => col.id === '1814231990')?.text;
      
      console.log('Found project name by field ID 1814231990:', projectNameByFieldId);

      // Try to find the project name field by title as a fallback
      const projectNameColumn = currentItem.column_values
        .find((col: any) => 
          col.column?.title?.toLowerCase().includes('project') && 
          col.column?.title?.toLowerCase().includes('name')
        );
      
      // Use the project name from field ID 1814231990 if available, otherwise fall back to other methods
      const projectName = projectNameByFieldId || (projectNameColumn?.text || itemName);
      
      console.log('Item Name:', itemName);
      console.log('Business Name:', businessName);
      console.log('Project Name:', projectName, 
        projectNameByFieldId ? '(from field ID 1814231990)' : 
        projectNameColumn ? `(from column: ${projectNameColumn.column.title}, ID: ${projectNameColumn.id})` : 
        '(from item name)');

      // Determine which value to use for matching
      let matchValue = projectName;
      let matchSource = projectNameByFieldId ? 'Project Name (Field ID 1814231990)' : 
                        projectNameColumn ? 'Project Name Column' : 'Item Name';

      // Special case for "אימפרוב - איט" - use "Regulatory training with Ziv" instead
      if (businessName === "אימפרוב - איט" || matchValue === "אימפרוב - איט") {
        console.log('Special case detected: "אימפרוב - איט" - using "Regulatory training with Ziv" instead');
        matchValue = "Regulatory training with Ziv";
        matchSource = "Manual Override";
      }
      
      // Special case for "Hodaya's Cosmetic Salon" - handle possessive form
      if (businessName?.includes("Hodaya") || matchValue?.includes("Hodaya") || 
          projectName?.includes("Hodaya") || itemName?.includes("Hodaya")) {
        console.log('Special case detected: "Hodaya\'s Cosmetic Salon" - adding alternative matching patterns');
        // We'll keep the original matchValue but add special handling in the matching logic
      }

      if (!matchValue) {
        throw new Error('No value found to use for matching');
      }

      console.log(`Using ${matchSource} for matching: "${matchValue}"`);

      // Step 2: Fetch items from board 1720560983
      const lendersQuery = `query {
        boards(ids: [1720560983]) {
          items_page(limit: 500) {
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

      console.log('Querying lenders board (ID: 1720560983)');
      
      // Use enhanced API call with direct fetch
      const lendersResponse = await enhancedApiCall(lendersQuery);
      
      console.log('Lenders board response received');
      
      if (!lendersResponse?.data?.boards?.[0]?.items_page?.items) {
        throw new Error('Failed to fetch items from lenders board');
      }

      const lendersItems = lendersResponse.data.boards[0].items_page.items;
      console.log(`Retrieved ${lendersItems.length} items from lenders board`);
      
      // Log all unique column titles across all items
      if (lendersItems.length > 0) {
        // Get all unique column titles from the first item
        const firstItem = lendersItems[0];
        console.log('First lender item columns:');
        firstItem.column_values.forEach((col: any) => {
          console.log(`Column ID: ${col.id}, Title: ${col.column?.title || 'No title'}, Value: ${col.text || 'No value'}`);
        });
        
        // Get all unique column titles across all items
        const allColumnTitles = new Set<string>();
        lendersItems.forEach((item: any) => {
          item.column_values.forEach((col: any) => {
            if (col.column?.title) {
              allColumnTitles.add(col.column.title);
            }
          });
        });
        console.log('All unique column titles in lenders board:', Array.from(allColumnTitles));
      }
      
      // Step 3: Find the matching column ID and email column ID
      let matchColumnId = 'text_mkm142mk'; // Default ID
      let emailColumnId = 'email_mkm15azq'; // Default ID
      let matchColumnTitle = 'Project Name English'; // Default title to look for
      let emailColumnTitle = 'Lender Email'; // Default title to look for
      
      // Try to find columns by title first
      if (lendersItems.length > 0) {
        const firstItem = lendersItems[0];
        
        // Find project name column by title - try multiple variations
        let projectNameColumn = firstItem.column_values.find((col: any) => 
          col.column?.title?.toLowerCase() === 'project name english'
        );
        
        if (!projectNameColumn) {
          projectNameColumn = firstItem.column_values.find((col: any) => 
            col.column?.title?.toLowerCase().includes('project') && 
            col.column?.title?.toLowerCase().includes('name')
          );
        }
        
        if (!projectNameColumn) {
          projectNameColumn = firstItem.column_values.find((col: any) => 
            col.column?.title?.toLowerCase().includes('business') && 
            col.column?.title?.toLowerCase().includes('name')
          );
        }
        
        if (projectNameColumn) {
          matchColumnId = projectNameColumn.id;
          matchColumnTitle = projectNameColumn.column.title;
          console.log(`Found project name column: ID=${matchColumnId}, Title="${matchColumnTitle}"`);
        } else {
          console.log('Could not find a specific project name column, will use default:', matchColumnTitle);
        }
        
        // Find email column by title - try multiple variations
        let emailColumn = firstItem.column_values.find((col: any) => 
          col.column?.title?.toLowerCase() === 'lender email'
        );
        
        if (!emailColumn) {
          emailColumn = firstItem.column_values.find((col: any) => 
            col.column?.title?.toLowerCase().includes('email') &&
            col.column?.title?.toLowerCase().includes('lender')
          );
        }
        
        if (!emailColumn) {
          emailColumn = firstItem.column_values.find((col: any) => 
            col.column?.title?.toLowerCase().includes('email')
          );
        }
        
        if (emailColumn) {
          emailColumnId = emailColumn.id;
          emailColumnTitle = emailColumn.column.title;
          console.log(`Found email column: ID=${emailColumnId}, Title="${emailColumnTitle}"`);
        } else {
          console.log('Could not find a specific email column, will use default:', emailColumnTitle);
        }
      }
      
      // Step 4: Try to find matching items using multiple strategies
      let matchingItems: any[] = [];
      
      // Strategy 1: Try exact match on the project name column
      matchingItems = lendersItems.filter((item: any) => {
        const matchColumn = item.column_values.find((col: any) => 
          col.id === matchColumnId || 
          (col.column?.title && col.column.title.toLowerCase() === matchColumnTitle.toLowerCase())
        );
        
        const itemMatchValue = matchColumn?.text;
        
        if (itemMatchValue && matchValue) {
          // Normalize strings for comparison
          const normalizedItemValue = itemMatchValue.trim().toLowerCase();
          const normalizedMatchValue = matchValue.trim().toLowerCase();
          
          console.log(`Comparing: "${itemMatchValue}" (${normalizedItemValue}) with "${matchValue}" (${normalizedMatchValue}) (Column: ${matchColumn.column?.title || 'Unknown'})`);
          
          // Try exact match first
          if (itemMatchValue === matchValue) {
            console.log('Found exact match!');
            return true;
          }
          
          // Try case-insensitive match
          if (normalizedItemValue === normalizedMatchValue) {
            console.log('Found normalized match!');
            return true;
          }
          
          // Try with additional whitespace removal (replace multiple spaces with single space)
          const extraNormalizedItem = normalizedItemValue.replace(/\s+/g, ' ');
          const extraNormalizedMatch = normalizedMatchValue.replace(/\s+/g, ' ');
          
          if (extraNormalizedItem === extraNormalizedMatch) {
            console.log('Found match after whitespace normalization!');
            return true;
          }
          
          // Try partial match (item contains match or match contains item)
          if (normalizedItemValue.includes(normalizedMatchValue) || 
              normalizedMatchValue.includes(normalizedItemValue)) {
            console.log('Found partial match!');
            return true;
          }
          
          // Try with special character removal
          const cleanItemValue = normalizedItemValue.replace(/[^\w\s]/gi, '');
          const cleanMatchValue = normalizedMatchValue.replace(/[^\w\s]/gi, '');
          
          if (cleanItemValue === cleanMatchValue) {
            console.log('Found match after special character removal!');
            return true;
          }
          
          // Try with apostrophe/quote normalization (e.g., "Hodaya's" vs "Hodayas")
          const apostropheNormalizedItem = normalizedItemValue.replace(/['"`]/g, '');
          const apostropheNormalizedMatch = normalizedMatchValue.replace(/['"`]/g, '');
          
          if (apostropheNormalizedItem === apostropheNormalizedMatch) {
            console.log('Found match after apostrophe normalization!');
            return true;
          }
        }
        return false;
      });
      
      console.log(`Found ${matchingItems.length} matching items using ${matchSource}`);
      
      // If no matches found, try a more aggressive approach with the project name
      if (matchingItems.length === 0 && matchValue) {
        console.log(`No matches found with standard comparison. Trying more aggressive matching for: "${matchValue}"`);
        
        // Log all potential matches for debugging
        console.log('All potential project name values in lenders board:');
        lendersItems.forEach((item: any) => {
          const matchColumn = item.column_values.find((col: any) => 
            col.id === matchColumnId || 
            (col.column?.title && col.column.title.toLowerCase() === matchColumnTitle.toLowerCase())
          );
          
          if (matchColumn?.text) {
            console.log(`- Item: ${item.name}, Project Name: "${matchColumn.text}"`);
          }
        });
        
        // Try a more lenient matching approach
        matchingItems = lendersItems.filter((item: any) => {
          const matchColumn = item.column_values.find((col: any) => 
            col.id === matchColumnId || 
            (col.column?.title && col.column.title.toLowerCase() === matchColumnTitle.toLowerCase())
          );
          
          const itemMatchValue = matchColumn?.text;
          
          if (!itemMatchValue) return false;
          
          // Normalize and clean strings
          const normalizedItemValue = itemMatchValue.trim().toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, ' ');
          const normalizedMatchValue = matchValue.trim().toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, ' ');
          
          // Check if one is a substring of the other (more lenient)
          const isPartialMatch = normalizedItemValue.includes(normalizedMatchValue) || 
                                normalizedMatchValue.includes(normalizedItemValue);
          
          if (isPartialMatch) {
            console.log(`Found lenient partial match: "${itemMatchValue}" with "${matchValue}"`);
            return true;
          }
          
          // Try word-by-word matching (check if all words in matchValue are in itemMatchValue)
          const matchWords = normalizedMatchValue.split(' ').filter((w: string) => w.length > 2); // Only words longer than 2 chars
          const itemWords = normalizedItemValue.split(' ');
          
          const allWordsMatch = matchWords.length > 0 && matchWords.every((word: string) => 
            itemWords.some((itemWord: string) => itemWord.includes(word) || word.includes(itemWord))
          );
          
          if (allWordsMatch) {
            console.log(`Found word-by-word match: "${itemMatchValue}" with "${matchValue}"`);
            return true;
          }
          
          return false;
        });
        
        console.log(`Found ${matchingItems.length} matching items using aggressive matching`);
      }
      
      // Strategy 2: If no matches found and we used business name, try using item name
      if (matchingItems.length === 0 && matchSource === 'Business Name' && itemName) {
        console.log(`No matches found using Business Name. Trying Item Name: "${itemName}"`);
        
        matchingItems = lendersItems.filter((item: any) => {
          const matchColumn = item.column_values.find((col: any) => 
            col.id === matchColumnId || 
            (col.column?.title && col.column.title.toLowerCase() === matchColumnTitle.toLowerCase())
          );
          
          const itemMatchValue = matchColumn?.text;
          
          if (itemMatchValue) {
            console.log(`Comparing: "${itemMatchValue}" with "${itemName}" (Column: ${matchColumn.column?.title || 'Unknown'})`);
            
            // Try various matching strategies
            if (itemMatchValue === itemName) {
              console.log('Found exact match with Item Name!');
              return true;
            }
            
            if (itemMatchValue.toLowerCase() === itemName.toLowerCase()) {
              console.log('Found case-insensitive match with Item Name!');
              return true;
            }
            
            if (itemMatchValue.trim() === itemName.trim()) {
              console.log('Found trimmed match with Item Name!');
              return true;
            }
            
            if (itemMatchValue.trim().toLowerCase() === itemName.trim().toLowerCase()) {
              console.log('Found trimmed case-insensitive match with Item Name!');
              return true;
            }
          }
          return false;
        });
        
        console.log(`Found ${matchingItems.length} matching items using Item Name`);
      }
      
      // Strategy 3: If still no matches, try matching against item names in the lenders board
      if (matchingItems.length === 0) {
        console.log(`No matches found in columns. Trying to match against item names in lenders board.`);
        
        matchingItems = lendersItems.filter((item: any) => {
          const lenderItemName = item.name;
          
          if (lenderItemName) {
            console.log(`Comparing lender item name: "${lenderItemName}" with "${matchValue}"`);
            
            // Try various matching strategies
            if (lenderItemName === matchValue) {
              console.log('Found exact match with lender item name!');
              return true;
            }
            
            if (lenderItemName.toLowerCase() === matchValue.toLowerCase()) {
              console.log('Found case-insensitive match with lender item name!');
              return true;
            }
            
            if (lenderItemName.trim() === matchValue.trim()) {
              console.log('Found trimmed match with lender item name!');
              return true;
            }
            
            if (lenderItemName.trim().toLowerCase() === matchValue.trim().toLowerCase()) {
              console.log('Found trimmed case-insensitive match with lender item name!');
              return true;
            }
            
            // Try partial matches
            if (lenderItemName.toLowerCase().includes(matchValue.toLowerCase())) {
              console.log('Found partial match with lender item name!');
              return true;
            }
            
            if (matchValue.toLowerCase().includes(lenderItemName.toLowerCase())) {
              console.log('Found reverse partial match with lender item name!');
              return true;
            }
          }
          return false;
        });
        
        console.log(`Found ${matchingItems.length} matching items by matching against item names`);
      }
      
      // Strategy 4: Try specific known values for certain projects
      if (matchingItems.length === 0) {
        console.log('No matches found with previous strategies. Trying specific known cases...');
        
        // Special case for Hodaya's Cosmetic Salon
        if (matchValue.includes("Hodaya") || businessName?.includes("Hodaya")) {
          console.log('Trying specific search for "Hodaya\'s Cosmetic Salon"');
          
          // Search for any item containing "Hodaya" or "Cosmetic" or "Salon"
          matchingItems = lendersItems.filter((item: any) => {
            // Check item name
            if (item.name.toLowerCase().includes('hodaya') || 
                item.name.toLowerCase().includes('cosmetic') || 
                item.name.toLowerCase().includes('salon')) {
              console.log(`Found Hodaya match in item name: ${item.name}`);
              return true;
            }
            
            // Check all column values
            for (const col of item.column_values) {
              if (col.text && (
                  col.text.toLowerCase().includes('hodaya') || 
                  col.text.toLowerCase().includes('cosmetic') || 
                  col.text.toLowerCase().includes('salon'))) {
                console.log(`Found Hodaya match in column ${col.column?.title}: ${col.text}`);
                return true;
              }
            }
            
            return false;
          });
          
          console.log(`Found ${matchingItems.length} matching items for Hodaya's Cosmetic Salon`);
        }
        
        // Special case for אימפרוב - איט
        if (matchingItems.length === 0 && businessName === "אימפרוב - איט") {
          console.log('No matches found. Trying specific search for "Regulatory training with Ziv"');
          
          // Search for any item containing "Regulatory" and "Ziv"
          matchingItems = lendersItems.filter((item: any) => {
            // Check item name
            if (item.name.toLowerCase().includes('regulatory') && item.name.toLowerCase().includes('ziv')) {
              console.log(`Found match in item name: ${item.name}`);
              return true;
            }
            
            // Check all column values
            for (const col of item.column_values) {
              if (col.text && 
                  col.text.toLowerCase().includes('regulatory') && 
                  col.text.toLowerCase().includes('ziv')) {
                console.log(`Found match in column ${col.column?.title}: ${col.text}`);
                return true;
              }
            }
            
            return false;
          });
          
          console.log(`Found ${matchingItems.length} matching items using specific search`);
        }
      }
      
      // Log the matching items for debugging
      if (matchingItems.length > 0) {
        console.log('Matching items:', matchingItems.map((item: any) => ({
          id: item.id,
          name: item.name
        })));
      }
      
      // Step 5: Extract emails from matching items
      const lenderEmails: string[] = [];
      
      matchingItems.forEach((item: any) => {
        const emailColumn = item.column_values.find((col: any) => 
          col.id === emailColumnId || 
          (col.column?.title && col.column.title.toLowerCase() === emailColumnTitle.toLowerCase())
        );
        
        const email = emailColumn?.text;
        if (email && email.trim() !== '') {
          console.log(`Found email: ${email} in item: ${item.name}`);
          lenderEmails.push(email);
        } else {
          console.log(`No valid email found in item: ${item.name}`);
        }
      });
      
      console.log(`Extracted ${lenderEmails.length} valid emails`);
      
      // Display the emails
      if (lenderEmails.length > 0) {
        // Join emails with semicolons for easy copying
        const emailsString = lenderEmails.join('; ');
        
        // Create a more concise display focused on the emails
        setLenderEmails(`Found ${lenderEmails.length} email(s):\n\n${emailsString}`);
        setError(null); // Clear any previous errors
      } else {
        // Create a more detailed error message
        const errorMsg = `No matching emails found for ${matchSource}: "${matchValue}". 
Searched ${lendersItems.length} items in board 1720560983.
Looking for matches where column '${matchColumnTitle}' (ID: ${matchColumnId}) equals "${matchValue}".
Found ${matchingItems.length} matching items, but none had valid emails in column '${emailColumnTitle}' (ID: ${emailColumnId}).

Try the following:
1. Check if the value "${matchValue}" exists in the lenders board
2. Check if the column names are correct
3. Try enabling Debug mode for more detailed logs`;
        
        console.error(errorMsg);
        setError(errorMsg);
      }
      
    } catch (err) {
      console.error('Error fetching lender emails:', err);
      setError('Failed to fetch lender emails: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  }, [itemId, useMockData, getMockLenderEmails, enhancedApiCall]);

  // Initialize API client and load initial preview
  useEffect(() => {
    // Create a flag to prevent duplicate initialization
    let isMounted = true;
    
    const token = process.env.NEXT_PUBLIC_MONDAY_API_TOKEN;
    if (token && isMounted) {
      console.log('Setting token in direct API client:', token.substring(0, 10) + '...' + token.substring(token.length - 5));
      // Set the token in our direct API client
      mondayApi.setToken(token);
    }
    
    // Initialize the preview (not calling getLenderEmails here)
    const initializePreview = async () => {
      if (!isMounted) return;
      
      try {
        setLoading(true);
        setError(null);

        // If mock data mode is enabled, use mock data
        if (useMockData) {
          console.log('Using mock data for preview');
          const mockHtml = `
            <html>
              <body>
                <h1>Mock Email Preview</h1>
                <p>This is a mock email preview generated while in Mock Data Mode.</p>
                <p>Switch to real data mode to see the actual email preview.</p>
              </body>
            </html>
          `;
          setPreviewHtml(mockHtml);
          setLoading(false);
          return;
        }

        // Get the item data
        const itemQuery = `query {
          items (ids: [${itemId}]) {
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
        }`;

        console.log('Initializing preview for item:', itemId);
        
        // Use enhanced API call with direct fetch
        const itemResponse = await enhancedApiCall(itemQuery);
        
        console.log('Current item response:', itemResponse);

        if (!itemResponse?.data?.items?.[0]) {
          throw new Error('Item data not found');
        }

        const item = itemResponse.data.items[0];

        // Generate the email HTML
        const emailHtml = generateEmailFromTemplate({
          item: {
            name: item.name,
            columnValues: item.column_values.map((col: any) => ({
              title: col.text,
              text: col.text,
              value: col.value,
              column: col.column
            }))
          },
          headerImage,
          impactImage
        });

        // Update the preview with the generated HTML
        if (isMounted) {
          setPreviewHtml(emailHtml);
          setEmailHtml(emailHtml);
        }

        // If we have lender emails, update the preview with them
        if (lenderEmails && isMounted) {
          const updatedHtml = emailHtml.replace(
            'Use the "Get Lender Emails" button to fetch emails',
            lenderEmails
          );
          setPreviewHtml(updatedHtml);
        }

      } catch (err) {
        console.error('Error initializing preview:', err);
        if (isMounted) {
          setError('Failed to initialize preview: ' + (err instanceof Error ? err.message : String(err)) + 
            '\n\nTry enabling Mock Data Mode if Monday.com API is unavailable.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    initializePreview();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [itemId, headerImage, impactImage, lenderEmails, useMockData, enhancedApiCall]);

  // Re-initialize preview when lender emails change
  useEffect(() => {
    if (lenderEmails && previewHtml) {
      const updatedHtml = previewHtml.replace(
        'Use the "Get Lender Emails" button to fetch emails',
        lenderEmails
      );
      setPreviewHtml(updatedHtml);
    }
  }, [lenderEmails, previewHtml]);

  // Modify handleImageUpload to upload images to our new endpoint
  const handleImageUpload = async (file: File, isHeader: boolean) => {
    try {
      setLoading(true);
      setError(null);

      console.log('Uploading image:', file.name);
      
      // Create form data for upload
      const formData = new FormData();
      formData.append('file', file);
      
      // Upload the file
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      const data = await response.json();
      
      // Update state with both URLs
      if (isHeader) {
        setHeaderImage(data.url);
        setHeaderImageEmail(data.emailUrl);
        console.log('Setting header image:', data.url);
      } else {
        setImpactImage(data.url);
        setImpactImageEmail(data.emailUrl);
        console.log('Setting impact image:', data.url);
      }

      // Force preview regeneration with preview URL
      await generateEmailPreview(
        isHeader ? data.url : headerImage,
        isHeader ? impactImage : data.url
      );

    } catch (err) {
      console.error('Error handling image:', err);
      setError('Failed to handle image: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  // Send test email only to avimunk@gmail.com
  const sendTestEmail = useCallback(async () => {
    if (!emailHtml) {
      setError('No email content to send');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Create a copy of the HTML for email
      let emailHtmlWithBase64 = emailHtml;

      // Replace header image
      if (headerImage && headerImageEmail) {
        console.log('Processing header image:');
        console.log('- Original URL length:', headerImage.length);
        console.log('- Base64 URL length:', headerImageEmail.length);

        // Create a temporary DOM parser to handle the HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(emailHtmlWithBase64, 'text/html');
        
        // Find all img tags
        const images = doc.getElementsByTagName('img');
        for (let i = 0; i < images.length; i++) {
          const img = images[i];
          if (img.src === headerImage) {
            img.src = headerImageEmail;
            console.log('- Replaced header image successfully');
          }
        }
        
        emailHtmlWithBase64 = doc.documentElement.outerHTML;
      }

      // Replace impact image
      if (impactImage && impactImageEmail) {
        console.log('Processing impact image:');
        console.log('- Original URL length:', impactImage.length);
        console.log('- Base64 URL length:', impactImageEmail.length);

        // Create a temporary DOM parser to handle the HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(emailHtmlWithBase64, 'text/html');
        
        // Find all img tags
        const images = doc.getElementsByTagName('img');
        for (let i = 0; i < images.length; i++) {
          const img = images[i];
          if (img.src === impactImage) {
            img.src = impactImageEmail;
            console.log('- Replaced impact image successfully');
          }
        }
        
        emailHtmlWithBase64 = doc.documentElement.outerHTML;
      }

      // Log the final HTML length and a sample
      console.log('Final HTML length:', emailHtmlWithBase64.length);
      console.log('Sample of final HTML:', emailHtmlWithBase64.substring(0, 200) + '...');
      
      // Use retry mechanism for the API call
      const sendEmail = async () => {
        const response = await fetch('/api/send-test-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            html: emailHtmlWithBase64,
            subject: `Test Email - ${new Date().toLocaleString()}`
          })
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to send test email');
        }

        return await response.json();
      };

      await retryApiCall(sendEmail);
      setError('Test email sent successfully to avimunk@gmail.com');
      
    } catch (err) {
      console.error('Error sending test email:', err);
      setError('Failed to send test email: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  }, [emailHtml, headerImage, headerImageEmail, impactImage, impactImageEmail]);

  // Add a simple test function to check if the Monday.com API is responding
  const testMondayApi = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Testing Monday.com API connection...');

      // Check if token is available
      const token = process.env.NEXT_PUBLIC_MONDAY_API_TOKEN;
      if (!token) {
        setError('API token is missing! Check your environment variables.');
        console.error('API token is missing');
        return;
      }
      
      // Log a masked version of the token for debugging
      const maskedToken = token.length > 15 
        ? `${token.substring(0, 5)}...${token.substring(token.length - 5)}`
        : '***token too short to mask safely***';
      console.log('Using API token:', maskedToken);

      // Use the simplest possible query
      const testQuery = `query { me { name } }`;

      console.log('Testing API connection with direct fetch');
      
      try {
        // Try direct fetch
        console.log('Testing with direct fetch');
        const fetchResponse = await enhancedApiCall(testQuery);
        console.log('Direct fetch test successful:', fetchResponse);
        
        if (fetchResponse?.data?.me) {
          setError(`API connection successful! Authenticated as: ${fetchResponse.data.me.name}`);
        } else {
          throw new Error('No user data returned from API');
        }
      } catch (fetchError) {
        console.error('API test failed:', fetchError);
        setError('API connection test failed. Try enabling Mock Data Mode.');
      }
    } catch (err) {
      console.error('Error testing Monday.com API:', err);
      setError('API connection test failed: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  }, [enhancedApiCall]);

  // Function to clear errors
  const clearErrors = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log('Received message from iframe:', event.data);
      
      if (event.data.type === 'header-click') {
        console.log('Header image click detected');
        headerInputRef.current?.click();
      } else if (event.data.type === 'landscape-click') {
        console.log('Landscape image click detected');
        impactInputRef.current?.click();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Add a function to search for a column by ID
  const searchColumnById = useCallback(async (columnId: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log(`Searching for column with ID: ${columnId}`);

      // Step 1: Check in the current item's board
      const itemQuery = `query {
        items (ids: [${itemId}]) {
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
      }`;

      console.log('Fetching current item data');
      
      // Use enhanced API call with direct fetch
      const itemResponse = await enhancedApiCall(itemQuery);
      
      if (!itemResponse?.data?.items?.[0]) {
        throw new Error('Item data not found');
      }

      const currentItem = itemResponse.data.items[0];
      
      // Look for the column in the current item
      const columnInCurrentItem = currentItem.column_values.find((col: any) => col.id === columnId);
      if (columnInCurrentItem) {
        console.log(`Found column with ID ${columnId} in current item:`, {
          id: columnInCurrentItem.id,
          title: columnInCurrentItem.column?.title || 'No title',
          text: columnInCurrentItem.text || 'No value'
        });
        
        setError(`Column ID ${columnId} in main board has title: "${columnInCurrentItem.column?.title || 'No title'}" with value: "${columnInCurrentItem.text || 'No value'}"`);
      } else {
        console.log(`Column with ID ${columnId} not found in current item`);
      }

      // Step 2: Check in the lenders board
      const lendersQuery = `query {
        boards(ids: [1720560983]) {
          items_page(limit: 1) {
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

      console.log('Querying lenders board (ID: 1720560983)');
      
      // Use enhanced API call with direct fetch
      const lendersResponse = await enhancedApiCall(lendersQuery);
      
      if (!lendersResponse?.data?.boards?.[0]?.items_page?.items?.[0]) {
        throw new Error('Failed to fetch items from lenders board');
      }

      const firstLenderItem = lendersResponse.data.boards[0].items_page.items[0];
      
      // Look for the column in the lenders board
      const columnInLendersBoard = firstLenderItem.column_values.find((col: any) => col.id === columnId);
      if (columnInLendersBoard) {
        console.log(`Found column with ID ${columnId} in lenders board:`, {
          id: columnInLendersBoard.id,
          title: columnInLendersBoard.column?.title || 'No title',
          text: columnInLendersBoard.text || 'No value'
        });
        
        setError((prev) => `${prev || ''}\n\nColumn ID ${columnId} in lenders board has title: "${columnInLendersBoard.column?.title || 'No title'}" with value: "${columnInLendersBoard.text || 'No value'}"`);
      } else {
        console.log(`Column with ID ${columnId} not found in lenders board`);
        
        if (!columnInCurrentItem) {
          setError(`Column with ID ${columnId} not found in either board`);
        }
      }

    } catch (err) {
      console.error(`Error searching for column ${columnId}:`, err);
      setError('Failed to search for column: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  }, [itemId, enhancedApiCall]);

  // Function to search for the specific column ID
  const searchForNumericColumn = useCallback(() => {
    searchColumnById('numeric_mknn4ekf');
  }, [searchColumnById]);

  // Add a function to search for the specific column ID 1814231990
  const searchForProjectNameField = useCallback(() => {
    searchColumnById('1814231990');
  }, [searchColumnById]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-semibold">Email Preview</h2>
        <div className="flex gap-2">
          <button
            onClick={toggleDebugMode}
            className={`px-4 py-2 ${debugMode ? 'bg-red-600' : 'bg-gray-500'} text-white rounded hover:bg-red-700 transition-colors`}
          >
            {debugMode ? 'Debug: ON' : 'Debug: OFF'}
          </button>
          <button
            onClick={toggleMockDataMode}
            className={`px-4 py-2 ${useMockData ? 'bg-purple-600' : 'bg-gray-500'} text-white rounded hover:bg-purple-700 transition-colors`}
          >
            {useMockData ? 'Mock Data: ON' : 'Mock Data: OFF'}
          </button>
          <button
            onClick={testMondayApi}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
          >
            Test API
          </button>
          <button
            onClick={searchForNumericColumn}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
          >
            Find Column
          </button>
          <button
            onClick={searchForProjectNameField}
            className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors"
          >
            Find Project Field
          </button>
          <button
            onClick={getLenderEmails}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            Get Lender Emails
          </button>
          <button
            onClick={sendTestEmail}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Send Test Email
          </button>
        </div>
      </div>
      {debugMode && debugInfo && (
        <div className="p-4 bg-gray-900 text-green-400 border-b overflow-auto max-h-[300px]">
          <div className="font-semibold mb-2">Debug Information:</div>
          <pre className="text-xs whitespace-pre-wrap">{debugInfo}</pre>
        </div>
      )}
      {lenderEmails && (
        <div className="p-4 bg-gray-50 border-b">
          <div className="font-semibold mb-2">Lender Emails:</div>
          <div className="text-sm break-all whitespace-pre-wrap">{lenderEmails}</div>
          <button
            onClick={() => {
              if (lenderEmails) {
                // Extract just the email addresses (assuming they're after "Found X email(s):" text)
                const emailText = lenderEmails.includes('Found') 
                  ? lenderEmails.split('\n\n')[1] 
                  : lenderEmails;
                
                navigator.clipboard.writeText(emailText)
                  .then(() => {
                    setError('Emails copied to clipboard!');
                    setTimeout(() => setError(null), 2000);
                  })
                  .catch(err => {
                    console.error('Failed to copy emails:', err);
                    setError('Failed to copy emails to clipboard');
                  });
              }
            }}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Copy Emails
          </button>
        </div>
      )}
      <div className="relative">
        {!iframeReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
        <input
          ref={headerInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageUpload(file, true);
          }}
        />
        <input
          ref={impactInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageUpload(file, false);
          }}
        />
        <iframe
          ref={previewRef}
          className="w-full h-[800px] border-0"
          title="Email Preview"
          sandbox="allow-scripts allow-same-origin allow-top-navigation-to-custom-protocols"
          srcDoc={previewHtml || ''}
        />
      </div>
    </div>
  );
};

export default EmailTemplate; 