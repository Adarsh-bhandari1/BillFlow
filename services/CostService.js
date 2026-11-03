import pool from "../config/db.js";

class CostService {
  static async calculateCost(tenantId) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const planQuery = `
      SELECT p.input_token_price, p.cached_input_token_price, 
             p.output_token_price, p.reasoning_token_price,
             p.monthly_price_cents
      FROM subscriptions s
      JOIN plans p ON s.plan_id = p.id
      WHERE s.tenant_id = $1 AND s.status = 'active'
      LIMIT 1;
    `;

    const planResult = await pool.query(planQuery, [tenantId]);
    if (!planResult.rows.length) return null;

    const plan = planResult.rows[0];

    const usageQuery = `
      SELECT type, quantity
      FROM usage_events
      WHERE tenant_id = $1 AND timestamp >= $2
        AND type IN ('input_tokens', 'cached_input_tokens', 'output_tokens', 'reasoning_tokens');
    `;

    const usageResult = await pool.query(usageQuery, [tenantId, startOfMonth]);

    const usageMap = {};
    usageResult.rows.forEach((row) => {
      usageMap[row.type] = Number(row.quantity);
    });

    const inputMicroCents =
      (usageMap["input_tokens"] || 0) * plan.input_token_price;
    const cachedInputMicroCents =
      (usageMap["cached_input_tokens"] || 0) * plan.cached_input_token_price;
    const outputMicroCents =
      (usageMap["output_tokens"] || 0) * plan.output_token_price;
    const reasoningMicroCents =
      (usageMap["reasoning_tokens"] || 0) * plan.reasoning_token_price;

    const totalMicroCents =
      inputMicroCents +
      cachedInputMicroCents +
      outputMicroCents +
      reasoningMicroCents;

    const totalTokenCostCents = Math.floor(totalMicroCents / 100000);

    return {
      baseSubscriptionCents: plan.monthly_price_cents,
      tokenUsageCents: totalTokenCostCents,
      totalCents: plan.monthly_price_cents + totalTokenCostCents,
      breakdown: {
        inputTokens: usageMap["input_tokens"] || 0,
        cachedInputTokens: usageMap["cached_input_tokens"] || 0,
        outputTokens: usageMap["output_tokens"] || 0,
        reasoningTokens: usageMap["reasoning_tokens"] || 0,
      },
    };
  }
}

export default CostService;
