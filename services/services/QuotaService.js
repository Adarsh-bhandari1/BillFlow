import pool from '../config/db.js';
import MeterService from './MeterService.js';

class QuotaService {
  static async checkQuota(tenantId, type, requestedQuantity) {
    const subQuery = `
      SELECT p.api_call_limit, p.token_limit
      FROM subscriptions s
      JOIN plans p ON s.plan_id = p.id
      WHERE s.tenant_id = $1 AND s.status = 'active'
      LIMIT 1;
    `;
    
    const subResult = await pool.query(subQuery, [tenantId]);
    if (!subResult.rows.length) {
      return { allowed: false, status: 402, message: 'No active subscription found' };
    }
    
    const plan = subResult.rows[0];
    const limit = type === 'api_call' ? plan.api_call_limit : plan.token_limit;
    
    const currentUsage = await MeterService.getMonthlyUsage(tenantId);
    const used = currentUsage[type] || 0;
    
    if (used + requestedQuantity > limit) {
      return {
        allowed: false,
        status: 429,
        message: `Quota exceeded. Used ${used}/${limit} ${type}s this month.`
      };
    }
    
    return { allowed: true, used, limit };
  }
}

export default QuotaService;