import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://palestine-music-directory.example',
  output: 'static',
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
    inlineStylesheets: 'auto',
  },
  compressHTML: true,
  devToolbar: { enabled: false },
});
