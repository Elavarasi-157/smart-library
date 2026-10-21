const { getDatabase } = require('../config/database');

function getMyFines(req, res) {
  try {
    const studentId = req.user.id;
    const db = getDatabase();

    const fines = db.query(`
      SELECT 
        f.*,
        b.title as book_title,
        b.author as book_author,
        b.isbn,
        t.borrowed_date,
        t.due_date,
        t.returned_date
      FROM fines f
      JOIN books b ON f.book_id = b.id
      JOIN borrow_transactions t ON f.transaction_id = t.id
      WHERE f.student_id = ?
      ORDER BY CASE WHEN f.status = 'UNPAID' THEN 0 ELSE 1 END, f.created_at DESC
    `, [studentId]);

    const totalUnpaid = fines
      .filter(f => f.status === 'UNPAID')
      .reduce((sum, f) => sum + (Number(f.fine_amount) || 0), 0);

    const totalPaid = fines
      .filter(f => f.status === 'PAID')
      .reduce((sum, f) => sum + (Number(f.fine_amount) || 0), 0);

    return res.json({
      success: true,
      total_unpaid: totalUnpaid,
      total_paid: totalPaid,
      fines
    });
  } catch (err) {
    console.error('Get my fines error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch student fines.' });
  }
}

function getAllFines(req, res) {
  try {
    const db = getDatabase();
    const fines = db.query(`
      SELECT 
        f.*,
        b.title as book_title,
        u.name as student_name,
        u.institutional_id,
        d.code as department_code
      FROM fines f
      JOIN books b ON f.book_id = b.id
      JOIN users u ON f.student_id = u.id
      LEFT JOIN departments d ON u.department_id = d.id
      ORDER BY f.created_at DESC
    `);

    return res.json({ success: true, fines });
  } catch (err) {
    console.error('Get all fines error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch fine records.' });
  }
}

module.exports = {
  getMyFines,
  getAllFines
};
