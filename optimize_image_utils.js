const fs = require('fs');

// Read the file
let content = fs.readFileSync('app/src/utils/imageUtils.ts', 'utf8');

// Add performance optimizations to getImageSource
content = content.replace(
  "export const getImageSource = (photo: any) => {\n  const url = getImageUrl(photo);\n  \n  if (!url) {\n    return { uri: '' };\n  }\n  \n  // For Unsplash URLs, add proper headers\n  if (url.includes('unsplash.com')) {\n    return {\n      uri: url,\n      headers: {\n        'User-Agent': 'Mozilla/5.0 (compatible; ReactNative/1.0)',\n        'Accept': 'image/*',\n      },\n    };\n  }\n  \n  // For other URLs, use standard format\n  return { uri: url };\n};",
  "export const getImageSource = (photo: any) => {\n  const url = getImageUrl(photo);\n  \n  if (!url) {\n    return { uri: '' };\n  }\n  \n  // Base image source with performance optimizations\n  const baseSource = {\n    uri: url,\n    // Performance optimizations\n    cachePolicy: 'memory-disk',\n    recyclingKey: url,\n  };\n  \n  // For Unsplash URLs, add proper headers\n  if (url.includes('unsplash.com')) {\n    return {\n      ...baseSource,\n      headers: {\n        'User-Agent': 'Mozilla/5.0 (compatible; ReactNative/1.0)',\n        'Accept': 'image/*',\n      },\n    };\n  }\n  \n  // For other URLs, use optimized format\n  return baseSource;\n};"
);

// Add image preloading utility
content += `\n\n// Image preloading utility for better performance\nexport const preloadImages = async (urls: string[]): Promise<void> => {\n  const validUrls = urls.filter(url => url && typeof url === 'string' && url.trim() !== '');\n  \n  if (validUrls.length === 0) {\n    return;\n  }\n\n  // Batch preload with concurrency limit\n  const batchSize = 3;\n  for (let i = 0; i < validUrls.length; i += batchSize) {\n    const batch = validUrls.slice(i, i + batchSize);\n    await Promise.allSettled(\n      batch.map(async (url) => {\n        try {\n          // Preload using expo-image\n          const { Image } = require('expo-image');\n          await Image.prefetch(url);\n        } catch (error) {\n          console.warn(\`Failed to preload image \${url}:\`, error);\n        }\n      })\n    );\n  }\n};`;

// Write the optimized file
fs.writeFileSync('app/src/utils/imageUtils.ts', content);
console.log('✅ imageUtils.ts optimized with performance enhancements!');
