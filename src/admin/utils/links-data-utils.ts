/**
 * Links Data Utilities
 * 
 * Helper functions for loading and saving links data.
 */

import * as fs from 'fs';
import * as path from 'path';
import { Data } from '../../types/links';

/**
 * Load links data from JSON file
 */
export async function loadLinksData(dataset = 'default'): Promise<Data> {
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

/**
 * Save links data to JSON file
 */
export async function saveLinksData(data: Data, dataset = 'default'): Promise<void> {
  const filePath = path.join(process.cwd(), 'src', 'data', dataset === 'large' ? 'links-large.json' : 'links.json');
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Create a backup of links data
 */
export async function backupLinksData(dataset = 'default'): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const sourceFilePath = path.join(process.cwd(), 'src', 'data', dataset === 'large' ? 'links-large.json' : 'links.json');
  const backupDir = path.join(process.cwd(), 'src', 'data', 'backups');
  
  // Create backup directory if it doesn't exist
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  const backupFilePath = path.join(backupDir, `links-${dataset}-${timestamp}.json`);
  
  // Copy the file
  fs.copyFileSync(sourceFilePath, backupFilePath);
  
  return backupFilePath;
}
