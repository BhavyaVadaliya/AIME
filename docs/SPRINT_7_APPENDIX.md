# Sprint 7: Appendix & Handoff Definitions

## Appendix A — Sprint 7 Clarifications

### 1) Definition of “Usable AIME” (Sprint 7)
For Sprint 7, “usable AIME” means:
- A developer (or you, via developer support) can submit a signal manually via **script**, **curl**, or **harness entry**.
- The signal:
  - Enters **RTCE**.
  - Passes through **L2 ingestion**.
  - Produces a **deterministic decision/output**.
- Evidence of processing is visible via:
  - **Structured logs**.
  - **Acceptance harness output**.
- **No admin UI interaction is required** for Sprint 7 usability.
- Sprint 7 usability is **functional**, not UX-driven.

### 2) CI/CD & Artifact Ownership (Explicit)
- **Owner**: Human developer team.
- **Responsibilities**:
  - Build RTCE + L2 artifacts from implemented code.
  - Publish artifacts to agreed registry (`artifacts/registry.json`).
  - Provide artifact identifiers (hash/tag).
- **Gate**: Deployment cannot proceed without explicit artifact confirmation.

### 3) Signal Testing (Post-Staging)
Sprint 7 signal testing consists of:
- **Acceptance harness execution** (Request: `npm test` in harness).
- **Manual signal injection** (at least 3 cases - see `scripts/manual_invoke.js`):
  - Happy path.
  - Edge case.
  - Invalid/ignored case.
- **Verification** via logs + harness outputs.
- **No exploratory UI testing** is expected in Sprint 7.

### 4) Logging & Audit Consumption
- Logs must be:
  - **Structured** (JSON).
  - **Queryable** by developers (grep/jq on log files).
- Sprint 7 does **not** require:
  - Dashboard visualization.
  - Analyst-friendly UI.
- Sprint 8+ will define log consumption UX.

### 5) Admin Dashboard Expectation (Clarified)
- **Sprint 7**:
  - ❌ No admin dashboard required.
  - ❌ No live UI demo guarantee.
- **Sprint 8**:
  - ✅ Admin dashboard becomes a deliverable.

---

## Appendix B — Sprint 7 → Sprint 8 Handoff Map

### Sprint 7 Outputs (Must Exist)
- [x] Implemented RTCE + L2 code.
- [x] Built and published artifacts (`artifacts/*.zip`).
- [x] Acceptance harness passing.
- [x] Staging deployment completed (Simulated).
- [x] Signal processing verified via logs.
- [ ] Stability window completed (Pending time).

### Sprint 8 Inputs (Unlocked by Sprint 7)
- Artifact IDs + versions.
- Proven signal flow.
- Known operational limits.
- Logging schema + access.
- Confidence in deterministic behavior.

### Sprint 8 Candidate Deliverables (Non-Binding)
- Admin dashboard (read-only first).
- Manual signal submission via UI.
- Enhanced observability views.
- Preparation for signal-maximization features:
  - Narrative Mapper.
  - Trust Scoring.
  - Objection Resolver.
  - Delayed CTA.
  - “Why GIMA” Engine.
