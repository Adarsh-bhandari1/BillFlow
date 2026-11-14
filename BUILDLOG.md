# BillFlow — Build Log

This document tracks the development progress of BillFlow, including major implementation steps, technical decisions, challenges, and future improvements.

## Phase 1: Project Setup

- Created the BillFlow project structure.
- Initialized the Node.js project using npm.
- Configured Express 5 for backend API development.
- Set up environment variables for application configuration.
- Configured PostgreSQL using Docker Compose.

## Phase 2: Database Design

- Designed the initial relational database schema.
- Created tables for tenants, plans, subscriptions, and usage events.
- Established relationships using primary and foreign keys.
- Added support for tracking processed Stripe webhook events.
- Added initial subscription plan data.

## Phase 3: Usage Metering

- Implemented the usage metering API.
- Created `MeterService` to handle usage recording.
- Added support for API call tracking.
- Implemented idempotency using unique request keys.
- Added tenant-level usage retrieval.

## Phase 4: Quota Management

- Created `QuotaService` for subscription-based usage validation.
- Implemented plan-based usage limits.
- Added checks to prevent tenants from exceeding their allowed quotas.
- Integrated quota validation into the metering workflow.

## Phase 5: AI Token Cost Calculation

- Extended the metering system to support AI token usage.
- Added separate tracking for input, cached input, output, and reasoning tokens.
- Created `CostService` to calculate token usage costs.
- Integrated token pricing with subscription plan configuration.

## Phase 6: Stripe Integration

- Integrated Stripe for subscription and payment management.
- Configured Stripe API credentials using environment variables.
- Implemented the Stripe webhook endpoint.
- Added webhook signature verification.
- Implemented handling for checkout completion, subscription updates, and cancellations.
- Added duplicate webhook event protection.

## Phase 7: Admin Analytics

- Implemented administrative API endpoints.
- Added API key authentication for administrative routes.
- Implemented tenant and subscription information retrieval.
- Added Monthly Recurring Revenue (MRR) calculation.
- Implemented daily usage trend reporting.

## Phase 8: Testing and Validation

- Tested API endpoints using Postman.
- Used Stripe CLI to test webhook events locally.
- Tested usage recording and idempotency behavior.
- Tested subscription quota enforcement.
- Verified AI token cost calculations.
- Tested administrative endpoints and authentication.
- Used Docker to manage the local PostgreSQL environment.

## Technical Challenges

Some of the important engineering challenges encountered during development:

| Challenge | Approach |
|---|---|
| Duplicate usage records | Implemented idempotency keys |
| Subscription-based usage restrictions | Created a dedicated quota service |
| Different AI token pricing rates | Implemented category-based cost calculation |
| Stripe webhook verification | Used Stripe signature verification |
| Duplicate webhook events | Added processed event tracking |
| Database environment setup | Used Docker Compose with PostgreSQL |


---

**Project:** BillFlow — Usage Metering & Billing Engine

**Author:** Adarsh Bhandari

**Repository:** https://github.com/Adarsh-bhandari1/BillFlow