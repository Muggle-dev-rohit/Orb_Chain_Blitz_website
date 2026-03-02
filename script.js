/* Multilingual loader (no frameworks) */

const supportedLanguages = [
  'en','es','pt-BR','id','tr','ar','fr','de','ja','zh-CN','zh-TW'
];

const languageNames = {
  'en': 'English',
  'es': 'Español (LatAm)',
  'pt-BR': 'Português (BR)',
  'id': 'Bahasa Indonesia',
  'tr': 'Türkçe',
  'ar': 'العربية',
  'fr': 'Français',
  'de': 'Deutsch',
  'ja': '日本語',
  'zh-CN': '中文 (简体)',
  'zh-TW': '中文 (繁體)'
};

const translationsCache = {};
const DEFAULT_LANG = 'en';

function getBestSupported(lang) {
  if (!lang) return DEFAULT_LANG;
  lang = lang.trim();
  if (supportedLanguages.includes(lang)) return lang;
  const prefix = lang.split('-')[0];
  // try exact prefix matches (e.g., 'es-MX' -> 'es')
  for (const s of supportedLanguages) {
    if (s === prefix || s.startsWith(prefix + '-')) return s;
  }
  return DEFAULT_LANG;
}

async function loadTranslations(lang) {
  if (translationsCache[lang]) return translationsCache[lang];
  try {
    const res = await fetch(`locales/${lang}.json`);
    if (!res.ok) throw new Error('Fetch failed');
    const json = await res.json();
    translationsCache[lang] = json;
    return json;
  } catch (err) {
    if (lang !== DEFAULT_LANG) return loadTranslations(DEFAULT_LANG);
    console.error('Could not load translations', err);
    return {};
  }
}

function getNested(obj, key) {
  return key.split('.').reduce((o,k)=> (o && o[k]!==undefined) ? o[k] : null, obj);
}

function applyTranslations(trans) {
  if (!trans) return;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const val = getNested(trans, key);
    if (val !== null && val !== undefined) {
      // Allow markup for trusted/local translations
      el.innerHTML = val;
    }
  });
  if (trans && trans['document'] && trans['document'].title) {
    document.title = trans['document'].title;
  }
}

function setDirectionForLang(lang) {
  const rtlLangs = ['ar'];
  if (rtlLangs.includes(lang)) {
    document.documentElement.setAttribute('dir','rtl');
  } else {
    document.documentElement.setAttribute('dir','ltr');
  }
}

async function setLanguage(lang, save=true) {
  const chosen = getBestSupported(lang);
  const trans = await loadTranslations(chosen);
  applyTranslations(trans);
  setDirectionForLang(chosen);
  document.documentElement.lang = chosen;
  const select = document.getElementById('languageSelect');
  if (select && select.value !== chosen) select.value = chosen;
  if (save) localStorage.setItem('site_lang', chosen);
}

function populateLanguageSelector() {
  const select = document.getElementById('languageSelect');
  if (!select) return;
  select.innerHTML = '';
  supportedLanguages.forEach(code => {
    const opt = document.createElement('option');
    opt.value = code;
    opt.textContent = languageNames[code] || code;
    select.appendChild(opt);
  });
  select.addEventListener('change', () => setLanguage(select.value));
}

function detectInitialLanguage() {
  const saved = localStorage.getItem('site_lang');
  if (saved && supportedLanguages.includes(saved)) return saved;
  const nav = navigator.languages && navigator.languages.length ? navigator.languages[0] : navigator.language || navigator.userLanguage;
  return getBestSupported(nav);
}

// Init on DOM ready
document.addEventListener('DOMContentLoaded', async () => {
  populateLanguageSelector();
  const initial = detectInitialLanguage();
  await setLanguage(initial, false);

  // Mobile nav toggle (minimal JS)
  const navToggle = document.getElementById('navToggle');
  const nav = document.querySelector('.nav-menu');
  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }
});

/* Existing simple UI helpers */
function toggleFAQ(element){
  const answer = element.nextElementSibling;
  answer.style.display = answer.style.display === "block" ? "none" : "block";
}
// Note: trailer modal removed; related functions deleted