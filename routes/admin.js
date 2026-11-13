import express from "express";
import pool from "../config/db.js";

const router = express.Router();

const requireAdminKey = (req, res, next) => {
  const key = req.headers["x-admin-key"];
  if (key !== process.env.ADMIN_API_KEY) {
    return res.status(403).json({ error: "Forbidden: Invalid admin key" });
  }
  next();
};

router.get("/tenants", requireAdminKey, async (req, res) => {
  try {
    const query = `
      SELECT 
        t.id, t.name, t.email,
        s.status as subscription_status,
        p.name as plan_name,
        COUNT(ue.id) as monthly_events
      FROM tenants t
      LEFT JOIN subscriptions s ON t.id = s.tenant_id AND s.status = 'active'
      LEFT JOIN plans p ON s.plan_id = p.id
      LEFT JOIN usage_events ue ON t.id = ue.tenant_id 
        AND DATE_TRUNC('month', ue.timestamp) = DATE_TRUNC('month', NOW())
      GROUP BY t.id, t.name, t.email, s.status, p.name
      ORDER BY monthly_events DESC;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("Admin tenants error:", err);
    res.status(500).json({ error: "Failed to fetch tenants" });
  }
});

router.get("/revenue", requireAdminKey, async (req, res) => {
  try {
    const query = `
      SELECT 
        SUM(p.price_cents) as total_mrr_cents,
        COUNT(s.id) as active_subscriptions
      FROM subscriptions s
      JOIN plans p ON s.plan_id = p.id
      WHERE s.status = 'active';
    `;
    const result = await pool.query(query);
    const row = result.rows[0];

    res.json({
      mrr: row.total_mrr_cents || 0,
      activeSubscriptions: row.active_subscriptions || 0,
      currency: "USD", // Assuming cents in USD
    });
  } catch (err) {
    console.error("Admin revenue error:", err);
    res.status(500).json({ error: "Failed to calculate revenue" });
  }
});

router.get("/usage-trends", requireAdminKey, async (req, res) => {
  try {
    const query = `
      SELECT 
        DATE(timestamp) as date,
        type,
        SUM(quantity) as total_quantity
      FROM usage_events
      WHERE timestamp >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(timestamp), type
      ORDER BY date ASC;
    `;
    const result = await pool.query(query);

    const trends = {};
    result.rows.forEach((row) => {
      if (!trends[row.date]) trends[row.date] = { date: row.date };
      trends[row.date][row.type] = Number(row.total_quantity);
    });

    res.json(Object.values(trends));
  } catch (err) {
    console.error("Admin trends error:", err);
    res.status(500).json({ error: "Failed to fetch usage trends" });
  }
});

export default router;
