SHARBO AUTO — CONTRACTS V4.1

This version fixes the contract type relationship.

Changes:
- Reads contract types from Supabase table public.contract_types.
- Displays french_name or english_name depending on the contract language.
- Saves contracts.contract_type as the correct UUID.
- Keeps the existing foreign key contracts_contract_type_fkey.
- Contract list and filter now use the real contract type records.

IMPORTANT:
- Do not convert contracts.contract_type to text.
- Do not remove contracts_contract_type_fkey.
- No new SQL migration is required for the contract type fix.

Deployment:
1. Replace the project files with this version.
2. Commit and push to GitHub.
3. Wait for Netlify deployment.
4. Hard refresh the admin page (Ctrl+Shift+R).
