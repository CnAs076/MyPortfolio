// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind()],
  i18n: {
    defaultLocale: 'es', // Tu idioma principal
    locales: ['es', 'en'], // Los idiomas soportados
    routing: {
        prefixDefaultLocale: false // 'es' estará en la raíz (/), 'en' en (/en)
        // Si pones true, tu home será /es/
    }
  }
});