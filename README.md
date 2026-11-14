# BillFlow — Usage Metering & Billing Engine

<p align="center">
  <strong>A Multi-Tenant Usage Metering and Subscription Billing Backend for SaaS Applications</strong>
</p>

<p align="center">
  Built with Node.js · Express 5 · PostgreSQL · Stripe · Docker
</p>

---

## Overview

**BillFlow** is a backend billing and usage-metering engine designed for SaaS platforms that need to track customer consumption, enforce subscription quotas, and calculate usage-based costs.

Instead of implementing billing logic independently in every application, BillFlow provides a centralized service that handles usage tracking, subscription management, quota enforcement, and payment integration.

It is designed around three fundamental questions:

- **Usage Tracking:** How much has each tenant consumed?
- **Cost Calculation:** How much should each tenant be charged?
- **Quota Enforcement:** Has a tenant exceeded the limits of their subscription plan?

BillFlow supports multiple tenants, subscription plans, API usage tracking, AI token metering, and Stripe-powered subscription lifecycle management.

## Key Features

### 1. Idempotent Usage Metering
- Records usage events against individual tenants.
- Uses idempotency keys to prevent duplicate usage records during network retries.
- Supports API call and AI token usage tracking.
- Maintains usage records in PostgreSQL.

### 2. Subscription-Based Quota Enforcement
- Checks tenant usage against their active subscription plan.
- Enforces configurable plan limits.
- Prevents requests from exceeding available quotas.
- Returns appropriate HTTP status codes when limits are exceeded.

### 3. AI Token Cost Calculation

Supports granular AI token metering with separate tracking for:

- Input tokens
- Cached input tokens
- Output tokens
- Reasoning tokens

Calculates token usage costs and provides a cost breakdown for individual tenants.

### 4. Stripe Subscription Integration
- Integrates with Stripe in test mode.
- Supports subscription checkout completion.
- Processes subscription updates and cancellations.
- Verifies Stripe webhook signatures.
- Prevents duplicate webhook processing using Stripe event IDs.
- Synchronizes subscription status with PostgreSQL.

### 5. Usage Analytics
- Retrieves tenant-level usage statistics.
- Supports daily, weekly, monthly, and yearly usage ranges.
- Provides subscription and cost information alongside usage data.

### 6. Admin Analytics
- Retrieves tenant information and subscription details.
- Calculates Monthly Recurring Revenue (MRR).
- Tracks active subscriptions.
- Provides usage trends over the last 30 days.
- Protects administrative endpoints using API key authentication.

## Technology Stack

| Technology | Purpose |
|---|---|
| Node.js | Backend runtime |
| Express 5 | REST API framework |
| PostgreSQL | Relational database |
| Stripe | Subscription and payment integration |
| Docker | Database containerization |
| Docker Compose | Database environment management |
| JavaScript (ES Modules) | Application development |
| Postman | API testing |
| Stripe CLI | Local webhook testing |

## Architecture

BillFlow follows a modular backend architecture that separates API routing, business logic, database connectivity, and external payment integration.

```text
                   Client Applications
                           |
                           v
                    Express Server
                           |
             +-------------+-------------+
             |             |             |
             v             v             v
         Metering       Stripe         Admin
          Routes        Webhooks       Routes
             |             |             |
             v             v             v
       +-----------+  +-----------+  +-----------+
       |   Meter   |  |  Stripe   |  |  Admin    |
       |  Service  |  | Integration| | Analytics |
       +-----------+  +-----------+  +-----------+
             |
       +-----+------------------+
       |             |          |
       v             v          v
   QuotaService  CostService  PostgreSQL
                               Database
```

### Core Components

- **Routes:** Handle incoming HTTP requests and API responses.
- **MeterService:** Records usage events with idempotency protection.
- **QuotaService:** Validates usage against subscription limits.
- **CostService:** Calculates subscription and AI token usage costs.
- **Stripe Integration:** Handles webhook verification and subscription synchronization.
- **PostgreSQL:** Stores tenants, plans, subscriptions, usage events, and processed Stripe events.

## Project Structure

```text
BillFlow/
│
├── config/
│   ├── db.js
│   └── stripe.js
│
├── routes/
│   ├── metering.js
│   ├── webhooks.js
│   └── admin.js
│
├── services/
│   ├── MeterService.js
│   ├── QuotaService.js
│   └── CostService.js
│
├── sql/
│   └── Database schema and seed scripts
│
├── Evidence/
│   └── Project evidence and testing materials
│
├── .env.example
├── .gitignore
├── BUILDLOG.md
├── DESIGN.md
├── EVIDENCE.md
├── capstone.yaml
├── docker-compose.yml
├── package.json
├── server.js
└── README.md
```

## Getting Started

Follow these instructions to run BillFlow locally.

### Prerequisites

Make sure you have the following installed:

- Node.js 18 or later
- npm
- Docker Desktop
- Docker Compose
- Stripe account (for payment integration)
- Stripe CLI (for local webhook testing)
- Postman (optional, for API testing)

### 1. Clone the Repository

```bash
git clone https://github.com/Adarsh-bhandari1/BillFlow.git

cd BillFlow
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root.

```env
DATABASE_URL=postgresql://billflow_user:billflow_pass@localhost:5433/billflow_db

STRIPE_SECRET_KEY=sk_test_your_secret_key

STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

ADMIN_API_KEY=your_secure_admin_key

PORT=3000
```

Replace the Stripe credentials with your own test-mode credentials.

**Important:** Never commit your `.env` file or expose your Stripe secret keys publicly.

### 4. Start PostgreSQL Using Docker

Start the PostgreSQL database:

```bash
docker compose up -d
```

Check whether the database container is running:

```bash
docker ps
```

The database is configured with:

| Configuration | Value |
|---|---|
| Container | billflow_db |
| Database | billflow_db |
| Username | billflow_user |
| Password | billflow_pass |
| Host Port | 5433 |
| PostgreSQL Port | 5432 |
| Image | postgres:16-alpine |

### 5. Initialize the Database

Execute the SQL schema and seed scripts available in the `sql/` directory.

Make sure the database tables and initial subscription plans are created before testing the API.

### 6. Start the Backend Server

```bash
node server.js
```

The server will start on:

```text
http://localhost:3000
```

Test the root endpoint:

```http
GET http://localhost:3000/
```

Expected response:

```json
{
  "message": "BillFlow API is running"
}
```

## API Documentation

BillFlow exposes REST endpoints for usage metering, cost calculation, subscription analytics, and administrative operations.

### 1. Record Usage

**Endpoint**

```http
POST /api/meter
```

**Headers**

```http
Content-Type: application/json
x-idempotency-key: unique-request-id
```

**Request Body**

```json
{
  "tenant_id": "YOUR_TENANT_UUID",
  "type": "api_call",
  "quantity": 10
}
```

**Supported Usage Types**

- `api_call`
- `ai_tokens`

The idempotency key ensures that retrying the same request does not create duplicate usage records.

### 2. Calculate AI Token Costs

**Endpoint**

```http
POST /api/meter/cost
```

**Headers**

```http
Content-Type: application/json
x-idempotency-key: unique-request-id
```

**Request Body**

```json
{
  "tenant_id": "YOUR_TENANT_UUID",
  "input_tokens": 1000,
  "cached_input_tokens": 200,
  "output_tokens": 500,
  "reasoning_tokens": 100
}
```

The endpoint records individual token categories and returns the calculated cost with a usage breakdown.

### 3. Retrieve Tenant Usage

**Endpoint**

```http
GET /api/usage/:tenantId
```

**Query Parameters**

| Parameter | Description |
|---|---|
| day | Current day's usage |
| week | Current week's usage |
| month | Current month's usage (default) |
| year | Current year's usage |

**Example**

```http
GET /api/usage/YOUR_TENANT_UUID?range=month
```

Returns usage statistics, active subscription information, plan limits, and calculated costs.

### 4. Retrieve All Tenants (Admin)

**Endpoint**

```http
GET /api/admin/tenants
```

**Headers**

```http
x-admin-key: YOUR_ADMIN_API_KEY
```

Retrieves tenant information, subscription status, plan details, and monthly usage events.

### 5. Retrieve Revenue Analytics (Admin)

**Endpoint**

```http
GET /api/admin/revenue
```

**Headers**

```http
x-admin-key: YOUR_ADMIN_API_KEY
```

Returns:

- Monthly Recurring Revenue (MRR)
- Number of active subscriptions
- Revenue currency

### 6. Retrieve Usage Trends (Admin)

**Endpoint**

```http
GET /api/admin/usage-trends
```

**Headers**

```http
x-admin-key: YOUR_ADMIN_API_KEY
```

Returns daily usage statistics grouped by usage type over the previous 30 days.

## Stripe Integration

BillFlow integrates with Stripe to manage subscription lifecycle events.

The application processes the following webhook events:

| Stripe Event | Purpose |
|---|---|
| `checkout.session.completed` | Activates a tenant's subscription after successful checkout |
| `customer.subscription.updated` | Synchronizes subscription status and billing period |
| `customer.subscription.deleted` | Updates subscription status after cancellation |

### Webhook Configuration

The webhook endpoint is:

```http
POST /api/stripe
```

Start the Stripe CLI listener:

```bash
stripe listen --forward-to localhost:3000/api/stripe
```

Copy the generated webhook signing secret and configure it in your `.env` file:

```env
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### Testing Stripe Events

Use Stripe CLI to trigger test events:

```bash
stripe trigger checkout.session.completed
```

```bash
stripe trigger customer.subscription.updated
```

```bash
stripe trigger customer.subscription.deleted
```

**Note:** Checkout activation requires valid tenant and plan metadata (`tenant_id` and `plan_name`). Subscription lifecycle tests also require matching subscription records and Stripe identifiers. Configure the appropriate test data when testing these flows.

## Security and Reliability

BillFlow incorporates several mechanisms to improve the reliability of billing operations:

- **Idempotent Usage Recording:** Prevents duplicate usage entries when clients retry requests.
- **Webhook Signature Verification:** Validates incoming Stripe webhook requests.
- **Duplicate Webhook Protection:** Tracks processed Stripe event IDs to avoid repeated processing.
- **Admin API Authentication:** Restricts administrative endpoints using an API key.
- **Parameterized SQL Queries:** Uses PostgreSQL parameterized queries to reduce SQL injection risks.
- **Environment-Based Configuration:** Keeps application secrets and credentials outside source code.

## Testing

You can test the API endpoints using Postman.

Recommended test scenarios:

1. Record API usage for a tenant.
2. Submit the same idempotency key twice and verify duplicate usage is not recorded.
3. Attempt usage beyond the subscription quota.
4. Record AI token usage across different token categories.
5. Retrieve daily, weekly, and monthly usage statistics.
6. Test Stripe checkout completion.
7. Verify duplicate Stripe webhook events are ignored.
8. Test subscription updates and cancellations.
9. Verify administrative endpoints reject invalid API keys.
10. Validate MRR and usage analytics.

## Author

**Adarsh Bhandari**

- GitHub: [@Adarsh-bhandari1](https://github.com/Adarsh-bhandari1)
- Project: [BillFlow](https://github.com/Adarsh-bhandari1/BillFlow)
