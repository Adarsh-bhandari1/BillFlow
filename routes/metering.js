import express from 'express';
import MeterService from '../services/MeterService.js';
import QuotaService from '../services/QuotaService.js';

const router = express.Router();

router.post('/meter', async (req, res) => {
  const { tenant_id, type, quantity } = req.body;
  const idempotencyKey = req.headers['x-idempotency-key'];

  if (!tenant_id || !type || !quantity || !idempotencyKey) {
    return res.status(400).json({ 
      error: 'Missing required fields: tenant_id, type, quantity, x-idempotency-key header' 
    });
  }

  if (!['api_call', 'ai_tokens'].includes(type)) {
    return res.status(400).json({ 
      error: 'Invalid type. Must be api_call or ai_tokens' 
    });
  }

  try {
    const quotaCheck = await QuotaService.checkQuota(tenant_id, type, Number(quantity));
    
    if (!quotaCheck.allowed) {
      return res.status(quotaCheck.status).json({ error: quotaCheck.message });
    }

    const event = await MeterService.record(tenant_id, type, Number(quantity), idempotencyKey);
    res.status(201).json(event);

  } catch (err) {
    console.error('Metering error:', err);
    res.status(500).json({ error: 'Internal server error during metering' });
  }
});

router.get('/usage/:tenantId', async (req, res) => {
  try {
    const usage = await MeterService.getMonthlyUsage(req.params.tenantId);
    res.json(usage);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch usage rollup' });
  }
});

export default router;