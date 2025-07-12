const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

// Simple function to generate a link ID
function generateLinkId() {
  return 'link_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

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
    'design': ['design', 'ui', 'ux', 'interface', 'graphic', 'art']
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
    'ux': { category: 'Design', subcategory: 'UI/UX' }
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

// Main function to test the batch import
async function testBatchImport() {
  // Read the CSV file
  const filePath = path.join(__dirname, '..', 'data', 'csv', 'production-link.csv');
  const fileContent = fs.readFileSync(filePath, 'utf8');
  
  // Parse the CSV
  const links = parse(fileContent, {
    columns: true,
    skip_empty_lines: true
  });
  
  console.log(`Found ${links.length} links in the CSV file.`);
  
  // Process each link
  for (const linkData of links) {
    console.log(`\nProcessing link: ${linkData.title}`);
    
    // Generate an ID
    const id = linkData.id || generateLinkId();
    console.log(`Generated ID: ${id}`);
    
    // Prepare link object
    const link = {
      id,
      title: linkData.title,
      url: linkData.url,
      description: linkData.description || '',
      category: linkData.category || 'Uncategorized',
      subcategory: linkData.subcategory || 'General',
      tags: linkData.tags ? (typeof linkData.tags === 'string' ? linkData.tags.split(',').map(t => t.trim()) : linkData.tags) : []
    };
    
    // Generate tags
    const generatedTags = generateTagsForLink(link);
    console.log(`Generated tags: ${generatedTags.join(', ')}`);
    
    // Merge with existing tags
    const allTags = Array.from(new Set([...link.tags, ...generatedTags]));
    console.log(`All tags: ${allTags.join(', ')}`);
    
    // Suggest category if not provided
    if (link.category === 'Uncategorized') {
      const suggestion = suggestCategoryFromTags(allTags);
      console.log(`Suggested category: ${suggestion.category}/${suggestion.subcategory}`);
    } else {
      console.log(`Using provided category: ${link.category}/${link.subcategory}`);
    }
  }
  
  console.log('\nTest completed successfully!');
}

// Run the test
testBatchImport().catch(error => {
  console.error('Error during test:', error);
});
