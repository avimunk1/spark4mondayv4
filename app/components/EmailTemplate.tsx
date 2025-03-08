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
  const [headerImageEmail, setHeaderImageEmail] = React.useState<string | null>(null);
  const [impactImageEmail, setImpactImageEmail] = React.useState<string | null>(null);
  const previewRef = useRef<HTMLIFrameElement>(null);
  const headerInputRef = useRef<HTMLInputElement>(null);
  const impactInputRef = useRef<HTMLInputElement>(null);
  const [iframeReady, setIframeReady] = React.useState(false);

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

  // Effect to update iframe when emailHtml changes
  useEffect(() => {
    if (emailHtml) {
      console.log('Email HTML updated, length:', emailHtml.length);
      setIframeReady(false);
      updateIframeContent(emailHtml);
    }
  }, [emailHtml, updateIframeContent]);

  // Modify generateEmailPreview to not save automatically
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
    } catch (err) {
      console.error('Error in generateEmailPreview:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate email');
    } finally {
      setLoading(false);
    }
  }, [itemId, headerImage, impactImage]);

  // Modify handleSave to just log for now
  const handleSave = useCallback(async () => {
    if (!emailHtml) return;
    console.log('Save functionality temporarily disabled');
    setError('Save functionality coming soon');
  }, [emailHtml]);

  // Initialize Monday SDK and load initial preview
  useEffect(() => {
    const initializePreview = async () => {
      console.log('Initializing Monday SDK and preview');
      const token = process.env.NEXT_PUBLIC_MONDAY_API_TOKEN;
      if (token) {
        try {
          console.log('Token found, setting up Monday SDK');
          monday.setToken(token);
          
          // Generate preview without saving
          await generateEmailPreview(undefined, undefined);
          
          console.log('Initial preview generated without saving');
        } catch (err) {
          console.error('Error during initialization:', err);
          setError('Failed to initialize preview');
        }
      } else {
        console.error('No Monday.com API token found');
        setError('API token not configured');
      }
    };

    initializePreview();
  }, [generateEmailPreview]);

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

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send test email');
      }

      setError('Test email sent successfully to avimunk@gmail.com');
      
    } catch (err) {
      console.error('Error sending test email:', err);
      setError('Failed to send test email: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  }, [emailHtml, headerImage, headerImageEmail, impactImage, impactImageEmail]);

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
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-semibold">Email Preview</h2>
        <div className="flex gap-2">
          <button
            onClick={sendTestEmail}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Send Test Email
          </button>
        </div>
      </div>
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
          srcDoc={emailHtml || ''}
        />
      </div>
    </div>
  );
};

export default EmailTemplate; 