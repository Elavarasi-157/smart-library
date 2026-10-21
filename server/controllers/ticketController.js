const { getDatabase } = require('../config/database');
const { ROLES, TICKET_STATUS } = require('../config/constants');
const { logAudit } = require('../services/auditService');

function getMyTickets(req, res) {
  try {
    const studentId = req.user.id;
    const db = getDatabase();

    const tickets = db.query(`
      SELECT 
        t.*,
        b.title as book_title,
        b.isbn as book_isbn,
        u.name as assigned_staff_name
      FROM tickets t
      LEFT JOIN books b ON t.book_id = b.id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.student_id = ?
      ORDER BY CASE WHEN t.status IN ('OPEN', 'IN_PROGRESS', 'WAITING_FOR_STUDENT') THEN 0 ELSE 1 END, t.created_at DESC
    `, [studentId]);

    // Attach message history for each ticket
    const ticketIds = tickets.map(t => t.id);
    const messages = ticketIds.length > 0 ? db.query(`
      SELECT m.*, u.name as sender_name
      FROM ticket_messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.ticket_id IN (${ticketIds.map(() => '?').join(',')})
      ORDER BY m.created_at ASC
    `, ticketIds) : [];

    const messagesByTicket = {};
    messages.forEach(m => {
      if (!messagesByTicket[m.ticket_id]) messagesByTicket[m.ticket_id] = [];
      messagesByTicket[m.ticket_id].push(m);
    });

    const enrichedTickets = tickets.map(t => ({
      ...t,
      messages: messagesByTicket[t.id] || []
    }));

    return res.json({ success: true, count: enrichedTickets.length, tickets: enrichedTickets });
  } catch (err) {
    console.error('Get my tickets error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch tickets.' });
  }
}

function getAllTickets(req, res) {
  try {
    const { status, category } = req.query;
    const db = getDatabase();

    let query = `
      SELECT 
        t.*,
        b.title as book_title,
        b.isbn as book_isbn,
        u.name as student_name,
        u.institutional_id as student_id_code,
        u.email as student_email,
        d.code as department_code,
        staff.name as assigned_staff_name
      FROM tickets t
      JOIN users u ON t.student_id = u.id
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN books b ON t.book_id = b.id
      LEFT JOIN users staff ON t.assigned_to = staff.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ` AND t.status = ?`;
      params.push(status);
    }
    if (category) {
      query += ` AND t.category = ?`;
      params.push(category);
    }

    query += ` ORDER BY CASE WHEN t.status IN ('OPEN', 'IN_PROGRESS') THEN 0 ELSE 1 END, t.created_at DESC`;

    const tickets = db.query(query, params);

    // Attach messages
    const ticketIds = tickets.map(t => t.id);
    const messages = ticketIds.length > 0 ? db.query(`
      SELECT m.*, u.name as sender_name
      FROM ticket_messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.ticket_id IN (${ticketIds.map(() => '?').join(',')})
      ORDER BY m.created_at ASC
    `, ticketIds) : [];

    const messagesByTicket = {};
    messages.forEach(m => {
      if (!messagesByTicket[m.ticket_id]) messagesByTicket[m.ticket_id] = [];
      messagesByTicket[m.ticket_id].push(m);
    });

    const enrichedTickets = tickets.map(t => ({
      ...t,
      messages: messagesByTicket[t.id] || []
    }));

    return res.json({ success: true, count: enrichedTickets.length, tickets: enrichedTickets });
  } catch (err) {
    console.error('Get all tickets error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch tickets queue.' });
  }
}

function getTicketById(req, res) {
  try {
    const { ticketId } = req.params;
    const user = req.user;
    const db = getDatabase();

    const ticket = db.get(`
      SELECT 
        t.*,
        b.title as book_title,
        b.isbn as book_isbn,
        u.name as student_name,
        u.email as student_email,
        staff.name as assigned_staff_name
      FROM tickets t
      JOIN users u ON t.student_id = u.id
      LEFT JOIN books b ON t.book_id = b.id
      LEFT JOIN users staff ON t.assigned_to = staff.id
      WHERE t.id = ?
    `, [ticketId]);

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    // Check access
    if (user.role === ROLES.STUDENT && ticket.student_id !== user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const messages = db.query(`
      SELECT m.*, u.name as sender_name
      FROM ticket_messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.ticket_id = ?
      ORDER BY m.created_at ASC
    `, [ticketId]);

    return res.json({
      success: true,
      ticket: {
        ...ticket,
        messages
      },
      messages
    });
  } catch (err) {
    console.error('Get ticket by id error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch ticket conversation.' });
  }
}

function createTicket(req, res) {
  try {
    const student = req.user;
    const { category, subject, description, message, book_id, expected_location, priority } = req.body;
    const finalDescription = (description || message || '').trim();

    if (!subject || !subject.trim() || !finalDescription) {
      return res.status(400).json({ success: false, message: 'Subject and message are required.' });
    }

    const finalCategory = category || 'GENERAL_QUERY';
    const finalPriority = priority || 'MEDIUM';

    const db = getDatabase();
    const ticketNumber = Math.floor(10000 + Math.random() * 90000);
    const ticketId = `LIB-${ticketNumber}`;

    // Auto-assign to librarian
    const defaultLibrarian = db.get(`SELECT id FROM users WHERE role = 'LIBRARIAN' LIMIT 1`);
    const assignedStaffId = defaultLibrarian ? defaultLibrarian.id : null;

    db.transaction(() => {
      db.run(`
        INSERT INTO tickets (id, student_id, category, subject, description, book_id, expected_location, priority, status, assigned_to)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'OPEN', ?)
      `, [
        ticketId,
        student.id,
        finalCategory,
        subject.trim(),
        finalDescription,
        book_id || null,
        expected_location || null,
        finalPriority,
        assignedStaffId
      ]);

      // Insert initial message
      const msgId = `MSG_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      db.run(`
        INSERT INTO ticket_messages (id, ticket_id, sender_id, sender_role, message)
        VALUES (?, ?, ?, ?, ?)
      `, [msgId, ticketId, student.id, student.role, finalDescription]);
    });

    logAudit(student.id, student.name, student.role, 'CREATE_TICKET', 'tickets', ticketId, `Created ticket ${ticketId} under category ${finalCategory}`, req);

    return res.status(201).json({
      success: true,
      message: `Inquiry Ticket #${ticketId} submitted successfully! The librarian desk has received it.`,
      ticketId
    });
  } catch (err) {
    console.error('Create ticket error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create ticket.' });
  }
}

function sendMessage(req, res) {
  try {
    const user = req.user;
    const { ticketId } = req.params;
    const { message, attachment_url } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message content cannot be empty.' });
    }

    const db = getDatabase();
    const ticket = db.get(`SELECT * FROM tickets WHERE id = ?`, [ticketId]);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    // Role state transitions
    let newStatus = ticket.status;
    if (user.role === ROLES.STUDENT) {
      if (['WAITING_FOR_STUDENT', 'RESOLVED', 'CLOSED'].includes(ticket.status)) {
        newStatus = 'OPEN';
      }
    } else if ([ROLES.LIBRARIAN, ROLES.ADMIN, ROLES.HOD].includes(user.role)) {
      if (ticket.status === 'OPEN') {
        newStatus = 'IN_PROGRESS';
      }
    }

    const msgId = `MSG_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    db.transaction(() => {
      db.run(`
        INSERT INTO ticket_messages (id, ticket_id, sender_id, sender_role, message, attachment_url)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [msgId, ticketId, user.id, user.role, message.trim(), attachment_url || null]);

      db.run(`
        UPDATE tickets 
        SET status = ?, updated_at = datetime('now')
        WHERE id = ?
      `, [newStatus, ticketId]);

      // If librarian replied -> Notify student
      if ([ROLES.LIBRARIAN, ROLES.ADMIN].includes(user.role)) {
        db.run(`
          INSERT INTO in_app_notifications (id, user_id, title, message, type, link)
          VALUES (?, ?, ?, ?, 'INFO', '/student/tickets')
        `, [
          `NOTIF_TKT_${Date.now()}`,
          ticket.student_id,
          `Librarian Replied to Ticket #${ticketId}`,
          `"${user.name}": ${message.trim().substring(0, 80)}...`
        ]);
      }
    });

    return res.json({
      success: true,
      message: 'Message sent successfully.',
      ticketStatus: newStatus
    });
  } catch (err) {
    console.error('Send ticket message error:', err);
    return res.status(500).json({ success: false, message: 'Failed to send message.' });
  }
}

function updateTicketStatus(req, res) {
  try {
    const staff = req.user;
    const { ticketId } = req.params;
    const { status, resolution_notes, assigned_to } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required.' });
    }

    const db = getDatabase();
    const ticket = db.get(`SELECT * FROM tickets WHERE id = ?`, [ticketId]);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    const closedAt = ['RESOLVED', 'CLOSED'].includes(status) ? new Date().toISOString() : null;

    db.run(`
      UPDATE tickets 
      SET status = ?, 
          resolution_notes = COALESCE(?, resolution_notes),
          assigned_to = COALESCE(?, assigned_to),
          closed_at = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `, [status, resolution_notes || null, assigned_to || null, closedAt, ticketId]);

    // Notify student
    db.run(`
      INSERT INTO in_app_notifications (id, user_id, title, message, type, link)
      VALUES (?, ?, ?, ?, 'SUCCESS', '/student/tickets')
    `, [
      `NOTIF_STAT_${Date.now()}`,
      ticket.student_id,
      `Ticket #${ticketId} Marked as ${status}`,
      `Your ticket has been marked as ${status}. ${resolution_notes ? `Resolution: ${resolution_notes}` : ''}`
    ]);

    logAudit(staff.id, staff.name, staff.role, 'UPDATE_TICKET_STATUS', 'tickets', ticketId, `Updated ticket #${ticketId} status to ${status}. Notes: ${resolution_notes || ''}`, req);

    return res.json({
      success: true,
      message: `Ticket #${ticketId} status updated to ${status}.`
    });
  } catch (err) {
    console.error('Update ticket status error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update ticket.' });
  }
}

module.exports = {
  getMyTickets,
  getAllTickets,
  getTicketById,
  createTicket,
  sendMessage,
  updateTicketStatus
};
