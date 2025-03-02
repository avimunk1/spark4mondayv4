interface EmailTemplateOptions {
  item: {
    name: string;
    columnValues: {
      title: string;
      text: string;
      value: string;
      column?: {
        title: string;
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
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      background: #fff;
      direction: ltr;
      text-align: left;
    }
    
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      direction: ltr;
      text-align: left;
      background: #fff;
    }

    .header-section {
      display: flex;
      height: 200px;
    }

    .header-left {
      width: 50%;
      background: #620879;
      padding: 30px;
      position: relative;
    }

    .header-right {
      width: 50%;
      background: #B4E7F8;
      position: relative;
      overflow: hidden;
      background-size: cover;
      background-position: center;
      cursor: pointer;
    }

    .header-right:hover {
      opacity: 0.9;
    }

    .spark-logo {
      margin-bottom: 20px;
    }

    .spark-logo span {
      color: #E637BF;
      font-size: 24px;
      font-weight: bold;
      font-family: Arial, sans-serif;
    }

    .spark-logo span sup {
      font-size: 12px;
      color: #fff;
    }

    .title {
      color: #fff;
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    
    .subtitle {
      color: #64E0E0;
      font-size: 20px;
      line-height: 1.2;
    }

    .letter-section {
      padding: 30px;
    }
    
    .letter-heading {
      color: #620879;
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 20px;
    }
    
    .letter-text {
      color: #620879;
      font-size: 16px;
      line-height: 1.8;
      margin-bottom: 20px;
    }

    .signature {
      color: #620879;
      font-weight: bold;
    }

    .landscape-section {
      height: 150px;
      background: #B4E7F8;
      position: relative;
      overflow: hidden;
      background-size: cover;
      background-position: center;
      cursor: pointer;
    }

    .landscape-section:hover {
      opacity: 0.9;
    }

    .impact-section {
      background: #E637BF;
      color: white;
      padding: 40px;
      text-align: center;
    }

    .impact-title {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 20px;
    }

    .impact-text {
      font-size: 18px;
      line-height: 1.6;
      margin-bottom: 30px;
      text-align: left;
    }

    .impact-button {
      display: inline-block;
      background: white;
      color: #E637BF;
      padding: 15px 40px;
      border-radius: 5px;
      text-decoration: none;
      font-weight: bold;
      font-size: 18px;
      margin-bottom: 20px;
    }

    .website {
      color: white;
      text-decoration: none;
      font-size: 18px;
      margin-bottom: 20px;
      display: block;
    }

    .social-links {
      display: flex;
      justify-content: center;
      gap: 20px;
      margin: 20px 0;
    }

    .social-link {
      width: 30px;
      height: 30px;
      background: white;
      border-radius: 50%;
      display: inline-block;
    }

    .logos {
      display: flex;
      justify-content: center;
      gap: 30px;
      align-items: center;
    }

    .logo {
      height: 30px;
      filter: brightness(0) invert(1);
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header-section">
      <div class="header-left">
        <div class="spark-logo">
          <span>Spark<sup>IL</sup> News</span>
        </div>
        <div class="title">Exciting Update</div>
        <div class="subtitle">from {{name}}</div>
      </div>
      <div class="header-right" style="background-image: url('{{headerImage}}')" onclick="window.parent.postMessage({type: 'header-click'}, '*')">
      </div>
    </div>

    <div class="letter-section">
      <div class="letter-heading">Dear Lenders,</div>
      <div class="letter-text">{{text}}</div>
      <div class="signature">Best Regards,<br>{{name}}</div>
    </div>

    <div class="landscape-section" style="background-image: url('{{impactImage}}')" onclick="window.parent.postMessage({type: 'landscape-click'}, '*')">
    </div>

    <div class="impact-section">
      <div class="impact-title">Make a Bigger Impact Today!</div>
      <div class="impact-text">
        {{name}}'s journey is just one example of the resilience and determination of small business owners. Many others are still in need of your help. Visit the SparkIL platform today and support more businesses like <span class="business-name">{{businessName}}</span>, so together, we can drive meaningful change in their lives and communities.
      </div>
      <a href="https://www.sparkil.org" class="impact-button">Make a new impact!</a>
      <a href="https://www.sparkil.org" class="website">www.sparkil.org</a>
      <div class="social-links">
        <a href="#" class="social-link"></a>
        <a href="#" class="social-link"></a>
        <a href="#" class="social-link"></a>
        <a href="#" class="social-link"></a>
      </div>
      <div class="logos">
        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 40'%3E%3Cpath d='M10,20 h80 M50,10 v20' stroke='white' stroke-width='2'/%3E%3C/svg%3E" alt="Jewish Agency Logo" class="logo">
        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 40'%3E%3Ctext x='50' y='25' font-family='Arial' font-size='20' fill='white' text-anchor='middle'%3EOgen%3C/text%3E%3C/svg%3E" alt="Ogen Logo" class="logo">
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
    // Find the English text column
    const englishTextColumn = item.columnValues.find(col => col.column?.title === '❗טקטסט אנגלית');
    console.log('Found English text column:', englishTextColumn);
    
    if (!englishTextColumn || !englishTextColumn.text) {
      console.warn('No English text content found, using default');
      return EMAIL_TEMPLATE
        .replace(/\{\{text\}\}/g, 'No content available')
        .replace(/\{\{name\}\}/g, item.name || '')
        .replace(/\{\{businessName\}\}/g, item.name || '')
        .replace(/\{\{headerImage\}\}/g, headerImage || '')
        .replace(/\{\{impactImage\}\}/g, impactImage || '');
    }

    // Process the text to ensure proper line breaks and formatting
    const formattedText = englishTextColumn.text
      .replace(/\\n/g, '\n')
      .trim();
    console.log('Formatted text:', formattedText);

    // Replace all placeholders
    const result = EMAIL_TEMPLATE
      .replace(/\{\{text\}\}/g, formattedText)
      .replace(/\{\{name\}\}/g, item.name || '')
      .replace(/\{\{businessName\}\}/g, item.name || '')
      .replace(/\{\{headerImage\}\}/g, headerImage || '')
      .replace(/\{\{impactImage\}\}/g, impactImage || '');

    console.log('Generated template length:', result.length);
    return result;
  } catch (error) {
    console.error('Error generating email template:', error);
    throw new Error('Failed to generate email template');
  }
};

export const loadSvgTemplate = async (): Promise<string> => {
  return EMAIL_TEMPLATE;
}; 