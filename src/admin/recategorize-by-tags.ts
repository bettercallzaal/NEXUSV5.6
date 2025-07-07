/**
 * Tag-Based Link Recategorization Utility
 * 
 * This utility analyzes link tags and suggests or applies category/subcategory changes
 * based on tag patterns. It can run in preview mode to show potential changes before applying them.
 */

import fs from 'fs';
import path from 'path';
import { Link } from '../types/links';
import { loadLinksData, saveLinksData } from './utils/links-data-utils';

interface RecategorizationOptions {
  tagMappingFile: string;
  dryRun: boolean;
  dataset?: string;
  interactive?: boolean;
}

interface TagMapping {
  tag: string;
  category: string;
  subcategory?: string;
  priority?: number;
}

interface RecategorizationResult {
  totalLinks: number;
  changesProposed: number;
  changesApplied: number;
  unchanged: number;
  proposedChanges: {
    link: Link;
    currentCategory: string;
    currentSubcategory: string;
    suggestedCategory: string;
    suggestedSubcategory: string;
    matchedTags: string[];
    applied: boolean;
  }[];
}

/**
 * Recategorize links based on their tags
 */
export async function recategorizeByTags(options: RecategorizationOptions): Promise<RecategorizationResult> {
  const { tagMappingFile, dryRun, dataset = 'default', interactive = false } = options;
  
  if (!fs.existsSync(tagMappingFile)) {
    throw new Error(`Tag mapping file not found: ${tagMappingFile}`);
  }
  
  // Load tag mappings
  const tagMappingsContent = fs.readFileSync(tagMappingFile, 'utf8');
  const tagMappings: TagMapping[] = JSON.parse(tagMappingsContent);
  
  // Sort mappings by priority (higher priority first)
  tagMappings.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  
  // Load existing links data
  const linksData = await loadLinksData(dataset);
  
  // Initialize result
  const result: RecategorizationResult = {
    totalLinks: 0,
    changesProposed: 0,
    changesApplied: 0,
    unchanged: 0,
    proposedChanges: []
  };
  
  // Process all links in all categories and subcategories
  for (const category of linksData.categories) {
    for (const subcategory of category.subcategories) {
      for (const link of subcategory.links) {
        result.totalLinks++;
        
        // Skip links without tags
        if (!link.tags || link.tags.length === 0) {
          result.unchanged++;
          continue;
        }
        
        // Find matching tag mappings
        const matchingMappings = tagMappings.filter(mapping => 
          link.tags && link.tags.includes(mapping.tag)
        );
        
        if (matchingMappings.length === 0) {
          result.unchanged++;
          continue;
        }
        
        // Use the highest priority mapping (already sorted)
        const bestMapping = matchingMappings[0];
        const suggestedCategory = bestMapping.category;
        const suggestedSubcategory = bestMapping.subcategory || 'General';
        
        // Check if this would be a change
        if (
          category.name.toLowerCase() === suggestedCategory.toLowerCase() &&
          subcategory.name.toLowerCase() === suggestedSubcategory.toLowerCase()
        ) {
          result.unchanged++;
          continue;
        }
        
        // We have a potential change
        const proposedChange = {
          link,
          currentCategory: category.name,
          currentSubcategory: subcategory.name,
          suggestedCategory,
          suggestedSubcategory,
          matchedTags: matchingMappings.map(m => m.tag),
          applied: false
        };
        
        result.proposedChanges.push(proposedChange);
        result.changesProposed++;
        
        // If not in dry run mode, apply the change
        if (!dryRun) {
          let shouldApply = !interactive;
          
          if (interactive) {
            // In interactive mode, we'd prompt the user here
            // For now, we'll simulate this with a console log
            console.log(`\nProposed change for "${link.title}":`);
            console.log(`  Current: ${category.name} > ${subcategory.name}`);
            console.log(`  Suggested: ${suggestedCategory} > ${suggestedSubcategory}`);
            console.log(`  Based on tags: ${proposedChange.matchedTags.join(', ')}`);
            console.log('Apply this change? (y/n)');
            
            // In a real interactive CLI, we'd get user input here
            // For now, we'll default to yes in this simulation
            shouldApply = true;
          }
          
          if (shouldApply) {
            // Remove from current location
            const linkIndex = subcategory.links.findIndex(l => l.id === link.id);
            if (linkIndex >= 0) {
              subcategory.links.splice(linkIndex, 1);
            }
            
            // Find or create target category
            let targetCategory = linksData.categories.find(
              c => c.name.toLowerCase() === suggestedCategory.toLowerCase()
            );
            
            if (!targetCategory) {
              targetCategory = {
                name: suggestedCategory,
                subcategories: []
              };
              linksData.categories.push(targetCategory);
            }
            
            // Find or create target subcategory
            let targetSubcategory = targetCategory.subcategories.find(
              s => s.name.toLowerCase() === suggestedSubcategory.toLowerCase()
            );
            
            if (!targetSubcategory) {
              targetSubcategory = {
                name: suggestedSubcategory,
                links: []
              };
              targetCategory.subcategories.push(targetSubcategory);
            }
            
            // Add to new location
            targetSubcategory.links.push({
              ...link,
              updatedAt: new Date().toISOString()
            });
            
            // Update result
            proposedChange.applied = true;
            result.changesApplied++;
          }
        }
      }
    }
  }
  
  // Clean up empty subcategories and categories
  if (!dryRun) {
    // Remove empty subcategories
    for (const category of linksData.categories) {
      category.subcategories = category.subcategories.filter(
        subcategory => subcategory.links.length > 0
      );
    }
    
    // Remove empty categories
    linksData.categories = linksData.categories.filter(
      category => category.subcategories.length > 0
    );
    
    // Save the updated data
    await saveLinksData(linksData, dataset);
  }
  
  return result;
}

/**
 * Command-line interface for tag-based recategorization
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  const tagMappingFile = args[0];
  const dryRun = args.includes('--dry-run');
  const interactive = args.includes('--interactive');
  const dataset = args.find(arg => arg.startsWith('--dataset='))?.split('=')[1] || 'default';
  
  if (!tagMappingFile) {
    console.error('Please provide a tag mapping file path');
    process.exit(1);
  }
  
  recategorizeByTags({
    tagMappingFile,
    dryRun,
    dataset,
    interactive
  })
    .then(result => {
      console.log('Recategorization completed:');
      console.log(`Total links: ${result.totalLinks}`);
      console.log(`Changes proposed: ${result.changesProposed}`);
      console.log(`Changes applied: ${result.changesApplied}`);
      console.log(`Unchanged: ${result.unchanged}`);
      
      if (result.proposedChanges.length > 0) {
        console.log('\nProposed changes:');
        result.proposedChanges.forEach(change => {
          console.log(`- "${change.link.title}"`);
          console.log(`  From: ${change.currentCategory} > ${change.currentSubcategory}`);
          console.log(`  To: ${change.suggestedCategory} > ${change.suggestedSubcategory}`);
          console.log(`  Based on tags: ${change.matchedTags.join(', ')}`);
          console.log(`  Applied: ${change.applied ? 'Yes' : 'No'}`);
          console.log('');
        });
      }
      
      if (dryRun) {
        console.log('\nThis was a dry run. No changes were made.');
      }
    })
    .catch(error => {
      console.error('Error during recategorization:', error);
      process.exit(1);
    });
}
