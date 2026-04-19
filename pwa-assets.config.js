import { defineConfig } from '@vite-pwa/assets-generator/config';

export default defineConfig({
  headLinkOptions: {
    preset: 'default',
  },
  preset: {
    transparent: {
      sizes: [64, 192, 512],
      favicons: [[48, 'favicon.ico'], [64, 'favicon.ico']],
    },
    maskable: {
      sizes: [512],
      padding: 0.1,
      resizeOptions: { background: '#020617' },
    },
    apple: {
      sizes: [180],
      padding: 0.1,
      resizeOptions: { background: '#020617' },
    },
  },
  images: ['public/icons/pwa-source.svg'],
});
