/**
 * Batch Link Import Utility
 * 
 * This utility allows importing multiple links from a CSV or JSON file.
 * It supports validation, deduplication, and automatic categorization.
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse as csvParse } from 'csv-parse/sync';
import { Link, Data, Category, Subcategory } from '../types/links';

// Define the functions from utility files directly to avoid import issues
function generateLinkId(): string {
  return 'link_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

async function generateTagsForLink(link: Link): Promise<{ suggestedTags: string[] }> {
  // Simple local implementation for admin scripts
  const tags: string[] = [];
  const content = `${link.title} ${link.description || ''}`.toLowerCase();
  
  // Extract domain-based tags
  try {
    const domain = new URL(link.url).hostname;
    const domainParts = domain.split('.');
    
    if (domainParts.length > 1) {
      // Add the main domain name as a tag
      const mainDomain = domainParts[domainParts.length - 2];
      if (mainDomain && !['com', 'org', 'net', 'io', 'co'].includes(mainDomain)) {
        tags.push(mainDomain);
      }
    }
  } catch (error) {
    // Ignore URL parsing errors
  }
  
  return { suggestedTags: Array.from(new Set(tags)) };
}

// Import data utilities
import { loadLinksData, saveLinksData } from './utils/links-data-utils';

interface BatchImportOptions {
  filePath: string;
  fileType: 'csv' | 'json';
  generateTags: boolean;
  dryRun: boolean;
  dataset?: string;
}

interface BatchImportResult {
  totalProcessed: number;
  added: number;
  updated: number;
  skipped: number;
  errors: { link: any; error: string }[];
  linksAdded: Link[];
  linksUpdated: Link[];
}

/**
 * Import links in batch from a file
 */
export async function batchImportLinks(options: BatchImportOptions): Promise<BatchImportResult> {
  const { filePath, fileType, generateTags, dryRun, dataset = 'default' } = options;
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  
  // Read and parse the file
  const fileContent = fs.readFileSync(filePath, 'utf8');
  let links: any[] = [];
  
  if (fileType === 'csv') {
    links = csvParse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });
  } else if (fileType === 'json') {
    links = JSON.parse(fileContent);
    if (!Array.isArray(links)) {
      throw new Error('JSON file must contain an array of links');
    }
  }
  
  // Load existing links data
  const linksData = await loadLinksData(dataset);
  
  // Process each link
  const result: BatchImportResult = {
    totalProcessed: links.length,
    added: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    linksAdded: [],
    linksUpdated: []
  };
  
  for (const linkData of links) {
    try {
      // Validate required fields
      if (!linkData.title || !linkData.url) {
        result.errors.push({ link: linkData, error: 'Missing required fields (title, url)' });
        continue;
      }
      
      // Generate an ID if not provided
      const id = linkData.id || generateLinkId();
      
      // Check if the link already exists (by ID or URL)
      const existingLinkById = linksData.links.find(l => l.id === id);
      const existingLinkByUrl = linksData.links.find(l => l.url === linkData.url);
      const existingLink = existingLinkById || existingLinkByUrl;
      
      // Prepare link object
      const link: Link = {
        id,
        title: linkData.title,
        url: linkData.url,
        description: linkData.description || '',
        category: linkData.category || 'Uncategorized',
        subcategory: linkData.subcategory || 'General',
        tags: linkData.tags ? (Array.isArray(linkData.tags) ? linkData.tags : linkData.tags.split(',').map((t: string) => t.trim())) : []
      };
      
      // Generate tags if requested
      if (generateTags && (!link.tags || link.tags.length === 0)) {
        try {
          const taggingResult = await generateTagsForLink(link);
          link.tags = taggingResult.suggestedTags || [];
        } catch (error) {
          console.warn(`Failed to generate tags for link: ${link.title}`, error);
        }
      }
      
      if (existingLink) {
        // Update existing link
        if (!dryRun) {
          // Find in categories/subcategories
          let found = false;
          
          for (const category of linksData.categories) {
            for (const subcategory of category.subcategories) {
              const linkIndex = subcategory.links.findIndex(l => l.id === id || l.url === linkData.url);
              
              if (linkIndex >= 0) {
                subcategory.links[linkIndex] = {
                  ...subcategory.links[linkIndex],
                  ...link,
                  updatedAt: new Date().toISOString()
                };
                found = true;
              }
            }
          }
          
          // Also update in the top-level links array
          const topLevelIndex = linksData.links.findIndex(l => l.id === id || l.url === linkData.url);
          if (topLevelIndex >= 0) {
            linksData.links[topLevelIndex] = {
              ...linksData.links[topLevelIndex],
              ...link,
              updatedAt: new Date().toISOString()
            };
          }
          
          // If not found in any subcategory, add to the appropriate one
          if (!found) {
            addLinkToCategory(linksData, link);
          }
        }
        
        result.updated++;
        result.linksUpdated.push(link);
      } else {
        // Add new link
        if (!dryRun) {
          // Add to the appropriate category/subcategory
          addLinkToCategory(linksData, link);
          
          // Also add to the top-level links array
          linksData.links.push({
            ...link,
            createdAt: new Date().toISOString()
          });
        }
        
        result.added++;
        result.linksAdded.push(link);
      }
    } catch (error) {
      result.errors.push({ link: linkData, error: error instanceof Error ? error.message : String(error) });
      result.skipped++;
    }
  }
  
  // Save the updated data if not in dry run mode
  if (!dryRun) {
    await saveLinksData(linksData, dataset);
  }
  
  return result;
}

/**
 * Add a link to the appropriate category and subcategory
 */
function addLinkToCategory(linksData: Data, link: Link): void {
  // Find or create the category
  let category = linksData.categories.find((c: Category) => c.name.toLowerCase() === (link.category || 'Uncategorized').toLowerCase());
  if (!category) {
    category = {
      name: link.category || 'Uncategorized',
      subcategories: []
    };
    linksData.categories.push(category);
  }
  
  // Find or create the subcategory
  let subcategory = category.subcategories.find((s: Subcategory) => s.name.toLowerCase() === (link.subcategory || 'General').toLowerCase());
  if (!subcategory) {
    subcategory = {
      name: link.subcategory || 'General',
      links: []
    };
    category.subcategories.push(subcategory);
  }
  
  // Add the link to the subcategory
  subcategory.links.push({
    ...link,
    createdAt: new Date().toISOString()
  });
}

/**
 * Command-line interface for batch importing links
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  const filePath = args[0];
  const fileType = path.extname(filePath).toLowerCase() === '.csv' ? 'csv' : 'json';
  const generateTags = args.includes('--generate-tags');
  const dryRun = args.includes('--dry-run');
  const dataset = args.find(arg => arg.startsWith('--dataset='))?.split('=')[1] || 'default';
  
  if (!filePath) {
    console.error('Please provide a file path');
    process.exit(1);
  }
  
  batchImportLinks({
    filePath,
    fileType,
    generateTags,
    dryRun,
    dataset
  })
    .then(result => {
      console.log('Batch import completed:');
      console.log(`Total processed: ${result.totalProcessed}`);
      console.log(`Added: ${result.added}`);
      console.log(`Updated: ${result.updated}`);
      console.log(`Skipped/Errors: ${result.skipped}`);
      
      if (result.errors.length > 0) {
        console.log('\nErrors:');
        result.errors.forEach(({ link, error }) => {
          console.log(`- ${link.title || link.url}: ${error}`);
        });
      }
      
      if (dryRun) {
        console.log('\nThis was a dry run. No changes were made.');
      }
    })
    .catch(error => {
      console.error('Error during batch import:', error);
      process.exit(1);
    });
}
