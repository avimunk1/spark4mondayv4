import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

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
    console.log('Buffer created:', {
      size: buffer.length,
      isBuffer: Buffer.isBuffer(buffer)
    });

    // Create a unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = file.name.replace(/\.[^/.]+$/, "") + '-' + uniqueSuffix + path.extname(file.name);
    
    // Ensure the uploads directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (err) {
      // Directory might already exist, ignore error
    }
    
    // Save the file
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);
    console.log('File saved:', filePath);
    
    // Create base64 version for email
    const base64 = buffer.toString('base64');
    console.log('Base64 conversion:', {
      originalSize: buffer.length,
      base64Length: base64.length,
      ratio: base64.length / buffer.length
    });

    const dataUrl = `data:${file.type};base64,${base64}`;
    console.log('Data URL created:', {
      length: dataUrl.length,
      prefix: dataUrl.substring(0, 50),
      suffix: dataUrl.substring(dataUrl.length - 50)
    });
    
    // Return both URLs
    const response = {
      url: `/uploads/${filename}`,
      emailUrl: dataUrl
    };
    
    console.log('Response prepared:', {
      url: response.url,
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