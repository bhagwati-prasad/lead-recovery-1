# Funnel Structure and Definition

## Generic Funnel Structure

This document defines the generic structure for sales funnels in the lead recovery system. All funnels must adhere to this structure to ensure consistency and configurability. Any deviations require updates to this definition, the stage definitions, or the specific funnel examples.

## Funnel Overview

A **funnel** represents a sales process designed to guide potential customers through a series of steps toward a conversion goal (e.g., completing a credit card application). Funnels are configurable and can be created for different products or services.

### Key Characteristics
- **Stages**: A funnel consists of multiple stages, which can be sequential or parallel.
- **Paths**: Stages may form paths (e.g., parallel branches). The funnel objective is achieved when the customer completes the last stage along any valid path.
- **Configurability**: Funnels can be customized by administrators, including adding/removing stages, defining objections, and setting policies.

### Funnel Components
- **Title**: A descriptive name for the funnel (e.g., "Credit Card Application Funnel").
- **Description**: High-level overview of the funnel's purpose and flow.
- **Stages**: List of stages, each defined with specific attributes (see below).
- **Policies**: Global policies applicable to the entire funnel (e.g., data retention, compliance requirements).

## Stage Structure

Each **stage** in a funnel is a discrete step in the customer journey. Stages can be sequential (one after another) or parallel (multiple stages can be pursued simultaneously).

### Stage Components
1. **Title**: A concise name for the stage (e.g., "Mobile Verification").
2. **Goal**: The primary objective of the stage (e.g., "Verify customer's mobile number for communication").
3. **Description**: Detailed explanation of what happens in the stage, including user actions and system interactions.
4. **Policies**: Rules governing the stage, such as eligibility criteria, retry limits, or compliance requirements.
5. **System Objections**: Errors or issues that may arise due to system failures or data mismatches (e.g., "PAN detail mismatch", "Tech failure").
6. **Customer Objections**: Potential concerns or hesitations from the customer that may prevent progression (e.g., privacy concerns, misunderstanding of terms).

### Stage Flow
- Stages are processed in order (sequential) or concurrently (parallel).
- Upon completion of all required stages (considering parallel paths), the funnel objective is met.
- If a stage cannot be completed due to objections, the lead recovery system intervenes to address them.

## Usage Guidelines
- **Creating New Funnels**: Use this generic structure as a template. Define stages with the required components.
- **Modifying Existing Funnels**: Changes must align with this structure. Update the generic definition if new components are needed.
- **Examples**: Specific funnel implementations (e.g., credit card application) must follow this structure. See the Example Funnel section below.

## Relationship to Other Documents
- **PRD/SRS**: Reference this structure for configurability and requirements.

## Example Funnel: Credit Card Application

The following is a detailed breakdown of the stages in a credit card application funnel:

1. **Mobile Verification**: Enter mobile number, receive OTP via SMS, and fill in the OTP.
2. **Dedupe** (can be used multiple times for de-duplicating different information pieces about the customer): Mobile number, PAN card number, Aadhar number, loan/credit card application number, etc.
3. **Personal Details**: Name, age, gender, etc. Potential errors (system objections) could include:
   - PAN detail mismatch (information fetched via PAN card does not match entered information)
   - PIN code error (if services are not available in that area)
   - Age error (minimum age not cleared)
   - Tech failure (unexpected system failure)
4. **MITC**: Most Important Terms and Conditions.
5. **Aadhar Card Verification**: Via DigiLocker or another mechanism.
6. **Permanent and Current Address of Customer**.
7. **Additional Details**: Marital status, employment or income source type, company address, company name, monthly/annual income.
8. **Additional Details Fetched by System**: Credit score, user's bank statements.
9. **Offer Acceptance**: An offer is provided to the user, e.g., "increased credit card limit".
10. **Product Variants**: User is shown a selection of eligible products (e.g., credit card variants) and selects one or multiple, depending on policy.
11. **E-consent**: Electronic consent is requested from the customer.
12. **VKYC**: Virtual KYC (Know Your Customer) using live video or another mechanism.
13. **Deliverables**: Further instructions (e.g., steps to activate card), product configuration (e.g., setting up international usage, POS limit, ATM withdrawal limit), additional integrations (e.g., linking card to UPI), and finally, requesting the customer to download the application.