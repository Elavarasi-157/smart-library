const { getDatabase } = require('../config/database');
const { ROLES, RULES } = require('../config/constants');
const { logAudit } = require('../services/auditService');

function getDashboardMetrics(req, res) {
  try {
    const db = getDatabase();

    const userStats = db.query(`
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role
    `);
    const usersMap = {};
    userStats.forEach(u => { usersMap[u.role] = u.count; });

    const totalUsersCount = Object.values(usersMap).reduce((a, b) => a + b, 0);
    const totalBooks = db.get(`SELECT COUNT(*) as count FROM books`);
    const copyStats = db.query(`
      SELECT status, COUNT(*) as count 
      FROM book_copies 
      GROUP BY status
    `);
    const copyMap = {};
    copyStats.forEach(c => { copyMap[c.status] = c.count; });

    const activeLoans = db.get(`SELECT COUNT(*) as count FROM borrow_transactions WHERE status = 'ACTIVE'`);
    const overdueLoans = db.get(`SELECT COUNT(*) as count FROM borrow_transactions WHERE status = 'OVERDUE'`);
    const totalFines = db.get(`SELECT SUM(fine_amount) as total FROM fines WHERE status = 'UNPAID'`);
    const paidFines = db.get(`SELECT SUM(fine_amount) as total FROM fines WHERE status = 'PAID'`);
    
    const activeTickets = db.get(`SELECT COUNT(*) as count FROM tickets WHERE status IN ('OPEN', 'IN_PROGRESS', 'WAITING_FOR_STUDENT')`);
    const pendingBookRequests = db.get(`SELECT COUNT(*) as count FROM book_requests WHERE hod_status = 'APPROVED' AND admin_status = 'PENDING'`);
    const allPendingBookRequests = db.get(`SELECT COUNT(*) as count FROM book_requests WHERE admin_status = 'PENDING'`);
    const pendingResources = db.get(`SELECT COUNT(*) as count FROM academic_resources WHERE status = 'PENDING'`);
    const activeVisits = db.get(`SELECT COUNT(*) as count FROM library_visits WHERE status = 'ACTIVE'`);

    // Monthly circulation trends
    const monthlyBorrows = [
      { month: 'Jan', borrows: 120, returns: 110 },
      { month: 'Feb', borrows: 180, returns: 165 },
      { month: 'Mar', borrows: 240, returns: 220 },
      { month: 'Apr', borrows: 310, returns: 290 },
      { month: 'May', borrows: 280, returns: 275 },
      { month: 'Jun', borrows: 150, returns: 160 },
      { month: 'Jul', borrows: 210, returns: 195 },
      { month: 'Aug', borrows: 340, returns: 310 }
    ];

    // Department activity
    const deptActivity = db.query(`
      SELECT d.code as department, COUNT(t.id) as borrow_count
      FROM departments d
      JOIN users u ON d.id = u.department_id
      LEFT JOIN borrow_transactions t ON u.id = t.student_id
      GROUP BY d.code
      ORDER BY borrow_count DESC
    `);

    // Category distribution
    const categoryStats = db.query(`
      SELECT category, COUNT(id) as count 
      FROM books 
      GROUP BY category 
      ORDER BY count DESC
    `);

    const metricsData = {
      total_users: totalUsersCount,
      total_students: usersMap['STUDENT'] || 0,
      total_hods: usersMap['HOD'] || 0,
      total_librarians: usersMap['LIBRARIAN'] || 0,
      total_admins: usersMap['ADMIN'] || 0,
      total_titles: totalBooks ? totalBooks.count : 0,
      total_books: totalBooks ? totalBooks.count : 0,
      total_copies: Object.values(copyMap).reduce((a, b) => a + b, 0),
      available_copies: copyMap['AVAILABLE'] || 0,
      issued_copies: copyMap['ISSUED'] || 0,
      reserved_copies: copyMap['RESERVED'] || 0,
      missing_copies: copyMap['MISSING'] || 0,
      maintenance_copies: (copyMap['MAINTENANCE'] || 0) + (copyMap['DAMAGED'] || 0),
      active_loans: activeLoans ? activeLoans.count : 0,
      overdue_loans: overdueLoans ? overdueLoans.count : 0,
      total_fines_collected: paidFines && paidFines.total ? Number(paidFines.total) : 0,
      unpaid_fines_amount: totalFines && totalFines.total ? Number(totalFines.total) : 0,
      paid_fines_amount: paidFines && paidFines.total ? Number(paidFines.total) : 0,
      active_tickets: activeTickets ? activeTickets.count : 0,
      pending_book_requests: allPendingBookRequests ? allPendingBookRequests.count : 0,
      pending_procurements: pendingBookRequests ? pendingBookRequests.count : 0,
      pending_resources: pendingResources ? pendingResources.count : 0,
      current_crowd: activeVisits ? activeVisits.count : 0,
      library_capacity: RULES.DEFAULT_LIBRARY_CAPACITY
    };

    return res.json({
      success: true,
      ...metricsData,
      metrics: metricsData,
      charts: {
        monthlyBorrows,
        deptActivity,
        categoryStats
      }
    });
  } catch (err) {
    console.error('Get admin dashboard metrics error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch admin metrics.' });
  }
}

function getLibrarianMetrics(req, res) {
  try {
    const db = getDatabase();

    const todayIssues = db.get(`SELECT COUNT(*) as count FROM borrow_transactions WHERE DATE(borrowed_date) = DATE('now')`);
    const todayReturns = db.get(`SELECT COUNT(*) as count FROM borrow_transactions WHERE DATE(returned_date) = DATE('now')`);
    const overdueCount = db.get(`SELECT COUNT(*) as count FROM borrow_transactions WHERE status = 'OVERDUE'`);
    const missingCount = db.get(`SELECT COUNT(*) as count FROM book_copies WHERE status = 'MISSING'`);
    const reservationsCount = db.get(`SELECT COUNT(*) as count FROM reservations WHERE status = 'READY_FOR_PICKUP'`);
    const pendingTickets = db.get(`SELECT COUNT(*) as count FROM tickets WHERE status IN ('OPEN', 'IN_PROGRESS')`);
    const currentCrowd = db.get(`SELECT COUNT(*) as count FROM library_visits WHERE status = 'ACTIVE'`);

    const metricsData = {
      today_issues: todayIssues ? todayIssues.count : 0,
      today_returns: todayReturns ? todayReturns.count : 0,
      overdue_books: overdueCount ? overdueCount.count : 0,
      missing_books: missingCount ? missingCount.count : 0,
      ready_reservations: reservationsCount ? reservationsCount.count : 0,
      pending_tickets: pendingTickets ? pendingTickets.count : 0,
      current_crowd: currentCrowd ? currentCrowd.count : 0,
      library_capacity: RULES.DEFAULT_LIBRARY_CAPACITY
    };

    return res.json({
      success: true,
      ...metricsData,
      metrics: metricsData
    });
  } catch (err) {
    console.error('Get librarian metrics error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch librarian metrics.' });
  }
}

function getHodMetrics(req, res) {
  try {
    const hod = req.user;
    const db = getDatabase();

    const deptId = hod.department_id || 'DEPT_IT';

    const deptStudents = db.get(`SELECT COUNT(*) as count FROM users WHERE (department_id = ? OR ? IS NULL) AND role = 'STUDENT'`, [deptId, deptId]);
    const pendingBookRequests = db.get(`SELECT COUNT(*) as count FROM book_requests WHERE (department_id = ? OR department_id IS NULL) AND hod_status = 'PENDING'`, [deptId]);
    const approvedBookRequests = db.get(`SELECT COUNT(*) as count FROM book_requests WHERE (department_id = ? OR department_id IS NULL) AND hod_status = 'APPROVED'`, [deptId]);
    const deptResources = db.get(`SELECT COUNT(*) as count FROM academic_resources WHERE (department_id = ? OR department_id IS NULL)`, [deptId]);

    const activeBorrows = db.query(`
      SELECT t.*, b.title as book_title, u.name as student_name, u.institutional_id
      FROM borrow_transactions t
      JOIN books b ON t.book_id = b.id
      JOIN users u ON t.student_id = u.id
      WHERE (u.department_id = ? OR ? IS NULL) AND t.status IN ('ACTIVE', 'OVERDUE')
      ORDER BY t.due_date ASC
      LIMIT 10
    `, [deptId, deptId]);

    const metricsData = {
      department_students: deptStudents ? deptStudents.count : 0,
      pending_book_requests: pendingBookRequests ? pendingBookRequests.count : 0,
      approved_book_requests: approvedBookRequests ? approvedBookRequests.count : 0,
      pending_resources: 0,
      department_resources: deptResources ? deptResources.count : 0,
      department_active_loans: activeBorrows.length,
      active_department_loans: activeBorrows.length
    };

    return res.json({
      success: true,
      ...metricsData,
      metrics: metricsData,
      recentLoans: activeBorrows
    });
  } catch (err) {
    console.error('Get HOD metrics error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch HOD metrics.' });
  }
}

function getUsers(req, res) {
  try {
    const { role, department_id, status, search } = req.query;
    const db = getDatabase();

    let query = `
      SELECT u.id, u.institutional_id, u.name, u.email, u.role, u.department_id, u.year, u.semester, u.phone, u.account_status, u.created_at,
             d.name as department_name, d.code as department_code,
             COUNT(DISTINCT CASE WHEN t.status IN ('ACTIVE', 'OVERDUE') THEN t.id END) as borrowed_count,
             COALESCE(SUM(CASE WHEN f.status = 'UNPAID' THEN f.fine_amount ELSE 0 END), 0) as outstanding_fine
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN borrow_transactions t ON u.id = t.student_id
      LEFT JOIN fines f ON u.id = f.student_id
      WHERE 1=1
    `;
    const params = [];

    if (role) {
      query += ` AND u.role = ?`;
      params.push(role);
    }
    if (department_id) {
      query += ` AND u.department_id = ?`;
      params.push(department_id);
    }
    if (status) {
      query += ` AND u.account_status = ?`;
      params.push(status);
    }
    if (search) {
      query += ` AND (LOWER(u.name) LIKE LOWER(?) OR LOWER(u.email) LIKE LOWER(?) OR LOWER(u.institutional_id) LIKE LOWER(?))`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` GROUP BY u.id ORDER BY u.created_at DESC`;

    const users = db.query(query, params);
    return res.json({ success: true, count: users.length, users });
  } catch (err) {
    console.error('Get users error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch user directory.' });
  }
}

function updateUserStatus(req, res) {
  try {
    const admin = req.user;
    const { userId } = req.params;
    const { status, max_borrow_limit } = req.body;

    const db = getDatabase();
    const targetUser = db.get(`SELECT * FROM users WHERE id = ?`, [userId]);

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    db.run(`
      UPDATE users 
      SET account_status = COALESCE(?, account_status),
          max_borrow_limit = COALESCE(?, max_borrow_limit),
          updated_at = datetime('now')
      WHERE id = ?
    `, [status || null, max_borrow_limit ? Number(max_borrow_limit) : null, userId]);

    logAudit(admin.id, admin.name, admin.role, 'UPDATE_USER_STATUS', 'users', userId, `Updated user ${targetUser.email} status to ${status || targetUser.account_status}`, req);

    return res.json({
      success: true,
      message: `User ${targetUser.name} profile updated successfully.`
    });
  } catch (err) {
    console.error('Update user status error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update user status.' });
  }
}

function createBook(req, res) {
  try {
    const admin = req.user;
    const {
      isbn, title, author, publisher, edition, publication_year, category,
      department_id, description, keywords, cover_image, sample_preview_url,
      copies_count = 1, building, floor, rack, shelf
    } = req.body;

    if (!isbn || !title || !author || !category) {
      return res.status(400).json({ success: false, message: 'ISBN, Title, Author and Category are required.' });
    }

    const db = getDatabase();
    const bookId = `BK${Math.floor(1000 + Math.random() * 9000)}`;

    db.transaction(() => {
      db.run(`
        INSERT INTO books (
          id, isbn, title, author, publisher, edition, publication_year, category,
          department_id, description, keywords, cover_image, sample_preview_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        bookId, isbn.trim(), title.trim(), author.trim(), publisher || '', edition || '',
        publication_year ? Number(publication_year) : null, category, department_id || null,
        description || '', keywords || '', cover_image || '', sample_preview_url || ''
      ]);

      // Create physical copies
      const numCopies = Number(copies_count) || 1;
      for (let i = 1; i <= numCopies; i++) {
        const copyCode = `${title.split(' ').map(w => w[0]).join('').toUpperCase()}-${String(i).padStart(3, '0')}`;
        db.run(`
          INSERT INTO book_copies (id, book_id, condition, status, building, floor, rack, shelf, purchase_date)
          VALUES (?, ?, 'GOOD', 'AVAILABLE', ?, ?, ?, ?, DATE('now'))
        `, [
          copyCode, bookId,
          building || 'Main Library',
          floor || 'Floor 2',
          rack || 'Rack A1',
          shelf || 'Shelf 1'
        ]);
      }
    });

    logAudit(admin.id, admin.name, admin.role, 'CREATE_BOOK', 'books', bookId, `Added new book "${title}" with ${copies_count || 1} copies`, req);

    return res.status(201).json({
      success: true,
      message: `Book "${title}" added to library catalog with ${copies_count || 1} physical copies!`,
      bookId
    });
  } catch (err) {
    console.error('Create book error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create book record.' });
  }
}

function updateCopyLocation(req, res) {
  try {
    const staff = req.user;
    const { copyId } = req.params;
    const { building, floor, rack, shelf, status, condition } = req.body;

    const db = getDatabase();
    const copy = db.get(`SELECT c.*, b.title FROM book_copies c JOIN books b ON c.book_id = b.id WHERE c.id = ?`, [copyId]);

    if (!copy) {
      return res.status(404).json({ success: false, message: 'Book copy not found.' });
    }

    db.run(`
      UPDATE book_copies 
      SET building = COALESCE(?, building),
          floor = COALESCE(?, floor),
          rack = COALESCE(?, rack),
          shelf = COALESCE(?, shelf),
          status = COALESCE(?, status),
          condition = COALESCE(?, condition)
      WHERE id = ?
    `, [building || null, floor || null, rack || null, shelf || null, status || null, condition || null, copyId]);

    logAudit(staff.id, staff.name, staff.role, 'UPDATE_COPY_LOCATION', 'book_copies', copyId, `Updated location/status for ${copy.title} (Copy: ${copyId}) to ${rack || copy.rack}, ${shelf || copy.shelf}`, req);

    return res.json({
      success: true,
      message: `Copy "${copyId}" location and status updated successfully.`
    });
  } catch (err) {
    console.error('Update copy location error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update copy details.' });
  }
}

function getAuditLogs(req, res) {
  try {
    const { action, role, search, limit = 50 } = req.query;
    const db = getDatabase();

    let query = `SELECT * FROM audit_logs WHERE 1=1`;
    const params = [];

    if (action) {
      query += ` AND action LIKE ?`;
      params.push(`%${action}%`);
    }
    if (role) {
      query += ` AND actor_role = ?`;
      params.push(role);
    }
    if (search) {
      query += ` AND (LOWER(actor_name) LIKE LOWER(?) OR LOWER(details) LIKE LOWER(?) OR LOWER(action) LIKE LOWER(?))`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT ?`;
    params.push(Number(limit));

    const logs = db.query(query, params);
    return res.json({ success: true, count: logs.length, logs });
  } catch (err) {
    console.error('Get audit logs error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch audit logs.' });
  }
}

module.exports = {
  getDashboardMetrics,
  getLibrarianMetrics,
  getHodMetrics,
  getUsers,
  updateUserStatus,
  createBook,
  updateCopyLocation,
  getAuditLogs
};
