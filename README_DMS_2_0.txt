SHARBO AUTO DMS 2.0

Corrections:
- Chaque contrat crée/vérifie directement son dossier de vente dans l'application.
- Bouton Synchroniser les dossiers pour réparer les anciens contrats.
- La page Dossiers de vente affiche les dossiers réels, clients, véhicules, montants et soldes.
- Envoi de courriel réel via Netlify Function + Resend, avec repli vers l'application courriel.

Configuration courriel dans Netlify:
Site configuration > Environment variables
RESEND_API_KEY = votre clé Resend
CONTRACT_FROM_EMAIL = Sharbo Auto <contrats@votre-domaine.com>

Le domaine expéditeur doit être vérifié dans Resend. Sans configuration, le bouton ouvre automatiquement l'application courriel.
