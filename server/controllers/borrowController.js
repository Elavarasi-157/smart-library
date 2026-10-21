const { getDatabase } = require('../config/database');
const { RULES, BOOK_STATUS, BOOK_CONDITION } = require('../config/constants');
const { logAudit } = require('../services/auditService');

function getMyBorrowedBooks(req, res) {
  try {
    const studentId = req.user.id;
    const db = getDatabase();

    const loans = db.query(`
      SELECT 
        t.id as transaction_id,
        t.book_id,
        t.copy_id,
        t.borrowed_date,
        t.due_date,
        t.renewal_count,
        t.max_renewals,
        t.status,
        b.title,
        b.author,
        b.isbn,
        b.cover_image,
        c.building,
        c.floor,
        c.rack,
        c.shelf,
        f.fine_amount,
        f.overdue_days,
        f.status as fine_status
      FROM borrow_transactions t
      JOIN books b ON t.book_id = b.id
      JOIN book_copies c ON t.copy_id = c.id
      LEFT JOIN fines f ON t.id = f.transaction_id AND f.status = 'UNPAID'
      WHERE t.student_id = ? AND t.status IN ('ACTIVE', 'OVERDUE')
      ORDER BY t.due_date ASC
    `, [studentId]);

    const now = new Date();

    const processedLoans = loans.map(loan => {
      const dueDate = new Date(loan.due_date);
      const diffTime = dueDate.getTime() - now.getTime();
      const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let computedStatus = loan.status;
      let fineAmount = loan.fine_amount || 0;

      if (diffTime < 0) {
        computedStatus = 'OVERDUE';
        const overdueDays = Math.max(1, Math.floor(Math.abs(diffTime) / (1000 * 60 * 60 * 24)));
        fineAmount = overdueDays * RULES.FINE_PER_DAY; // ₹1 per day overdue
      } else if (remainingDays <= 2) {
        computedStatus = 'DUE_SOON';
      }

      // Check if renewable:
      // - Max renewals not reached
      // - No other student has reserved this book
      const isMaxRenewalsReached = loan.renewal_count >= loan.max_renewals;
      const reservationExists = db.get(`
        SELECT id FROM reservations 
        WHERE book_id = ? AND student_id != ? AND status IN ('PENDING', 'READY_FOR_PICKUP')
      `, [loan.book_id, studentId]);

      const isRenewable = !isMaxRenewalsReached && !reservationExists && computedStatus !== 'OVERDUE';

      return {
        ...loan,
        remaining_days: remainingDays,
        display_status: computedStatus,
        fine_amount: fineAmount,
        is_renewable: isRenewable,
        renewal_blocked_reason: isMaxRenewalsReached 
          ? `Maximum renewals limit (${loan.max_renewals}) reached.` 
          : (reservationExists ? 'Another student has reserved this book.' : (computedStatus === 'OVERDUE' ? 'Cannot renew overdue book with outstanding fines.' : null))
      };
    });

    return res.json({
      success: true,
      max_limit: RULES.MAX_BOOKS_PER_STUDENT, // 4 books
      currently_borrowed: processedLoans.length,
      loans: processedLoans
    });
  } catch (err) {
    console.error('Get my borrowed books error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch borrowed books.' });
  }
}

function renewBook(req, res) {
  try {
    const studentId = req.user.id;
    const { transactionId } = req.params;
    const db = getDatabase();

    const loan = db.get(`
      SELECT t.*, b.title as book_title
      FROM borrow_transactions t
      JOIN books b ON t.book_id = b.id
      WHERE t.id = ? AND t.student_id = ?
    `, [transactionId, studentId]);

    if (!loan) {
      return res.status(404).json({ success: false, message: 'Active borrowing transaction not found.' });
    }

    if (loan.status === 'RETURNED') {
      return res.status(400).json({ success: false, message: 'Book is already returned.' });
    }

    if (loan.renewal_count >= loan.max_renewals) {
      return res.status(400).json({
        success: false,
        message: `Renewal limit exceeded. You have already renewed this book ${loan.renewal_count} times (Maximum allowed: ${loan.max_renewals}).`
      });
    }

    // Check if another student has placed a reservation on this book
    const reservation = db.get(`
      SELECT id FROM reservations 
      WHERE book_id = ? AND student_id != ? AND status IN ('PENDING', 'READY_FOR_PICKUP')
    `, [loan.book_id, studentId]);

    if (reservation) {
      return res.status(400).json({
        success: false,
        message: 'Cannot renew: Another student is waiting on the reservation list for this book.'
      });
    }

    // Renewal criteria: new due date is +14 days from previous due date (or now, whichever is later)
    const currentDueDate = new Date(loan.due_date);
    const baseDate = currentDueDate.getTime() > Date.now() ? currentDueDate : new Date();
    const newDueDate = new Date(baseDate.getTime() + (RULES.RENEWAL_EXTENSION_DAYS * 24 * 60 * 60 * 1000)).toISOString();

    const renewalHistoryId = `RNW_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Update transaction and record renewal history in atomic transaction
    db.transaction(() => {
      db.run(`
        UPDATE borrow_transactions 
        SET due_date = ?, renewal_count = renewal_count + 1, status = 'ACTIVE'
        WHERE id = ?
      `, [newDueDate, loan.id]);

      db.run(`
        INSERT INTO renewal_history (id, transaction_id, book_id, student_id, previous_due_date, new_due_date, renewed_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `, [renewalHistoryId, loan.id, loan.book_id, studentId, loan.due_date, newDueDate]);

      db.run(`
        INSERT INTO in_app_notifications (id, user_id, title, message, type, link)
        VALUES (?, ?, ?, ?, 'SUCCESS', '/student/my-books')
      `, [
        `NOTIF_RNW_${Date.now()}`,
        studentId,
        'Book Successfully Renewed',
        `"${loan.book_title}" renewed! New due date: ${newDueDate.split('T')[0]} (+14 days extended).`
      ]);
    });

    logAudit(studentId, req.user.name, req.user.role, 'RENEW_BOOK', 'borrow_transactions', loan.id, `Renewed book ${loan.book_title} until ${newDueDate}`, req);

    return res.json({
      success: true,
      message: `Book successfully renewed! Your new return due date is ${newDueDate.split('T')[0]} (+14 days extension).`,
      new_due_date: newDueDate,
      renewals_remaining: loan.max_renewals - (loan.renewal_count + 1)
    });
  } catch (err) {
    console.error('Renew book error:', err);
    return res.status(500).json({ success: false, message: 'Failed to renew book.' });
  }
}

function getRenewalHistory(req, res) {
  try {
    const studentId = req.user.id;
    const db = getDatabase();

    const history = db.query(`
      SELECT 
        r.*,
        b.title as book_title,
        b.author as book_author,
        b.cover_image
      FROM renewal_history r
      JOIN books b ON r.book_id = b.id
      WHERE r.student_id = ?
      ORDER BY r.renewed_at DESC
    `, [studentId]);

    return res.json({ success: true, history });
  } catch (err) {
    console.error('Get renewal history error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch renewal history.' });
  }
}

// LIBRARIAN / ADMIN ISSUE BOOK
function issueBook(req, res) {
  try {
    const { studentIdentifier, copyId } = req.body;
    const librarianId = req.user.id;

    if (!studentIdentifier || !copyId) {
      return res.status(400).json({ success: false, message: 'Student ID/Email and Copy ID are required.' });
    }

    const db = getDatabase();

    // 1. Locate student
    const student = db.get(`
      SELECT * FROM users 
      WHERE (institutional_id = ? OR email = ? OR id = ?) AND role = 'STUDENT'
    `, [studentIdentifier.trim(), studentIdentifier.trim().toLowerCase(), studentIdentifier.trim()]);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student account not found.' });
    }

    // 2. Check student borrowing limit: STRICTLY MAX 4 BOOKS
    const activeCount = db.get(`
      SELECT COUNT(*) as count FROM borrow_transactions 
      WHERE student_id = ? AND status IN ('ACTIVE', 'OVERDUE')
    `, [student.id]);

    if (activeCount && activeCount.count >= RULES.MAX_BOOKS_PER_STUDENT) {
      return res.status(400).json({
        success: false,
        message: `Borrowing limit exceeded! Student already has ${activeCount.count} books currently borrowed (Strict Maximum Limit: ${RULES.MAX_BOOKS_PER_STUDENT} books).`
      });
    }

    // 3. Check student unpaid fines threshold
    const unpaidFine = db.get(`SELECT SUM(fine_amount) as total FROM fines WHERE student_id = ? AND status = 'UNPAID'`, [student.id]);
    if (unpaidFine && unpaidFine.total > 50) {
      return res.status(400).json({
        success: false,
        message: `Cannot issue book: Student has ₹${unpaidFine.total} in outstanding unpaid fines. Clear fines first.`
      });
    }

    // 4. Locate and verify physical copy
    const copy = db.get(`
      SELECT c.*, b.title as book_title, b.id as book_id
      FROM book_copies c
      JOIN books b ON c.book_id = b.id
      WHERE c.id = ?
    `, [copyId.trim()]);

    if (!copy) {
      return res.status(404).json({ success: false, message: `Book copy "${copyId}" not found in inventory.` });
    }

    if (copy.status !== 'AVAILABLE' && copy.status !== 'RESERVED') {
      return res.status(400).json({
        success: false,
        message: `Book copy "${copyId}" is not available for issue. Current status: ${copy.status}.`
      });
    }

    // If reserved, verify that it is reserved for this student
    if (copy.status === 'RESERVED') {
      const reservation = db.get(`
        SELECT id FROM reservations 
        WHERE copy_id = ? AND student_id = ? AND status = 'READY_FOR_PICKUP'
      `, [copy.id, student.id]);

      if (!reservation) {
        return res.status(400).json({
          success: false,
          message: `Book copy "${copyId}" is reserved for another student awaiting pickup.`
        });
      }
      // Fulfill reservation
      db.run(`UPDATE reservations SET status = 'FULFILLED' WHERE id = ?`, [reservation.id]);
    }

    // 5. Create transaction: Due Date = +14 days
    const now = new Date();
    const dueDate = new Date(now.getTime() + (RULES.STANDARD_BORROW_DAYS * 24 * 60 * 60 * 1000)).toISOString();
    const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    db.transaction(() => {
      db.run(`
        INSERT INTO borrow_transactions (id, book_id, copy_id, student_id, issued_by, borrowed_date, due_date, renewal_count, max_renewals, status)
        VALUES (?, ?, ?, ?, ?, datetime('now'), ?, 0, ?, 'ACTIVE')
      `, [transactionId, copy.book_id, copy.id, student.id, librarianId, dueDate, RULES.MAX_RENEWALS]);

      // Update copy status to ISSUED
      db.run(`UPDATE book_copies SET status = 'ISSUED' WHERE id = ?`, [copy.id]);

      // Increment book borrow_count
      db.run(`UPDATE books SET borrow_count = borrow_count + 1 WHERE id = ?`, [copy.book_id]);

      // Notify student
      db.run(`
        INSERT INTO in_app_notifications (id, user_id, title, message, type, link)
        VALUES (?, ?, ?, ?, 'INFO', '/student/my-books')
      `, [
        `NOTIF_ISSUE_${Date.now()}`,
        student.id,
        'Book Issued Successfully',
        `"${copy.book_title}" (Copy: ${copy.id}) has been issued to you. Due date is ${dueDate.split('T')[0]} (14-day standard period).`
      ]);
    });

    logAudit(librarianId, req.user.name, req.user.role, 'ISSUE_BOOK', 'borrow_transactions', transactionId, `Issued copy ${copy.id} (${copy.book_title}) to student ${student.name} (${student.institutional_id})`, req);

    return res.status(201).json({
      success: true,
      message: `Book "${copy.book_title}" (Copy ID: ${copy.id}) successfully issued to ${student.name}!`,
      transactionId,
      studentName: student.name,
      institutionalId: student.institutional_id,
      dueDate: dueDate.split('T')[0]
    });
  } catch (err) {
    console.error('Issue book error:', err);
    return res.status(500).json({ success: false, message: 'Failed to issue book.' });
  }
}

// LIBRARIAN / ADMIN RETURN BOOK
function returnBook(req, res) {
  try {
    const { copyId, returnedCondition = 'GOOD' } = req.body;
    const librarianId = req.user.id;

    if (!copyId) {
      return res.status(400).json({ success: false, message: 'Book copy ID is required.' });
    }

    const db = getDatabase();

    const activeTxn = db.get(`
      SELECT t.*, b.title as book_title, u.name as student_name, u.institutional_id, u.email as student_email
      FROM borrow_transactions t
      JOIN books b ON t.book_id = b.id
      JOIN users u ON t.student_id = u.id
      WHERE t.copy_id = ? AND t.status IN ('ACTIVE', 'OVERDUE')
    `, [copyId.trim()]);

    if (!activeTxn) {
      return res.status(404).json({ success: false, message: `No active borrowing transaction found for copy "${copyId}".` });
    }

    const now = new Date();
    const dueDate = new Date(activeTxn.due_date);
    const diffTime = now.getTime() - dueDate.getTime();
    let overdueDays = 0;
    let fineAmount = 0;

    if (diffTime > 0) {
      overdueDays = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
      fineAmount = overdueDays * RULES.FINE_PER_DAY; // strictly ₹1 per day
    }

    db.transaction(() => {
      // 1. Mark transaction returned
      db.run(`
        UPDATE borrow_transactions 
        SET status = 'RETURNED', returned_date = datetime('now'), returned_condition = ?, returned_to = ?
        WHERE id = ?
      `, [returnedCondition, librarianId, activeTxn.id]);

      // 2. If fine accrued, create or update fine record
      if (fineAmount > 0) {
        const fineId = `FINE_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        db.run(`
          INSERT OR REPLACE INTO fines (id, transaction_id, student_id, book_id, overdue_days, fine_rate, fine_amount, reason, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'UNPAID')
        `, [fineId, activeTxn.id, activeTxn.student_id, activeTxn.book_id, overdueDays, RULES.FINE_PER_DAY, fineAmount, `Overdue by ${overdueDays} days`]);
      }

      // 3. Check waiting list for this book
      const nextReservation = db.get(`
        SELECT * FROM reservations 
        WHERE book_id = ? AND status = 'PENDING' 
        ORDER BY queue_position ASC, reserved_at ASC 
        LIMIT 1
      `, [activeTxn.book_id]);

      if (nextReservation && returnedCondition === 'GOOD') {
        const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
        db.run(`
          UPDATE reservations 
          SET status = 'READY_FOR_PICKUP', copy_id = ?, notified_at = datetime('now'), expires_at = ?
          WHERE id = ?
        `, [copyId, expiresAt, nextReservation.id]);

        db.run(`UPDATE book_copies SET status = 'RESERVED' WHERE id = ?`, [copyId]);

        // Notify next student
        db.run(`
          INSERT INTO in_app_notifications (id, user_id, title, message, type, link)
          VALUES (?, ?, ?, ?, 'SUCCESS', '/student/reservations')
        `, [
          `NOTIF_RES_${Date.now()}`,
          nextReservation.student_id,
          'Reserved Book is Ready for Pickup!',
          `Good news! "${activeTxn.book_title}" has been returned and is reserved for you at the counter. Please collect within 48 hours.`
        ]);
      } else {
        // Mark copy status based on condition
        const newStatus = returnedCondition === 'DAMAGED' ? 'MAINTENANCE' : 'AVAILABLE';
        db.run(`UPDATE book_copies SET status = ?, condition = ? WHERE id = ?`, [newStatus, returnedCondition, copyId]);
      }

      // Notify returning student
      db.run(`
        INSERT INTO in_app_notifications (id, user_id, title, message, type, link)
        VALUES (?, ?, ?, ?, 'INFO', '/student/my-books')
      `, [
        `NOTIF_RET_${Date.now()}`,
        activeTxn.student_id,
        'Book Return Confirmed',
        `"${activeTxn.book_title}" (Copy: ${copyId}) successfully returned. ${fineAmount > 0 ? `Outstanding overdue fine: ₹${fineAmount}.` : 'No fines accrued.'}`
      ]);
    });

    logAudit(librarianId, req.user.name, req.user.role, 'RETURN_BOOK', 'borrow_transactions', activeTxn.id, `Processed return for copy ${copyId} from student ${activeTxn.student_name}. Fine: ₹${fineAmount}`, req);

    return res.json({
      success: true,
      message: `Book "${activeTxn.book_title}" returned successfully!`,
      studentName: activeTxn.student_name,
      overdueDays,
      fineAmount,
      copyCondition: returnedCondition
    });
  } catch (err) {
    console.error('Return book error:', err);
    return res.status(500).json({ success: false, message: 'Failed to process book return.' });
  }
}

module.exports = {
  getMyBorrowedBooks,
  renewBook,
  getRenewalHistory,
  issueBook,
  returnBook
};
