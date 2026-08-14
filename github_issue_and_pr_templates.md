# MedTrack — Issue & PR Templates / Feature Deployment Audit Log

This file is the canonical record of automated feature-hub deployments: every new
domain feature created for the MedTrack application gets a branch, a commit, a GitHub
Issue, a Pull Request and (once CI deploys) a live GitHub Pages link, logged below.

---

## Deployment Checklist (per feature)

1. `git checkout main` -> `git checkout -b feature/frontend-<feature-name>-hub`
2. Write the 500+ line React page under `src/pages/<domain>/` and register it in `src/routes/routeRegistry.js`
3. Stage, commit, push to the fork (`git push -u origin feature/...`)
4. Open Issue -> `gh issue create --repo kRamu81/MedTrack_Application --title "[FEATURE] ..."`
5. Open PR -> `gh pr create --repo kRamu81/MedTrack_Application --head <fork>:<branch> --base main --title "feat(frontend): ... (#<issue>)"`
6. Update this audit log with Issue #, PR # and Live Link.

## Issue / PR Templates

### Issue Template

```markdown
## Overview
[What the feature page does and why it matters for the MedTrack ecosystem]

## Industry Standards Alignment
- [Regulatory / interoperability standard the feature maps to]

## Files
- `src/pages/<domain>/<FeaturePageName>.jsx`
- `src/routes/routeRegistry.js`

## Acceptance Criteria
- [ ] New page exceeds 500 lines of production-grade, dark-themed React
- [ ] Registered route; `check-routes.js` passes
- [ ] Interactive simulation / search / filter / inspection controls
```

### PR Template

```markdown
## Description
[Summary of the consoles and interactions added]

Fixes #<issue>

#Closed #<issue>
```

---

## Audit Log

| # | Feature | Domain | Branch | Issue | PR | Live Link | Date |
|---|---------|--------|--------|-------|----|-----------|------|
| 1 | Biomedical & Clinical AI Hub | Biomedical & Clinical AI | `feature/frontend-biomedical-ai-hub` | [#1126](https://github.com/kRamu81/MedTrack_Application/issues/1126) | [#1127](https://github.com/kRamu81/MedTrack_Application/pull/1127) | https://kRamu81.github.io/MedTrack_Application/clinical-ai | 2026-08-14 |
| 2 | Real-Time Telemetry & ICU Monitoring Hub | ICU Telemetry & Monitoring | `feature/frontend-icu-telemetry-hub` | [#1129](https://github.com/kRamu81/MedTrack_Application/issues/1129) | [#1130](https://github.com/kRamu81/MedTrack_Application/pull/1130) | https://kRamu81.github.io/MedTrack_Application/icu-telemetry | 2026-08-14 |
