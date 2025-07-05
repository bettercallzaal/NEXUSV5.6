import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Data } from '@/types/links';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const dataset = searchParams.get('dataset') || 'default';
  
  try {
    let linksData: Data;
    
    if (dataset === 'large') {
      // Try to load the large dataset
      const filePath = path.join(process.cwd(), 'src', 'data', 'links-large.json');
      
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        linksData = JSON.parse(fileContent);
      } else {
        // Fall back to default dataset if large doesn't exist
        const defaultFilePath = path.join(process.cwd(), 'src', 'data', 'links.json');
        const fileContent = fs.readFileSync(defaultFilePath, 'utf8');
        linksData = JSON.parse(fileContent);
      }
    } else {
      // Load the default dataset
      const filePath = path.join(process.cwd(), 'src', 'data', 'links.json');
      const fileContent = fs.readFileSync(filePath, 'utf8');
      linksData = JSON.parse(fileContent);
    }
    
    return NextResponse.json(linksData);
  } catch (error) {
    console.error('Error loading links data:', error);
    return NextResponse.json(
      { error: 'Failed to load links data' },
      { status: 500 }
    );
  }
}
