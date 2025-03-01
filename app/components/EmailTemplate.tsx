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

  const generateEmailPreview = useCallback(async (newHeaderImage?: string | null, newImpactImage?: string | null) => {
    try {
      setLoading(true);
      setError(null);

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

      const response = await monday.api(query);
      
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

      // Update iframe content if it exists
      if (previewRef.current) {
        const iframeDoc = previewRef.current.contentDocument;
        if (iframeDoc) {
          iframeDoc.open();
          iframeDoc.write(html);
          iframeDoc.close();
        }
      }
    } catch (err) {
      console.error('Error generating email:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate email');
    } finally {
      setLoading(false);
    }
  }, [itemId, headerImage, impactImage]);

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MONDAY_API_TOKEN;
    if (!token) {
      setError('API token not configured');
      return;
    }

    monday.setToken(token);
    generateEmailPreview();
  }, [generateEmailPreview]);

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