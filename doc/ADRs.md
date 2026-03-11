# Architecture Decision Records (ADRs) for AI-Powered Lead Recovery System

## ADR 1: Tech Stack Selection
**Date:** March 10, 2026  
**Status:** Accepted  
**Context:** Need AI and voice services for lead recovery calls.  
**Decision:** Use Sarvam AI for conversation AI and Eleven Labs for text-to-speech/voice. Start with minimum services for MVP, club internal steps.  
**Consequences:** Enables rapid prototyping; potential vendor lock-in; evaluate alternatives later.

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