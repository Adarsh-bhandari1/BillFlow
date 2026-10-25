# BillFlow - Usage Metering & Billing Engine

A backend service that answers the three critical questions every SaaS needs:
1. How much has this customer used?
2. How much should they pay?
3. Have they reached their plan limits?

Built with Node.js, Express, PostgreSQL, and Stripe (Test Mode).

## 🚀 Features
- **Idempotent Metering:** Ensures usage events are recorded exactly once, even under network retries.
- **Quota Enforcement:** Real-time checks against Free and Pro plan limits with clear 429/402 responses.
- **AI Token Pricing:** Correctly calculates costs for input, cached input, output, and reasoning tokens.
- **Stripe Integration:** Handles subscription upgrades and webhook verification in test mode.

## 🛠️ Tech Stack
- **Runtime:** Node.js (Express 5)
- **Database:** PostgreSQL (via Docker)
- **Payments:** Stripe (Test Mode + CLI)
- **Tools:** Git, Postman, VS Code

## 📂 Project Structure
- `routes/`: API endpoints (`/meter`, `/usage`, `/webhooks`)
- `services/`: Core logic for metering, quotas, and cost calculation
- `config/`: Database and Stripe SDK setup
- `sql/`: Schema definitions and seed data

## ⚙️ Setup & Run

### Prerequisites
- Node.js (v18+)
- Docker & Docker Compose

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/[your-username]/flyrank-capstone-billflow.git
   cd flyrank-capstone-billflow