/**
 * Sitemap Generator
 *
 * Generates public/sitemap.xml by:
 * 1. Including static pages (home, find, apply, aboutus, hagwons, sat-hagwons, blog index)
 * 2. Querying Supabase for all approved teacher profiles
 * 3. Reading all blog post MDX files for slugs and dates
 *
 * Usage: node scripts/generate-sitemap.js
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SITE_URL = 'https://www.ibmaster.net';
const TODAY = new Date().toISOString().split('T')[0];

async function fetchApprovedTeachers() {
  const url = `${SUPABASE_URL}/rest/v1/teachers?select=name,last_updated,created_date&status=eq.approved`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  if (!res.ok) {
    console.error('Failed to fetch teachers:', res.status, await res.text());
    return [];
  }

  return res.json();
}

function getBlogPosts() {
  const blogDir = path.join(__dirname, '..', 'content', 'blog');
  const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.mdx') || f.endsWith('.md'));

  return files.map(file => {
    const content = fs.readFileSync(path.join(blogDir, file), 'utf8');
    const { data } = matter(content);
    const slug = file.replace(/\.(mdx|md)$/, '');
    return {
      slug,
      date: data.date || TODAY,
    };
  });
}

function urlEntry(loc, lastmod, changefreq, priority) {
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

async function main() {
  console.log('Fetching approved teachers from Supabase...');
  const teachers = await fetchApprovedTeachers();
  console.log(`Found ${teachers.length} approved teachers`);

  console.log('Reading blog posts...');
  const blogPosts = getBlogPosts();
  console.log(`Found ${blogPosts.length} blog posts`);

  const entries = [];

  // Static pages
  entries.push(urlEntry(`${SITE_URL}/`, TODAY, 'weekly', '0.85'));
  entries.push(urlEntry(`${SITE_URL}/find`, TODAY, 'daily', '1.0'));
  entries.push(urlEntry(`${SITE_URL}/apply`, TODAY, 'weekly', '0.8'));
  entries.push(urlEntry(`${SITE_URL}/aboutus`, TODAY, 'monthly', '0.5'));
  entries.push(urlEntry(`${SITE_URL}/hagwons`, TODAY, 'monthly', '0.9'));
  entries.push(urlEntry(`${SITE_URL}/sat-hagwons`, TODAY, 'weekly', '1.0'));
  entries.push(urlEntry(`${SITE_URL}/blog/`, TODAY, 'weekly', '0.7'));

  // Teacher profiles
  for (const teacher of teachers) {
    const lastmod = teacher.last_updated
      ? teacher.last_updated.split('T')[0]
      : teacher.created_date
        ? teacher.created_date.split('T')[0]
        : TODAY;
    const encodedName = encodeURIComponent(teacher.name);
    entries.push(urlEntry(`${SITE_URL}/profile/${encodedName}`, lastmod, 'monthly', '0.9'));
  }

  // Blog posts
  for (const post of blogPosts) {
    const lastmod = typeof post.date === 'string' ? post.date : post.date.toISOString().split('T')[0];
    entries.push(urlEntry(`${SITE_URL}/blog/${post.slug}`, lastmod, 'weekly', '0.7'));
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`;

  const outputPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
  fs.writeFileSync(outputPath, xml, 'utf8');
  console.log(`\nSitemap written to ${outputPath}`);
  console.log(`Total URLs: ${entries.length}`);
}

main().catch(console.error);
