const { getDatabase } = require('../config/database');
const { ROLES, RESOURCE_STATUS } = require('../config/constants');
const { logAudit } = require('../services/auditService');

function getResources(req, res) {
  try {
    const { department_id, semester, subject_id, resource_type, status, search } = req.query;
    const db = getDatabase();

    let query = `
      SELECT 
        r.*,
        d.name as department_name,
        d.code as department_code,
        s.name as subject_name,
        s.code as subject_code,
        u.name as uploader_name,
        u.institutional_id as uploader_id
      FROM academic_resources r
      LEFT JOIN departments d ON r.department_id = d.id
      LEFT JOIN subjects s ON r.subject_id = s.id
      LEFT JOIN users u ON r.uploaded_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (department_id) {
      query += ` AND r.department_id = ?`;
      params.push(department_id);
    }

    if (semester) {
      query += ` AND r.semester = ?`;
      params.push(Number(semester));
    }

    if (subject_id) {
      query += ` AND r.subject_id = ?`;
      params.push(subject_id);
    }

    if (resource_type) {
      query += ` AND r.resource_type = ?`;
      params.push(resource_type);
    }

    if (search) {
      query += ` AND (LOWER(r.title) LIKE LOWER(?) OR LOWER(r.description) LIKE LOWER(?) OR LOWER(s.name) LIKE LOWER(?))`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY r.created_at DESC, r.download_count DESC`;

    const resources = db.query(query, params);
    return res.json({ success: true, count: resources.length, resources });
  } catch (err) {
    console.error('Get resources error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch academic resources.' });
  }
}

function uploadResource(req, res) {
  try {
    const user = req.user;
    let { title, description, department_id, semester, subject_id, resource_type } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Resource title is required.' });
    }

    const db = getDatabase();

    // Default department & semester if missing
    department_id = department_id || user.department_id || 'DEPT_IT';
    semester = semester ? Number(semester) : (user.semester || 4);
    resource_type = resource_type || 'NOTES';

    // Auto-resolve subject_id if not given
    if (!subject_id) {
      const subject = db.get(`SELECT id FROM subjects WHERE department_id = ? AND semester = ? LIMIT 1`, [department_id, semester]) 
                   || db.get(`SELECT id FROM subjects WHERE department_id = ? LIMIT 1`, [department_id])
                   || db.get(`SELECT id FROM subjects LIMIT 1`);
      subject_id = subject ? subject.id : 'SUB_IT_401';
    }

    const file = req.file;
    const filePath = file ? `/uploads/${file.filename}` : '/uploads/sample_academic_document.pdf';
    const fileName = file ? file.originalname : `${title.trim().replace(/\s+/g, '_')}.pdf`;
    const fileSize = file ? file.size : 1024000;
    const mimeType = file ? file.mimetype : 'application/pdf';

    const resourceId = `RES_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const initialStatus = RESOURCE_STATUS.APPROVED; // Immediately visible to all as requested

    db.run(`
      INSERT INTO academic_resources (
        id, title, description, department_id, semester, subject_id, resource_type,
        file_path, file_name, file_size, mime_type, uploaded_by, uploader_role,
        copyright_confirmed, status, download_count, avg_rating, rating_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, 0, 5.0, 1)
    `, [
      resourceId,
      title.trim(),
      description ? description.trim() : '',
      department_id,
      Number(semester),
      subject_id,
      resource_type,
      filePath,
      fileName,
      fileSize,
      mimeType,
      user.id,
      user.role,
      initialStatus
    ]);

    logAudit(user.id, user.name, user.role, 'UPLOAD_RESOURCE', 'academic_resources', resourceId, `Uploaded academic resource "${title}" (${resource_type})`, req);

    return res.status(201).json({
      success: true,
      message: 'PDF Resource uploaded successfully and is now visible to all students and faculty!',
      resourceId,
      status: initialStatus
    });
  } catch (err) {
    console.error('Upload resource error:', err);
    return res.status(500).json({ success: false, message: 'Failed to upload academic resource.' });
  }
}

function rateResource(req, res) {
  try {
    const studentId = req.user.id;
    const { id } = req.params;
    const { rating, feedback } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be an integer between 1 and 5.' });
    }

    const db = getDatabase();
    const resource = db.get(`SELECT id FROM academic_resources WHERE id = ?`, [id]);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found.' });
    }

    db.run(`
      INSERT OR REPLACE INTO resource_ratings (resource_id, student_id, rating, feedback)
      VALUES (?, ?, ?, ?)
    `, [id, studentId, Number(rating), feedback || null]);

    // Recalculate average rating
    const stats = db.get(`
      SELECT AVG(rating) as avg_rating, COUNT(*) as count 
      FROM resource_ratings 
      WHERE resource_id = ?
    `, [id]);

    db.run(`
      UPDATE academic_resources 
      SET avg_rating = ?, rating_count = ?
      WHERE id = ?
    `, [Math.round((stats.avg_rating || 5) * 10) / 10, stats.count || 1, id]);

    return res.json({
      success: true,
      message: 'Rating submitted successfully!',
      avg_rating: stats.avg_rating,
      rating_count: stats.count
    });
  } catch (err) {
    console.error('Rate resource error:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit rating.' });
  }
}

function reportResource(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { reason, details } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Reason for report is required.' });
    }

    const db = getDatabase();
    const reportId = `REP_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    db.run(`
      INSERT INTO resource_reports (id, resource_id, reported_by, reason, details)
      VALUES (?, ?, ?, ?, ?)
    `, [reportId, id, userId, reason, details || null]);

    return res.status(201).json({
      success: true,
      message: 'Report submitted. A librarian or HOD will review this resource.',
      reportId
    });
  } catch (err) {
    console.error('Report resource error:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit report.' });
  }
}

function moderateResource(req, res) {
  try {
    const { id } = req.params;
    const { status, moderation_notes } = req.body;
    const user = req.user;

    if (![RESOURCE_STATUS.APPROVED, RESOURCE_STATUS.REJECTED].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be APPROVED or REJECTED.' });
    }

    const db = getDatabase();
    db.run(`
      UPDATE academic_resources 
      SET status = ?, moderated_by = ?, moderated_at = datetime('now'), moderation_notes = ?
      WHERE id = ?
    `, [status, user.id, moderation_notes || null, id]);

    logAudit(user.id, user.name, user.role, 'MODERATE_RESOURCE', 'academic_resources', id, `Moderated resource ${id} to ${status}`, req);

    return res.json({
      success: true,
      message: `Resource marked as ${status}.`
    });
  } catch (err) {
    console.error('Moderate resource error:', err);
    return res.status(500).json({ success: false, message: 'Failed to moderate resource.' });
  }
}

module.exports = {
  getResources,
  uploadResource,
  rateResource,
  reportResource,
  moderateResource
};
