import { defineConfig } from '@vite-pwa/assets-generator/config';
import type { Preset } from '@vite-pwa/assets-generator/config';

const preset: Preset = {
  transparent: {
    sizes: [64, 192, 512],
    favicons: [[48, 'favicon.ico']],
  },
  maskable: {
    sizes: [512],
    resizeOptions: {
      background: '#030712',
    },
  },
  apple: {
    sizes: [180],
    resizeOptions: {
      background: '#030712',
    },
  },
};

export default defineConfig({
  preset,
  images: ['public/logo.svg'],
});
