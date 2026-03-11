# Operations Manual

## 1. Secrets Management
Secrets are strictly separated from code.
- **Local**: `.env` files (gitignored).
- **Staging/Prod**: Injected via Environment Variables (CI/CD Provider or Orchestrator).
- **Format**: 
  - `RTCE_API_KEY`: [Redacted]
  - `POLICY_VERSION`: `v1.0-frozen`

## 2. Observability
Logs are emitted to `stdout` in JSON format.
- **Format**: structured JSON (ECS compatible).
- **Access**:
  - **Local**: Terminal output / Docker logs.
  - **Staging**: Aggregated via centralized logging (e.g., Datadog/Splunk - simulation: `artifacts/staging_logs.json`).
- **Metrics**: `/health` endpoint available on all services.

## 3. Rollback Procedure
If a deployment fails validation (Harness check):
1.  **Stop** the failing container.
2.  **Pull** the previous known-good tag from Registry (see `artifacts/registry.json`).
3.  **Start** the previous version.
4.  **Verify** with Harness.

## 4. Disaster Recovery
- **Artifacts**: All images are immutable and stored in the Registry.
- **Data**: No persistent state in L2/RTCE services (stateless).
