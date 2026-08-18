## Description

Implement an LLM-based Automated Clinical Triage & EHR Summarization Service. This system will ingest raw patient intake forms and unstructured Electronic Health Records (EHR) to generate standardized clinical summaries and assign an automated triage priority score.

**Fixes in `backend/`:**
1. **Added `ClinicalTriageService`** — core logic for triage scoring.
2. **Added `EHRLLMSummarizer`** — handles unstructured data parsing and LLM API calls.
3. **Added Models and DTOs** for heavy data validation.

---

## Related Issue

* Closes #1379

---

## Component(s) Affected

* [x] Backend (`backend/`)
* [ ] Mobile app (`rhythma_flutter/`)
* [ ] Web app (`web/`)
* [ ] Landing page (`landing-page/`)
* [ ] Docs only (README, CONTRIBUTING, architecture, etc.)
* [ ] CI / tooling

---

## Type of Change

* [ ] Bug fix
* [x] New feature
* [ ] Documentation update
* [ ] Refactor (no behavior change)
* [ ] Tests
* [ ] Other:

---

## Checklist

* [x] I have read `CONTRIBUTING.md`
* [ ] I rebased/merged the latest `main` into this branch
* [x] I tested my changes locally (see Testing Performed above)
* [ ] Any behavior change includes a new or updated test
* [x] I removed debug prints, commented-out dead code, and unused imports I introduced
* [x] This PR is scoped to one logical change
* [x] I did not commit any secrets, credentials, or real `.env` files
