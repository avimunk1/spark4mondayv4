interface EmailTemplateOptions {
  item: {
    name: string;
    columnValues: {
      title: string;
      text: string;
      value: string;
      column?: {
        title: string;
        id?: string;
        type?: string;
      };
    }[];
  };
  headerImage?: string | null;
  impactImage?: string | null;
}

const EMAIL_TEMPLATE = `<!DOCTYPE html>
<html dir="ltr" lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Spark Newsletter</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; background: #fff; direction: ltr; text-align: left;">
  <div class="email-container" style="max-width: 600px; margin: 0 auto; direction: ltr; text-align: left; background: #fff;">
    <div class="header-section" style="display: flex; height: 200px;">
      <div class="header-left" style="width: 50%; background: #620879; padding: 30px; position: relative;">
        <div class="spark-logo" style="margin-bottom: 20px;">
          <span style="color: #E637BF; font-size: 24px; font-weight: bold; font-family: Arial, sans-serif;">Spark<sup style="font-size: 12px; color: #fff;">IL</sup> News</span>
        </div>
        <div class="title" style="color: #fff; font-size: 28px; font-weight: bold; margin-bottom: 10px;">Exciting Update</div>
        <div class="subtitle" style="color: #64E0E0; font-size: 20px; line-height: 1.2;">from {{name}}</div>
        <div class="business-name" style="color: #fff; font-size: 14px; margin-top: 10px;">Business Name: {{businessNameOriginal}}</div>
      </div>
      <div class="header-right" style="width: 50%; position: relative; overflow: hidden;">
        <img src="{{headerImage}}" alt="Header Image" style="width: 100%; height: 200px; object-fit: cover;" onclick="window.parent.postMessage({type: 'header-click'}, '*')">
      </div>
    </div>

    <div class="lookup-emails-section" style="background: #f0e6f3; padding: 15px; border-bottom: 2px solid #620879;">
      <div style="font-weight: bold; color: #620879; margin-bottom: 5px;">Connected Lender Emails:</div>
      <div style="color: #333; word-break: break-word; font-family: monospace;">{{lookupEmails}}</div>
    </div>

    <div class="letter-section" style="padding: 30px;">
      <div class="letter-heading" style="color: #620879; font-size: 24px; font-weight: bold; margin-bottom: 20px;">Dear Lenders,</div>
      <div class="letter-text" style="color: #620879; font-size: 16px; line-height: 1.8; margin-bottom: 20px;">{{text}}</div>
      <div class="signature" style="color: #620879; font-weight: bold;">Best Regards,<br>{{name}}</div>
    </div>

    <div class="landscape-section" style="height: 150px; position: relative; overflow: hidden;">
      <img src="{{impactImage}}" alt="Impact Image" style="width: 100%; height: 150px; object-fit: cover;" onclick="window.parent.postMessage({type: 'landscape-click'}, '*')">
    </div>

    <div class="impact-section" style="background: #E637BF; color: white; padding: 40px; text-align: center;">
      <div class="impact-title" style="font-size: 32px; font-weight: bold; margin-bottom: 20px;">Make a Bigger Impact Today!</div>
      <div class="impact-text" style="font-size: 18px; line-height: 1.6; margin-bottom: 30px; text-align: left;">
        {{name}}'s journey is just one example of the resilience and determination of small business owners. Many others are still in need of your help. Visit the SparkIL platform today and support more businesses like <span style="font-weight: bold;">{{businessName}}</span>, so together, we can drive meaningful change in their lives and communities.
      </div>
      <a href="https://www.sparkil.org" class="impact-button" style="display: inline-block; background: white; color: #E637BF; padding: 15px 40px; border-radius: 5px; text-decoration: none; font-weight: bold; font-size: 18px; margin-bottom: 20px;">Make a new impact!</a>
      <a href="https://www.sparkil.org" class="website" style="color: white; text-decoration: none; font-size: 18px; margin-bottom: 20px; display: block;">www.sparkil.org</a>
      <div class="social-links" style="display: flex; justify-content: center; gap: 20px; margin: 20px 0;">
        <a href="#" class="social-link" style="width: 30px; height: 30px; background: white; border-radius: 50%; display: inline-block;"></a>
        <a href="#" class="social-link" style="width: 30px; height: 30px; background: white; border-radius: 50%; display: inline-block;"></a>
        <a href="#" class="social-link" style="width: 30px; height: 30px; background: white; border-radius: 50%; display: inline-block;"></a>
        <a href="#" class="social-link" style="width: 30px; height: 30px; background: white; border-radius: 50%; display: inline-block;"></a>
      </div>
      <div class="logos" style="display: flex; justify-content: center; gap: 30px; align-items: center;">
        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 40'%3E%3Cpath d='M10,20 h80 M50,10 v20' stroke='white' stroke-width='2'/%3E%3C/svg%3E" alt="Jewish Agency Logo" style="height: 30px; filter: brightness(0) invert(1);">
        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 40'%3E%3Ctext x='50' y='25' font-family='Arial' font-size='20' fill='white' text-anchor='middle'%3EOgen%3C/text%3E%3C/svg%3E" alt="Ogen Logo" style="height: 30px; filter: brightness(0) invert(1);">
      </div>
    </div>
  </div>
</body>
</html>`;

export const generateEmailFromTemplate = ({ item, headerImage, impactImage }: EmailTemplateOptions): string => {
  if (!item) {
    console.error('Missing required template data');
    throw new Error('Missing required template data');
  }

  try {
    console.log('Generating email template for item:', item.name);
    console.log('Header image provided:', headerImage);
    console.log('Impact image provided:', impactImage);
    
    // Log all column titles to help with debugging
    console.log('All available columns:', item.columnValues.map(col => ({
      title: col.column?.title,
      id: col.column?.id,
      hasText: !!col.text
    })));
    
    // Find all relevant columns with more flexible matching
    const englishTextColumn = item.columnValues.find(col => 
      col.column?.title === '❗ סקטסט אנגלית' || 
      col.column?.title === '❗טקטסט אנגלית' ||
      col.column?.title === '❗ טקסט אנגלית' ||
      (col.column?.title && col.column.title.includes('טקסט') && col.column.title.includes('אנגלית'))
    );
    
    const aiTextColumn = item.columnValues.find(col => 
      col.column?.title === '❗טקטסט AI' ||
      col.column?.title === '❗ טקטסט AI' ||
      (col.column?.title && col.column.title.includes('טקסט') && col.column.title.includes('AI'))
    );
    
    const projectNameColumn = item.columnValues.find(col => 
      col.column?.title === 'project name' ||
      (col.column?.title && col.column.title.toLowerCase().includes('project') && col.column.title.toLowerCase().includes('name'))
    );
    
    const businessNameColumn = item.columnValues.find(col => 
      col.column?.title === '🔸שם עסק מקורי מבעל העסק' ||
      (col.column?.title && col.column.title.includes('שם עסק מקורי'))
    );
    
    const lookupEmails = item.columnValues.find(col => col.column?.id === 'lookup_mknnf6y2');
    
    console.log('Found columns:', {
      englishText: englishTextColumn ? {
        title: englishTextColumn.column?.title,
        text: englishTextColumn.text,
        hasText: !!englishTextColumn.text
      } : 'Not found',
      aiText: aiTextColumn ? {
        title: aiTextColumn.column?.title,
        text: aiTextColumn.text,
        hasText: !!aiTextColumn.text
      } : 'Not found',
      projectName: projectNameColumn ? {
        title: projectNameColumn.column?.title,
        text: projectNameColumn.text,
        hasText: !!projectNameColumn.text
      } : 'Not found',
      businessName: businessNameColumn ? {
        title: businessNameColumn.column?.title,
        text: businessNameColumn.text,
        hasText: !!businessNameColumn.text
      } : 'Not found'
    });
    console.log('Found Lookup Emails raw data:', {
      text: lookupEmails?.text,
      value: lookupEmails?.value,
      column: lookupEmails?.column
    });

    // Process the lookup emails - since we can't get them directly, we'll use a placeholder
    let formattedLookupEmails = 'Use the "Get Lender Emails" button to fetch emails';
    
    console.log('Using placeholder for lookup emails');

    if (!englishTextColumn || !englishTextColumn.text) {
      console.warn('No English text content found, using default');
      const result = EMAIL_TEMPLATE
        .replace(/\{\{text\}\}/g, 'No content available')
        .replace(/\{\{name\}\}/g, item.name || '')
        .replace(/\{\{businessName\}\}/g, item.name || '')
        .replace(/\{\{businessNameOriginal\}\}/g, businessNameColumn?.text || 'N/A')
        .replace(/\{\{lookupEmails\}\}/g, formattedLookupEmails)
        .replace(/\{\{headerImage\}\}/g, headerImage || '')
        .replace(/\{\{impactImage\}\}/g, impactImage || '');
      
      console.log('Generated template with default text. Header image present:', result.includes(headerImage || ''));
      console.log('Impact image present:', result.includes(impactImage || ''));
      return result;
    }

    // Process the text to ensure proper line breaks and formatting
    const formattedText = englishTextColumn.text
      .replace(/\\n/g, '\n')
      .trim();
    
    // Replace all placeholders
    const result = EMAIL_TEMPLATE
      .replace(/\{\{text\}\}/g, formattedText)
      .replace(/\{\{name\}\}/g, item.name || '')
      .replace(/\{\{businessName\}\}/g, item.name || '')
      .replace(/\{\{businessNameOriginal\}\}/g, businessNameColumn?.text || 'N/A')
      .replace(/\{\{lookupEmails\}\}/g, formattedLookupEmails)
      .replace(/\{\{headerImage\}\}/g, headerImage || '')
      .replace(/\{\{impactImage\}\}/g, impactImage || '');

    console.log('Generated template with content. Header image present:', result.includes(headerImage || ''));
    console.log('Impact image present:', result.includes(impactImage || ''));
    console.log('Business Name included:', businessNameColumn?.text || 'N/A');
    
    return result;
  } catch (error) {
    console.error('Error generating email template:', error);
    throw new Error('Failed to generate email template');
  }
};

export const loadSvgTemplate = async (): Promise<string> => {
  return EMAIL_TEMPLATE;
}; 