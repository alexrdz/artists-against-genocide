import type { APIRoute } from 'astro';
import { loadPublicExport } from '../lib/load-export';

export const GET: APIRoute = () => {
  const data = loadPublicExport();
  const urls: string[] = [];

  // Directory
  urls.push('/');

  // Pages
  urls.push('/methodology');
  urls.push('/changes');
  urls.push('/submit');
  urls.push('/disclaimer');

  // Campaigns
  urls.push('/campaigns/');
  for (const campaign of data.campaigns) {
    urls.push(`/campaigns/${campaign.slug}/`);
  }

  // Artists
  for (const artist of data.artists) {
    urls.push(`/artists/${artist.slug}/`);
  }

  const body = urls.map(u => `https://palestine-music-directory.example${u}`).join('\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain' },
  });
};
