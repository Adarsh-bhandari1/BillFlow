import express from "express";
import stripe from "../config/stripe.js";
import pool from "../config/db.js";

const router = express.Router();

router.post("/stripe", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const existing = await pool.query(
    "SELECT id FROM processed_stripe_events WHERE stripe_event_id = $1",
    [event.id],
  );

  if (existing.rows.length > 0) {
    console.log(`Duplicate event ignored: ${event.id}`);
    return res.json({ received: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        await handleCheckoutCompleted(session);
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        await handleSubscriptionChange(subscription);
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    await pool.query(
      "INSERT INTO processed_stripe_events (stripe_event_id) VALUES ($1)",
      [event.id],
    );

    res.json({ received: true });
  } catch (err) {
    console.error("Webhook processing error:", err);
    res.status(500).json({ error: "Processing failed" });
  }
});
async function handleCheckoutCompleted(session) {
  const { customer, metadata } = session;
  const tenantId = metadata?.tenant_id;
  if (!tenantId) {
    console.warn(
      ` Skipping checkout.session.completed: Missing tenant_id metadata (Event: ${session.id})`,
    );
    return;
  }

  await pool.query(`UPDATE tenants SET stripe_customer_id = $1 WHERE id = $2`, [
    customer,
    tenantId,
  ]);

  const planResult = await pool.query(
    "SELECT id FROM plans WHERE name = 'Pro' LIMIT 1",
  );
  if (!planResult.rows.length) throw new Error("Pro plan not found");

  await pool.query(
    `INSERT INTO subscriptions (tenant_id, plan_id, status, current_period_end, stripe_subscription_id)
     VALUES ($1, $2, 'active', NOW() + INTERVAL '30 days', $3)
     ON CONFLICT DO NOTHING`,
    [tenantId, planResult.rows[0].id, session.subscription],
  );
}

async function handleSubscriptionChange(subscription) {
  const statusMap = {
    active: "active",
    past_due: "past_due",
    canceled: "canceled",
    unpaid: "past_due",
  };

  await pool.query(
    `UPDATE subscriptions 
     SET status = $1, current_period_end = to_timestamp($2)
     WHERE stripe_subscription_id = $3`,
    [
      statusMap[subscription.status] || subscription.status,
      subscription.current_period_end,
      subscription.id,
    ],
  );
}

export default router;
