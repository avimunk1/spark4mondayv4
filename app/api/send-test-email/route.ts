import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

// Ensure only avimunk@gmail.com can receive test emails
const ALLOWED_TEST_EMAIL = 'avimunk@gmail.com';

export async function POST(request: Request) {
  try {
    const { html, subject } = await request.json();

    // Validate request
    if (!html) {
      return NextResponse.json({ error: 'Missing email content' }, { status: 400 });
    }

    // Initialize SendGrid
    if (!process.env.SENDGRID_API_KEY) {
      return NextResponse.json({ error: 'SendGrid API key not configured' }, { status: 500 });
    }
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    // Prepare email
    const msg = {
      to: ALLOWED_TEST_EMAIL, // Hardcoded for safety
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@sparkil.org', // Set your verified sender
      subject: subject || 'Test Email',
      html: html,
    };

    // Send email
    await sgMail.send(msg);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send email' },
      { status: 500 }
    );
  }
} 