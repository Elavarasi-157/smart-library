const { getDatabase } = require('../config/database');

function searchBooks({
  query = '',
  department_id = null,
  semester = null,
  subject_id = null,
  category = null,
  author = null,
  availability = 'ALL', // 'AVAILABLE_ONLY' | 'ALL'
  min_rating = 0,
  page = 1,
  limit = 20
}) {
  const db = getDatabase();

  // 1. Fetch all books along with copy statistics and department info
  const books = db.query(`
    SELECT 
      b.*,
      d.name as department_name,
      d.code as department_code,
      COUNT(c.id) as total_copies,
      SUM(CASE WHEN c.status = 'AVAILABLE' THEN 1 ELSE 0 END) as available_copies,
      SUM(CASE WHEN c.status = 'ISSUED' THEN 1 ELSE 0 END) as issued_copies,
      SUM(CASE WHEN c.status = 'RESERVED' THEN 1 ELSE 0 END) as reserved_copies,
      SUM(CASE WHEN c.status = 'MISSING' THEN 1 ELSE 0 END) as missing_copies,
      SUM(CASE WHEN c.status = 'MAINTENANCE' OR c.status = 'DAMAGED' THEN 1 ELSE 0 END) as maintenance_copies,
      GROUP_CONCAT(DISTINCT c.building || ' | ' || c.floor || ' | ' || c.rack || ' | ' || c.shelf) as physical_locations
    FROM books b
    LEFT JOIN departments d ON b.department_id = d.id
    LEFT JOIN book_copies c ON b.id = c.book_id
    GROUP BY b.id
  `);

  // 2. Fetch subject / syllabus mappings to attach semester and subject relevance
  const syllabusMappings = db.query(`
    SELECT 
      m.book_id,
      m.subject_id,
      m.mapping_type,
      m.notes,
      s.code as subject_code,
      s.name as subject_name,
      s.semester,
      s.department_id as subject_department_id
    FROM syllabus_book_mappings m
    JOIN subjects s ON m.subject_id = s.id
  `);

  // Map syllabus info to books
  const syllabusMap = {};
  syllabusMappings.forEach(s => {
    if (!syllabusMap[s.book_id]) syllabusMap[s.book_id] = [];
    syllabusMap[s.book_id].push(s);
  });

  const queryTerms = query
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(t => t.length > 0);

  // 3. Score and Filter Books
  let scoredBooks = books.map(book => {
    book.total_copies = Number(book.total_copies) || 0;
    book.available_copies = Number(book.available_copies) || 0;
    book.issued_copies = Number(book.issued_copies) || 0;
    book.reserved_copies = Number(book.reserved_copies) || 0;
    book.missing_copies = Number(book.missing_copies) || 0;
    book.maintenance_copies = Number(book.maintenance_copies) || 0;
    book.avg_rating = Number(book.avg_rating) || 0;
    book.review_count = Number(book.review_count) || 0;
    book.syllabus_mappings = syllabusMap[book.id] || [];

    // Parse primary location from copies
    const sampleCopy = db.get(`
      SELECT building, floor, rack, shelf 
      FROM book_copies 
      WHERE book_id = ? 
      ORDER BY CASE WHEN status = 'AVAILABLE' THEN 0 ELSE 1 END, id ASC 
      LIMIT 1
    `, [book.id]);

    book.primary_location = sampleCopy ? {
      building: sampleCopy.building || 'Central Library',
      floor: sampleCopy.floor || 'Floor 2',
      rack: sampleCopy.rack || 'Rack A1',
      shelf: sampleCopy.shelf || 'Shelf 1'
    } : {
      building: 'Central Library',
      floor: 'Floor 2',
      rack: 'Rack A1',
      shelf: 'Shelf 1'
    };

    // Filter checks
    if (department_id && book.department_id !== department_id) {
      const hasSubjectDept = book.syllabus_mappings.some(m => m.subject_department_id === department_id);
      if (!hasSubjectDept) return null;
    }

    if (semester) {
      const hasSemester = book.syllabus_mappings.some(m => Number(m.semester) === Number(semester));
      if (!hasSemester) return null;
    }

    if (subject_id) {
      const hasSubject = book.syllabus_mappings.some(m => m.subject_id === subject_id);
      if (!hasSubject) return null;
    }

    if (category && book.category.toLowerCase() !== category.toLowerCase()) {
      return null;
    }

    if (author && !book.author.toLowerCase().includes(author.toLowerCase())) {
      return null;
    }

    if (availability === 'AVAILABLE_ONLY' && book.available_copies <= 0) {
      return null;
    }

    if (min_rating > 0 && book.avg_rating < min_rating) {
      return null;
    }

    // Ranking algorithm calculation
    let score = 0;

    if (queryTerms.length === 0) {
      // Default score when no query: based on popularity, rating, and availability
      score = 50 + (book.available_copies > 0 ? 20 : 0) + (book.avg_rating * 4) + (Math.min(book.borrow_count, 30));
    } else {
      const titleLower = (book.title || '').toLowerCase();
      const authorLower = (book.author || '').toLowerCase();
      const keywordsLower = (book.keywords || '').toLowerCase();
      const categoryLower = (book.category || '').toLowerCase();
      const descLower = (book.description || '').toLowerCase();
      const isbnLower = (book.isbn || '').toLowerCase();
      const subjectNames = book.syllabus_mappings.map(m => m.subject_name.toLowerCase()).join(' ');

      const fullQuery = query.toLowerCase().trim();

      // Exact title or ISBN match
      if (titleLower === fullQuery) score += 120;
      else if (titleLower.startsWith(fullQuery)) score += 80;
      else if (titleLower.includes(fullQuery)) score += 60;

      if (isbnLower.includes(fullQuery)) score += 100;
      if (authorLower.includes(fullQuery)) score += 50;

      // Token-level scoring
      queryTerms.forEach(term => {
        if (titleLower.includes(term)) score += 25;
        if (authorLower.includes(term)) score += 20;
        if (keywordsLower.includes(term)) score += 18;
        if (subjectNames.includes(term)) score += 20;
        if (categoryLower.includes(term)) score += 12;
        if (descLower.includes(term)) score += 6;
      });

      // Boost for matching multiple tokens
      const matchesAllTerms = queryTerms.every(term => 
        titleLower.includes(term) || authorLower.includes(term) || keywordsLower.includes(term) || subjectNames.includes(term)
      );
      if (matchesAllTerms) score += 35;

      // If no query terms matched at all, return null
      if (score === 0) return null;

      // Factor in rating, availability & popularity weights
      if (book.available_copies > 0) score += 15;
      score += book.avg_rating * 3;
      score += Math.min(book.borrow_count, 20);
    }

    book.search_score = Math.round(score);
    return book;
  }).filter(Boolean);

  // 4. Sort by score descending
  scoredBooks.sort((a, b) => b.search_score - a.search_score);

  const totalResults = scoredBooks.length;
  const totalPages = Math.ceil(totalResults / limit) || 1;
  const startIndex = (page - 1) * limit;
  const paginatedBooks = scoredBooks.slice(startIndex, startIndex + limit);

  return {
    success: true,
    total: totalResults,
    page: Number(page),
    limit: Number(limit),
    totalPages,
    books: paginatedBooks
  };
}

function getBookDetails(bookId) {
  const db = getDatabase();

  // Increment view count
  db.run(`UPDATE books SET view_count = view_count + 1 WHERE id = ?`, [bookId]);

  const book = db.get(`
    SELECT 
      b.*,
      d.name as department_name,
      d.code as department_code
    FROM books b
    LEFT JOIN departments d ON b.department_id = d.id
    WHERE b.id = ?
  `, [bookId]);

  if (!book) return null;

  // Physical copies with rack & shelf locations
  const copies = db.query(`
    SELECT id, condition, status, building, floor, rack, shelf, purchase_date
    FROM book_copies
    WHERE book_id = ?
    ORDER BY CASE WHEN status = 'AVAILABLE' THEN 0 ELSE 1 END, id ASC
  `, [bookId]);

  // Calculate live copy stats
  const total_copies = copies.length;
  const available_copies = copies.filter(c => c.status === 'AVAILABLE').length;
  const issued_copies = copies.filter(c => c.status === 'ISSUED').length;
  const reserved_copies = copies.filter(c => c.status === 'RESERVED').length;
  const missing_copies = copies.filter(c => c.status === 'MISSING').length;
  const maintenance_copies = copies.filter(c => c.status === 'MAINTENANCE' || c.status === 'DAMAGED').length;

  // Syllabus mappings
  const syllabus_mappings = db.query(`
    SELECT 
      m.subject_id,
      m.mapping_type,
      m.notes,
      s.code as subject_code,
      s.name as subject_name,
      s.semester,
      s.year,
      d.name as department_name
    FROM syllabus_book_mappings m
    JOIN subjects s ON m.subject_id = s.id
    LEFT JOIN departments d ON s.department_id = d.id
    WHERE m.book_id = ?
  `, [bookId]);

  // Book reviews & rating distribution
  const reviews = db.query(`
    SELECT 
      r.id,
      r.rating,
      r.review_title,
      r.review_text,
      r.is_verified_borrower,
      r.created_at,
      u.name as student_name,
      u.institutional_id as student_id,
      d.code as department_code
    FROM book_reviews r
    JOIN users u ON r.student_id = u.id
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE r.book_id = ? AND r.reported = 0
    ORDER BY r.created_at DESC
  `, [bookId]);

  // Star breakdown calculation (5 star down to 1 star percentage)
  const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(r => {
    if (starCounts[r.rating] !== undefined) starCounts[r.rating]++;
  });
  const totalReviews = reviews.length;
  const rating_breakdown = {
    5: totalReviews > 0 ? Math.round((starCounts[5] / totalReviews) * 100) : 0,
    4: totalReviews > 0 ? Math.round((starCounts[4] / totalReviews) * 100) : 0,
    3: totalReviews > 0 ? Math.round((starCounts[3] / totalReviews) * 100) : 0,
    2: totalReviews > 0 ? Math.round((starCounts[2] / totalReviews) * 100) : 0,
    1: totalReviews > 0 ? Math.round((starCounts[1] / totalReviews) * 100) : 0,
  };

  // "Students Also Borrowed" Collaborative recommendation
  const alsoBorrowed = db.query(`
    SELECT 
      b.id,
      b.title,
      b.author,
      b.cover_image,
      b.avg_rating,
      COUNT(DISTINCT t2.student_id) as co_borrow_count,
      SUM(CASE WHEN c.status = 'AVAILABLE' THEN 1 ELSE 0 END) as available_copies
    FROM borrow_transactions t1
    JOIN borrow_transactions t2 ON t1.student_id = t2.student_id AND t1.book_id != t2.book_id
    JOIN books b ON t2.book_id = b.id
    LEFT JOIN book_copies c ON b.id = c.book_id
    WHERE t1.book_id = ?
    GROUP BY b.id
    ORDER BY co_borrow_count DESC, b.avg_rating DESC
    LIMIT 4
  `, [bookId]);

  // Fallback related books if not enough co-borrow history
  let relatedBooks = alsoBorrowed;
  if (relatedBooks.length < 3) {
    const fallbackRelated = db.query(`
      SELECT 
        b.id, b.title, b.author, b.cover_image, b.avg_rating,
        SUM(CASE WHEN c.status = 'AVAILABLE' THEN 1 ELSE 0 END) as available_copies
      FROM books b
      LEFT JOIN book_copies c ON b.id = c.book_id
      WHERE (b.department_id = ? OR b.category = ?) AND b.id != ?
      GROUP BY b.id
      ORDER BY b.avg_rating DESC
      LIMIT 4
    `, [book.department_id, book.category, bookId]);
    relatedBooks = fallbackRelated;
  }

  return {
    ...book,
    total_copies,
    available_copies,
    issued_copies,
    reserved_copies,
    missing_copies,
    maintenance_copies,
    copies,
    syllabus_mappings,
    reviews,
    rating_breakdown,
    students_also_borrowed: relatedBooks
  };
}

module.exports = {
  searchBooks,
  getBookDetails
};
