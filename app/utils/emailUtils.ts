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
  svgTemplate: string;
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
    }

    .header-section {
      position: relative;
      overflow: hidden;
    }
    
    .spark-logo {
      padding: 20px;
      display: flex;
      align-items: center;
    }

    .spark-logo span {
      color: #E637BF;
      font-size: 24px;
      font-weight: bold;
    }

    .spark-logo span sup {
      color: #333;
      font-size: 16px;
    }

    .flag-corner {
      position: absolute;
      top: -20px;
      left: -20px;
      width: 200px;
      transform: rotate(-15deg);
    }
    
    .main-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
    }
    
    .left-section {
      background: #620879;
      padding: 40px;
      color: white;
      text-align: left;
    }
    
    .title {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 10px;
      text-align: left;
    }
    
    .subtitle {
      color: #64E0E0;
      font-size: 28px;
      line-height: 1.2;
      text-align: left;
    }
    
    .right-section {
      background: #B4E7F8;
      position: relative;
    }
    
    .clouds {
      position: absolute;
      width: 100%;
      height: 100%;
    }
    
    .cloud {
      position: absolute;
      background: white;
      border-radius: 50%;
    }
    
    .cloud-1 { width: 40px; height: 40px; right: 20%; top: 20%; }
    .cloud-2 { width: 50px; height: 50px; right: 50%; top: 30%; }
    .cloud-3 { width: 30px; height: 30px; right: 80%; top: 15%; }
    
    .hills {
      position: absolute;
      bottom: 0;
      width: 100%;
      height: 40%;
      background: #8CC63F;
      clip-path: polygon(0% 100%, 0% 40%, 33% 60%, 66% 30%, 100% 50%, 100% 100%);
    }

    .letter-section {
      background: #fff;
      padding: 30px;
      margin: 20px;
      border-radius: 10px;
      text-align: left;
    }
    
    .letter-heading {
      color: #620879;
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 20px;
      text-align: left;
    }
    
    .letter-text {
      color: #620879;
      font-size: 16px;
      line-height: 1.8;
      margin-bottom: 20px;
      text-align: left;
    }

    .signature {
      color: #620879;
      font-weight: bold;
      text-align: left;
    }

    .landscape-section {
      height: 200px;
      background: #B4E7F8;
      position: relative;
    }

    .landscape-hills {
      position: absolute;
      bottom: 0;
      width: 100%;
      height: 60%;
      background: #8CC63F;
      clip-path: polygon(0% 100%, 0% 30%, 33% 50%, 66% 20%, 100% 40%, 100% 100%);
    }

    .landscape-clouds {
      position: absolute;
      width: 100%;
      height: 100%;
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

    .business-name {
      color: white;
      font-weight: bold;
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
      margin-bottom: 30px;
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
      margin-bottom: 30px;
    }

    .social-link {
      width: 40px;
      height: 40px;
      background: white;
      border-radius: 50%;
    }

    .logos {
      display: flex;
      justify-content: center;
      gap: 30px;
      align-items: center;
    }

    .logo {
      height: 40px;
    }

    @media (max-width: 600px) {
      .main-content {
        grid-template-columns: 1fr;
      }
      .title { font-size: 24px; }
      .subtitle { font-size: 20px; }
      .impact-title { font-size: 24px; }
      .impact-text { font-size: 16px; }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header-section">
      <div class="spark-logo">
        <span>Spark<sup>IL</sup> News</span>
      </div>
      <img class="flag-corner" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 150'%3E%3Cpath d='M0,0 L200,0 L200,150 L0,150 Z' fill='white'/%3E%3Cpath d='M0,20 L200,20 L200,130 L0,130 Z' fill='white'/%3E%3Cpath d='M100,35 L150,95 L50,95 Z' fill='%230038B8'/%3E%3Cpath d='M100,115 L150,55 L50,55 Z' fill='%230038B8'/%3E%3C/svg%3E" alt="Israel Flag">
    </div>

    <div class="main-content">
      <div class="left-section">
        <div class="title">Exciting Update</div>
        <div class="subtitle">from Parvati<br>Indian food in<br>the Arava</div>
      </div>
      <div class="right-section">
        <div class="clouds">
          <div class="cloud cloud-1"></div>
          <div class="cloud cloud-2"></div>
          <div class="cloud cloud-3"></div>
        </div>
        <div class="hills"></div>
      </div>
    </div>

    <div class="letter-section">
      <div class="letter-heading">Dear Lenders,</div>
      <div class="letter-text">{{text}}</div>
      <div class="signature">Best Regards,<br>{{name}}</div>
    </div>

    <div class="landscape-section">
      <div class="landscape-clouds">
        <div class="cloud cloud-1"></div>
        <div class="cloud cloud-2"></div>
      </div>
      <div class="landscape-hills"></div>
    </div>

    <div class="impact-section">
      <div class="impact-title">Make a Bigger Impact Today!</div>
      <div class="impact-text">
        {{name}}'s journey is just one example of the resilience and determination of small business owners. Many others are still in need of your help. Visit the SparkIL platform today and support more businesses like <span class="business-name">{{businessName}}</span>, so together, we can drive meaningful change in their lives and communities.
      </div>
      <a href="https://www.sparkil.org" class="impact-button">Make a new impact!</a>
      <a href="https://www.sparkil.org" class="website">www.sparkil.org</a>
      <div class="social-links">
        <a href="#" class="social-link facebook"></a>
        <a href="#" class="social-link instagram"></a>
        <a href="#" class="social-link linkedin"></a>
        <a href="#" class="social-link youtube"></a>
      </div>
      <div class="logos">
        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 40'%3E%3Cpath d='M10,20 h80 M50,10 v20' stroke='white' stroke-width='2'/%3E%3C/svg%3E" alt="Jewish Agency Logo" class="logo">
        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 40'%3E%3Ctext x='50' y='25' font-family='Arial' font-size='20' fill='white' text-anchor='middle'%3EOgen%3C/text%3E%3C/svg%3E" alt="Ogen Logo" class="logo">
      </div>
    </div>
  </div>
</body>
</html>`;

export const generateEmailFromTemplate = ({ item, svgTemplate }: EmailTemplateOptions): string => {
  if (!item) {
    throw new Error('Missing required template data');
  }

  try {
    // Find the English text column
    const englishTextColumn = item.columnValues.find(col => col.column?.title === '❗טקטסט אנגלית');
    if (!englishTextColumn || !englishTextColumn.text) {
      return EMAIL_TEMPLATE.replace(/\{\{text\}\}/g, 'No content available')
                          .replace(/\{\{name\}\}/g, item.name || '')
                          .replace(/\{\{businessName\}\}/g, item.name || '');
    }

    // Process the text to ensure proper line breaks and formatting
    const formattedText = englishTextColumn.text
      .replace(/\\n/g, '\n')
      .trim();

    // Replace all placeholders
    return EMAIL_TEMPLATE
      .replace(/\{\{text\}\}/g, formattedText)
      .replace(/\{\{name\}\}/g, item.name || '')
      .replace(/\{\{businessName\}\}/g, item.name || '');
  } catch (error) {
    console.error('Error generating email template:', error);
    throw new Error('Failed to generate email template');
  }
};

export const loadSvgTemplate = async (): Promise<string> => {
  return EMAIL_TEMPLATE;
}; 