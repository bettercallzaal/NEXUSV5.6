#!/usr/bin/env node

/**
 * NEXUS Admin CLI
 * 
 * Command-line interface for NEXUS admin utilities.
 * Provides easy access to batch link operations and recategorization.
 */

import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { batchImportLinks } from './batch-import-links';
import { recategorizeByTags } from './recategorize-by-tags';
import { backupLinksData } from './utils/links-data-utils';

// Create CLI program
const program = new Command();

program
  .name('nexus-admin')
  .description('NEXUS Admin CLI for batch operations and maintenance')
  .version('1.0.0');

// Batch import command
program
  .command('import')
  .description('Import links in batch from a CSV or JSON file')
  .argument('<file>', 'Path to the CSV or JSON file containing links')
  .option('-d, --dataset <dataset>', 'Dataset to use (default or large)', 'default')
  .option('-t, --generate-tags', 'Generate tags for links without tags', false)
  .option('--dry-run', 'Preview changes without applying them', false)
  .action(async (file, options) => {
    try {
      console.log('Starting batch import...');
      console.log(`File: ${file}`);
      console.log(`Dataset: ${options.dataset}`);
      console.log(`Generate tags: ${options.generateTags ? 'Yes' : 'No'}`);
      console.log(`Dry run: ${options.dryRun ? 'Yes' : 'No'}`);
      
      // Create a backup before making changes
      if (!options.dryRun) {
        const backupPath = await backupLinksData(options.dataset);
        console.log(`Created backup: ${backupPath}`);
      }
      
      const fileType = path.extname(file).toLowerCase() === '.csv' ? 'csv' : 'json';
      
      const result = await batchImportLinks({
        filePath: file,
        fileType,
        generateTags: options.generateTags,
        dryRun: options.dryRun,
        dataset: options.dataset
      });
      
      console.log('\nBatch import completed:');
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
      
      if (options.dryRun) {
        console.log('\nThis was a dry run. No changes were made.');
      }
    } catch (error) {
      console.error('Error during batch import:', error);
      process.exit(1);
    }
  });

// Recategorize command
program
  .command('recategorize')
  .description('Recategorize links based on their tags')
  .argument('<mapping-file>', 'Path to the JSON file containing tag-to-category mappings')
  .option('-d, --dataset <dataset>', 'Dataset to use (default or large)', 'default')
  .option('-i, --interactive', 'Prompt for confirmation before applying each change', false)
  .option('--dry-run', 'Preview changes without applying them', false)
  .action(async (mappingFile, options) => {
    try {
      console.log('Starting recategorization...');
      console.log(`Mapping file: ${mappingFile}`);
      console.log(`Dataset: ${options.dataset}`);
      console.log(`Interactive: ${options.interactive ? 'Yes' : 'No'}`);
      console.log(`Dry run: ${options.dryRun ? 'Yes' : 'No'}`);
      
      // Create a backup before making changes
      if (!options.dryRun) {
        const backupPath = await backupLinksData(options.dataset);
        console.log(`Created backup: ${backupPath}`);
      }
      
      const result = await recategorizeByTags({
        tagMappingFile: mappingFile,
        dryRun: options.dryRun,
        dataset: options.dataset,
        interactive: options.interactive
      });
      
      console.log('\nRecategorization completed:');
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
      
      if (options.dryRun) {
        console.log('\nThis was a dry run. No changes were made.');
      }
    } catch (error) {
      console.error('Error during recategorization:', error);
      process.exit(1);
    }
  });

// Create backup command
program
  .command('backup')
  .description('Create a backup of the links data')
  .option('-d, --dataset <dataset>', 'Dataset to backup (default or large)', 'default')
  .action(async (options) => {
    try {
      console.log(`Creating backup of ${options.dataset} dataset...`);
      const backupPath = await backupLinksData(options.dataset);
      console.log(`Backup created: ${backupPath}`);
    } catch (error) {
      console.error('Error creating backup:', error);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();
