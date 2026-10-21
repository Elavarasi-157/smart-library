const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDatabase } = require('../config/database');
const { JWT_SECRET } = require('../middleware/authMiddleware');
const { ROLES } = require('../config/constants');
const { logAudit } = require('../services/auditService');

async function register(req, res) {
  try {
    let { institutional_id, name, email, password, phone, role, department_id, department_code, year, semester } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Full Name, Email, and Password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const assignedRole = role && ['STUDENT', 'LIBRARIAN', 'HOD'].includes(role.toUpperCase()) 
      ? role.toUpperCase() 
      : ROLES.STUDENT;

    // Block Admin registration through public API
    if (assignedRole === ROLES.ADMIN) {
      return res.status(403).json({ success: false, message: 'Admin accounts cannot be registered publicly.' });
    }

    const db = getDatabase();

    // Check if email already registered
    const existingEmail = db.get(`SELECT id FROM users WHERE LOWER(email) = ?`, [cleanEmail]);
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'An account with this email address already exists. Please log in.' });
    }

    // Auto-generate institutional ID if not provided
    if (!institutional_id || !institutional_id.trim()) {
      const prefix = assignedRole === ROLES.HOD ? 'HOD' : (assignedRole === ROLES.LIBRARIAN ? 'LIB' : 'STU');
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      institutional_id = `${prefix}${new Date().getFullYear()}${randomNum}`;
    } else {
      institutional_id = institutional_id.trim().toUpperCase();
      const existingId = db.get(`SELECT id FROM users WHERE institutional_id = ?`, [institutional_id]);
      if (existingId) {
        return res.status(400).json({ success: false, message: 'An account with this Institutional ID already exists.' });
      }
    }

    // Resolve department
    let resolvedDeptId = department_id || null;
    let resolvedDeptCode = department_code || null;

    if (!resolvedDeptId && resolvedDeptCode) {
      const d = db.get(`SELECT id, code FROM departments WHERE code = ?`, [resolvedDeptCode]);
      if (d) { resolvedDeptId = d.id; resolvedDeptCode = d.code; }
    } else if (resolvedDeptId) {
      const d = db.get(`SELECT id, code FROM departments WHERE id = ?`, [resolvedDeptId]);
      if (d) { resolvedDeptCode = d.code; }
    } else {
      // Default to IT
      resolvedDeptId = 'DEPT_IT';
      resolvedDeptCode = 'IT';
    }

    // Register into authorized_identities for record keeping
    db.run(`
      INSERT OR REPLACE INTO authorized_identities (institutional_id, name, email, role, department_code, year, semester, is_registered)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `, [
      institutional_id,
      cleanName,
      cleanEmail,
      assignedRole,
      resolvedDeptCode,
      assignedRole === ROLES.STUDENT ? (year || 2) : null,
      assignedRole === ROLES.STUDENT ? (semester || 4) : null
    ]);

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = `USR_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    db.run(`
      INSERT INTO users (id, institutional_id, name, email, password_hash, role, department_id, year, semester, phone, account_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
    `, [
      userId,
      institutional_id,
      cleanName,
      cleanEmail,
      passwordHash,
      assignedRole,
      resolvedDeptId,
      assignedRole === ROLES.STUDENT ? (year || 2) : null,
      assignedRole === ROLES.STUDENT ? (semester || 4) : null,
      phone ? phone.trim() : null
    ]);

    // Create notification preferences for students
    if (assignedRole === ROLES.STUDENT) {
      db.run(`INSERT OR REPLACE INTO notification_preferences (student_id) VALUES (?)`, [userId]);
    }

    // Log audit
    logAudit(userId, cleanName, assignedRole, 'USER_REGISTERED', 'users', userId, `Registered ${assignedRole} account ${institutional_id}`, req);

    const token = jwt.sign(
      { id: userId, institutional_id, role: assignedRole, name: cleanName, email: cleanEmail },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const fullUser = db.get(`
      SELECT u.id, u.institutional_id, u.name, u.email, u.role, u.department_id, u.year, u.semester, u.phone, u.account_status,
             d.name as department_name, d.code as department_code
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = ?
    `, [userId]);

    if (fullUser && fullUser.role === ROLES.STUDENT) {
      fullUser.currently_borrowed_count = 0;
      fullUser.outstanding_fine = 0;
      fullUser.active_reservations_count = 0;
    }

    return res.status(201).json({
      success: true,
      message: `Registration successful! Welcome to MIT Library, ${cleanName}.`,
      token,
      user: fullUser
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, message: 'Server error during registration. Please try again.' });
  }
}

async function login(req, res) {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Email / Institutional ID and password are required.' });
    }

    const db = getDatabase();
    const cleanId = identifier.trim();

    const user = db.get(`
      SELECT u.*, d.name as department_name, d.code as department_code
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE LOWER(u.email) = LOWER(?) OR UPPER(u.institutional_id) = UPPER(?)
    `, [cleanId, cleanId]);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. No user found with this Email or ID.' });
    }

    if (user.account_status !== 'ACTIVE') {
      return res.status(403).json({ success: false, message: 'Your account is deactivated. Please contact the administrator.' });
    }

    // Password comparison (allowing admin/admin login as requested)
    let isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch && user.role === ROLES.ADMIN && (password === 'admin' || password === 'Password@123')) {
      isMatch = true;
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Incorrect password.' });
    }

    const token = jwt.sign(
      { id: user.id, institutional_id: user.institutional_id, role: user.role, name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    logAudit(user.id, user.name, user.role, 'USER_LOGIN', 'users', user.id, 'User logged into Smart Library', req);

    // Compute live stats for student
    let borrowCount = 0;
    let totalFines = 0;
    let reservedCount = 0;

    if (user.role === ROLES.STUDENT) {
      const bRes = db.get(`SELECT COUNT(*) as count FROM borrow_transactions WHERE student_id = ? AND status IN ('ACTIVE', 'OVERDUE')`, [user.id]);
      const fRes = db.get(`SELECT SUM(fine_amount) as total FROM fines WHERE student_id = ? AND status = 'UNPAID'`, [user.id]);
      const rRes = db.get(`SELECT COUNT(*) as count FROM reservations WHERE student_id = ? AND status IN ('PENDING', 'READY_FOR_PICKUP')`, [user.id]);

      borrowCount = bRes ? (bRes.count || 0) : 0;
      totalFines = fRes ? (fRes.total || 0) : 0;
      reservedCount = rRes ? (rRes.count || 0) : 0;
    }

    return res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        id: user.id,
        institutional_id: user.institutional_id,
        name: user.name,
        email: user.email,
        role: user.role,
        department_id: user.department_id,
        department_name: user.department_name,
        department_code: user.department_code,
        year: user.year,
        semester: user.semester,
        phone: user.phone,
        currently_borrowed_count: borrowCount,
        outstanding_fine: totalFines,
        active_reservations_count: reservedCount
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error during login. Please try again.' });
  }
}

function getMe(req, res) {
  const db = getDatabase();
  const user = db.get(`
    SELECT u.id, u.institutional_id, u.name, u.email, u.role, u.department_id, u.year, u.semester, u.phone, u.account_status,
           d.name as department_name, d.code as department_code
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE u.id = ?
  `, [req.user.id]);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  // Attach live borrowing & fines
  if (user.role === ROLES.STUDENT) {
    const borrowCount = db.get(`SELECT COUNT(*) as count FROM borrow_transactions WHERE student_id = ? AND status IN ('ACTIVE', 'OVERDUE')`, [user.id]);
    const totalFines = db.get(`SELECT SUM(fine_amount) as total FROM fines WHERE student_id = ? AND status = 'UNPAID'`, [user.id]);
    const reservedCount = db.get(`SELECT COUNT(*) as count FROM reservations WHERE student_id = ? AND status IN ('PENDING', 'READY_FOR_PICKUP')`, [user.id]);

    user.currently_borrowed_count = borrowCount ? (borrowCount.count || 0) : 0;
    user.outstanding_fine = totalFines ? (totalFines.total || 0) : 0;
    user.active_reservations_count = reservedCount ? (reservedCount.count || 0) : 0;
  }

  return res.json({
    success: true,
    user
  });
}

// Quick Switcher for Demo
async function demoSwitch(req, res) {
  try {
    const { role } = req.body;
    const db = getDatabase();

    let targetEmail = 'karthik.r@mit.edu';
    if (role === ROLES.LIBRARIAN) targetEmail = 'librarian@mit.edu';
    else if (role === ROLES.HOD) targetEmail = 'hod.it@mit.edu';
    else if (role === ROLES.ADMIN) targetEmail = 'admin@mit.edu';

    const user = db.get(`
      SELECT u.*, d.name as department_name, d.code as department_code
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE LOWER(u.email) = LOWER(?)
    `, [targetEmail]);

    if (!user) {
      return res.status(404).json({ success: false, message: `Demo user for role ${role} not found in database.` });
    }

    const token = jwt.sign(
      { id: user.id, institutional_id: user.institutional_id, role: user.role, name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    if (user.role === ROLES.STUDENT) {
      const borrowCount = db.get(`SELECT COUNT(*) as count FROM borrow_transactions WHERE student_id = ? AND status IN ('ACTIVE', 'OVERDUE')`, [user.id]);
      const totalFines = db.get(`SELECT SUM(fine_amount) as total FROM fines WHERE student_id = ? AND status = 'UNPAID'`, [user.id]);
      const reservedCount = db.get(`SELECT COUNT(*) as count FROM reservations WHERE student_id = ? AND status IN ('PENDING', 'READY_FOR_PICKUP')`, [user.id]);

      user.currently_borrowed_count = borrowCount ? (borrowCount.count || 0) : 0;
      user.outstanding_fine = totalFines ? (totalFines.total || 0) : 0;
      user.active_reservations_count = reservedCount ? (reservedCount.count || 0) : 0;
    }

    return res.json({
      success: true,
      message: `Switched perspective to ${user.name} (${user.role})`,
      token,
      user
    });
  } catch (err) {
    console.error('Demo switch error:', err);
    return res.status(500).json({ success: false, message: 'Failed to switch demo perspective.' });
  }
}

function getDemoAccounts(req, res) {
  return res.json({
    success: true,
    accounts: [
      { role: 'STUDENT', email: 'karthik.r@mit.edu', label: 'Student (Karthik R - IT 2nd Year)' },
      { role: 'LIBRARIAN', email: 'librarian@mit.edu', label: 'Librarian (Meera Nair)' },
      { role: 'HOD', email: 'hod.it@mit.edu', label: 'IT HOD (Dr. Ramesh Chandra)' },
      { role: 'ADMIN', email: 'admin@mit.edu', label: 'Admin (Dr. Arvind Swaminathan)' }
    ]
  });
}

module.exports = {
  register,
  login,
  getMe,
  demoSwitch,
  getDemoAccounts
};
