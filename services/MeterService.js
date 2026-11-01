
import pool from "../config/db.js";

class MeterService {
  static async record(tenantId, type, quantity, idempotencyKey) {
    const query = `
      INSERT INTO usage_events (tenant_id, type, quantity, idempotency_key)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (tenant_id, idempotency_key) 
      DO UPDATE SET quantity = usage_events.quantity
      RETURNING id, tenant_id, type, quantity, timestamp;
    `;

    const result = await pool.query(query, [
      tenantId,
      type,
      quantity,
      idempotencyKey,
    ]);
    return result.rows[0];
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
