const { createFinePaymentOrder, verifyAndProcessPayment } = require('../services/cashfreeService');
const { getDatabase } = require('../config/database');
const { logAudit } = require('../services/auditService');

async function createPaymentOrder(req, res) {
  try {
    const student = req.user;
    const { fineId } = req.body;

    if (!fineId) {
      return res.status(400).json({ success: false, message: 'Fine ID is required.' });
    }

    const db = getDatabase();
    const fine = db.get(`SELECT * FROM fines WHERE id = ? AND student_id = ?`, [fineId, student.id]);

    if (!fine) {
      return res.status(404).json({ success: false, message: 'Fine record not found.' });
    }

    if (fine.status === 'PAID') {
      return res.status(400).json({ success: false, message: 'This fine has already been paid.' });
    }

    const orderResult = await createFinePaymentOrder({
      fineId: fine.id,
      student,
      amount: fine.fine_amount
    });

    logAudit(student.id, student.name, student.role, 'CREATE_PAYMENT_ORDER', 'fines', fine.id, `Created Cashfree payment order ${orderResult.orderId} for ₹${fine.fine_amount}`, req);

    return res.json(orderResult);
  } catch (err) {
    console.error('Create payment order error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to initiate payment.' });
  }
}

async function verifyPayment(req, res) {
  try {
    const student = req.user;
    const { orderId, paymentId, paymentMethod, fineId } = req.body;

    const verificationResult = await verifyAndProcessPayment({
      orderId,
      paymentId,
      paymentMethod: paymentMethod || 'UPI',
      fineId,
      studentId: student.id
    });

    logAudit(student.id, student.name, student.role, 'PAYMENT_VERIFIED', 'fines', fineId || orderId, `Fine payment verified for ₹${verificationResult.receipt?.amount || ''}. Payment ID: ${verificationResult.receipt?.paymentId}`, req);

    return res.json(verificationResult);
  } catch (err) {
    console.error('Verify payment error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Payment verification failed.' });
  }
}

function getReceipt(req, res) {
  try {
    const { fineId } = req.params;
    const db = getDatabase();

    const fine = db.get(`
      SELECT 
        f.*,
        b.title as book_title,
        b.isbn,
        u.name as student_name,
        u.institutional_id,
        u.email as student_email,
        d.name as department_name
      FROM fines f
      JOIN books b ON f.book_id = b.id
      JOIN users u ON f.student_id = u.id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE f.id = ?
    `, [fineId]);

    if (!fine || fine.status !== 'PAID') {
      return res.status(404).json({ success: false, message: 'Paid receipt not found.' });
    }

    return res.json({
      success: true,
      receipt: {
        receiptNo: `REC-${fine.id.replace('FINE_', '')}`,
        fineId: fine.id,
        orderId: fine.cashfree_order_id,
        paymentId: fine.cashfree_payment_id || `CF_PAY_${fine.id}`,
        amount: fine.fine_amount,
        overdueDays: fine.overdue_days,
        bookTitle: fine.book_title,
        isbn: fine.isbn,
        studentName: fine.student_name,
        institutionalId: fine.institutional_id,
        department: fine.department_name,
        paidAt: fine.paid_at || fine.created_at,
        paymentMethod: fine.payment_method || 'UPI / NetBanking',
        status: 'PAID'
      }
    });
  } catch (err) {
    console.error('Get receipt error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve receipt.' });
  }
}

module.exports = {
  createPaymentOrder,
  verifyPayment,
  getReceipt
};
