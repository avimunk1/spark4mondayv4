import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const templatePath = path.join(process.cwd(), 'inputs', 'email template.svg');
    
    const dir = path.dirname(templatePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (!fs.existsSync(templatePath)) {
      const defaultTemplate = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="600" height="800" viewBox="0 0 600 800" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="600" height="200" fill="#620879"/>
  <rect y="200" width="600" height="600" fill="#B4E7F8"/>
  
  <!-- Mountains -->
  <path d="M0 800 Q150 650 300 700 T600 800" fill="#8CC63F"/>
  
  <!-- Clouds -->
  <g fill="#FFFFFF">
    <circle cx="100" cy="80" r="20"/>
    <circle cx="300" cy="60" r="25"/>
    <circle cx="500" cy="100" r="15"/>
  </g>
  
  <!-- Text Content -->
  <g font-family="Arial, sans-serif">
    <text x="30" y="50" fill="#FFFFFF" font-size="24" font-weight="bold">Spark News</text>
    <text x="30" y="100" fill="#64E0E0" font-size="32" font-weight="bold">Exciting Update</text>
    <text x="30" y="140" fill="#64E0E0" font-size="32" font-weight="bold">from Parvati</text>
    <text x="30" y="180" fill="#64E0E0" font-size="32" font-weight="bold">Indian food in</text>
    <text x="30" y="220" fill="#64E0E0" font-size="32" font-weight="bold">the Arava</text>
  </g>
  
  <!-- Israel Flag -->
  <g transform="translate(450, 20) rotate(-15)">
    <rect width="150" height="100" fill="#FFFFFF" stroke="#000000" stroke-width="1"/>
    <rect y="20" width="150" height="60" fill="#FFFFFF"/>
    <path d="M75,35 l25,43.3 l-50,0 z" fill="#0038B8"/>
    <path d="M75,65 l25,-43.3 l-50,0 z" fill="#0038B8"/>
  </g>
  
  <!-- Dynamic Content -->
  <foreignObject x="30" y="280" width="540" height="480">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Arial, sans-serif;">
      <p style="margin: 0; font-size: 28px; color: #620879; font-weight: bold;">Dear Lenders,</p>
      <div style="margin: 20px 0; font-size: 16px; line-height: 1.8; white-space: pre-wrap; color: #333333;">{{text}}</div>
    </div>
  </foreignObject>
</svg>`;
      
      fs.writeFileSync(templatePath, defaultTemplate, 'utf-8');
      return new NextResponse(defaultTemplate, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }

    const svgContent = await fs.promises.readFile(templatePath, 'utf-8');
    
    return new NextResponse(svgContent, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error loading SVG template:', error);
    return new NextResponse('Failed to load template', { status: 500 });
  }
} 