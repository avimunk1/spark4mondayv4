'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import mondaySdk from 'monday-sdk-js';
import { generateEmailFromTemplate } from '../utils/emailUtils';

interface EmailTemplateProps {
  boardId: number;
  itemId: string;
  columnId: string;
}

const monday = mondaySdk();

const EmailTemplate: React.FC<EmailTemplateProps> = ({ boardId, itemId, columnId }) => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [emailHtml, setEmailHtml] = React.useState<string | null>(null);
  const [headerImage, setHeaderImage] = React.useState<string | null>(null);
  const [impactImage, setImpactImage] = React.useState<string | null>(null);
  const previewRef = useRef<HTMLIFrameElement>(null);
  const headerInputRef = useRef<HTMLInputElement>(null);
  const impactInputRef = useRef<HTMLInputElement>(null);

  // Function to update iframe content
  const updateIframeContent = useCallback((html: string) => {
    if (!previewRef.current) {
      console.error('No iframe reference available');
      return;
    }

    // Wait for iframe to be ready
    const checkIframe = () => {
      const iframeDoc = previewRef.current?.contentDocument;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(html);
        iframeDoc.close();
      } else {
        setTimeout(checkIframe, 100); // Check again in 100ms
      }
    };
    checkIframe();
  }, []);

  // Effect to update iframe when emailHtml changes
  useEffect(() => {
    if (emailHtml) {
      updateIframeContent(emailHtml);
    }
  }, [emailHtml, updateIframeContent]);

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

      console.log('Sending API query:', query);
      const response = await monday.api(query);
      console.log('API Response:', response);
      
      if (!response?.data?.items?.[0]) {
        console.error('No item data found in response');
        throw new Error('No item data found');
      }

      const item = response.data.items[0];
      console.log('Item data:', item);
      console.log('Column values:', item.column_values);

      const html = generateEmailFromTemplate({
        item: {
          name: item.name,
          columnValues: item.column_values
        },
        headerImage: newHeaderImage !== undefined ? newHeaderImage : headerImage,
        impactImage: newImpactImage !== undefined ? newImpactImage : impactImage
      });
      console.log('Generated HTML length:', html.length);

      setEmailHtml(html);
    } catch (err) {
      console.error('Detailed error in generateEmailPreview:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate email');
    } finally {
      setLoading(false);
    }
  }, [itemId, headerImage, impactImage]);

  // Initialize Monday SDK with debug logging
  useEffect(() => {
    console.log('Initializing Monday SDK');
    const token = process.env.NEXT_PUBLIC_MONDAY_API_TOKEN;
    if (token) {
      console.log('Token found, setting up Monday SDK');
      monday.setToken(token);
      generateEmailPreview();
    } else {
      console.error('No Monday.com API token found');
    }
  }, [generateEmailPreview]);

  const handleImageUpload = async (file: File, isHeader: boolean) => {
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        if (typeof reader.result === 'string') {
          if (isHeader) {
            await setHeaderImage(reader.result);
            await generateEmailPreview(reader.result, impactImage);
          } else {
            await setImpactImage(reader.result);
            await generateEmailPreview(headerImage, reader.result);
          }
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to upload image');
    }
  };

  // Handle messages from the iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'imageClick') {
        if (event.data.imageType === 'header') {
          headerInputRef.current?.click();
        } else if (event.data.imageType === 'landscape') {
          impactInputRef.current?.click();
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

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
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="relative">
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
        />
      </div>
    </div>
  );
};

export default EmailTemplate; 