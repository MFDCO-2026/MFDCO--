# WORKLOG v15

Base: v13 full package. v14 was interrupted before packaging; v15 folds requested v14 changes into a clean full tree.

## Priority
1. Fix country-edit left category navigation.
2. Accordion closes previous group.
3. Treaty creation fix.
4. Main/active country and header identity.
5. Diplomacy posture.
6. YouTube normalized embed.
7. World economy monthly/daily/hourly history and comparison.
8. Audit.

## Completed
- Root cause of editor navigation found: links were rendered but no explicit navigation handler existed.
- Replaced nav with explicit buttons and scrollIntoView behavior.
- Merged social-problem TOC item into social category.
- Added single-open behavior for country topbar details.
- Fixed treaty creation including local fallback and visible errors.
- Added diplomacy openness.
- Added main/active country preferences and header context.
- Added monthly/daily/hourly market simulation and market history page.
- Static/runtime/HTTP checks completed.
