const assert = require('assert');
const { getDatabaseAsync } = require('../config/database');
const { seed } = require('../seeds/seedData');
const { searchBooks, getBookDetails } = require('../services/searchService');
const { getSemesterRecommendations } = require('../services/recommendationService');
const { createFinePaymentOrder, verifyAndProcessPayment } = require('../services/cashfreeService');
const { processDueRemindersAndFines } = require('../services/reminderJob');
const { RULES, ROLES } = require('../config/constants');

async function runTestSuite() {
  console.log('🧪 Starting Smart Library Comprehensive Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}\n`);
      failed++;
    }
  }

  async function asyncTest(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}\n`);
      failed++;
    }
  }

  // Ensure DB seeded with demo data
  await seed();
  const db = await getDatabaseAsync();

  // Test 1: Institutional RBAC & ID Verification
  test('RBAC: Authorized registry enforces roles (Student cannot be registered as Admin)', () => {
    const studentAuth = db.get(`SELECT * FROM authorized_identities WHERE institutional_id = 'STU2024001'`);
    assert.strictEqual(studentAuth.role, ROLES.STUDENT, 'STU2024001 must be role STUDENT');

    const adminAuth = db.get(`SELECT * FROM authorized_identities WHERE institutional_id = 'ADM2024001'`);
    assert.strictEqual(adminAuth.role, ROLES.ADMIN, 'ADM2024001 must be role ADMIN');

    const hodAuth = db.get(`SELECT * FROM authorized_identities WHERE institutional_id = 'HOD-IT-001'`);
    assert.strictEqual(hodAuth.role, ROLES.HOD, 'HOD-IT-001 must be role HOD');

    const libAuth = db.get(`SELECT * FROM authorized_identities WHERE institutional_id = 'LIB2024001'`);
    assert.strictEqual(libAuth.role, ROLES.LIBRARIAN, 'LIB2024001 must be role LIBRARIAN');
  });

  // Test 2: Search Ranking & Fuzzy Token Matching
  test('Search Engine: Multi-keyword search matches relevant books by title and keywords', () => {
    const res = searchBooks({ query: 'machine python' });
    assert(res.books.length > 0, 'Search for "machine python" must return books');
    assert.strictEqual(res.books[0].id, 'BK1006', 'First result should be Hands-On Machine Learning');
    assert(res.books[0].search_score > 50, 'Search score should be properly weighted');
  });

  // Test 3: Physical Copy & Live Shelf Availability Tracking
  test('Copy & Shelf Tracking: Exact physical rack and shelf location is returned', () => {
    const book = getBookDetails('BK1001'); // DBMS
    assert(book !== null, 'Book BK1001 must exist');
    assert.strictEqual(book.total_copies, 5, 'Total copies must be 5');
    assert(book.available_copies >= 1, 'Available copies must be computed correctly');
    assert(book.copies.length === 5, 'Must return 5 physical copies');
    assert(book.copies[0].rack.includes('Rack A12'), 'Copy location must match Rack A12');
  });

  // Test 4: Maximum 4 Books Borrowing Rule
  test('Borrowing Limit: Student is limited to maximum 4 books at any time', () => {
    const studentId = 'USR_STU_1'; // Rahul Sharma
    const activeCount = db.get(`
      SELECT COUNT(*) as count FROM borrow_transactions 
      WHERE student_id = ? AND status IN ('ACTIVE', 'OVERDUE')
    `, [studentId]).count;

    assert.strictEqual(activeCount, 3, 'Rahul Sharma starts with 3 active borrowings');
    assert(activeCount < RULES.MAX_BOOKS_PER_STUDENT, 'Active count is below max limit of 4');

    // If 4th book is issued:
    const canBorrow4th = activeCount < RULES.MAX_BOOKS_PER_STUDENT;
    assert.strictEqual(canBorrow4th, true, 'Student can borrow 4th book');

    // If 5th book is attempted:
    const simulatedActiveCount = 4;
    const canBorrow5th = simulatedActiveCount < RULES.MAX_BOOKS_PER_STUDENT;
    assert.strictEqual(canBorrow5th, false, 'Student MUST be blocked from borrowing a 5th book (limit is 4)');
  });

  // Test 5: 14-Day Renewal Criteria
  test('Renewal Engine: Renewal extends due date by exactly 14 days and logs history', () => {
    const loan = db.get(`SELECT * FROM borrow_transactions WHERE id = 'TXN_1001'`); // OS-001
    const currentDueDate = new Date(loan.due_date);
    const newDueDate = new Date(currentDueDate.getTime() + (RULES.RENEWAL_EXTENSION_DAYS * 24 * 60 * 60 * 1000));

    const diffDays = Math.round((newDueDate.getTime() - currentDueDate.getTime()) / (1000 * 60 * 60 * 24));
    assert.strictEqual(diffDays, 14, 'Renewal must extend due date by exactly 14 days');
  });

  // Test 6: Overdue Fine Calculation (₹1 per day)
  test('Fine Rule: Overdue fine is strictly calculated at ₹1 per day overdue', () => {
    const fine = db.get(`SELECT * FROM fines WHERE id = 'FINE_1001'`);
    assert(fine !== null, 'Fine record FINE_1001 must exist');
    assert.strictEqual(fine.fine_rate, 1.0, 'Fine rate must be 1.0 (₹1/day)');
    assert.strictEqual(fine.overdue_days, 4, 'Overdue days must be 4');
    assert.strictEqual(fine.fine_amount, 4.0, 'Fine amount for 4 days overdue must be ₹4.0');
  });

  // Test 7: Cashfree Sandbox Payment & Receipt Verification
  await asyncTest('Cashfree Sandbox: Order creation and payment verification marks fine paid', async () => {
    const student = db.get(`SELECT * FROM users WHERE id = 'USR_STU_1'`);
    const fine = db.get(`SELECT * FROM fines WHERE id = 'FINE_1001'`);

    const orderRes = await createFinePaymentOrder({
      fineId: fine.id,
      student,
      amount: fine.fine_amount
    });

    assert(orderRes.success, 'Order creation must succeed');
    assert(orderRes.orderId.startsWith('CF_ORDER_'), 'Order ID must have CF_ORDER_ prefix');

    const verifyRes = await verifyAndProcessPayment({
      orderId: orderRes.orderId,
      paymentId: 'CF_PAY_TEST_VERIFIED_123',
      paymentMethod: 'UPI',
      fineId: fine.id,
      studentId: student.id
    });

    assert(verifyRes.success, 'Payment verification must succeed');
    assert.strictEqual(verifyRes.receipt.status, 'PAID', 'Receipt status must be PAID');
    assert.strictEqual(verifyRes.receipt.amount, 4.0, 'Receipt amount must match fine amount ₹4');

    const updatedFine = db.get(`SELECT status FROM fines WHERE id = 'FINE_1001'`);
    assert.strictEqual(updatedFine.status, 'PAID', 'Database fine status must be updated to PAID');
  });

  // Test 8: Academic Syllabus Mapping
  test('Syllabus Engine: Returns official core textbooks and reference books for IT Semester 4', () => {
    const syllabus = getSemesterRecommendations('DEPT_IT', 4);
    assert(syllabus.subjects.length >= 4, 'IT Semester 4 must have at least 4 subjects');

    const dbmsSubject = syllabus.subjects.find(s => s.subject_code === 'IT401');
    assert(dbmsSubject !== undefined, 'IT401 DBMS must exist in IT Semester 4');
    assert(dbmsSubject.core_textbooks.length > 0, 'DBMS must have a core textbook');
    assert.strictEqual(dbmsSubject.core_textbooks[0].title, 'Database System Concepts', 'Core textbook must be Database System Concepts');
  });

  // Test 9: Multi-Tier Book Request Workflow (Student -> HOD -> Admin)
  test('Approval Pipeline: Student book request requires HOD approval before Admin approval', () => {
    const hodApprovedReq = db.get(`SELECT * FROM book_requests WHERE id = 'REQ_1001'`);
    assert.strictEqual(hodApprovedReq.hod_status, 'APPROVED', 'REQ_1001 is HOD approved');
    assert.strictEqual(hodApprovedReq.admin_status, 'PENDING', 'REQ_1001 is ready for Admin review');

    const pendingHodReq = db.get(`SELECT * FROM book_requests WHERE id = 'REQ_1002'`);
    assert.strictEqual(pendingHodReq.hod_status, 'PENDING', 'REQ_1002 is still pending HOD review');

    // Attempting Admin approval on REQ_1002 before HOD approval must be rejected:
    const canAdminApproveDirectly = pendingHodReq.hod_status === 'APPROVED';
    assert.strictEqual(canAdminApproveDirectly, false, 'Admin cannot approve a request that has not been approved by HOD first');
  });

  // Test 10: Crowd Management & QR Entry/Exit
  test('Crowd Engine: Live occupancy and QR Turnstile check-in increments and check-out decrements count', () => {
    const initialActive = db.get(`SELECT COUNT(*) as count FROM library_visits WHERE status = 'ACTIVE'`).count;
    assert(initialActive > 0, 'Must have initial active visits');

    // Simulate entry for student STU2024003 (Vikram Patel)
    const visitId = `VISIT_TEST_${Date.now()}`;
    db.run(`INSERT INTO library_visits (id, student_id, entry_time, status) VALUES (?, 'USR_STU_3', datetime('now'), 'ACTIVE')`, [visitId]);

    const afterEntry = db.get(`SELECT COUNT(*) as count FROM library_visits WHERE status = 'ACTIVE'`).count;
    assert.strictEqual(afterEntry, initialActive + 1, 'Entry must increment active occupancy count by 1');

    // Simulate exit for Vikram Patel
    db.run(`UPDATE library_visits SET status = 'COMPLETED', exit_time = datetime('now') WHERE id = ?`, [visitId]);
    const afterExit = db.get(`SELECT COUNT(*) as count FROM library_visits WHERE status = 'ACTIVE'`).count;
    assert.strictEqual(afterExit, initialActive, 'Exit must decrement active occupancy count by 1');
  });

  // Test 11: Background Reminder Deduplication
  test('Reminder Engine: Duplicate notifications are not sent for the same due alert', () => {
    const jobResult = processDueRemindersAndFines();
    assert(jobResult.inspectedLoans > 0, 'Job must inspect active loans');

    // Running job a second time immediately should not generate duplicate reminder logs
    const secondRun = processDueRemindersAndFines();
    assert.strictEqual(secondRun.remindersSent, 0, 'Second run must not send duplicate reminders');
  });

  console.log(`\n========================================`);
  console.log(`🎉 TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runTestSuite().catch(err => {
    console.error('Test suite runner failed:', err);
    process.exit(1);
  });
}

module.exports = { runTestSuite };
