import React from 'react';
import mondaySdk from 'monday-sdk-js';
import { generateEmailFromTemplate, loadSvgTemplate } from '../utils/emailUtils';

interface EmailTemplateProps {
  boardId: number;
  itemId: string;
  columnId: string;
}

interface MondayApiResponse {
  data?: any;
  account_id?: number;
  errors?: Array<{ message: string; status?: number }>;
}

interface ColumnValue {
  id: string;
  text: string;
  value: string;
  column?: {
    id: string;
    title: string;
    type: string;
  };
}

const monday = mondaySdk();

export const EmailTemplate: React.FC<EmailTemplateProps> = ({ boardId, itemId, columnId }) => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [emailHtml, setEmailHtml] = React.useState<string | null>(null);
  const [svgTemplate, setSvgTemplate] = React.useState<string | null>(null);

  const generateEmailHtml = React.useCallback(async (template: string) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch the item with all its column values
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

      console.log('Fetching item data with query:', query);
      
      const response = await monday.api(query);
      console.log('Raw API response:', JSON.stringify(response, null, 2));

      if (!response) {
        throw new Error('No response from Monday.com API');
      }

      // Type assertion after we know response exists
      const typedResponse = response as MondayApiResponse;

      if (typedResponse.errors && typedResponse.errors.length > 0) {
        const errorDetails = typedResponse.errors
          .map(e => e.message || 'Unknown error')
          .join(', ');
        throw new Error(`Monday.com API error: ${errorDetails}`);
      }

      if (!typedResponse.data?.items?.[0]) {
        throw new Error('No item data found');
      }

      const item = typedResponse.data.items[0];
      console.log('Column values:', item.column_values.map((col: ColumnValue) => ({
        id: col.id,
        title: col.column?.title,
        text: col.text
      })));
      
      // Generate email HTML using the SVG template and item data
      const html = generateEmailFromTemplate({
        item: {
          name: item.name,
          columnValues: item.column_values
        },
        svgTemplate: template
      });

      setEmailHtml(html);
    } catch (err) {
      console.error('Error generating email:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate email');
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  // Load SVG template and generate email on mount or when props change
  React.useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MONDAY_API_TOKEN;
    if (!token) {
      setError('API token not configured');
      return;
    }

    monday.setToken(token);
    
    loadSvgTemplate()
      .then(template => {
        console.log('Loaded template:', template.substring(0, 100) + '...');
        setSvgTemplate(template);
        return generateEmailHtml(template);
      })
      .catch(err => {
        console.error('Failed to load SVG template:', err);
        setError('Failed to load email template');
      });
  }, [itemId, columnId, generateEmailHtml]);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg" dir="rtl">
      <h2 className="text-xl font-semibold mb-4">תצוגה מקדימה</h2>
      
      <div className="flex justify-end">
        <button
          onClick={() => {
            if (emailHtml) {
              const blob = new Blob([emailHtml], { type: 'text/html' });
              const url = URL.createObjectURL(blob);
              window.open(url, '_blank');
              URL.revokeObjectURL(url);
            }
          }}
          disabled={loading || !emailHtml}
          className={`px-4 py-2 ${
            loading || !emailHtml
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white rounded transition-colors`}
        >
          {loading ? 'טוען...' : 'הצג תצוגה מקדימה'}
        </button>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
};

export default EmailTemplate; 