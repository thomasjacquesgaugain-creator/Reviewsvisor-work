/**
 * Logger utilitaire pour les logs de debug
 * Les logs sont masqués en production
 */

export const logger = {
  log: (...args: any[]) => {
    if (!import.meta.env.PROD) {
      console.log(...args);
    }
  },
  error: (...args: any[]) => {
    // Les erreurs sont toujours affichées
    console.error(...args);
  },
  warn: (...args: any[]) => {
    // Les warnings sont toujours affichés
    console.warn(...args);
  },
  debug: (prefix: string, ...args: any[]) => {
    if (!import.meta.env.PROD) {
      console.log(`[${prefix}]`, ...args);
    }
  },
};

