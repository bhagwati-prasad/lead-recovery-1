# Architecture Decision Records (ADRs) for AI-Powered Lead Recovery System

## ADR 1: Tech Stack Selection
**Date:** March 10, 2026  
**Status:** Accepted  
**Context:** Need a stable application stack for a modular lead recovery platform while keeping third-party service choices outside architecture decisions.  
**Decision:** Use NestJS for the backend application layer and HTML, CSS, and vanilla JavaScript for the frontend. Keep third-party vendor selection outside ADRs and define provider-agnostic adapter interfaces for LLM, speech, and telephony capabilities.  
**Consequences:** Backend gains a structured module system, DI, controllers, and testing conventions through NestJS; frontend remains framework-free and close to browser APIs; third-party services remain replaceable behind adapters.

## ADR 2: Modular Architecture
**Date:** March 10, 2026  
**Status:** Accepted  
**Context:** System must have granular, composable steps for third-party integration.  
**Decision:** Design system with atomic, composable components (e.g., ingestion, scoring, calling modules).  
**Consequences:** Improves maintainability and extensibility; allows swapping services.

## ADR 3: Data Storage for Objections
**Date:** March 10, 2026  
**Status:** Accepted  
**Context:** Need to store objections, handling scripts, and unhandleable cases.  
**Decision:** Use a database (e.g., PostgreSQL) with repositories for objections and scripts, configurable per stage.  
**Consequences:** Supports configurability; requires schema design for funnel-specific data.

## ADR 4: Scoring Model
**Date:** March 10, 2026  
**Status:** Accepted  
**Context:** Conversion probability needs to improve over time.  
**Decision:** Implement a machine learning model trained on historical data; start with rule-based scoring for MVP.  
**Consequences:** Enables self-improvement; requires data pipeline for training.

## ADR 5: Communication Channels
**Date:** March 10, 2026  
**Status:** Accepted  
**Context:** Start with calls, expand to SMS/email/WhatsApp.  
**Decision:** Use a channel abstraction layer; implement call first, add others via plugins.  
**Consequences:** Future-proofs expansion; initial focus on core functionality.

## ADR 6: Escalation Logic
**Date:** March 10, 2026  
**Status:** Accepted  
**Context:** Determine when to escalate to humans.  
**Decision:** Escalate if objection is handleable but AI lacks knowledge; log unhandleable objections.  
**Consequences:** Balances automation with human oversight; requires clear criteria definition.