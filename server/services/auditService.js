const { getDatabase } = require('../config/database');

function logAudit(actorId, actorName, actorRole, action, entityType, entityId = null, details = null, req = null) {
  try {
    const db = getDatabase();
    const id = `LOG_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const ip = req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1') : '127.0.0.1';
    const detailStr = typeof details === 'object' ? JSON.stringify(details) : (details || '');

    db.run(`
      INSERT INTO audit_logs (id, actor_id, actor_name, actor_role, action, entity_type, entity_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, actorId, actorName, actorRole, action, entityType, entityId, detailStr, ip]);
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}

module.exports = {
  logAudit
};
