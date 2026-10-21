const { getDatabase } = require('../config/database');
const { processDueRemindersAndFines } = require('../services/reminderJob');

function getNotifications(req, res) {
  try {
    const userId = req.user.id;
    const db = getDatabase();

    const notifications = db.query(`
      SELECT * FROM in_app_notifications 
      WHERE user_id = ? 
      ORDER BY is_read ASC, created_at DESC 
      LIMIT 30
    `, [userId]);

    const unreadCount = db.get(`SELECT COUNT(*) as count FROM in_app_notifications WHERE user_id = ? AND is_read = 0`, [userId]);

    return res.json({
      success: true,
      unread_count: unreadCount ? unreadCount.count : 0,
      notifications
    });
  } catch (err) {
    console.error('Get notifications error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch notifications.' });
  }
}

function markAsRead(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const db = getDatabase();

    if (id === 'all') {
      db.run(`UPDATE in_app_notifications SET is_read = 1 WHERE user_id = ?`, [userId]);
    } else {
      db.run(`UPDATE in_app_notifications SET is_read = 1 WHERE id = ? AND user_id = ?`, [id, userId]);
    }

    return res.json({ success: true, message: 'Notifications updated.' });
  } catch (err) {
    console.error('Mark as read error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update notification.' });
  }
}

function getPreferences(req, res) {
  try {
    const userId = req.user.id;
    const db = getDatabase();

    let prefs = db.get(`SELECT * FROM notification_preferences WHERE student_id = ?`, [userId]);
    if (!prefs) {
      db.run(`INSERT OR REPLACE INTO notification_preferences (student_id) VALUES (?)`, [userId]);
      prefs = {
        student_id: userId,
        email_enabled: 1,
        push_enabled: 1,
        calendar_sync_enabled: 1,
        reservation_alert_enabled: 1,
        fine_alert_enabled: 1,
        resource_alert_enabled: 1
      };
    }

    return res.json({ success: true, preferences: prefs });
  } catch (err) {
    console.error('Get preferences error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch notification preferences.' });
  }
}

function updatePreferences(req, res) {
  try {
    const userId = req.user.id;
    const { email_enabled, push_enabled, calendar_sync_enabled, reservation_alert_enabled, fine_alert_enabled, resource_alert_enabled } = req.body;
    const db = getDatabase();

    db.run(`
      INSERT OR REPLACE INTO notification_preferences (
        student_id, email_enabled, push_enabled, calendar_sync_enabled,
        reservation_alert_enabled, fine_alert_enabled, resource_alert_enabled, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [
      userId,
      email_enabled !== undefined ? (email_enabled ? 1 : 0) : 1,
      push_enabled !== undefined ? (push_enabled ? 1 : 0) : 1,
      calendar_sync_enabled !== undefined ? (calendar_sync_enabled ? 1 : 0) : 1,
      reservation_alert_enabled !== undefined ? (reservation_alert_enabled ? 1 : 0) : 1,
      fine_alert_enabled !== undefined ? (fine_alert_enabled ? 1 : 0) : 1,
      resource_alert_enabled !== undefined ? (resource_alert_enabled ? 1 : 0) : 1
    ]);

    return res.json({ success: true, message: 'Notification preferences updated successfully.' });
  } catch (err) {
    console.error('Update preferences error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update preferences.' });
  }
}

function triggerJob(req, res) {
  try {
    const result = processDueRemindersAndFines();
    return res.json({ success: true, message: 'Background reminder and fine calculation completed.', result });
  } catch (err) {
    console.error('Trigger reminder job error:', err);
    return res.status(500).json({ success: false, message: 'Failed to execute reminder job.' });
  }
}

function generateCalendarIcs(req, res) {
  try {
    const { title, dueDate, author, bookId } = req.query;

    if (!title || !dueDate) {
      return res.status(400).send('Title and due date are required.');
    }

    const cleanDate = dueDate.replace(/-/g, '').split('T')[0];
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Smart Library//University Library Management System//EN',
      'BEGIN:VEVENT',
      `UID:smartlib-${bookId || 'loan'}-${Date.now()}@smartlib.edu`,
      `DTSTAMP:${cleanDate}T090000Z`,
      `DTSTART:${cleanDate}T090000Z`,
      `DTEND:${cleanDate}T170000Z`,
      `SUMMARY:Return Book: ${title} to Smart Library`,
      `DESCRIPTION:Reminder to return or renew '${title}' by ${author || 'Author'}. Avoid overdue fines of ₹1/day.`,
      'LOCATION:Central University Library - Circulation Counter',
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-P2D',
      'ACTION:DISPLAY',
      `DESCRIPTION:Smart Library Reminder: '${title}' is due in 2 days.`,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="smart_library_return_${cleanDate}.ics"`);
    return res.send(icsContent);
  } catch (err) {
    console.error('Generate ICS error:', err);
    return res.status(500).send('Failed to generate calendar file.');
  }
}

module.exports = {
  getNotifications,
  markAsRead,
  getPreferences,
  updatePreferences,
  triggerJob,
  generateCalendarIcs
};
