# Product Requirements Document (PRD) for AI-Powered Lead Recovery System

## Overview
The AI-Powered Lead Recovery System is an ancillary process designed to recover lost leads from sales funnels, thereby improving sales efficiency by increasing conversion rates and reducing lead losses. The system operates independently of the actual sales funnel and focuses on re-engaging dropped leads through AI-driven conversations.

The backend application shall be implemented using NestJS. The frontend shall be implemented using HTML, CSS, and vanilla JavaScript.

## Business Objectives
- Recover lost leads by addressing objections and guiding customers back into the sales funnel.
- Improve overall sales efficiency through automated lead recovery.
- Enable self-improvement over time via data-driven insights and model training.

## Target Users
- **AI Agents**: Handle calls, converse with customers, and log results.
- **Administrators**: Configure funnels, set up lead ingestion pipelines, and manage objection databases.
- **Sales Managers**: Monitor system performance via dashboards.

## Key Features
1. **Lead Data Ingestion**: Fetch dropped lead data from APIs, with placeholders for CSV, JSON, and Excel.
2. **Conversion Probability Scoring**: Assign scores to leads based on data, funnel stage, and potential objections.
3. **Automated Calls**: Initiate calls using AI agents prepared for stage-specific objections. See [Call Workflow Plan](conversation.md) for detailed modular workflow.
4. **Objection Handling**: Identify actual objections, store them, and address using configurable scripts aligned with company policies.
5. **Re-engagement Assistance**: Provide links or guidance to re-enter the funnel.
6. **Assessment and Escalation**: Evaluate post-call potential, escalate to humans if needed, and log unhandleable objections.
7. **Configurability**: Allow creation and configuration of multiple funnels, stages, objections, and handling scripts.
8. **Reporting and Analytics**: Generate reports on conversion rates, call success, and system performance.

## UI/UX Requirements
The user interface shall mimic the design and layout of Visual Studio Code (online version), featuring a responsive web application with a sidebar navigation, tabbed interface, and integrated panels. All icons must be sourced exclusively from Icons8. The UI shall be implemented using HTML, CSS, and vanilla JavaScript only, without frontend frameworks or libraries.

### Core Navigation and Layout
- **Header Breadcrumb/Selector**: Display hierarchical navigation (Organization > Product > Funnel > Lead/Customer) for context awareness.
- **Sidebar Tabs**: Include Dashboard, Customers, Products & Funnels, Calls, Agents, Analytics, Settings, and User Account.
- **Responsive Design**: Ensure usability on desktop, tablet, and mobile devices.

### Key UI Components
1. **Lead Data Input**:
   - Settings tab: Configure API endpoints, webhooks, and file upload options (CSV/Excel).
   - File upload interface with drag-and-drop support and validation.

2. **Funnel Configuration**:
   - Products & Funnels tab: Drag-and-drop editor for creating and modifying funnel stages.
   - Visual representation of stages, paths, and objections based on the funnel definition structure.

3. **Call Scheduling**:
   - Settings tab: Hierarchical configuration for call times (system-wide, organization, product, funnel, or lead-specific).
   - Time picker interfaces with presets and custom options.

4. **Manual Call Initiation**:
   - Customers tab: Select customer from list/grid, initiate call with button.
   - Calls > Make Call sub-menu: Form to manually enter lead details (name, phone, motive/stage) and initiate call.

5. **Ongoing Calls Management**:
   - Calls > Active Calls sub-menu: List of ongoing calls with status indicators.
   - Click on a call to view real-time text transcript or audio stream.

### Additional UI Elements
- **Dashboard**: Overview widgets for key metrics, recent activities, and alerts.
- **Customers (Tiny CRM)**: List/grid view of leads with search, filters, and actions (edit, call, view history).
- **Agents**: Management interface for AI agents, including configuration and performance monitoring.
- **Analytics**: Charts and reports for forecasts, trends, and historical data.
- **Settings**: Centralized configuration for all system settings.
- **User Account**: Profile management and personal settings.

### Implicit UI/UX Elements
- **Authentication**: Login/logout with role-based access.
- **Notifications**: Toast messages, alerts for call statuses, errors, and updates.
- **Search and Filters**: Global search across entities, advanced filters in lists.
- **Loading States and Error Handling**: Spinners, progress bars, and user-friendly error messages.
- **Accessibility**: Keyboard navigation, screen reader support, high contrast modes.
- **Help and Tooltips**: Contextual help, tooltips for complex features.

## Funnel Configuration
Funnels are configurable with multiple stages, each potentially having sub-stages and associated objections. For a complete example of a credit card application funnel, see [Funnel Structure and Definition](funnel-definition.md).

## Success Metrics
- Primary: Number of calls that result in conversion and redirection back to the funnel.
- Secondary: Call success rate, time to re-engagement, objection resolution rate.

## Assumptions and Constraints
- Start with call-based communication; expand to SMS, email, WhatsApp later.
- Data shape and sources to be finalized during development.
- Initial scalability: Support 3 funnels for 2 products.

## User Stories
- As an AI Agent, I want to receive lead data and initiate calls to handle objections.
- As an Administrator, I want to configure funnels and objection handling scripts.
- As a Sales Manager, I want to view dashboards showing recovery rates and system performance.