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
    'footer.rights': 'Todos los derechos reservados',
    'projects.title': 'Proyectos Destacados',
    'projects.subtitle': 'Portfolio',

    'spam.title': 'Detector de Spam',
    'spam.desc': 'Pega el asunto y el mensaje. El modelo lo analizará y comprobará si se trata de spam o es legítimo.',
    'spam.name': 'Nombre (Opcional)',
    'spam.email': 'Email (Opcional)',
    'spam.subject': 'Asunto del Correo',
    'spam.message': 'Cuerpo del Mensaje',
    'spam.analyze_btn': 'Analizar con IA',
    'spam.note': 'Nota: Modelo entrenado con dataset en inglés (funciona mejor con Spam internacional).',
    
    // Textos para JavaScript (Client-side)
    'spam.js.processing': 'Procesando...',
    'spam.js.spam_alert': '¡ALERTA DE SPAM!',
    'spam.js.spam_desc': 'El sistema ha clasificado este mensaje como malicioso o no deseado.',
    'spam.js.safe_title': 'MENSAJE SEGURO',
    'spam.js.safe_desc': 'Este correo parece legítimo y no contiene patrones comunes de spam.',
    'spam.js.confidence': 'Confianza',
    'spam.js.error': 'No se pudo conectar con el servidor.',
    
    // Placeholders
    'spam.ph_name': 'Tu nombre',
    'spam.ph_email': 'ejemplo@email.com',
    'spam.ph_subject': 'Ej: URGENTE! Has ganado un premio...',
    'spam.ph_message': 'Copia y pega aquí el contenido del mensaje...',

    // Botones (Estos SÍ se traducen para la interfaz)
    'spam.btn_load_spam': 'Carga ejemplo Spam',
    'spam.btn_load_ham': 'Carga ejemplo Legítimo',
    
    // Contenido de los ejemplos (SIEMPRE EN INGLÉS)
    'spam.ex_spam_subject': 'URGENT! You won $1,000,000 Lottery Prize',
    'spam.ex_spam_message': 'Congratulations dear beneficiary. Your email has been selected to receive a cash prize. Please click here and send us your bank details immediately to process the payment. Act now.',
    
    'spam.ex_ham_subject': 'Project meeting tomorrow',
    'spam.ex_ham_message': 'Hi Jorge, how are you? I am writing to confirm that tomorrow\'s meeting is still scheduled for 10:00 AM. We will review the API project progress. Best regards.',
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
    'footer.rights': 'All rights reserved',
    'projects.title': 'Featured Projects',
    'projects.subtitle': 'Portfolio',
    'spam.title': 'AI Spam Detector',
    'spam.desc': 'Paste the subject and message. Our AI model will analyze it and check if it is spam or legitimate.',
    'spam.name': 'Name (Optional)',
    'spam.email': 'Email (Optional)',
    'spam.subject': 'Email Subject',
    'spam.message': 'Message Body',
    'spam.analyze_btn': 'Analyze with AI',
    'spam.note': 'Note: Model trained on English dataset (works best with international Spam).',
    
    // JS Texts
    'spam.js.processing': 'Processing...',
    'spam.js.spam_alert': 'SPAM DETECTED!',
    'spam.js.spam_desc': 'The system classified this message as malicious or unwanted.',
    'spam.js.safe_title': 'SAFE MESSAGE',
    'spam.js.safe_desc': 'This email looks legitimate and contains no common spam patterns.',
    'spam.js.confidence': 'Confidence',
    'spam.js.error': 'Could not connect to the server.',

    // Placeholders
    'spam.ph_name': 'Your name',
    'spam.ph_email': 'example@email.com',
    'spam.ph_subject': 'Ex: URGENT! You won a cash prize...',
    'spam.ph_message': 'Copy and paste the suspicious email content here...',

    // Buttons
    'spam.btn_load_spam': 'Try with Spam',
    'spam.btn_load_ham': 'Try with Legitimate',

    // Example Content (Always English)
    'spam.ex_spam_subject': 'URGENT! You won $1,000,000 Lottery Prize',
    'spam.ex_spam_message': 'Congratulations dear beneficiary. Your email has been selected to receive a cash prize. Please click here and send us your bank details immediately to process the payment. Act now.',

    'spam.ex_ham_subject': 'Project meeting tomorrow',
    'spam.ex_ham_message': 'Hi Jorge, how are you? I am writing to confirm that tomorrow\'s meeting is still scheduled for 10:00 AM. We will review the API project progress. Best regards.',
  },
} as const;

// Función helper para usar las traducciones en los componentes
export function useTranslations(lang: keyof typeof ui) {
  return function t(key: keyof typeof ui[typeof defaultLang]) {
    return ui[lang][key] || ui[defaultLang][key];
  }
}