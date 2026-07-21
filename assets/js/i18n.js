(function () {
  'use strict';

  const STORAGE_KEY = 'lang';
  const supported = ['fr', 'en'];
  let current = supported.includes(localStorage.getItem(STORAGE_KEY)) ? localStorage.getItem(STORAGE_KEY) : 'fr';

  const frToEn = {
    'Accueil': 'Home',
    'Inventaire': 'Inventory',
    'Financement': 'Financing',
    'À propos': 'About',
    'Contact': 'Contact',
    'Navigation principale': 'Main navigation',
    'VÉHICULES D’OCCASION': 'PRE-OWNED VEHICLES',
    "VÉHICULES D'OCCASION · LAVAL": 'PRE-OWNED VEHICLES · LAVAL',
    'Trouvez votre prochain véhicule chez Sharbo Auto': 'Find your next vehicle at Sharbo Auto',
    "Des véhicules sélectionnés avec soin, un financement flexible et un accompagnement clair du premier contact jusqu'à la livraison.": 'Carefully selected vehicles, flexible financing, and straightforward support from your first inquiry to delivery.',
    "Voir l'inventaire": 'Browse inventory',
    'Demande de financement': 'Apply for financing',
    'Inventaire sélectionné': 'Carefully selected inventory',
    'Des véhicules présentés clairement.': 'Clear information on every vehicle.',
    'Financement flexible': 'Flexible financing',
    '1re, 2e et 3e chance.': 'Options for a wide range of credit profiles.',
    'Service transparent': 'Straightforward service',
    'Une expérience simple et professionnelle.': 'A simple, professional experience.',
    "Une façon plus simple d'acheter votre prochain véhicule.": 'A simpler way to buy your next vehicle.',
    'Notre approche est directe : des informations claires, des véhicules bien présentés et une équipe disponible pour répondre à vos questions.': 'Our approach is straightforward: clear information, well-presented vehicles, and a team ready to answer your questions.',
    'Découvrir Sharbo Auto': 'Discover Sharbo Auto',
    'NOTRE SÉLECTION': 'OUR SELECTION',
    'Véhicules en vedette': 'Featured vehicles',
    "Voir tout l'inventaire": 'Browse all vehicles',
    'UNE EXPÉRIENCE CLAIRE': 'A STRAIGHTFORWARD EXPERIENCE',
    'Pourquoi choisir Sharbo Auto': 'Why choose Sharbo Auto',
    'Choisissez votre véhicule': 'Choose your vehicle',
    'Consultez les photos, le prix, le kilométrage et les principales informations en un seul endroit.': 'Review photos, pricing, mileage, and key vehicle details all in one place.',
    'Parlez-nous de votre projet': 'Tell us what you need',
    'Planifiez un essai routier ou remplissez votre demande de financement en ligne.': 'Book a test drive or complete your financing application online.',
    'Finalisez simplement': 'Complete your purchase with ease',
    "Notre équipe vous accompagne clairement jusqu'à la prise de possession.": 'Our team guides you clearly through every step until delivery.',
    'FINANCEMENT AUTOMOBILE': 'AUTO FINANCING',
    'Une demande simple, rapide et confidentielle.': 'A simple, fast, and confidential application.',
    'Commencez votre demande en ligne. Nous proposons des solutions de financement adaptées à plusieurs profils de crédit.': 'Start your application online. We offer financing solutions for a wide range of credit profiles.',
    'Commencer ma demande': 'Start my application',
    'Remplissez votre demande': 'Complete your application',
    'Quelques minutes suffisent.': 'It only takes a few minutes.',
    'Recevez un suivi': 'Hear from our team',
    'Notre équipe analyse votre dossier.': 'Our team reviews your application.',
    'Choisissez votre véhicule': 'Choose your vehicle',
    'Finalisez votre achat avec confiance.': 'Complete your purchase with confidence.',
    'VENEZ NOUS VOIR': 'VISIT US',
    'Sharbo Auto à Laval': 'Sharbo Auto in Laval',
    'TÉLÉPHONE': 'PHONE',
    'COURRIEL': 'EMAIL',
    'INFORMATIONS': 'INFORMATION',
    'Nous contacter': 'Contact us',
    "Véhicules d'occasion et financement automobile à Laval.": 'Pre-owned vehicles and auto financing in Laval.',
    "Véhicules d'occasion de qualité au Québec.": 'Quality pre-owned vehicles in Quebec.',
    'Suivez-nous': 'Follow us',
    'Notre inventaire': 'Our inventory',
    'Une sélection claire, facile à comparer et mise à jour directement depuis notre système de gestion.': 'A clear, easy-to-compare selection updated directly from our inventory system.',
    'Rechercher': 'Search',
    'Marque': 'Make',
    'Année': 'Year',
    'Prix maximum': 'Maximum price',
    'Réinitialiser': 'Reset',
    'Trier par': 'Sort by',
    'En vedette': 'Featured first',
    'Prix croissant': 'Price: low to high',
    'Prix décroissant': 'Price: high to low',
    'Année récente': 'Newest year',
    'Kilométrage croissant': 'Lowest mileage',
    'Toutes': 'All',
    'Marque, modèle ou année': 'Make, model, or year',
    'Ex. 25 000': 'E.g. 25,000',
    'Aucun véhicule trouvé': 'No vehicles found',
    'Modifiez vos critères ou réinitialisez les filtres.': 'Adjust your search or reset the filters.',
    'Aucun véhicule pour le moment.': 'No vehicles are currently available.',
    'Voir le véhicule': 'View vehicle',
    'Voir les détails': 'View details',
    'Kilométrage': 'Mileage',
    'Transmission': 'Transmission',
    'Carburant': 'Fuel',
    'Version': 'Trim',
    'Disponible': 'Available',
    'Vendu': 'Sold',
    'Réservé': 'Reserved',
    'Essence': 'Gasoline',
    'Manuelle': 'Manual',
    'Automatique': 'Automatic',
    'Électrique': 'Electric',
    'Hybride': 'Hybrid',
    'À propos de Sharbo Auto': 'About Sharbo Auto',
    "Le Groupe Sharbo a été fondé mondialement en 1948 et s'est établi au Canada en 2009.": 'The Sharbo Group was founded in 1948 and established its Canadian presence in 2009.',
    "Sharbo Auto est spécialisé dans la vente de véhicules d'occasion et offre une expérience simple, transparente et professionnelle.": 'Sharbo Auto specializes in pre-owned vehicles and delivers a straightforward, transparent, and professional buying experience.',
    "Contactez-nous pour plus d'information.": 'Contact us for more information.',
    'Coordonnées': 'Contact details',
    'Téléphone:': 'Phone:',
    'Courriel:': 'Email:',
    'Adresse:': 'Address:',
    'Heures:': 'Hours:',
    'Lundi au vendredi, 9h30 à 17h00': 'Monday to Friday, 9:30 a.m. to 5:00 p.m.',
    'Ouvrir dans Google Maps': 'Open in Google Maps',
    'Retour': 'Back',
    'Suivant': 'Next',
    'Envoyer ma demande': 'Submit my application',
    'Sélectionner': 'Select',
    'Oui': 'Yes',
    'Non': 'No',
    'Français': 'French',
    'Langue préférée': 'Preferred language',
    'Véhicule introuvable': 'Vehicle not found',
    "Retour à l’inventaire": 'Back to inventory',
    'Photos du véhicule': 'Vehicle photos',
    'Photo précédente': 'Previous photo',
    'Photo suivante': 'Next photo',
    'Ouvrir la galerie': 'Open gallery',
    'Fermer': 'Close',
    'VÉHICULE D’OCCASION': 'PRE-OWNED VEHICLE',
    'Prix affiché avant taxes et immatriculation.': 'Price shown before taxes and registration.',
    'Réserver un essai routier': 'Book a test drive',
    'Appeler': 'Call',
    'Voir le Carfax': 'View Carfax report',
    'PRÉSENTATION': 'OVERVIEW',
    'À propos de ce véhicule': 'About this vehicle',
    'INFORMATIONS': 'DETAILS',
    'Fiche technique': 'Vehicle specifications',
    'No d’inventaire': 'Stock number',
    'Couleur': 'Colour',
    'Moteur': 'Engine',
    'Statut': 'Status',
    'Disponible sur demande': 'Available upon request',
    'Solutions de financement adaptées à votre situation.': 'Financing solutions tailored to your needs.',
    'Carfax disponible': 'Carfax available',
    'Historique du véhicule accessible lorsqu’il est fourni.': 'Vehicle history available when a report is provided.',
    'Service professionnel': 'Professional service',
    'Accompagnement clair avant, pendant et après l’achat.': 'Clear support before, during, and after your purchase.',
    'Favori': 'Favourite',
    'Comparer': 'Compare',
    'Partager': 'Share',
    'Voir': 'View',
    'Réserver un essai routier': 'Book a test drive',
    'Choisissez une date et une heure entre 9h30 et 17h00. Nous vous contacterons pour confirmer le rendez-vous.': 'Choose a date and time between 9:30 a.m. and 5:00 p.m. We will contact you to confirm your appointment.',
    'Nom complet': 'Full name',
    'Téléphone': 'Phone',
    'Courriel': 'Email',
    'Matin': 'Morning',
    'Après-midi': 'Afternoon',
    'Message ou préférence': 'Message or preferred time',
    'Envoyer la demande': 'Submit request',
    'Votre demande d’essai routier a été envoyée avec succès.': 'Your test drive request has been sent successfully.',
    'Ne pas remplir:': 'Do not fill out:',
    'Les essais routiers sont disponibles du lundi au vendredi seulement.': 'Test drives are available Monday through Friday only.',
    'Rapport Carfax disponible sur demande. Contactez-nous pour obtenir plus d’information sur ce véhicule.': 'A Carfax report is available upon request. Contact us for more information about this vehicle.',
    'Afficher la photo': 'Show photo',
    'le véhicule': 'vehicle',
    'Véhicule': 'Vehicle',
    'Bonjour, je suis intéressé par ce véhicule : ': 'Hello, I am interested in this vehicle: ',
    'Choisissez deux véhicules à comparer.': 'Choose two vehicles to compare.'
  };

  const pageMeta = {
    'index.html': {
      fr: { title: "Sharbo Auto | Véhicules d'occasion à Laval", description: "Découvrez l'inventaire de Sharbo Auto à Laval. Véhicules d'occasion sélectionnés, financement flexible et service transparent." },
      en: { title: 'Sharbo Auto | Pre-Owned Vehicles in Laval', description: 'Browse Sharbo Auto’s pre-owned inventory in Laval. Carefully selected vehicles, flexible financing, and straightforward service.' }
    },
    'inventaire.html': {
      fr: { title: 'Inventaire | Sharbo Auto', description: "Découvrez l'inventaire de véhicules d'occasion de Sharbo Auto à Laval." },
      en: { title: 'Inventory | Sharbo Auto', description: 'Browse Sharbo Auto’s pre-owned vehicle inventory in Laval.' }
    },
    'vehicle.html': {
      fr: { title: 'Détails du véhicule | Sharbo Auto', description: "Consultez les détails, les photos et le prix de ce véhicule d'occasion chez Sharbo Auto." },
      en: { title: 'Vehicle Details | Sharbo Auto', description: 'View photos, pricing, and details for this pre-owned vehicle at Sharbo Auto.' }
    },
    'financement.html': {
      fr: { title: 'Financement | Sharbo Auto', description: 'Faites votre demande de financement automobile en ligne auprès de Sharbo Auto.' },
      en: { title: 'Financing | Sharbo Auto', description: 'Complete your auto financing application online with Sharbo Auto.' }
    },
    'about.html': {
      fr: { title: 'À propos | Sharbo Auto', description: "Découvrez Sharbo Auto, spécialiste des véhicules d'occasion et du financement automobile à Laval." },
      en: { title: 'About | Sharbo Auto', description: 'Learn about Sharbo Auto, your source for pre-owned vehicles and auto financing in Laval.' }
    },
    'contact.html': {
      fr: { title: 'Contact | Sharbo Auto', description: "Contactez Sharbo Auto à Laval pour nos véhicules d'occasion et nos options de financement." },
      en: { title: 'Contact | Sharbo Auto', description: 'Contact Sharbo Auto in Laval for pre-owned vehicles and financing options.' }
    }
  };

  function translateText(text, target = current) {
    if (target === 'fr') return text;
    const trimmed = String(text).trim();
    return frToEn[trimmed] || text;
  }

  function translateVehicleValue(value) {
    if (value === null || value === undefined) return value;
    if (current === 'fr') return value;
    return frToEn[String(value).trim()] || value;
  }

  function translateTextNodes(root = document.body) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const p = node.parentElement;
        if (!p || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(p.tagName)) return NodeFilter.FILTER_REJECT;
        return node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      if (!node.__frOriginal) node.__frOriginal = node.nodeValue;
      if (current === 'fr') {
        node.nodeValue = node.__frOriginal;
      } else {
        const original = node.__frOriginal;
        const lead = original.match(/^\s*/)[0];
        const tail = original.match(/\s*$/)[0];
        const translated = frToEn[original.trim()] || original.trim();
        node.nodeValue = lead + translated + tail;
      }
    });
  }

  function applyAttributes() {
    document.querySelectorAll('[data-fr][data-en]').forEach(el => {
      el.textContent = current === 'fr' ? el.dataset.fr : el.dataset.en;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.dataset.i18nPlaceholder;
      el.placeholder = current === 'fr' ? key : (frToEn[key] || key);
    });
    document.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(el => {
      if (!el.dataset.frPlaceholder) el.dataset.frPlaceholder = el.placeholder;
      el.placeholder = current === 'fr' ? el.dataset.frPlaceholder : (frToEn[el.dataset.frPlaceholder] || el.dataset.frPlaceholder);
    });
    document.querySelectorAll('[aria-label]').forEach(el => {
      if (!el.dataset.frAriaLabel) el.dataset.frAriaLabel = el.getAttribute('aria-label');
      const base = el.dataset.frAriaLabel;
      el.setAttribute('aria-label', current === 'fr' ? base : (frToEn[base] || base));
    });
  }

  function applyMeta() {
    const file = location.pathname.split('/').pop() || 'index.html';
    const meta = pageMeta[file]?.[current];
    if (!meta) return;
    if (!document.body?.dataset.dynamicVehicleTitle) document.title = meta.title;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.content = meta.description;
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogTitle) ogTitle.content = meta.title;
    if (ogDesc) ogDesc.content = meta.description;
  }

  function applyLanguage(options = {}) {
    document.documentElement.lang = current;
    localStorage.setItem(STORAGE_KEY, current);
    translateTextNodes(document.body);
    applyAttributes();
    applyMeta();
    document.querySelectorAll('.lang').forEach(btn => {
      btn.textContent = current === 'fr' ? 'EN' : 'FR';
      btn.setAttribute('aria-label', current === 'fr' ? 'Switch to English' : 'Passer au français');
      btn.title = current === 'fr' ? 'English' : 'Français';
    });
    if (!options.silent) document.dispatchEvent(new CustomEvent('sharbo:languagechange', { detail: { lang: current } }));
  }

  function setLanguage(next) {
    if (!supported.includes(next)) return;
    current = next;
    applyLanguage();
  }

  function toggleLanguage() { setLanguage(current === 'fr' ? 'en' : 'fr'); }

  window.SharboI18n = {
    get lang() { return current; },
    t(fr, en) { return current === 'fr' ? fr : (en || frToEn[fr] || fr); },
    translateText,
    translateVehicleValue,
    setLanguage,
    toggleLanguage,
    applyLanguage
  };
  window.toggleLang = toggleLanguage;
  window.toggleLangFinance = toggleLanguage;

  document.addEventListener('DOMContentLoaded', () => applyLanguage({ silent: true }));
})();
