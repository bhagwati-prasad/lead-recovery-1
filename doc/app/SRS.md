# Software Requirements Specification (SRS) for AI-Powered Lead Recovery System

## 1. Introduction
### 1.1 Purpose
This SRS outlines the functional and non-functional requirements for the AI-Powered Lead Recovery System.

### 1.2 Scope
The system will ingest dropped lead data, score leads, initiate AI-driven calls, handle objections, assist re-engagement, and provide analytics. For detailed specifications of the call workflow modules, see [Call Workflow Plan](conversation.md).

## 2. Overall Description
### 2.1 Product Perspective
Ancillary to sales funnels, integrating with Sarvam AI and Eleven Labs for AI and voice services. The backend application shall use NestJS, and the frontend shall use HTML, CSS, and vanilla JavaScript.

### 2.2 User Characteristics
- AI Agents: Automated entities handling calls.
- Administrators: Technical users configuring the system.
- Sales Managers: Business users monitoring performance.

## 3. Specific Requirements
### 3.1 Functional Requirements
#### 3.1.1 Lead Ingestion
- FR1: System shall fetch lead data from APIs.
- FR2: System shall support placeholders for CSV, JSON, Excel ingestion.
- FR3: Data fields: name, contact info, funnel stage, drop-off reason.

#### 3.1.2 Scoring
- FR4: System shall calculate conversion probability score using a model.
- FR5: Score shall improve over time with training data.

#### 3.1.3 Call Initiation
- FR6: System shall initiate calls using Eleven Labs for voice.
- FR7: AI agents shall use Sarvam AI for conversation.

#### 3.1.4 Objection Handling
- FR8: System shall maintain databases for objections and handling scripts.
- FR9: Scripts shall be configurable per funnel stage.
- FR10: System shall identify and store actual objections.
- FR11: System shall escalate to humans if objection is handleable but unknown.

#### 3.1.5 Re-engagement
- FR12: System shall provide links or guidance to re-enter funnel.

#### 3.1.6 Assessment
- FR13: System shall log call results and assess conversion potential.
- FR14: System shall mark leads for human intervention or as unhandleable.

#### 3.1.7 Configurability
- FR15: Administrators shall create and configure funnels, stages, objections.

#### 3.1.8 Reporting
- FR16: System shall generate dashboards for sales managers.

### 3.2 Non-Functional Requirements
- NFR1: Granular, composable steps for third-party integration. See [Call Workflow Plan](conversation.md) for detailed module specifications.
- NFR2: Scalable to 3 funnels for 2 products initially.
- NFR3: Response time for calls: <5 seconds.
- NFR4: Security: Encrypt sensitive data.
- NFR5: Reliability: 99% uptime.

### 3.3 Interface Requirements
- API for lead data ingestion.
- Integrations with Sarvam AI and Eleven Labs.
- Dashboard UI for monitoring.

#### 3.3.1 User Interface Requirements
The system shall provide a web-based user interface designed to resemble Visual Studio Code (online version), with responsive layout, sidebar navigation, and tabbed content areas. All icons shall be from Icons8. The UI shall be implemented using HTML, CSS, and vanilla JavaScript only, leveraging standard web APIs for interactivity, without external frontend frameworks or libraries.

##### 3.3.1.1 General UI Components
- **Layout**: Header with breadcrumb selector (Organization > Product > Funnel > Lead), sidebar with tabs, main content area with panels.
- **Responsiveness**: Support for desktop (min 1024px), tablet (768px), and mobile (320px) viewports.
- **Navigation**: Hierarchical selector in header for context switching.
- **Tabs**: Dashboard, Customers, Products & Funnels, Calls (with sub-menus: Active Calls, Call Log, Make Call), Agents, Analytics, Settings, User Account.

##### 3.3.1.2 Specific UI Screens and Features
- **Lead Ingestion UI** (Settings tab):
  - Forms for API configuration (endpoints, auth).
  - Webhook setup interface.
  - File upload area with drag-and-drop, format validation (CSV, Excel), preview, and import progress.

- **Funnel Configuration UI** (Products & Funnels tab):
  - List of organizations, products, funnels.
  - Drag-and-drop canvas for stage creation/editing.
  - Forms for stage properties (title, goal, description, policies, objections).
  - Visual flow diagram showing stages and paths.

- **Call Scheduling UI** (Settings tab):
  - Hierarchical settings: System, Organization, Product, Funnel, Lead levels.
  - Time picker with calendar, presets (e.g., business hours), and recurrence options.

- **Manual Call UI**:
  - Customers tab: Grid/list of leads with search/filters, select and "Call" button.
  - Calls > Make Call: Form with fields for name, phone, motive/stage, initiate button.

- **Active Calls UI** (Calls > Active Calls):
  - List of ongoing calls with status (ringing, connected, etc.), customer info.
  - Click to open panel with real-time text transcript and audio controls (play/pause, volume).

- **Dashboard UI**:
  - Widgets: KPIs (conversion rate, calls today), charts (trends), recent calls list.

- **Customers UI**:
  - CRM-like interface: List/grid with columns (name, phone, stage, score, last call).
  - Actions: View details, edit, initiate call, view history.

- **Agents UI**:
  - List of AI agents with status, configuration options, performance metrics.

- **Analytics UI**:
  - Charts for forecasts, trends; filters by time, funnel, etc.

- **Settings UI**:
  - Tabs for different categories (ingestion, scheduling, general).

- **User Account UI**:
  - Profile form, preferences, logout.

##### 3.3.1.3 Implicit UI Features
- **Authentication UI**: Login form with username/password, role selection.
- **Notifications**: Toast notifications for call events, errors.
- **Search**: Global search bar, per-tab filters.
- **Loading/Progress**: Spinners for async operations, progress bars for uploads/calls.
- **Error Handling**: Error messages, retry options.
- **Accessibility**: ARIA labels, keyboard shortcuts, high contrast theme.
- **Help**: Tooltips, inline help, link to documentation.

## 4. Appendices
- Initial Funnel: See [Funnel Structure and Definition](funnel-definition.md) for the Bank of Baroda credit card funnel stages.