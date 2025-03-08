import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    console.log('Processing file:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Create a buffer from the file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Create base64 version for email
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;
    
    console.log('Base64 conversion:', {
      originalSize: buffer.length,
      base64Length: base64.length,
      ratio: base64.length / buffer.length
    });

    // Return both a preview URL (using blob) and the email data URL
    const previewUrl = `data:${file.type};base64,${base64}`;
    
    const response = {
      url: previewUrl,      // Use base64 for preview too
      emailUrl: dataUrl     // Same data for email
    };
    
    console.log('Response prepared:', {
      previewUrlLength: response.url.length,
      emailUrlLength: response.emailUrl.length,
      emailUrlValid: response.emailUrl.startsWith('data:') && response.emailUrl.includes(';base64,')
    });
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error handling file:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to handle file' },
      { status: 500 }
    );
  }
} 