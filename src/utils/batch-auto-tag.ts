/**
 * Batch Auto-Tagging Utility
 * 
 * This utility provides functions to process existing links in the data
 * and add AI-generated tags to links that don't have them.
 */

import { Data, Link } from "@/types/links";

/**
 * Process a single link to add auto-generated tags
 */
export async function autoTagLink(link: Link): Promise<string[]> {
  try {
    const response = await fetch("/api/auto-tag", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: link.title,
        description: link.description,
        url: link.url,
        category: link.category,
        subcategory: link.subcategory,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    return data.tags || [];
  } catch (error) {
    console.error("Error auto-tagging link:", error);
    return [];
  }
}

/**
 * Process all links in the data structure and add tags to those without them
 */
export async function batchAutoTagLinks(data: Data): Promise<Data> {
  // Create a deep copy of the data to avoid mutating the original
  const updatedData = JSON.parse(JSON.stringify(data)) as Data;
  let totalTagged = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  // Process each link in the data structure
  for (const category of updatedData.categories) {
    for (const subcategory of category.subcategories) {
      for (let i = 0; i < subcategory.links.length; i++) {
        const link = subcategory.links[i];
        
        // Skip links that already have tags
        if (link.tags && link.tags.length > 0) {
          totalSkipped++;
          continue;
        }

        try {
          // Add a small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Get tags for the link
          const tags = await autoTagLink(link);
          
          if (tags.length > 0) {
            // Update the link with the new tags
            subcategory.links[i] = {
              ...link,
              tags,
              updatedAt: new Date().toISOString(),
            };
            totalTagged++;
          } else {
            totalErrors++;
          }
        } catch (error) {
          console.error(`Error processing link ${link.title}:`, error);
          totalErrors++;
        }
      }
    }
  }

  console.log(`Batch auto-tagging complete:
    - Tagged: ${totalTagged} links
    - Skipped (already had tags): ${totalSkipped} links
    - Errors: ${totalErrors} links
  `);

  return updatedData;
}

/**
 * Count links with and without tags in the data
 */
export function countTaggedLinks(data: Data): { 
  total: number; 
  tagged: number; 
  untagged: number; 
} {
  let total = 0;
  let tagged = 0;
  let untagged = 0;

  for (const category of data.categories) {
    for (const subcategory of category.subcategories) {
      for (const link of subcategory.links) {
        total++;
        if (link.tags && link.tags.length > 0) {
          tagged++;
        } else {
          untagged++;
        }
      }
    }
  }

  return { total, tagged, untagged };
}
