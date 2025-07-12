/**
 * NEXUS V5 - Enhanced Data Structure Adapter
 * 
 * This script converts the new optimized links structure back to the format
 * expected by the current application components, with special attention to
 * ensuring tags and metadata are properly formatted for all view modes.
 * 
 * It organizes links by categories and subcategories to ensure proper display
 * in the application.
 */

const fs = require('fs');
const path = require('path');

// File paths
const NEW_STRUCTURE_FILE = path.join(__dirname, '..', 'data', 'links-new.json');
const APP_COMPATIBLE_FILE = path.join(__dirname, '..', 'data', 'links.json');
const BACKUP_FILE = path.join(__dirname, '..', 'data', 'links.json.bak');

// Define categories and their subcategories for organizing links
const CATEGORIES = [
  {
    name: "ZAO Ecosystem",
    description: "Official ZAO ecosystem resources",
    icon: "globe",
    color: "#e74c3c",
    subcategories: [
      {
        name: "Official Sites",
        description: "Official ZAO websites and platforms",
        icon: "link",
        color: "#e74c3c",
        linkPatterns: ["thezao.com", "zao.network", "thezao.xyz", "zverse", "zao org"]
      },
      {
        name: "Community",
        description: "ZAO community platforms and resources",
        icon: "users",
        color: "#3498db",
        linkPatterns: ["discord", "telegram", "t.me", "community"]
      }
    ]
  },
  {
    name: "ZAO Music",
    description: "Music tracks, NFTs, and audio content",
    icon: "music",
    color: "#9b59b6",
    subcategories: [
      {
        name: "Tracks",
        description: "ZAO music tracks and audio content",
        icon: "headphones",
        color: "#9b59b6",
        linkPatterns: ["song", "vibez", "cypher", "music", "spotify", "track"]
      },
      {
        name: "Artists",
        description: "ZAO artists and collaborators",
        icon: "user",
        color: "#f1c40f",
        linkPatterns: ["artist", "attabotty", "midipunkz", "ima"]
      }
    ]
  },
  {
    name: "ZAO Events",
    description: "Events, festivals, and calendars",
    icon: "calendar",
    color: "#2ecc71",
    subcategories: [
      {
        name: "Festivals",
        description: "ZAO festivals and events",
        icon: "ticket",
        color: "#2ecc71",
        linkPatterns: ["festival", "zaofestivals", "palooza", "chella"]
      },
      {
        name: "Calendars",
        description: "Event calendars and schedules",
        icon: "calendar",
        color: "#f39c12",
        linkPatterns: ["calendar", "lu.ma", "google.com/calendar"]
      }
    ]
  },
  {
    name: "Social Media",
    description: "Social media channels and profiles",
    icon: "share",
    color: "#1abc9c",
    subcategories: [
      {
        name: "Profiles",
        description: "Social media profiles",
        icon: "at-sign",
        color: "#1abc9c",
        linkPatterns: ["x.com", "twitter", "instagram", "facebook", "linkedin", "youtube"]
      },
      {
        name: "Content",
        description: "ZAO content on social platforms",
        icon: "file-text",
        color: "#d35400",
        linkPatterns: ["paragraph.xyz", "article", "newsletter"]
      }
    ]
  },
  {
    name: "Web3 Resources",
    description: "Web3 documentation and resources",
    icon: "code",
    color: "#0F02A4",
    subcategories: [
      {
        name: "Documentation",
        description: "Technical documentation for Web3",
        icon: "book",
        color: "#0F02A4",
        linkPatterns: ["docs", "documentation", "optimism", "ethereum", "blockchain"]
      },
      {
        name: "Tools",
        description: "Development tools for Web3",
        icon: "tool",
        color: "#8e44ad",
        linkPatterns: ["tool", "sdk", "api", "developer"]
      }
    ]
  },
  {
    name: "Other",
    description: "Other resources and links",
    icon: "grid",
    color: "#7f8c8d",
    subcategories: [
      {
        name: "Miscellaneous",
        description: "Miscellaneous links and resources",
        icon: "more-horizontal",
        color: "#7f8c8d",
        linkPatterns: []
      }
    ]
  }
];

/**
 * Limit the number of tags to display in the UI
 * @param {string[]} tags - Array of tags
 * @param {number} limit - Maximum number of tags to include
 * @returns {string[]} - Limited array of tags
 */
function limitTags(tags, limit = 5) {
  if (!tags || tags.length <= limit) return tags || [];
  
  // Sort tags by length (shorter tags first) to prioritize display
  const sortedTags = [...tags].sort((a, b) => a.length - b.length);
  return sortedTags.slice(0, limit);
}

/**
 * Process a link from the new structure to the app-compatible format
 * @param {Object} link - Link from the new structure
 * @param {Object} tagMap - Map of tag names to their metadata
 * @returns {Object} - App-compatible link object
 */
function processLink(link, tagMap = {}) {
  // Ensure we have tags and they're properly formatted
  const tags = link.tags || [];
  
  // Determine if the link is new (created in the last 7 days)
  const isNew = link.metadata?.createdAt ? 
    (new Date(link.metadata.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) : 
    false;
  
  // Sort tags by importance (based on tag count if available)
  const sortedTags = [...tags].sort((a, b) => {
    const countA = tagMap[a]?.count || 0;
    const countB = tagMap[b]?.count || 0;
    return countB - countA; // Sort by count descending
  });
  
  // Create the app-compatible link object with enhanced properties
  return {
    id: link.id, // Include the ID for reference
    title: link.title,
    url: link.url,
    description: link.description || "",
    tags: sortedTags,
    // Display tags in all views - limit to 5 most important tags
    displayTags: limitTags(sortedTags),
    // Include metadata for UI enhancements
    isNew: isNew,
    isOfficial: link.metadata?.addedBy === "admin" || false,
    isPopular: (link.metadata?.clicks || 0) > 50,
    createdAt: link.metadata?.createdAt || new Date().toISOString(),
    updatedAt: link.metadata?.updatedAt || new Date().toISOString(),
    // Include additional metadata that might be useful
    clicks: link.metadata?.clicks || 0,
    popularity: link.metadata?.popularity || 0,
    favicon: link.favicon || null
  };
}

/**
 * Find the best category and subcategory for a link based on its content
 * @param {Object} link - The link object
 * @returns {Object} - Category and subcategory information
 */
function findBestCategoryForLink(link) {
  // Default to "Other" category if no match is found
  let bestCategory = CATEGORIES[CATEGORIES.length - 1];
  let bestSubcategory = bestCategory.subcategories[0];
  let bestScore = 0;
  
  // Check each category and subcategory for matches
  for (const category of CATEGORIES) {
    for (const subcategory of category.subcategories) {
      let score = 0;
      
      // Check if the link URL or title matches any of the patterns
      for (const pattern of subcategory.linkPatterns) {
        if (link.url.toLowerCase().includes(pattern.toLowerCase()) ||
            link.title.toLowerCase().includes(pattern.toLowerCase())) {
          score += 10;
        }
      }
      
      // Check if any tags match the patterns
      if (link.tags) {
        for (const tag of link.tags) {
          for (const pattern of subcategory.linkPatterns) {
            if (tag.toLowerCase().includes(pattern.toLowerCase()) ||
                pattern.toLowerCase().includes(tag.toLowerCase())) {
              score += 5;
            }
          }
        }
      }
      
      // Special case for Web3 Resources category
      if (category.name === "Web3 Resources" && 
          (link.tags?.includes("blockchain") || 
           link.tags?.includes("ethereum") || 
           link.tags?.includes("optimism"))) {
        score += 15;
      }
      
      // Special case for ZAO Ecosystem
      if (category.name === "ZAO Ecosystem" && 
          (link.tags?.includes("zao") || 
           link.tags?.includes("thezao"))) {
        score += 15;
      }
      
      // Update best match if this score is higher
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category;
        bestSubcategory = subcategory;
      }
    }
  }
  
  return {
    category: bestCategory,
    subcategory: bestSubcategory,
    score: bestScore
  };
}

/**
 * Convert the new optimized structure to the format expected by the application
 */
async function adaptStructureForApp() {
  console.log('Converting optimized structure to application-compatible format with enhanced tag support...');
  
  try {
    // Read the new structure
    const newStructureContent = fs.readFileSync(NEW_STRUCTURE_FILE, 'utf8');
    const newStructure = JSON.parse(newStructureContent);
    
    // Create a backup of the current links.json
    if (fs.existsSync(APP_COMPATIBLE_FILE)) {
      console.log(`Creating backup of current links.json at ${BACKUP_FILE}`);
      fs.copyFileSync(APP_COMPATIBLE_FILE, BACKUP_FILE);
    }
    
    // Initialize the application-compatible structure
    const appStructure = {
      version: newStructure.version || "1.0",
      lastUpdated: new Date().toISOString(),
      categories: [],
      links: []
    };
    
    // Initialize categories based on our predefined structure
    CATEGORIES.forEach(categoryTemplate => {
      const category = {
        name: categoryTemplate.name,
        description: categoryTemplate.description,
        icon: categoryTemplate.icon,
        color: categoryTemplate.color,
        subcategories: []
      };
      
      // Initialize subcategories
      categoryTemplate.subcategories.forEach(subcategoryTemplate => {
        category.subcategories.push({
          name: subcategoryTemplate.name,
          description: subcategoryTemplate.description,
          icon: subcategoryTemplate.icon,
          color: subcategoryTemplate.color,
          links: []
        });
      });
      
      appStructure.categories.push(category);
    });
    
    // Create tag metadata for easier access
    const tagMap = {};
    Object.entries(newStructure.tags || {}).forEach(([tagId, metadata]) => {
      tagMap[tagId] = metadata;
    });
    
    // Process all links and assign them to categories
    newStructure.links.forEach(link => {
      // Process the link to app-compatible format
      const appLink = processLink(link, tagMap);
      
      // Find the best category for this link
      const { category, subcategory } = findBestCategoryForLink(link);
      
      // Add category and subcategory info to the link
      appLink.category = category.name;
      appLink.subcategory = subcategory.name;
      
      // Find the corresponding category and subcategory in our app structure
      const targetCategory = appStructure.categories.find(c => c.name === category.name);
      if (targetCategory) {
        const targetSubcategory = targetCategory.subcategories.find(s => s.name === subcategory.name);
        if (targetSubcategory) {
          targetSubcategory.links.push(appLink);
        }
      }
    });
    
    // Add tag metadata to help with filtering
    appStructure.tagMetadata = {};
    Object.entries(newStructure.tags || {}).forEach(([tagId, metadata]) => {
      appStructure.tagMetadata[tagId] = {
        count: metadata.count || 0,
        color: metadata.color || "#cccccc",
        related: (metadata.related || []).filter(Boolean)
      };
    });
    
    // Sort links within each subcategory by popularity and then alphabetically
    appStructure.categories.forEach(category => {
      category.subcategories.forEach(subcategory => {
        subcategory.links.sort((a, b) => {
          // First sort by popularity (clicks)
          if (b.clicks !== a.clicks) {
            return b.clicks - a.clicks;
          }
          // Then sort alphabetically by title
          return a.title.localeCompare(b.title);
        });
      });
    });
    
    // Count links in each category for debugging
    let totalLinks = 0;
    appStructure.categories.forEach(category => {
      let categoryCount = 0;
      category.subcategories.forEach(subcategory => {
        categoryCount += subcategory.links.length;
        console.log(`Category: ${category.name}, Subcategory: ${subcategory.name}, Links: ${subcategory.links.length}`);
      });
      console.log(`Total links in category ${category.name}: ${categoryCount}`);
      totalLinks += categoryCount;
    });
    console.log(`Total links categorized: ${totalLinks}`);
    console.log(`Total links in structure: ${newStructure.links.length}`);
    
    // Add any uncategorized links to the top-level links array
    // (this should be empty if our categorization works well)
    const categorizedLinkIds = new Set();
    appStructure.categories.forEach(category => {
      category.subcategories.forEach(subcategory => {
        subcategory.links.forEach(link => {
          categorizedLinkIds.add(link.id);
        });
      });
    });
    
    // Find any links that weren't categorized and add them to the top-level links
    const uncategorizedLinks = [];
    newStructure.links.forEach(link => {
      if (!categorizedLinkIds.has(link.id)) {
        uncategorizedLinks.push(processLink(link));
      }
    });
    appStructure.links = uncategorizedLinks;
    console.log(`Uncategorized links: ${uncategorizedLinks.length}`);
    
    // Write the application-compatible structure to the file
    fs.writeFileSync(APP_COMPATIBLE_FILE, JSON.stringify(appStructure, null, 2), 'utf8');
    console.log(`Successfully wrote application-compatible structure to ${APP_COMPATIBLE_FILE}`);
  } catch (error) {
    console.error('Error adapting structure for app:', error);
    throw error;
  }
  
  console.log(`Enhanced conversion completed successfully!`);
  console.log(`- Categories: ${appStructure.categories.length}`);
  console.log(`- Top-level links: ${appStructure.links.length}`);
  console.log(`- Tags with metadata: ${Object.keys(appStructure.tagMetadata || {}).length}`);
  console.log(`Application-compatible structure written to ${APP_COMPATIBLE_FILE}`);
  
  return appStructure;
}

// Run the adapter
adaptStructureForApp().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
