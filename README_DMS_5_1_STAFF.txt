SHARBO AUTO DMS 5.1 — EMPLOYÉS & PERMISSIONS

1) Dans Supabase > SQL Editor, exécutez :
   SUPABASE_DMS_5_1_STAFF_PERMISSIONS.sql

2) Dans Netlify > Site configuration > Environment variables, ajoutez :
   SUPABASE_URL = votre URL Supabase
   SUPABASE_SERVICE_ROLE_KEY = clé service_role Supabase (jamais dans le navigateur)

3) Déployez tous les fichiers du dossier.

4) Connectez-vous avec hashem@sharboauto.com, puis ouvrez « Employés ».
   Ajoutez le nom, le courriel, le rôle et les permissions. L’employé reçoit une invitation par courriel.

IMPORTANT : ne mettez jamais la clé service_role dans admin-v2/supabase-config.js.
