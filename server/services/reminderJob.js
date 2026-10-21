const { getDatabase } = require('../config/database');
const { RULES, REMINDER_TYPES } = require('../config/constants');

function processDueRemindersAndFines() {
  const db = getDatabase();
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  console.log(`[Job] Running automated library background check at ${now.toISOString()}`);

  const activeLoans = db.query(`
    SELECT 
      t.id as transaction_id,
      t.book_id,
      t.copy_id,
      t.student_id,
      t.due_date,
      t.status,
      b.title as book_title,
      b.author as book_author,
      u.name as student_name,
      u.email as student_email,
      p.email_enabled
    FROM borrow_transactions t
    JOIN books b ON t.book_id = b.id
    JOIN users u ON t.student_id = u.id
    LEFT JOIN notification_preferences p ON u.id = p.student_id
    WHERE t.status IN ('ACTIVE', 'OVERDUE')
  `);

  let overdueCount = 0;
  let remindersSent = 0;

  activeLoans.forEach(loan => {
    const dueDate = new Date(loan.due_date);
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // 1. Check if OVERDUE
    if (diffTime < 0) {
      overdueCount++;
      const overdueDays = Math.max(1, Math.floor(Math.abs(diffTime) / (1000 * 60 * 60 * 24)));
      const fineAmount = overdueDays * RULES.FINE_PER_DAY; // strictly ₹1 per day

      // Update transaction status
      db.run(`UPDATE borrow_transactions SET status = 'OVERDUE' WHERE id = ?`, [loan.transaction_id]);

      // Check or insert fine record
      const existingFine = db.get(`SELECT id FROM fines WHERE transaction_id = ? AND status = 'UNPAID'`, [loan.transaction_id]);
      if (existingFine) {
        db.run(`
          UPDATE fines 
          SET overdue_days = ?, fine_amount = ?
          WHERE id = ?
        `, [overdueDays, fineAmount, existingFine.id]);
      } else {
        const fineId = `FINE_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        db.run(`
          INSERT INTO fines (id, transaction_id, student_id, book_id, overdue_days, fine_rate, fine_amount, reason, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'UNPAID')
        `, [fineId, loan.transaction_id, loan.student_id, loan.book_id, overdueDays, RULES.FINE_PER_DAY, fineAmount, `Overdue return by ${overdueDays} days`]);
      }

      // Check if overdue notification already logged today
      const alreadyLogged = db.get(`
        SELECT id FROM reminder_logs 
        WHERE transaction_id = ? AND reminder_type = ?
      `, [loan.transaction_id, REMINDER_TYPES.OVERDUE]);

      if (!alreadyLogged) {
        db.run(`
          INSERT INTO reminder_logs (id, transaction_id, student_id, reminder_type, recipient_email, sent_at)
          VALUES (?, ?, ?, ?, ?, datetime('now'))
        `, [`REM_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, loan.transaction_id, loan.student_id, REMINDER_TYPES.OVERDUE, loan.student_email]);

        db.run(`
          INSERT INTO in_app_notifications (id, user_id, title, message, type, link)
          VALUES (?, ?, ?, ?, 'URGENT', '/student/fines')
        `, [
          `NOTIF_OD_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          loan.student_id,
          'Book Overdue Notice',
          `"${loan.book_title}" is overdue by ${overdueDays} days. Current fine: ₹${fineAmount}. Please return immediately.`
        ]);
        remindersSent++;
      }
    } 
    // 2. Sequential Proactive Reminders
    else {
      let targetReminderType = null;
      let reminderTitle = '';
      let reminderMsg = '';

      if (diffDays === 2) {
        targetReminderType = REMINDER_TYPES.DUE_IN_2_DAYS;
        reminderTitle = 'Friendly Reminder: Book Due in 2 Days';
        reminderMsg = `"${loan.book_title}" by ${loan.book_author} is due in 2 days on ${loan.due_date.split('T')[0]}. Please renew or return to avoid fines.`;
      } else if (diffDays === 1) {
        targetReminderType = REMINDER_TYPES.DUE_IN_1_DAY;
        reminderTitle = 'Urgent Reminder: Book Due Tomorrow';
        reminderMsg = `"${loan.book_title}" is due tomorrow (${loan.due_date.split('T')[0]}). Renew your book now in "My Books".`;
      } else if (diffDays === 0) {
        targetReminderType = REMINDER_TYPES.DUE_TODAY;
        reminderTitle = 'Action Required: Book Due Today';
        reminderMsg = `Today is the due date for "${loan.book_title}". Please return it to the library or renew online.`;
      }

      if (targetReminderType) {
        const alreadySent = db.get(`
          SELECT id FROM reminder_logs 
          WHERE transaction_id = ? AND reminder_type = ?
        `, [loan.transaction_id, targetReminderType]);

        if (!alreadySent) {
          db.run(`
            INSERT INTO reminder_logs (id, transaction_id, student_id, reminder_type, recipient_email, sent_at)
            VALUES (?, ?, ?, ?, ?, datetime('now'))
          `, [`REM_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, loan.transaction_id, loan.student_id, targetReminderType, loan.student_email]);

          db.run(`
            INSERT INTO in_app_notifications (id, user_id, title, message, type, link)
            VALUES (?, ?, ?, ?, 'WARNING', '/student/my-books')
          `, [
            `NOTIF_DUE_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
            loan.student_id,
            reminderTitle,
            reminderMsg
          ]);
          remindersSent++;
        }
      }
    }
  });

  // 3. Process Expired Reservations
  const expiredReservations = db.query(`
    SELECT r.*, b.title as book_title
    FROM reservations r
    JOIN books b ON r.book_id = b.id
    WHERE r.status = 'READY_FOR_PICKUP' AND datetime(r.expires_at) < datetime('now')
  `);

  expiredReservations.forEach(res => {
    db.run(`UPDATE reservations SET status = 'EXPIRED' WHERE id = ?`, [res.id]);
    if (res.copy_id) {
      // Free copy status to AVAILABLE
      db.run(`UPDATE book_copies SET status = 'AVAILABLE' WHERE id = ?`, [res.copy_id]);
    }
  });

  console.log(`[Job] Finished check: ${activeLoans.length} loans inspected, ${overdueCount} overdue, ${remindersSent} new sequential reminders logged.`);
  return {
    inspectedLoans: activeLoans.length,
    overdueCount,
    remindersSent,
    expiredReservations: expiredReservations.length
  };
}

module.exports = {
  processDueRemindersAndFines
};
