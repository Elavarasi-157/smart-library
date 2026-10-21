const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { authenticateToken, requireRoles } = require('../middleware/authMiddleware');
const { ROLES } = require('../config/constants');

// Controllers
const authController = require('../controllers/authController');
const bookController = require('../controllers/bookController');
const borrowController = require('../controllers/borrowController');
const fineController = require('../controllers/fineController');
const paymentController = require('../controllers/paymentController');
const syllabusController = require('../controllers/syllabusController');
const resourceController = require('../controllers/resourceController');
const ticketController = require('../controllers/ticketController');
const bookRequestController = require('../controllers/bookRequestController');
const crowdController = require('../controllers/crowdController');
const aiController = require('../controllers/aiController');
const adminController = require('../controllers/adminController');
const notificationController = require('../controllers/notificationController');

const router = express.Router();

// Multer storage for academic resource uploads
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${Date.now()}_${cleanName}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'text/plain'];
    if (allowedMimes.includes(file.mimetype) || file.originalname.endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Only PDF, DOC, DOCX, PPT, and TXT files are accepted.'));
    }
  }
});

// ==========================================
// 1. AUTHENTICATION & DEMO ACCOUNTS
// ==========================================
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', authenticateToken, authController.getMe);
router.get('/auth/demo-accounts', authController.getDemoAccounts);

// ==========================================
// 2. BOOKS CATALOG & SEARCH
// ==========================================
router.get('/books/search', bookController.search);
router.get('/books/categories', bookController.getCategories);
router.get('/books/departments', bookController.getDepartments);
router.get('/books/:id', bookController.getById);
router.post('/books/:id/reserve', authenticateToken, requireRoles([ROLES.STUDENT]), bookController.reserveBook);
router.post('/books/:id/review', authenticateToken, requireRoles([ROLES.STUDENT]), bookController.addReview);

// ==========================================
// 3. STUDENT BORROWING & RENEWALS
// ==========================================
router.get('/borrow/my-books', authenticateToken, requireRoles([ROLES.STUDENT]), borrowController.getMyBorrowedBooks);
router.post('/borrow/renew/:transactionId', authenticateToken, requireRoles([ROLES.STUDENT]), borrowController.renewBook);
router.get('/borrow/renewals', authenticateToken, requireRoles([ROLES.STUDENT]), borrowController.getRenewalHistory);
router.post('/borrow/issue', authenticateToken, requireRoles([ROLES.LIBRARIAN, ROLES.ADMIN]), borrowController.issueBook);
router.post('/borrow/return', authenticateToken, requireRoles([ROLES.LIBRARIAN, ROLES.ADMIN]), borrowController.returnBook);

// ==========================================
// 4. FINES & CASHFREE SANDBOX PAYMENTS
// ==========================================
router.get('/fines/my-fines', authenticateToken, requireRoles([ROLES.STUDENT]), fineController.getMyFines);
router.get('/fines/all', authenticateToken, requireRoles([ROLES.LIBRARIAN, ROLES.ADMIN]), fineController.getAllFines);
router.post('/payments/create-order', authenticateToken, requireRoles([ROLES.STUDENT]), paymentController.createPaymentOrder);
router.post('/payments/verify', authenticateToken, requireRoles([ROLES.STUDENT]), paymentController.verifyPayment);
router.get('/payments/receipt/:fineId', authenticateToken, paymentController.getReceipt);

// ==========================================
// 5. ACADEMIC SYLLABUS & RECOMMENDATIONS
// ==========================================
router.get('/syllabus/recommendations', syllabusController.getRecommendations);
router.get('/syllabus/trending', syllabusController.getTrending);
router.get('/syllabus/procurement-insights', syllabusController.getInsights);

// ==========================================
// 6. ACADEMIC RESOURCE SHARING
// ==========================================
router.get('/resources', resourceController.getResources);
router.post('/resources/upload', authenticateToken, upload.single('file'), resourceController.uploadResource);
router.post('/resources/:id/rate', authenticateToken, requireRoles([ROLES.STUDENT]), resourceController.rateResource);
router.post('/resources/:id/report', authenticateToken, requireRoles([ROLES.STUDENT]), resourceController.reportResource);
router.post('/resources/:id/moderate', authenticateToken, requireRoles([ROLES.LIBRARIAN, ROLES.HOD, ROLES.ADMIN]), resourceController.moderateResource);

// ==========================================
// 7. STUDENT-LIBRARIAN CHAT & TICKETS
// ==========================================
router.get('/tickets', authenticateToken, (req, res) => {
  if ([ROLES.LIBRARIAN, ROLES.ADMIN, ROLES.HOD].includes(req.user.role)) {
    return ticketController.getAllTickets(req, res);
  }
  return ticketController.getMyTickets(req, res);
});
router.get('/tickets/my-tickets', authenticateToken, requireRoles([ROLES.STUDENT]), ticketController.getMyTickets);
router.get('/tickets/all', authenticateToken, requireRoles([ROLES.LIBRARIAN, ROLES.ADMIN]), ticketController.getAllTickets);
router.get('/tickets/:ticketId', authenticateToken, ticketController.getTicketById);
router.post('/tickets/create', authenticateToken, ticketController.createTicket);
router.post('/tickets/:ticketId/reply', authenticateToken, ticketController.sendMessage);
router.post('/tickets/:ticketId/messages', authenticateToken, ticketController.sendMessage);
router.put('/tickets/:ticketId/status', authenticateToken, requireRoles([ROLES.LIBRARIAN, ROLES.ADMIN]), ticketController.updateTicketStatus);

// ==========================================
// 8. BOOK REQUESTS & APPROVAL WORKFLOW
// ==========================================
router.post('/book-requests/create', authenticateToken, requireRoles([ROLES.STUDENT]), bookRequestController.createRequest);
router.get('/book-requests/my-requests', authenticateToken, requireRoles([ROLES.STUDENT]), bookRequestController.getMyRequests);
router.get('/book-requests/department-requests', authenticateToken, requireRoles([ROLES.HOD, ROLES.ADMIN]), bookRequestController.getHodRequests);
router.get('/book-requests/hod/pending', authenticateToken, requireRoles([ROLES.HOD, ROLES.ADMIN]), bookRequestController.getHodRequests);
router.put('/book-requests/:requestId/hod-review', authenticateToken, requireRoles([ROLES.HOD, ROLES.ADMIN]), bookRequestController.hodAction);
router.post('/book-requests/hod/:requestId/action', authenticateToken, requireRoles([ROLES.HOD, ROLES.ADMIN]), bookRequestController.hodAction);
router.get('/book-requests/admin-requests', authenticateToken, requireRoles([ROLES.ADMIN]), bookRequestController.getAdminRequests);
router.get('/book-requests/admin/pending', authenticateToken, requireRoles([ROLES.ADMIN]), bookRequestController.getAdminRequests);
router.put('/book-requests/:requestId/admin-review', authenticateToken, requireRoles([ROLES.ADMIN]), bookRequestController.adminAction);
router.post('/book-requests/admin/:requestId/action', authenticateToken, requireRoles([ROLES.ADMIN]), bookRequestController.adminAction);

// ==========================================
// 9. CROWD MANAGEMENT & QR ENTRY/EXIT
// ==========================================
router.get('/crowd/status', crowdController.getCurrentCrowd);
router.post('/crowd/entry', authenticateToken, requireRoles([ROLES.LIBRARIAN, ROLES.ADMIN, ROLES.STUDENT]), crowdController.processQrEntry);
router.post('/crowd/exit', authenticateToken, requireRoles([ROLES.LIBRARIAN, ROLES.ADMIN, ROLES.STUDENT]), crowdController.processQrExit);
router.get('/crowd/analytics', crowdController.getCrowdAnalytics);
router.put('/crowd/config', authenticateToken, requireRoles([ROLES.ADMIN]), crowdController.updateCrowdConfig);

// ==========================================
// 10. AI ASSISTANT
// ==========================================
router.post('/ai/chat', aiController.chat);

// ==========================================
// 11. ADMIN & STAFF DASHBOARDS & CONTROLS
// ==========================================
router.get('/admin/dashboard', authenticateToken, requireRoles([ROLES.ADMIN]), adminController.getDashboardMetrics);
router.get('/admin/metrics', authenticateToken, requireRoles([ROLES.ADMIN]), adminController.getDashboardMetrics);
router.get('/admin/overview', authenticateToken, requireRoles([ROLES.ADMIN]), adminController.getDashboardMetrics);
router.get('/admin/librarian-metrics', authenticateToken, requireRoles([ROLES.LIBRARIAN, ROLES.ADMIN]), adminController.getLibrarianMetrics);
router.get('/admin/hod-metrics', authenticateToken, requireRoles([ROLES.HOD, ROLES.ADMIN]), adminController.getHodMetrics);
router.get('/admin/users', authenticateToken, requireRoles([ROLES.ADMIN]), adminController.getUsers);
router.put('/admin/users/:id/status', authenticateToken, requireRoles([ROLES.ADMIN]), adminController.updateUserStatus);
router.post('/admin/books', authenticateToken, requireRoles([ROLES.ADMIN, ROLES.LIBRARIAN]), adminController.createBook);
router.put('/admin/copies/:copyId/location', authenticateToken, requireRoles([ROLES.LIBRARIAN, ROLES.ADMIN]), adminController.updateCopyLocation);
router.get('/admin/audit-logs', authenticateToken, requireRoles([ROLES.ADMIN]), adminController.getAuditLogs);

// ==========================================
// 12. NOTIFICATIONS & CALENDAR SYNC
// ==========================================
router.get('/notifications', authenticateToken, notificationController.getNotifications);
router.put('/notifications/:id/read', authenticateToken, notificationController.markAsRead);
router.get('/notifications/preferences', authenticateToken, notificationController.getPreferences);
router.put('/notifications/preferences', authenticateToken, notificationController.updatePreferences);
router.post('/notifications/trigger-cron', authenticateToken, requireRoles([ROLES.ADMIN, ROLES.LIBRARIAN]), notificationController.triggerJob);
router.get('/calendar/ics', notificationController.generateCalendarIcs);

module.exports = router;
