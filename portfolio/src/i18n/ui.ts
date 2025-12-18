// src/i18n/ui.ts

export const languages = {
  es: 'Español',
  en: 'English',
};

export const defaultLang = 'es';

export const ui = {
  es: {
    // Menú de Navegación
    'nav.home': 'Inicio',
    'nav.about': 'Sobre mí',
    'nav.projects': 'Proyectos',
    'nav.contact': 'Contacto',
    
    // Botones comunes
    'btn.viewProjects': 'Ver Proyectos',
    'btn.contact': 'Contactar',
    
    // Textos generales (Footer, etc.)
    'footer.rights': 'Desarrollado con Astro y mucho café.',
    'projects.title': 'Proyectos Destacados',
    'projects.subtitle': 'Portfolio'
  },
  en: {
    // Navigation Menu
    'nav.home': 'Home',
    'nav.about': 'About Me',
    'nav.projects': 'Projects',
    'nav.contact': 'Contact',
    
    // Common Buttons
    'btn.viewProjects': 'View Projects',
    'btn.contact': 'Contact Me',
    
    // General Text
    'footer.rights': 'Developed with Astro and lots of coffee.',
    'projects.title': 'Featured Projects',
    'projects.subtitle': 'Portfolio'
  },
} as const;

// Función helper para usar las traducciones en los componentes
export function useTranslations(lang: keyof typeof ui) {
  return function t(key: keyof typeof ui[typeof defaultLang]) {
    return ui[lang][key] || ui[defaultLang][key];
  }
}