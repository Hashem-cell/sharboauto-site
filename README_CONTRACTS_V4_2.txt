SHARBO AUTO — CONTRACTS V4.2

1. Dans Supabase > SQL Editor > New Query, exécuter :
   SUPABASE_CONTRACT_TYPES_FIX_V4_2.sql

2. Remplacer les fichiers du projet par ceux de ce dossier.

3. Commit GitHub :
   Fix contract type permissions and save V4.2

4. Push origin, attendre Netlify, puis Ctrl + Shift + R.

Corrections :
- La liste Type se charge depuis contract_types.
- Le bouton Enregistrer affiche maintenant toute erreur Supabase.
- Validation visible si le type n'est pas chargé.
- Permissions RLS non destructives pour contract_types et contracts.
