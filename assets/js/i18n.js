// Internationalization Logic
const i18n = {
    currentLang: localStorage.getItem('clinic_lang') || 'en',

    init() {
        this.applyLanguage(this.currentLang);
        this.updateSwitcherUI();
    },

    setLanguage(lang) {
        if (!translations[lang]) return;
        this.currentLang = lang;
        localStorage.setItem('clinic_lang', lang);
        this.applyLanguage(lang);
        this.updateSwitcherUI();
        
        // Dispatch event for other components to update if needed (like charts)
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: lang }));
    },

    applyLanguage(lang) {
        const trans = translations[lang];
        if (!trans) return;

        // Set HTML lang and dir attributes
        document.documentElement.lang = lang;
        document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';

        // Translate all elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (trans[key]) {
                if (el.tagName === 'INPUT' && (el.type === 'text' || el.type === 'search' || el.type === 'password')) {
                    el.placeholder = trans[key];
                } else {
                    el.innerHTML = trans[key];
                }
            }
        });

        // Specific handling for dates if needed
        if (lang === 'so') {
            moment?.locale('so'); // if moment is used
        } else if (lang === 'ar') {
            moment?.locale('ar');
        } else {
            moment?.locale('en');
        }
    },

    updateSwitcherUI() {
        const switcher = document.getElementById('language-switcher-select');
        if (switcher) {
            switcher.value = this.currentLang;
        }
    }
};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    i18n.init();
});

// Ensure i18n is globally accessible
window.i18n = i18n;
