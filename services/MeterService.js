import pool from "../config/db.js";

class MeterService {
  static async record(tenantId, type, quantity, idempotencyKey) {
    const checkQuery = `
      WITH current_usage AS (
        SELECT COALESCE(SUM(ue.quantity), 0) as used
        FROM usage_events ue
        WHERE ue.tenant_id = $1 
          AND ue.type = $2
          AND DATE_TRUNC('month', ue.timestamp) = DATE_TRUNC('month', NOW())
      ),
      sub_check AS (
        SELECT s.status, p.limits->>$2 as limit_val
        FROM subscriptions s
        JOIN plans p ON s.plan_id = p.id
        WHERE s.tenant_id = $1 AND s.status = 'active'
        LIMIT 1
      )
      SELECT 
        sc.status,
        sc.limit_val::int as limit,
        cu.used,
        (sc.limit_val::int - cu.used) as remaining
      FROM sub_check sc, current_usage cu;
    `;

    const checkResult = await pool.query(checkQuery, [tenantId, type]);

    if (checkResult.rows.length === 0) {
      throw Object.assign(new Error("No active subscription found"), {
        statusCode: 402,
        code: "SUBSCRIPTION_REQUIRED",
      });
    }

    const { status, limit, used, remaining } = checkResult.rows[0];

    if (remaining < quantity) {
      throw Object.assign(
        new Error(
          `Quota exceeded. Used: ${used}/${limit}. Remaining: ${remaining}`,
        ),
        {
          statusCode: 402,
          code: "QUOTA_EXCEEDED",
          details: { used, limit, remaining, required: quantity },
        },
      );
    }

    const insertQuery = `
      INSERT INTO usage_events (tenant_id, type, quantity, idempotency_key)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (tenant_id, idempotency_key) 
      DO UPDATE SET quantity = usage_events.quantity
      RETURNING id, tenant_id, type, quantity, timestamp;
    `;

    const result = await pool.query(insertQuery, [
      tenantId,
      type,
      quantity,
      idempotencyKey,
    ]);

    return {
      ...result.rows[0],
      quota: { used: used + quantity, limit, remaining: remaining - quantity },
    };
  }

  static async getMonthlyUsage(tenantId) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const query = `
      SELECT type, SUM(quantity) as total_quantity
      FROM usage_events
      WHERE tenant_id = $1 AND timestamp >= $2
      GROUP BY type;
    `;

    const result = await pool.query(query, [tenantId, startOfMonth]);

    const usageMap = {};
    result.rows.forEach((row) => {
      usageMap[row.type] = Number(row.total_quantity);
    });

    return usageMap;
  }
}

export default MeterService;
