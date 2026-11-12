import express from "express";
import MeterService from "../services/MeterService.js";
import QuotaService from "../services/QuotaService.js";
import CostService from "../services/CostService.js";
import pool from "../config/db.js";

const router = express.Router();

router.post("/meter", async (req, res) => {
  const { tenant_id, type, quantity } = req.body;
  const idempotencyKey = req.headers["x-idempotency-key"];

  if (!tenant_id || !type || !quantity || !idempotencyKey) {
    return res.status(400).json({
      error:
        "Missing required fields: tenant_id, type, quantity, x-idempotency-key header",
    });
  }

  if (!["api_call", "ai_tokens"].includes(type)) {
    return res.status(400).json({
      error: "Invalid type. Must be api_call or ai_tokens",
    });
  }

  try {
    const quotaCheck = await QuotaService.checkQuota(
      tenant_id,
      type,
      Number(quantity),
    );
    if (!quotaCheck.allowed) {
      return res.status(quotaCheck.status).json({ error: quotaCheck.message });
    }

    const event = await MeterService.record(
      tenant_id,
      type,
      Number(quantity),
      idempotencyKey,
    );
    res.status(201).json(event);
  } catch (err) {
    console.error("Metering error:", err);
    res.status(500).json({ error: "Internal server error during metering" });
  }
});

router.post("/meter/cost", async (req, res) => {
  const {
    tenant_id,
    input_tokens,
    cached_input_tokens,
    output_tokens,
    reasoning_tokens,
  } = req.body;
  const idempotencyKey = req.headers["x-idempotency-key"];

  if (!tenant_id || !idempotencyKey) {
    return res.status(400).json({
      error: "Missing required fields: tenant_id, x-idempotency-key header",
    });
  }

  try {
    const categories = [
      { type: "input_tokens", qty: input_tokens },
      { type: "cached_input_tokens", qty: cached_input_tokens },
      { type: "output_tokens", qty: output_tokens },
      { type: "reasoning_tokens", qty: reasoning_tokens },
    ];

    const results = [];
    for (const cat of categories) {
      if (cat.qty && Number(cat.qty) > 0) {
        const uniqueKey = `${idempotencyKey}_${cat.type}`;
        const event = await MeterService.record(
          tenant_id,
          cat.type,
          Number(cat.qty),
          uniqueKey,
        );
        results.push(event);
      }
    }

    const cost = await CostService.calculateCost(tenant_id);
    res.status(201).json({
      events: results,
      cost: cost || { totalCents: 0, breakdown: {} },
    });
  } catch (err) {
    console.error("Token metering error:", err);
    res
      .status(500)
      .json({ error: "Internal server error during token metering" });
  }
});

router.get("/usage/:tenantId", async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { range = "month" } = req.query; 
    const now = new Date();
    let startDate;
    switch (range) {
      case "day":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        const dayOfWeek = now.getDay();
        startDate = new Date(now);
        startDate.setDate(now.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default: 
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const usageQuery = `
      SELECT type, SUM(quantity) as total_quantity
      FROM usage_events
      WHERE tenant_id = $1 AND timestamp >= $2
      GROUP BY type;
    `;
    const usageResult = await pool.query(usageQuery, [tenantId, startDate]);

    const usageMap = {};
    usageResult.rows.forEach((row) => {
      usageMap[row.type] = Number(row.total_quantity);
    });

    const subQuery = `
      SELECT s.status, p.name as plan_name, p.limits
      FROM subscriptions s
      JOIN plans p ON s.plan_id = p.id
      WHERE s.tenant_id = $1 AND s.status = 'active'
      LIMIT 1;
    `;
    const subResult = await pool.query(subQuery, [tenantId]);

    const subscription =
      subResult.rows.length > 0
        ? {
            status: subResult.rows[0].status,
            planName: subResult.rows[0].plan_name,
            limits: subResult.rows[0].limits || {},
          }
        : null;

    const cost = await CostService.calculateCost(tenantId);

    res.json({
      tenantId,
      range,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      usage: usageMap,
      subscription,
      cost: cost || {
        baseSubscriptionCents: 0,
        tokenUsageCents: 0,
        totalCents: 0,
        breakdown: {},
      },
    });
  } catch (err) {
    console.error("Usage fetch error:", err);
    res.status(500).json({ error: "Failed to fetch usage and cost" });
  }
});

export default router;
