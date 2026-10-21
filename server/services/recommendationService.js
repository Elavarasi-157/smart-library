const { getDatabase } = require('../config/database');

function getSemesterRecommendations(department_id, semester) {
  const db = getDatabase();

  // Fetch subjects for this department and semester
  const subjects = db.query(`
    SELECT s.*, d.name as department_name, d.code as department_code
    FROM subjects s
    JOIN departments d ON s.department_id = d.id
    WHERE s.department_id = ? AND s.semester = ?
    ORDER BY s.code ASC
  `, [department_id, semester]);

  const subjectResults = subjects.map(subject => {
    // Fetch mapped textbooks and references
    const mappedBooks = db.query(`
      SELECT 
        b.id,
        b.title,
        b.author,
        b.publisher,
        b.edition,
        b.isbn,
        b.cover_image,
        b.sample_preview_url,
        b.avg_rating,
        b.review_count,
        m.mapping_type,
        m.notes,
        COUNT(c.id) as total_copies,
        SUM(CASE WHEN c.status = 'AVAILABLE' THEN 1 ELSE 0 END) as available_copies,
        MIN(CASE WHEN c.status = 'AVAILABLE' THEN c.building || ' | ' || c.floor || ' | ' || c.rack || ' | ' || c.shelf ELSE NULL END) as primary_location
      FROM syllabus_book_mappings m
      JOIN books b ON m.book_id = b.id
      LEFT JOIN book_copies c ON b.id = c.book_id
      WHERE m.subject_id = ?
      GROUP BY b.id, m.mapping_type
      ORDER BY CASE WHEN m.mapping_type = 'CORE_TEXTBOOK' THEN 0 ELSE 1 END, m.id ASC
    `, [subject.id]);

    const core_textbooks = mappedBooks.filter(b => b.mapping_type === 'CORE_TEXTBOOK');
    const reference_books = mappedBooks.filter(b => b.mapping_type === 'REFERENCE_BOOK');

    return {
      subject_id: subject.id,
      subject_code: subject.code,
      subject_name: subject.name,
      credits: subject.credits,
      description: subject.description,
      core_textbooks,
      reference_books
    };
  });

  return {
    success: true,
    department_id,
    semester: Number(semester),
    subjects: subjectResults
  };
}

function getTrendingAndPopularBooks() {
  const db = getDatabase();

  const popular = db.query(`
    SELECT 
      b.*,
      d.name as department_name,
      d.code as department_code,
      COUNT(c.id) as total_copies,
      SUM(CASE WHEN c.status = 'AVAILABLE' THEN 1 ELSE 0 END) as available_copies
    FROM books b
    LEFT JOIN departments d ON b.department_id = d.id
    LEFT JOIN book_copies c ON b.id = c.book_id
    GROUP BY b.id
    ORDER BY (b.borrow_count * 2 + b.search_count + b.avg_rating * 5) DESC
    LIMIT 6
  `);

  return {
    success: true,
    popular_books: popular
  };
}

function getProcurementInsights() {
  const db = getDatabase();

  // High demand insights based on student book requests and low availability
  const requests = db.query(`
    SELECT 
      r.title,
      r.author,
      r.department_id,
      d.name as department_name,
      d.code as department_code,
      r.semester,
      COUNT(r.id) as request_count,
      r.priority,
      r.hod_status,
      r.admin_status
    FROM book_requests r
    LEFT JOIN departments d ON r.department_id = d.id
    GROUP BY r.title, r.author
    ORDER BY request_count DESC
  `);

  return {
    success: true,
    procurement_insights: requests
  };
}

module.exports = {
  getSemesterRecommendations,
  getTrendingAndPopularBooks,
  getProcurementInsights
};
