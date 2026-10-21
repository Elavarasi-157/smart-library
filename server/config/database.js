const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

let dbInstance = null;
let SQL = null;
let rawDb = null;
let dbFilePath = null;

function saveDb() {
  if (rawDb && dbFilePath) {
    try {
      const data = rawDb.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(dbFilePath, buffer);
    } catch (err) {
      console.error('Error saving SQLite database to disk:', err);
    }
  }
}

async function getDatabaseAsync() {
  if (dbInstance) return dbInstance;

  if (!SQL) {
    SQL = await initSqlJs();
  }

  dbFilePath = process.env.SQLITE_DB_PATH || path.join(__dirname, '..', 'smart_library.db');
  
  if (fs.existsSync(dbFilePath)) {
    const fileBuffer = fs.readFileSync(dbFilePath);
    rawDb = new SQL.Database(fileBuffer);
  } else {
    rawDb = new SQL.Database();
  }

  // Create unified query interface
  dbInstance = {
    raw: rawDb,
    isSqlite: true,

    query(sql, params = []) {
      const stmt = rawDb.prepare(sql);
      stmt.bind(params);
      const results = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
      return results;
    },

    get(sql, params = []) {
      const stmt = rawDb.prepare(sql);
      stmt.bind(params);
      let result = null;
      if (stmt.step()) {
        result = stmt.getAsObject();
      }
      stmt.free();
      return result;
    },

    run(sql, params = []) {
      rawDb.run(sql, params);
      const changes = rawDb.getRowsModified();
      saveDb();
      return { changes };
    },

    exec(sql) {
      rawDb.exec(sql);
      saveDb();
    },

    transaction(callback) {
      try {
        const result = callback();
        saveDb();
        return result;
      } catch (err) {
        throw err;
      }
    },

    save() {
      saveDb();
    },

    close() {
      saveDb();
      if (rawDb) rawDb.close();
      dbInstance = null;
    }
  };

  initSchema(dbInstance);
  return dbInstance;
}

function getDatabase() {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call await getDatabaseAsync() at app startup.');
  }
  return dbInstance;
}

function initSchema(db) {
  const schemaSql = `
    CREATE TABLE IF NOT EXISTS authorized_identities (
      institutional_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL CHECK(role IN ('STUDENT', 'LIBRARIAN', 'HOD', 'ADMIN')),
      department_code TEXT,
      year INTEGER,
      semester INTEGER,
      is_registered INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      department_id TEXT NOT NULL,
      semester INTEGER NOT NULL,
      year INTEGER NOT NULL,
      credits INTEGER DEFAULT 3,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (department_id) REFERENCES departments(id)
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      institutional_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('STUDENT', 'LIBRARIAN', 'HOD', 'ADMIN')),
      department_id TEXT,
      year INTEGER,
      semester INTEGER,
      phone TEXT,
      avatar_url TEXT,
      account_status TEXT DEFAULT 'ACTIVE' CHECK(account_status IN ('ACTIVE', 'SUSPENDED', 'PENDING')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (department_id) REFERENCES departments(id)
    );

    CREATE TABLE IF NOT EXISTS books (
      id TEXT PRIMARY KEY,
      isbn TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      publisher TEXT,
      edition TEXT,
      publication_year INTEGER,
      category TEXT NOT NULL,
      department_id TEXT,
      description TEXT,
      keywords TEXT,
      cover_image TEXT,
      sample_preview_url TEXT,
      language TEXT DEFAULT 'English',
      search_count INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      borrow_count INTEGER DEFAULT 0,
      avg_rating REAL DEFAULT 0.0,
      review_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (department_id) REFERENCES departments(id)
    );

    CREATE TABLE IF NOT EXISTS syllabus_book_mappings (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL,
      book_id TEXT NOT NULL,
      mapping_type TEXT NOT NULL CHECK(mapping_type IN ('CORE_TEXTBOOK', 'REFERENCE_BOOK')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(subject_id, book_id),
      FOREIGN KEY (subject_id) REFERENCES subjects(id),
      FOREIGN KEY (book_id) REFERENCES books(id)
    );

    CREATE TABLE IF NOT EXISTS book_copies (
      id TEXT PRIMARY KEY,
      book_id TEXT NOT NULL,
      condition TEXT DEFAULT 'GOOD' CHECK(condition IN ('GOOD', 'FAIR', 'DAMAGED', 'MAINTENANCE', 'LOST')),
      status TEXT DEFAULT 'AVAILABLE' CHECK(status IN ('AVAILABLE', 'ISSUED', 'RESERVED', 'MISSING', 'DAMAGED', 'MAINTENANCE', 'LOST')),
      building TEXT DEFAULT 'Central Library',
      floor TEXT DEFAULT 'Floor 2',
      rack TEXT DEFAULT 'Rack A1',
      shelf TEXT DEFAULT 'Shelf 1',
      purchase_date DATE,
      acquisition_source TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (book_id) REFERENCES books(id)
    );

    CREATE TABLE IF NOT EXISTS borrow_transactions (
      id TEXT PRIMARY KEY,
      book_id TEXT NOT NULL,
      copy_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      issued_by TEXT NOT NULL,
      borrowed_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      due_date DATETIME NOT NULL,
      returned_date DATETIME,
      renewal_count INTEGER DEFAULT 0,
      max_renewals INTEGER DEFAULT 2,
      returned_condition TEXT,
      returned_to TEXT,
      status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'RETURNED', 'OVERDUE')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (book_id) REFERENCES books(id),
      FOREIGN KEY (copy_id) REFERENCES book_copies(id),
      FOREIGN KEY (student_id) REFERENCES users(id),
      FOREIGN KEY (issued_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS renewal_history (
      id TEXT PRIMARY KEY,
      transaction_id TEXT NOT NULL,
      book_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      previous_due_date DATETIME NOT NULL,
      new_due_date DATETIME NOT NULL,
      renewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (transaction_id) REFERENCES borrow_transactions(id),
      FOREIGN KEY (student_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS reservations (
      id TEXT PRIMARY KEY,
      book_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      copy_id TEXT,
      reserved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      notified_at DATETIME,
      expires_at DATETIME,
      status TEXT DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'READY_FOR_PICKUP', 'FULFILLED', 'EXPIRED', 'CANCELLED')),
      queue_position INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (book_id) REFERENCES books(id),
      FOREIGN KEY (student_id) REFERENCES users(id),
      FOREIGN KEY (copy_id) REFERENCES book_copies(id)
    );

    CREATE TABLE IF NOT EXISTS fines (
      id TEXT PRIMARY KEY,
      transaction_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      book_id TEXT NOT NULL,
      overdue_days INTEGER NOT NULL DEFAULT 0,
      fine_rate REAL DEFAULT 1.0,
      fine_amount REAL NOT NULL,
      reason TEXT DEFAULT 'Overdue book return',
      status TEXT DEFAULT 'UNPAID' CHECK(status IN ('UNPAID', 'PAID', 'WAIVED')),
      cashfree_order_id TEXT,
      cashfree_payment_id TEXT,
      payment_method TEXT,
      paid_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (transaction_id) REFERENCES borrow_transactions(id),
      FOREIGN KEY (student_id) REFERENCES users(id),
      FOREIGN KEY (book_id) REFERENCES books(id)
    );

    CREATE TABLE IF NOT EXISTS book_reviews (
      id TEXT PRIMARY KEY,
      book_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      review_title TEXT,
      review_text TEXT NOT NULL,
      is_verified_borrower INTEGER DEFAULT 1,
      reported INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(book_id, student_id),
      FOREIGN KEY (book_id) REFERENCES books(id),
      FOREIGN KEY (student_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS academic_resources (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      department_id TEXT NOT NULL,
      semester INTEGER NOT NULL,
      subject_id TEXT NOT NULL,
      resource_type TEXT NOT NULL CHECK(resource_type IN ('QUESTION_PAPER', 'NOTES', 'LAB_MANUAL', 'STUDY_GUIDE', 'SYLLABUS_COPY', 'OTHER')),
      file_path TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_size INTEGER,
      mime_type TEXT,
      uploaded_by TEXT NOT NULL,
      uploader_role TEXT NOT NULL,
      copyright_confirmed INTEGER DEFAULT 1,
      status TEXT DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED', 'REMOVED')),
      moderated_by TEXT,
      moderation_notes TEXT,
      download_count INTEGER DEFAULT 0,
      avg_rating REAL DEFAULT 0.0,
      rating_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (department_id) REFERENCES departments(id),
      FOREIGN KEY (subject_id) REFERENCES subjects(id),
      FOREIGN KEY (uploaded_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS resource_ratings (
      id TEXT PRIMARY KEY,
      resource_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(resource_id, student_id),
      FOREIGN KEY (resource_id) REFERENCES academic_resources(id),
      FOREIGN KEY (student_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS resource_reports (
      id TEXT PRIMARY KEY,
      resource_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      details TEXT,
      status TEXT DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'REVIEWED', 'ACTION_TAKEN', 'DISMISSED')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (resource_id) REFERENCES academic_resources(id),
      FOREIGN KEY (student_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('BOOK_NOT_FOUND', 'WRONG_AVAILABILITY', 'BOOK_CONDITION', 'FINE_ISSUE', 'PAYMENT_ISSUE', 'ACCOUNT_ISSUE', 'RESOURCE_ISSUE', 'LIBRARY_FACILITY', 'TECHNICAL_PROBLEM', 'OTHER')),
      subject TEXT NOT NULL,
      description TEXT NOT NULL,
      book_id TEXT,
      expected_location TEXT,
      priority TEXT DEFAULT 'MEDIUM' CHECK(priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
      status TEXT DEFAULT 'OPEN' CHECK(status IN ('OPEN', 'IN_PROGRESS', 'WAITING_FOR_STUDENT', 'RESOLVED', 'CLOSED')),
      assigned_to TEXT,
      resolution_notes TEXT,
      closed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES users(id),
      FOREIGN KEY (assigned_to) REFERENCES users(id),
      FOREIGN KEY (book_id) REFERENCES books(id)
    );

    CREATE TABLE IF NOT EXISTS ticket_messages (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      sender_role TEXT NOT NULL,
      message TEXT NOT NULL,
      attachment_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id),
      FOREIGN KEY (sender_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS book_requests (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      isbn TEXT,
      publisher TEXT,
      edition TEXT,
      department_id TEXT NOT NULL,
      semester INTEGER NOT NULL,
      subject_id TEXT,
      reason TEXT NOT NULL,
      priority TEXT DEFAULT 'MEDIUM' CHECK(priority IN ('LOW', 'MEDIUM', 'HIGH')),
      hod_status TEXT DEFAULT 'PENDING' CHECK(hod_status IN ('PENDING', 'APPROVED', 'REJECTED', 'NEED_INFO')),
      hod_id TEXT,
      hod_notes TEXT,
      hod_action_at DATETIME,
      admin_status TEXT DEFAULT 'PENDING' CHECK(admin_status IN ('PENDING', 'APPROVED', 'REJECTED')),
      admin_id TEXT,
      admin_notes TEXT,
      admin_action_at DATETIME,
      procurement_status TEXT DEFAULT 'PENDING' CHECK(procurement_status IN ('PENDING', 'ORDERED', 'PROCURED', 'ADDED_TO_CATALOG', 'CANCELLED')),
      procured_book_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES users(id),
      FOREIGN KEY (department_id) REFERENCES departments(id),
      FOREIGN KEY (subject_id) REFERENCES subjects(id),
      FOREIGN KEY (hod_id) REFERENCES users(id),
      FOREIGN KEY (admin_id) REFERENCES users(id),
      FOREIGN KEY (procured_book_id) REFERENCES books(id)
    );

    CREATE TABLE IF NOT EXISTS library_visits (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      entry_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      exit_time DATETIME,
      duration_minutes INTEGER,
      status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'COMPLETED')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS crowd_config (
      id TEXT PRIMARY KEY,
      max_capacity INTEGER DEFAULT 300,
      low_threshold_pct REAL DEFAULT 0.40,
      moderate_threshold_pct REAL DEFAULT 0.70,
      high_threshold_pct REAL DEFAULT 1.00,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reminder_logs (
      id TEXT PRIMARY KEY,
      transaction_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      reminder_type TEXT NOT NULL CHECK(reminder_type IN ('DUE_IN_2_DAYS', 'DUE_IN_1_DAY', 'DUE_TODAY', 'OVERDUE')),
      recipient_email TEXT NOT NULL,
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      delivery_status TEXT DEFAULT 'SENT',
      UNIQUE(transaction_id, reminder_type),
      FOREIGN KEY (transaction_id) REFERENCES borrow_transactions(id),
      FOREIGN KEY (student_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notification_preferences (
      student_id TEXT PRIMARY KEY,
      email_enabled INTEGER DEFAULT 1,
      push_enabled INTEGER DEFAULT 1,
      calendar_sync_enabled INTEGER DEFAULT 1,
      reservation_alert_enabled INTEGER DEFAULT 1,
      fine_alert_enabled INTEGER DEFAULT 1,
      resource_alert_enabled INTEGER DEFAULT 1,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS in_app_notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'INFO' CHECK(type IN ('INFO', 'WARNING', 'SUCCESS', 'URGENT')),
      link TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      actor_id TEXT,
      actor_name TEXT,
      actor_role TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;

  db.exec(schemaSql);
}

module.exports = {
  getDatabaseAsync,
  getDatabase
};
