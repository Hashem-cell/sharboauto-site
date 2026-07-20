SHARBO AUTO - SUPABASE INVENTORY V1

1) In Supabase SQL Editor, run SUPABASE_SETUP.sql once.
2) Upload this project to GitHub with GitHub Desktop.
3) Wait for Netlify deployment.
4) Open https://sharboauto.com/admin-v2/
5) Sign in with the Supabase user you created.
6) Click "Importer l'inventaire actuel" once to copy vehicles.json into Supabase.
7) Verify the 26 vehicles, then use "+ Ajouter un véhicule" for new inventory.

Safety:
- The public website first reads Supabase.
- If Supabase is empty or unavailable, it falls back to data/vehicles.json.
- Existing vehicles remain visible during migration.
- Never put a secret/service_role key in website files.
