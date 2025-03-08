import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

// Ensure only avimunk@gmail.com can receive test emails
const ALLOWED_TEST_EMAIL = 'avimunk@gmail.com';

export async function POST(request: Request) {
  try {
    const { html: originalHtml, subject } = await request.json();
    let processedHtml = originalHtml;

    // Validate request
    if (!processedHtml) {
      return NextResponse.json({ error: 'Missing email content' }, { status: 400 });
    }

    // Initialize SendGrid
    if (!process.env.SENDGRID_API_KEY) {
      return NextResponse.json({ error: 'SendGrid API key not configured' }, { status: 500 });
    }
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    // Log the size of the HTML and check for base64 images
    console.log('Original HTML size:', processedHtml.length);
    const base64Count = (processedHtml.match(/data:image\/[^;]+;base64,/g) || []).length;
    console.log('Number of base64 images found:', base64Count);

    // Extract and validate base64 images
    const base64Images = processedHtml.match(/data:image\/[^;]+;base64,[^"']+/g) || [];
    console.log('Base64 images found:', base64Images.length);

    // Prepare attachments and replace base64 with CID references
    const attachments = [];
    for (let i = 0; i < base64Images.length; i++) {
      const base64Image = base64Images[i];
      const matches = base64Image.match(/^data:image\/([^;]+);base64,(.+)$/);
      
      if (!matches) {
        console.warn(`Invalid base64 image format at index ${i}`);
        continue;
      }

      const [, type, base64Data] = matches;
      // Use a more unique content ID
      const contentId = `img_${Date.now()}_${i}`;
      
      // Replace the base64 data in HTML with proper CID format
      processedHtml = processedHtml.replace(
        base64Image,
        `cid:${contentId}`
      );

      attachments.push({
        content: base64Data,
        filename: `image_${i + 1}.${type}`,
        type: `image/${type}`,
        disposition: 'inline',
        content_id: contentId // SendGrid expects content_id, not contentId
      });

      console.log(`Processed image ${i + 1}:`, {
        type: `image/${type}`,
        contentId,
        filenameGenerated: `image_${i + 1}.${type}`
      });
    }

    // Verify the HTML still contains image references
    console.log('Processed HTML size:', processedHtml.length);
    console.log('Number of CID references:', (processedHtml.match(/cid:/g) || []).length);

    // Prepare email with proper SendGrid format
    const msg = {
      to: ALLOWED_TEST_EMAIL,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'noreply@sparkil.org',
        name: 'SparkIL Updates'
      },
      subject: subject || 'Test Email',
      html: processedHtml,
      attachments: attachments
    };

    console.log('Sending email with:', {
      attachmentsCount: attachments.length,
      htmlLength: processedHtml.length,
      to: msg.to,
      from: msg.from.email
    });

    // Send email
    const response = await sgMail.send(msg);
    console.log('SendGrid response:', response[0].statusCode);

    return NextResponse.json({ 
      success: true,
      details: {
        statusCode: response[0].statusCode,
        attachmentsProcessed: attachments.length
      }
    });

  } catch (error) {
    console.error('Error sending test email:', error);
    // Extract detailed error information from SendGrid response
    const errorDetails = error.response?.body?.errors 
      ? error.response.body.errors
      : [{ message: error.message || 'Unknown error' }];
    
    return NextResponse.json(
      { 
        error: 'Failed to send email',
        details: errorDetails
      },
      { status: error.code || 500 }
    );
  }
} 