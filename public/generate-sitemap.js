/**
 * Sitemap Generator for Willow & Water
 * 
 * Run this script to generate an updated sitemap.xml
 * Usage: node public/generate-sitemap.js
 * 
 * Or copy the XML below directly into public/sitemap.xml
 */

const SERVICE_AREAS = [
  // Primary (priority 1.0)
  { slug: 'st-charles', name: 'St. Charles', priority: 1.0 },
  { slug: 'geneva', name: 'Geneva', priority: 1.0 },
  { slug: 'batavia', name: 'Batavia', priority: 1.0 },
  
  // Secondary (priority 0.8)
  { slug: 'wayne', name: 'Wayne', priority: 0.8 },
  { slug: 'campton-hills', name: 'Campton Hills', priority: 0.8 },
  { slug: 'elburn', name: 'Elburn', priority: 0.8 },
  { slug: 'south-elgin', name: 'South Elgin', priority: 0.8 },
  { slug: 'north-aurora', name: 'North Aurora', priority: 0.8 },
  { slug: 'aurora', name: 'Aurora', priority: 0.8 },
  { slug: 'sugar-grove', name: 'Sugar Grove', priority: 0.8 },
  { slug: 'west-chicago', name: 'West Chicago', priority: 0.8 },
  
  // Tertiary (priority 0.6)
  { slug: 'maple-park', name: 'Maple Park', priority: 0.6 },
  { slug: 'lily-lake', name: 'Lily Lake', priority: 0.6 },
  { slug: 'kaneville', name: 'Kaneville', priority: 0.6 },
  { slug: 'big-rock', name: 'Big Rock', priority: 0.6 },
  { slug: 'montgomery', name: 'Montgomery', priority: 0.6 },
  { slug: 'oswego', name: 'Oswego', priority: 0.6 },
  { slug: 'yorkville', name: 'Yorkville', priority: 0.6 },
  { slug: 'plano', name: 'Plano', priority: 0.6 },
  { slug: 'warrenville', name: 'Warrenville', priority: 0.6 },
  { slug: 'wheaton', name: 'Wheaton', priority: 0.6 },
];

const BASE_URL = 'https://willowandwater.com';
const today = new Date().toISOString().split('T')[0];

const generateSitemap = () => {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Homepage -->
  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- Service Areas Overview -->
  <url>
    <loc>${BASE_URL}/service-areas</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  
  <!-- City Landing Pages -->`;

  SERVICE_AREAS.forEach(area => {
    xml += `
  <url>
    <loc>${BASE_URL}/${area.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${area.priority}</priority>
  </url>`;
  });

  xml += `
</urlset>`;

  return xml;
};

// Output sitemap
console.log(generateSitemap());
console.log('\n\n--- Copy the above XML into public/sitemap.xml ---\n');
