import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Data, Link } from '@/types/links';

// Helper function to load links data
async function loadLinksData(dataset = 'default'): Promise<Data> {
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
  
  // Ensure links array exists
  if (!linksData.links) {
    linksData.links = [];
  }
  
  return linksData;
}

// Helper function to save links data
async function saveLinksData(data: Data, dataset = 'default'): Promise<void> {
  const filePath = path.join(process.cwd(), 'src', 'data', dataset === 'large' ? 'links-large.json' : 'links.json');
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const dataset = searchParams.get('dataset') || 'default';
  
  try {
    const linksData = await loadLinksData(dataset);
    return NextResponse.json(linksData);
  } catch (error) {
    console.error('Error loading links data:', error);
    return NextResponse.json(
      { error: 'Failed to load links data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { link } = body;
    
    if (!link || !link.id || !link.title || !link.url) {
      return NextResponse.json(
        { error: 'Invalid link data. Required fields: id, title, url' },
        { status: 400 }
      );
    }

    // Required fields for categorization
    if (!link.category) {
      return NextResponse.json(
        { error: 'Category is required for link placement' },
        { status: 400 }
      );
    }
    
    const dataset = request.nextUrl.searchParams.get('dataset') || 'default';
    const linksData = await loadLinksData(dataset);
    
    // First check if the link exists in the top-level links array (for backward compatibility)
    let existingLinkFound = false;
    const existingLinkIndex = linksData.links.findIndex(l => l.id === link.id);
    
    if (existingLinkIndex >= 0) {
      // Update existing link in the top-level links array
      linksData.links[existingLinkIndex] = {
        ...linksData.links[existingLinkIndex],
        ...link,
        updatedAt: new Date().toISOString()
      };
      existingLinkFound = true;
    }

    // Find or create the category
    let category = linksData.categories.find(c => c.name.toLowerCase() === link.category.toLowerCase());
    if (!category) {
      category = {
        name: link.category,
        subcategories: []
      };
      linksData.categories.push(category);
    }

    // Find or create the subcategory
    const subcategoryName = link.subcategory || 'General';
    let subcategory = category.subcategories.find(s => s.name.toLowerCase() === subcategoryName.toLowerCase());
    if (!subcategory) {
      subcategory = {
        name: subcategoryName,
        links: []
      };
      category.subcategories.push(subcategory);
    }

    // Check if the link already exists in the subcategory
    const subcategoryLinkIndex = subcategory.links.findIndex(l => l.id === link.id);
    
    if (subcategoryLinkIndex >= 0) {
      // Update existing link in the subcategory
      subcategory.links[subcategoryLinkIndex] = {
        ...subcategory.links[subcategoryLinkIndex],
        title: link.title,
        url: link.url,
        description: link.description || '',
        tags: link.tags || subcategory.links[subcategoryLinkIndex].tags || [],
        category: link.category,
        subcategory: subcategoryName,
        isNew: link.isNew !== undefined ? link.isNew : subcategory.links[subcategoryLinkIndex].isNew,
        isOfficial: link.isOfficial !== undefined ? link.isOfficial : subcategory.links[subcategoryLinkIndex].isOfficial,
        updatedAt: new Date().toISOString()
      };
      existingLinkFound = true;
    } else if (!existingLinkFound) {
      // Add new link to the subcategory
      const newLink = {
        id: link.id,
        title: link.title,
        url: link.url,
        description: link.description || '',
        tags: link.tags || [],
        category: link.category,
        subcategory: subcategoryName,
        isNew: link.isNew !== undefined ? link.isNew : false,
        isOfficial: link.isOfficial !== undefined ? link.isOfficial : false,
        createdAt: new Date().toISOString()
      };
      
      subcategory.links.push(newLink);
      
      // Also add to top-level links array for backward compatibility
      linksData.links.push({
        ...newLink
      });
    }
    
    // Save updated data
    await saveLinksData(linksData, dataset);
    
    return NextResponse.json({ success: true, link });
  } catch (error) {
    console.error('Error adding/updating link:', error);
    return NextResponse.json(
      { error: 'Failed to add/update link' },
      { status: 500 }
    );
  }
}
