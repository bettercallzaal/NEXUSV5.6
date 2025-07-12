const fs = require('fs');
const path = require('path');

// Simple function to generate tags based on link content
function generateTagsForLink(link) {
  const tags = [];
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
  
  // Common keywords to check for
  const keywordMap = {
    'development': ['code', 'programming', 'developer', 'software', 'github', 'git'],
    'finance': ['money', 'invest', 'stock', 'crypto', 'financial', 'bank', 'trading'],
    'health': ['fitness', 'exercise', 'diet', 'workout', 'health', 'medical'],
    'technology': ['tech', 'technology', 'ai', 'artificial intelligence', 'machine learning'],
    'education': ['learn', 'course', 'tutorial', 'education', 'training', 'university'],
    'news': ['news', 'article', 'blog', 'post', 'update'],
    'social': ['social', 'community', 'network', 'forum', 'discussion'],
    'entertainment': ['game', 'movie', 'music', 'video', 'stream', 'entertainment'],
    'business': ['business', 'company', 'startup', 'enterprise', 'corporate'],
    'design': ['design', 'ui', 'ux', 'interface', 'graphic', 'art'],
    'web3': ['web3', 'blockchain', 'crypto', 'ethereum', 'token', 'nft', 'dao', 'defi'],
    'music': ['music', 'song', 'track', 'album', 'artist', 'playlist', 'audio'],
    'festival': ['festival', 'event', 'concert', 'performance', 'live'],
    'zao': ['zao', 'thezao', 'zaofestivals', 'zverse']
  };
  
  // Check for keywords in content
  Object.entries(keywordMap).forEach(([tag, keywords]) => {
    if (keywords.some(keyword => content.includes(keyword))) {
      tags.push(tag);
    }
  });
  
  // Return unique tags
  return Array.from(new Set(tags));
}

// Function to suggest category based on tags
function suggestCategoryFromTags(tags) {
  // Default category
  let category = 'Uncategorized';
  let subcategory = 'General';
  
  // Map of tags to categories
  const tagCategoryMap = {
    'development': { category: 'Development', subcategory: 'Programming' },
    'programming': { category: 'Development', subcategory: 'Programming' },
    'code': { category: 'Development', subcategory: 'Programming' },
    'github': { category: 'Development', subcategory: 'Tools' },
    
    'finance': { category: 'Finance', subcategory: 'General' },
    'crypto': { category: 'Finance', subcategory: 'Cryptocurrency' },
    'investing': { category: 'Finance', subcategory: 'Investing' },
    
    'health': { category: 'Health & Fitness', subcategory: 'General' },
    'fitness': { category: 'Health & Fitness', subcategory: 'Fitness' },
    'nutrition': { category: 'Health & Fitness', subcategory: 'Nutrition' },
    
    'technology': { category: 'Technology', subcategory: 'General' },
    'ai': { category: 'Technology', subcategory: 'AI & ML' },
    'machine learning': { category: 'Technology', subcategory: 'AI & ML' },
    
    'education': { category: 'Education', subcategory: 'General' },
    'course': { category: 'Education', subcategory: 'Courses' },
    'tutorial': { category: 'Education', subcategory: 'Tutorials' },
    
    'news': { category: 'News & Media', subcategory: 'General' },
    'article': { category: 'News & Media', subcategory: 'Articles' },
    'blog': { category: 'News & Media', subcategory: 'Blogs' },
    
    'social': { category: 'Social', subcategory: 'General' },
    'community': { category: 'Social', subcategory: 'Communities' },
    'forum': { category: 'Social', subcategory: 'Forums' },
    
    'entertainment': { category: 'Entertainment', subcategory: 'General' },
    'game': { category: 'Entertainment', subcategory: 'Games' },
    'movie': { category: 'Entertainment', subcategory: 'Movies' },
    'music': { category: 'Entertainment', subcategory: 'Music' },
    
    'business': { category: 'Business', subcategory: 'General' },
    'startup': { category: 'Business', subcategory: 'Startups' },
    'marketing': { category: 'Business', subcategory: 'Marketing' },
    
    'design': { category: 'Design', subcategory: 'General' },
    'ui': { category: 'Design', subcategory: 'UI/UX' },
    'ux': { category: 'Design', subcategory: 'UI/UX' },
    
    'web3': { category: 'Web3 Resources', subcategory: 'General' },
    'blockchain': { category: 'Web3 Resources', subcategory: 'Blockchain' },
    'ethereum': { category: 'Web3 Resources', subcategory: 'Ethereum' },
    
    'zao': { category: 'ZAO Links', subcategory: 'ZAO Platforms' },
    'festival': { category: 'ZAO Festivals', subcategory: 'General' }
  };
  
  // Check for matching tags
  for (const tag of tags) {
    const lowerTag = tag.toLowerCase();
    if (tagCategoryMap[lowerTag]) {
      category = tagCategoryMap[lowerTag].category;
      subcategory = tagCategoryMap[lowerTag].subcategory || 'General';
      break; // Use the first matching tag's category
    }
  }
  
  return { category, subcategory };
}

// Main function to auto-tag all links
async function autoTagAllLinks() {
  try {
    // Read the links.json file
    const filePath = path.join(__dirname, '..', 'data', 'links.json');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const linksData = JSON.parse(fileContent);
    
    console.log(`Found ${linksData.links.length} links in the database.`);
    
    let tagsAdded = 0;
    let linksUpdated = 0;
    
    // Process each link in the top-level links array
    for (const link of linksData.links) {
      const existingTags = link.tags || [];
      const generatedTags = generateTagsForLink(link);
      
      if (generatedTags.length > 0) {
        // Merge with existing tags
        const allTags = Array.from(new Set([...existingTags, ...generatedTags]));
        
        // Only update if we have new tags
        if (allTags.length > existingTags.length) {
          link.tags = allTags;
          tagsAdded += (allTags.length - existingTags.length);
          linksUpdated++;
          
          console.log(`Added tags to "${link.title}": ${generatedTags.join(', ')}`);
        }
      }
    }
    
    // Now update the links in the categories structure
    for (const category of linksData.categories) {
      for (const subcategory of category.subcategories) {
        for (const link of subcategory.links) {
          // Find the corresponding link in the top-level array
          const topLevelLink = linksData.links.find(l => 
            l.id === link.id || 
            (l.url === link.url && l.title === link.title)
          );
          
          // If found, copy the tags
          if (topLevelLink && topLevelLink.tags) {
            link.tags = [...topLevelLink.tags];
          } else {
            // Otherwise generate tags directly
            const existingTags = link.tags || [];
            const generatedTags = generateTagsForLink(link);
            
            if (generatedTags.length > 0) {
              // Merge with existing tags
              link.tags = Array.from(new Set([...existingTags, ...generatedTags]));
            }
          }
        }
      }
    }
    
    // Save the updated data
    fs.writeFileSync(filePath, JSON.stringify(linksData, null, 2), 'utf8');
    
    console.log(`\nAuto-tagging completed successfully!`);
    console.log(`Added ${tagsAdded} new tags to ${linksUpdated} links.`);
    
    return { tagsAdded, linksUpdated };
  } catch (error) {
    console.error('Error during auto-tagging:', error);
    throw error;
  }
}

// Run the auto-tagging function
autoTagAllLinks().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
