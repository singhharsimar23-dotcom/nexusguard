# NexusGuard Intelligence Architecture

## Industrial Event-Sourcing
NexusGuard is built on an **Event-Sourced** foundation. Every state change (Invoice Submission, Risk Scoring, AI Explanation) is recorded as an immutable, versioned event in the `events` table.

### Tamper-Evident Audit Chain
Each event includes:
- `event_hash`: SHA-256 hash of the current event data + previous event hash.
- `previous_hash`: Link to the preceding event.
This creates a cryptographically linked chain, ensuring the audit ledger is immutable and verifiable.

## Multi-Tenant Isolation
The platform is designed for global scale:
- **Tenant Isolation**: Every record is tagged with a `tenant_id`.
- **RLS Ready**: Schema supports Row-Level Security for strict data partitioning.

## Graph Topology Engine
- **Computation Graph**: Derived in real-time from the event stream.
- **Cycle Detection**: DFS-based algorithms detect Carousel Trades (circular financing).
- **Centrality Analysis**: Identifies abnormal hubs in the supply chain network.

## AI Explainability (Gemini 1.5)
- **Async Pipeline**: Risk scoring is deterministic and instant. AI explanations are queued and processed asynchronously.
- **Narrative Intelligence**: Gemini 1.5 Flash generates forensic briefs for compliance officers, explaining *why* a specific network pattern is risky.

## Production SLOs
- **Scoring Latency**: P95 < 1.2s.
- **Ingestion Throughput**: Horizontally scalable worker architecture.
- **Auditability**: 100% forensic replay capability.
