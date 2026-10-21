const { getDatabase } = require('../config/database');
const { searchBooks, getBookDetails } = require('../services/searchService');
const { logAudit } = require('../services/auditService');

function search(req, res) {
  try {
    const {
      q,
      department_id,
      semester,
      subject_id,
      category,
      author,
      availability,
      min_rating,
      page,
      limit
    } = req.query;

    const results = searchBooks({
      query: q || '',
      department_id,
      semester,
      subject_id,
      category,
      author,
      availability: availability || 'ALL',
      min_rating: Number(min_rating) || 0,
      page: Number(page) || 1,
      limit: Number(limit) || 20
    });

    return res.json(results);
  } catch (err) {
    console.error('Book search error:', err);
    return res.status(500).json({ success: false, message: 'Failed to search books catalog.' });
  }
}

function getById(req, res) {
  try {
    const book = getBookDetails(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found.' });
    }
    return res.json({ success: true, book });
  } catch (err) {
    console.error('Get book error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch book details.' });
  }
}

function reserveBook(req, res) {
  try {
    const studentId = req.user.id;
    const bookId = req.params.id;
    const db = getDatabase();

    const book = db.get(`SELECT * FROM books WHERE id = ?`, [bookId]);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found.' });
    }

    // Check if student already has active reservation for this book
    const existingRes = db.get(`
      SELECT id FROM reservations 
      WHERE book_id = ? AND student_id = ? AND status IN ('PENDING', 'READY_FOR_PICKUP')
    `, [bookId, studentId]);

    if (existingRes) {
      return res.status(400).json({ success: false, message: 'You already have an active reservation for this book.' });
    }

    // Check if student already has this book borrowed
    const existingLoan = db.get(`
      SELECT id FROM borrow_transactions 
      WHERE book_id = ? AND student_id = ? AND status IN ('ACTIVE', 'OVERDUE')
    `, [bookId, studentId]);

    if (existingLoan) {
      return res.status(400).json({ success: false, message: 'You already have a copy of this book currently issued to you.' });
    }

    // Check if an available copy exists to reserve for pickup immediately
    const availableCopy = db.get(`
      SELECT id FROM book_copies 
      WHERE book_id = ? AND status = 'AVAILABLE' 
      ORDER BY id ASC LIMIT 1
    `, [bookId]);

    const resId = `RES_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(); // 48-hour pickup window

    if (availableCopy) {
      // Mark copy as RESERVED
      db.run(`UPDATE book_copies SET status = 'RESERVED' WHERE id = ?`, [availableCopy.id]);

      db.run(`
        INSERT INTO reservations (id, book_id, student_id, copy_id, reserved_at, expires_at, status, queue_position)
        VALUES (?, ?, ?, ?, datetime('now'), ?, 'READY_FOR_PICKUP', 1)
      `, [resId, bookId, studentId, availableCopy.id, expiresAt]);

      db.run(`
        INSERT INTO in_app_notifications (id, user_id, title, message, type, link)
        VALUES (?, ?, ?, ?, 'SUCCESS', '/student/reservations')
      `, [
        `NOTIF_${Date.now()}`,
        studentId,
        'Reservation Ready for Collection',
        `Your reservation for "${book.title}" (Copy: ${availableCopy.id}) is ready at the circulation counter! Please collect within 48 hours.`
      ]);

      logAudit(studentId, req.user.name, req.user.role, 'RESERVE_BOOK', 'reservations', resId, `Reserved copy ${availableCopy.id} of book ${book.title}`, req);

      return res.json({
        success: true,
        message: `Book reserved successfully! Copy ${availableCopy.id} is held for you at the library. Please collect within 48 hours.`,
        reservationId: resId,
        status: 'READY_FOR_PICKUP'
      });
    } else {
      // Add to waiting list queue
      const queueCount = db.get(`SELECT COUNT(*) as count FROM reservations WHERE book_id = ? AND status = 'PENDING'`, [bookId]);
      const nextPosition = (queueCount ? queueCount.count : 0) + 1;

      db.run(`
        INSERT INTO reservations (id, book_id, student_id, reserved_at, status, queue_position)
        VALUES (?, ?, ?, datetime('now'), 'PENDING', ?)
      `, [resId, bookId, studentId, nextPosition]);

      logAudit(studentId, req.user.name, req.user.role, 'JOIN_WAITING_LIST', 'reservations', resId, `Joined waiting list for ${book.title} (Position ${nextPosition})`, req);

      return res.json({
        success: true,
        message: `All physical copies are currently checked out. You have been placed on the waiting list at Queue Position #${nextPosition}. You will be notified automatically when a copy is returned!`,
        reservationId: resId,
        status: 'PENDING',
        queuePosition: nextPosition
      });
    }
  } catch (err) {
    console.error('Reserve book error:', err);
    return res.status(500).json({ success: false, message: 'Failed to process book reservation.' });
  }
}

function addReview(req, res) {
  try {
    const studentId = req.user.id;
    const bookId = req.params.id;
    const { rating, review_title, review_text } = req.body;

    if (!rating || !review_text) {
      return res.status(400).json({ success: false, message: 'Rating (1-5) and review text are required.' });
    }

    const numRating = Number(rating);
    if (numRating < 1 || numRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5 stars.' });
    }

    const db = getDatabase();

    // Check if student has borrowed this book at least once (Verified Borrower)
    const hasBorrowed = db.get(`
      SELECT id FROM borrow_transactions 
      WHERE book_id = ? AND student_id = ?
    `, [bookId, studentId]);

    const reviewId = `REV_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Insert or replace review
    db.run(`
      INSERT OR REPLACE INTO book_reviews (id, book_id, student_id, rating, review_title, review_text, is_verified_borrower, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [reviewId, bookId, studentId, numRating, review_title || '', review_text.trim(), hasBorrowed ? 1 : 0]);

    // Recalculate book average rating & review count
    const stats = db.get(`
      SELECT AVG(rating) as avg_rating, COUNT(*) as count 
      FROM book_reviews 
      WHERE book_id = ? AND reported = 0
    `, [bookId]);

    if (stats) {
      const avg = Math.round((stats.avg_rating || 0) * 10) / 10;
      db.run(`UPDATE books SET avg_rating = ?, review_count = ? WHERE id = ?`, [avg, stats.count, bookId]);
    }

    return res.json({
      success: true,
      message: 'Your review and rating have been posted successfully!',
      reviewId
    });
  } catch (err) {
    console.error('Add review error:', err);
    return res.status(500).json({ success: false, message: 'Failed to post review.' });
  }
}

function getCategories(req, res) {
  const db = getDatabase();
  const categories = db.query(`SELECT DISTINCT category FROM books ORDER BY category ASC`);
  return res.json({ success: true, categories: categories.map(c => c.category) });
}

function getDepartments(req, res) {
  const db = getDatabase();
  const departments = db.query(`SELECT * FROM departments ORDER BY code ASC`);
  return res.json({ success: true, departments });
}

module.exports = {
  search,
  getById,
  reserveBook,
  addReview,
  getCategories,
  getDepartments
};
