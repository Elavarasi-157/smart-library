const { getDatabase } = require('../config/database');
const { ROLES, REQUEST_STATUS } = require('../config/constants');
const { logAudit } = require('../services/auditService');

function createRequest(req, res) {
  try {
    const student = req.user;
    const { title, author, isbn, publisher, edition, department_id, semester, subject_id, reason, priority } = req.body;

    if (!title || !author || !reason) {
      return res.status(400).json({ success: false, message: 'Title, Author and Reason are required.' });
    }

    const deptId = department_id || student.department_id || 'DEPT_IT';
    const sem = semester ? Number(semester) : (student.semester || 4);

    const db = getDatabase();
    const requestId = `REQ_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    db.run(`
      INSERT INTO book_requests (
        id, student_id, title, author, isbn, publisher, edition, department_id, semester, subject_id,
        reason, priority, hod_status, admin_status, procurement_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', 'PENDING', 'PENDING')
    `, [
      requestId,
      student.id,
      title.trim(),
      author.trim(),
      isbn ? isbn.trim() : null,
      publisher ? publisher.trim() : null,
      edition ? edition.trim() : null,
      deptId,
      sem,
      subject_id || null,
      reason.trim(),
      priority || 'MEDIUM'
    ]);

    logAudit(student.id, student.name, student.role, 'CREATE_BOOK_REQUEST', 'book_requests', requestId, `Requested book procurement: "${title}" by ${author}`, req);

    return res.status(201).json({
      success: true,
      message: `Book procurement request for "${title}" submitted successfully! It has been routed to your Department HOD for academic review.`,
      requestId
    });
  } catch (err) {
    console.error('Create book request error:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit book request.' });
  }
}

function getMyRequests(req, res) {
  try {
    const studentId = req.user.id;
    const db = getDatabase();

    const requests = db.query(`
      SELECT 
        r.*,
        d.name as department_name,
        d.code as department_code,
        s.name as subject_name,
        hod.name as hod_name,
        adm.name as admin_name
      FROM book_requests r
      LEFT JOIN departments d ON r.department_id = d.id
      LEFT JOIN subjects s ON r.subject_id = s.id
      LEFT JOIN users hod ON r.hod_id = hod.id
      LEFT JOIN users adm ON r.admin_id = adm.id
      WHERE r.student_id = ?
      ORDER BY r.created_at DESC
    `, [studentId]);

    return res.json({ success: true, count: requests.length, requests });
  } catch (err) {
    console.error('Get my requests error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch book requests.' });
  }
}

// HOD VIEW (department requests)
function getHodRequests(req, res) {
  try {
    const hod = req.user;
    const db = getDatabase();

    let query = `
      SELECT 
        r.*,
        d.name as department_name,
        d.code as department_code,
        s.name as subject_name,
        u.name as student_name,
        u.institutional_id as student_id_code,
        u.email as student_email
      FROM book_requests r
      LEFT JOIN departments d ON r.department_id = d.id
      JOIN users u ON r.student_id = u.id
      LEFT JOIN subjects s ON r.subject_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (hod.department_id) {
      query += ` AND (r.department_id = ? OR r.department_id IS NULL)`;
      params.push(hod.department_id);
    }

    query += ` ORDER BY CASE WHEN r.hod_status = 'PENDING' THEN 0 ELSE 1 END, r.created_at DESC`;

    const requests = db.query(query, params);
    return res.json({ success: true, count: requests.length, requests });
  } catch (err) {
    console.error('Get HOD requests error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch department book requests.' });
  }
}

// HOD APPROVE / REJECT
function hodAction(req, res) {
  try {
    const hod = req.user;
    const { requestId } = req.params;
    const rawAction = req.body.action || req.body.status || 'APPROVE';
    const notes = req.body.notes || req.body.comments || '';

    const action = rawAction.toUpperCase().includes('APPROV') ? 'APPROVE' : (rawAction.toUpperCase().includes('REJECT') ? 'REJECT' : 'NEED_INFO');

    const db = getDatabase();
    const request = db.get(`SELECT * FROM book_requests WHERE id = ?`, [requestId]);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Book request not found.' });
    }

    const hodStatus = action === 'APPROVE' ? 'APPROVED' : (action === 'REJECT' ? 'REJECTED' : 'NEED_INFO');

    db.run(`
      UPDATE book_requests 
      SET hod_status = ?, hod_id = ?, hod_notes = ?, hod_action_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `, [hodStatus, hod.id, notes, requestId]);

    // Notify student
    db.run(`
      INSERT INTO in_app_notifications (id, user_id, title, message, type, link)
      VALUES (?, ?, ?, ?, ?, '/student/book-requests')
    `, [
      `NOTIF_HOD_${Date.now()}`,
      request.student_id,
      `Book Request ${hodStatus === 'APPROVED' ? 'Approved by HOD' : 'Update from HOD'}`,
      `HOD ${hod.name} has ${hodStatus === 'APPROVED' ? 'approved' : hodStatus.toLowerCase()} your request for "${request.title}". ${hodStatus === 'APPROVED' ? 'Now sent to Admin for final procurement approval.' : (notes ? `Note: ${notes}` : '')}`,
      hodStatus === 'APPROVED' ? 'SUCCESS' : 'WARNING'
    ]);

    logAudit(hod.id, hod.name, hod.role, `HOD_${hodStatus}_BOOK_REQUEST`, 'book_requests', requestId, `HOD ${hodStatus} request for "${request.title}". Notes: ${notes}`, req);

    return res.json({
      success: true,
      message: `Book request for "${request.title}" ${hodStatus.toLowerCase()} successfully by Department HOD.`,
      hod_status: hodStatus
    });
  } catch (err) {
    console.error('HOD action error:', err);
    return res.status(500).json({ success: false, message: 'Failed to process HOD action.' });
  }
}

// ADMIN VIEW (All requests that have been submitted/reviewed)
function getAdminRequests(req, res) {
  try {
    const db = getDatabase();

    const requests = db.query(`
      SELECT 
        r.*,
        d.name as department_name,
        d.code as department_code,
        s.name as subject_name,
        u.name as student_name,
        u.institutional_id as student_id_code,
        hod.name as hod_name,
        adm.name as admin_name
      FROM book_requests r
      LEFT JOIN departments d ON r.department_id = d.id
      JOIN users u ON r.student_id = u.id
      LEFT JOIN subjects s ON r.subject_id = s.id
      LEFT JOIN users hod ON r.hod_id = hod.id
      LEFT JOIN users adm ON r.admin_id = adm.id
      ORDER BY 
        CASE WHEN r.hod_status = 'APPROVED' AND r.admin_status = 'PENDING' THEN 0 
             WHEN r.admin_status = 'PENDING' THEN 1 
             ELSE 2 END,
        r.created_at DESC
    `);

    return res.json({ success: true, count: requests.length, requests });
  } catch (err) {
    console.error('Get admin requests error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch admin requests queue.' });
  }
}

// ADMIN APPROVE / REJECT & PROCURE
function adminAction(req, res) {
  try {
    const admin = req.user;
    const { requestId } = req.params;
    const rawAction = req.body.action || req.body.status || 'APPROVE';
    const notes = req.body.notes || req.body.comments || '';
    const createCopiesCount = Number(req.body.createCopiesCount || 3);
    const rack = req.body.rack || 'Rack A12';
    const shelf = req.body.shelf || 'Shelf 4';

    const action = rawAction.toUpperCase().includes('APPROV') ? 'APPROVE' : 'REJECT';

    const db = getDatabase();
    const request = db.get(`SELECT * FROM book_requests WHERE id = ?`, [requestId]);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Book request not found.' });
    }

    const adminStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    const procurementStatus = action === 'APPROVE' ? 'PROCURED' : 'CANCELLED';

    db.transaction(() => {
      db.run(`
        UPDATE book_requests 
        SET admin_status = ?, admin_id = ?, admin_notes = ?, admin_action_at = datetime('now'),
            procurement_status = ?, updated_at = datetime('now')
        WHERE id = ?
      `, [adminStatus, admin.id, notes, procurementStatus, requestId]);

      // If approved, create the book in the catalog so everyone can search and borrow it!
      if (adminStatus === 'APPROVED' && createCopiesCount > 0) {
        const existingBook = db.get(`SELECT id FROM books WHERE title = ? AND author = ?`, [request.title, request.author]);
        const bookId = existingBook ? existingBook.id : `BOOK_${Date.now()}`;

        if (!existingBook) {
          db.run(`
            INSERT INTO books (
              id, isbn, title, author, publisher, edition, category, department_id, semester,
              total_copies, available_copies, description, cover_image, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, 'Academic Textbook', ?, ?, ?, ?, ?, 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80', 1)
          `, [
            bookId,
            request.isbn || `978-MIT-${Math.floor(100000 + Math.random() * 900000)}`,
            request.title,
            request.author,
            request.publisher || 'MIT Press',
            request.edition || 'Latest Edition',
            request.department_id || 'DEPT_IT',
            request.semester || 4,
            createCopiesCount,
            createCopiesCount,
            request.reason || 'Procured through institutional academic book request pipeline.'
          ]);

          // Create physical copies with barcodes and location tracking
          for (let i = 1; i <= createCopiesCount; i++) {
            const copyId = `COPY_${bookId}_${i}`;
            const barcode = `BC-${Math.floor(1000000 + Math.random() * 9000000)}`;
            db.run(`
              INSERT INTO book_copies (id, book_id, barcode, copy_number, status, floor, rack, shelf)
              VALUES (?, ?, ?, ?, 'AVAILABLE', 'Floor 2', ?, ?)
            `, [copyId, bookId, barcode, i, rack, shelf]);
          }
        }
      }

      // Notify student
      db.run(`
        INSERT INTO in_app_notifications (id, user_id, title, message, type, link)
        VALUES (?, ?, ?, ?, ?, '/student/book-requests')
      `, [
        `NOTIF_ADM_${Date.now()}`,
        request.student_id,
        `Book Request ${adminStatus === 'APPROVED' ? 'Procured & Added to Library' : 'Rejected by Admin'}`,
        `Administration has ${adminStatus.toLowerCase()} "${request.title}". ${adminStatus === 'APPROVED' ? `Catalog has added ${createCopiesCount} physical copies ready at ${rack} > ${shelf}.` : (notes ? `Note: ${notes}` : '')}`,
        adminStatus === 'APPROVED' ? 'SUCCESS' : 'WARNING'
      ]);
    });

    logAudit(admin.id, admin.name, admin.role, `ADMIN_${adminStatus}_BOOK_REQUEST`, 'book_requests', requestId, `Admin ${adminStatus} request for "${request.title}". Notes: ${notes}`, req);

    return res.json({
      success: true,
      message: `Book request for "${request.title}" ${adminStatus.toLowerCase()} successfully${adminStatus === 'APPROVED' ? ` and ${createCopiesCount} physical copies registered into library catalog!` : '.'}`,
      admin_status: adminStatus,
      procurement_status: procurementStatus
    });
  } catch (err) {
    console.error('Admin action error:', err);
    return res.status(500).json({ success: false, message: 'Failed to process admin action.' });
  }
}

module.exports = {
  createRequest,
  getMyRequests,
  getHodRequests,
  hodAction,
  getAdminRequests,
  adminAction
};
