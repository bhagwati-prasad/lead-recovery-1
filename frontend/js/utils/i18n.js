const bundles = {
  en: {
    appTitle: 'Lead Recovery Console',
  },
};

let locale = 'en';

export async function init(nextLocale = 'en') {
  locale = bundles[nextLocale] ? nextLocale : 'en';
}

export function t(key) {
  return bundles[locale][key] || key;
}
