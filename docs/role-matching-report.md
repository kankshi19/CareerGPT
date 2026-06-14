# Role Matching Report

## Matching methods
- exact
- normalized
- alias
- fuzzy
- unresolved

## Notes
- Exact and normalized matches are accepted automatically.
- Alias matches require `data/config/role-title-aliases.json`.
- Fuzzy matches use a conservative threshold and are written to `data/processed/reviewed-role-matches.json`.
- Unresolved rows remain in `data/processed/unmatched-role-mappings.json`.

## Alias suggestions
- Start by adding aliases for common title variants, abbreviations, and seniority prefixes.
- Use normalized title keys on the left and processed role slugs on the right.

