const { query } = require('../../config/db');
const calculator = require('./risk.calculator');
const rules = require('./risk.rules');
async function analyze(quotationId) { const quotes = await query('SELECT * FROM quotations WHERE id = ?', [quotationId]); if (!quotes[0]) throw new Error('Quotation not found'); const items = await query('SELECT * FROM quotation_items WHERE quotation_id = ?', [quotationId]); const result = calculator.calculate(quotes[0], items); const riskLevel = rules.level(result.score); await query('UPDATE quotations SET risk_score = ?, risk_level = ? WHERE id = ?', [result.score, riskLevel, quotationId]); if (riskLevel === 'HIGH' || riskLevel === 'CRITICAL') await query('INSERT INTO deal_health_events (quotation_id, event_type, severity, score, message) VALUES (?, \'HIGH_RISK\', ?, ?, ?)', [quotationId, riskLevel, result.score, `Risk score is ${result.score}`]); return { quotation_id: Number(quotationId), risk_score: result.score, risk_level: riskLevel, details: result };
}
async function get(quotationId) { const rows = await query('SELECT id, risk_score, risk_level, approval_required FROM quotations WHERE id = ?', [quotationId]); return rows[0] || null; }
module.exports = { analyze, get };
