SHARBO AUTO DMS 1.0 — INSTALLATION EN UN SEUL DÉPLOIEMENT

1) SUPABASE
- Ouvrir Supabase > SQL Editor.
- Coller et exécuter SUPABASE_SHARBO_DMS_1_0.sql.
- Le script conserve les données existantes et ajoute les nouvelles colonnes/tables.

2) GITHUB / NETLIFY
- Remplacer votre projet actuel par le contenu de ce dossier.
- Faire un seul commit: "Install Sharbo Auto DMS 1.0"
- Push origin une seule fois.
- Attendre le déploiement Netlify, puis Ctrl+Shift+R.

3) INVENTAIRE PRO
- Admin V2 > Inventaire.
- Choisir « Ordre manuel ».
- Glisser les lignes ou utiliser ↑ / ↓.
- Cliquer « Enregistrer l’ordre ».
- 📌 garde un véhicule en haut; ⭐ le marque en vedette.
- Le site public utilise automatiquement cet ordre.

4) DMS FOUNDATION
Le SQL crée les fondations suivantes:
- Dossiers de vente automatiques
- Paiements et reçus
- Financement
- Documents et pièces jointes
- Dépenses et calcul du profit
- Historique des activités
- Signatures électroniques

Cette version active immédiatement l’Inventaire Pro et prépare la base complète pour les écrans DMS suivants sans redéployer le schéma.
