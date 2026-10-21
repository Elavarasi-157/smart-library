const { getDatabase } = require('../config/database');
const { RULES } = require('../config/constants');
const { logAudit } = require('../services/auditService');

function getCurrentCrowd(req, res) {
  try {
    const db = getDatabase();

    const config = db.get(`SELECT * FROM crowd_config WHERE id = 'CFG_MAIN'`) || {
      max_capacity: RULES.DEFAULT_LIBRARY_CAPACITY,
      low_threshold_pct: RULES.CROWD_THRESHOLDS.LOW,
      moderate_threshold_pct: RULES.CROWD_THRESHOLDS.MODERATE,
      high_threshold_pct: RULES.CROWD_THRESHOLDS.HIGH
    };

    const activeVisits = db.get(`SELECT COUNT(*) as count FROM library_visits WHERE status = 'ACTIVE'`);
    const currentCount = activeVisits ? activeVisits.count : 0;
    const capacity = config.max_capacity || 300;
    const occupancyRatio = capacity > 0 ? (currentCount / capacity) : 0;
    const occupancyPct = Math.round(occupancyRatio * 100);

    let status = 'LOW';
    let statusLabel = '🟢 Low Crowd';
    let statusColor = 'emerald';

    if (occupancyRatio > config.moderate_threshold_pct) {
      status = 'HIGH';
      statusLabel = '🔴 High Crowd';
      statusColor = 'crimson';
    } else if (occupancyRatio > config.low_threshold_pct) {
      status = 'MODERATE';
      statusLabel = '🟡 Moderate Crowd';
      statusColor = 'gold';
    }

    return res.json({
      success: true,
      current_visitors: currentCount,
      max_capacity: capacity,
      occupancy_pct: occupancyPct,
      status,
      status_label: statusLabel,
      status_color: statusColor,
      best_time_today: '10:00 AM – 11:30 AM (Low expected crowd)',
      thresholds: {
        low: `${Math.round(config.low_threshold_pct * 100)}%`,
        moderate: `${Math.round(config.moderate_threshold_pct * 100)}%`,
        high: `${Math.round(config.high_threshold_pct * 100)}%`
      }
    });
  } catch (err) {
    console.error('Get current crowd error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch library crowd status.' });
  }
}

function processQrEntry(req, res) {
  try {
    const { studentIdentifier } = req.body; // Institutional ID, User ID, or email from QR code

    if (!studentIdentifier) {
      return res.status(400).json({ success: false, message: 'Student QR data is required.' });
    }

    const db = getDatabase();

    const student = db.get(`
      SELECT u.*, d.name as department_name 
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE (u.institutional_id = ? OR u.id = ? OR LOWER(u.email) = LOWER(?)) AND u.role = 'STUDENT'
    `, [studentIdentifier.trim(), studentIdentifier.trim(), studentIdentifier.trim()]);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Invalid Student ID. No active student found in registry.' });
    }

    // Check if student already has an active visit inside the library (prevent duplicate entries)
    const existingActive = db.get(`SELECT id, entry_time FROM library_visits WHERE student_id = ? AND status = 'ACTIVE'`, [student.id]);
    if (existingActive) {
      return res.status(400).json({
        success: false,
        message: `Student ${student.name} is already checked in since ${new Date(existingActive.entry_time).toLocaleTimeString()}. Please scan for exit first.`,
        activeVisitId: existingActive.id
      });
    }

    const visitId = `VISIT_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    db.run(`
      INSERT INTO library_visits (id, student_id, entry_time, status)
      VALUES (?, ?, datetime('now'), 'ACTIVE')
    `, [visitId, student.id]);

    logAudit(student.id, student.name, student.role, 'LIBRARY_ENTRY_SCAN', 'library_visits', visitId, `Checked into library via QR Turnstile`, req);

    return res.json({
      success: true,
      message: `Welcome to Smart Library, ${student.name}! Entry recorded successfully.`,
      visitId,
      student: {
        name: student.name,
        institutionalId: student.institutional_id,
        department: student.department_name,
        entryTime: new Date().toLocaleTimeString()
      }
    });
  } catch (err) {
    console.error('Process QR entry error:', err);
    return res.status(500).json({ success: false, message: 'Failed to process library entry.' });
  }
}

function processQrExit(req, res) {
  try {
    const { studentIdentifier } = req.body;

    if (!studentIdentifier) {
      return res.status(400).json({ success: false, message: 'Student QR data is required.' });
    }

    const db = getDatabase();

    const student = db.get(`
      SELECT u.*, d.name as department_name 
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE (u.institutional_id = ? OR u.id = ? OR LOWER(u.email) = LOWER(?)) AND u.role = 'STUDENT'
    `, [studentIdentifier.trim(), studentIdentifier.trim(), studentIdentifier.trim()]);

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found in registry.' });
    }

    // Find active visit
    const activeVisit = db.get(`SELECT * FROM library_visits WHERE student_id = ? AND status = 'ACTIVE' ORDER BY entry_time DESC LIMIT 1`, [student.id]);

    if (!activeVisit) {
      return res.status(400).json({
        success: false,
        message: `No active check-in record found for ${student.name}. Student was not recorded as inside the library.`
      });
    }

    const now = new Date();
    const entryDate = new Date(activeVisit.entry_time);
    const durationMinutes = Math.max(1, Math.round((now.getTime() - entryDate.getTime()) / (1000 * 60)));

    db.run(`
      UPDATE library_visits 
      SET exit_time = datetime('now'), duration_minutes = ?, status = 'COMPLETED'
      WHERE id = ?
    `, [durationMinutes, activeVisit.id]);

    logAudit(student.id, student.name, student.role, 'LIBRARY_EXIT_SCAN', 'library_visits', activeVisit.id, `Checked out of library after ${durationMinutes} mins`, req);

    return res.json({
      success: true,
      message: `Goodbye, ${student.name}! Exit recorded. Study duration: ${durationMinutes} minutes.`,
      student: {
        name: student.name,
        institutionalId: student.institutional_id,
        durationMinutes,
        exitTime: now.toLocaleTimeString()
      }
    });
  } catch (err) {
    console.error('Process QR exit error:', err);
    return res.status(500).json({ success: false, message: 'Failed to process library exit.' });
  }
}

function getCrowdAnalytics(req, res) {
  try {
    const hourlyData = [
      { hour: '8 AM', avgVisitors: 18, expectedOccupancy: '6%', status: 'Low' },
      { hour: '9 AM', avgVisitors: 35, expectedOccupancy: '12%', status: 'Low' },
      { hour: '10 AM', avgVisitors: 65, expectedOccupancy: '22%', status: 'Low' },
      { hour: '11 AM', avgVisitors: 88, expectedOccupancy: '29%', status: 'Low' },
      { hour: '12 PM', avgVisitors: 115, expectedOccupancy: '38%', status: 'Low' },
      { hour: '1 PM', avgVisitors: 135, expectedOccupancy: '45%', status: 'Moderate' },
      { hour: '2 PM', avgVisitors: 180, expectedOccupancy: '60%', status: 'Moderate' },
      { hour: '3 PM', avgVisitors: 215, expectedOccupancy: '72%', status: 'High' },
      { hour: '4 PM', avgVisitors: 195, expectedOccupancy: '65%', status: 'Moderate' },
      { hour: '5 PM', avgVisitors: 155, expectedOccupancy: '52%', status: 'Moderate' },
      { hour: '6 PM', avgVisitors: 110, expectedOccupancy: '37%', status: 'Low' },
      { hour: '7 PM', avgVisitors: 60, expectedOccupancy: '20%', status: 'Low' },
      { hour: '8 PM', avgVisitors: 25, expectedOccupancy: '8%', status: 'Low' }
    ];

    const weeklyTrends = [
      { day: 'Mon', peakCrowd: 220, avgDuration: 85 },
      { day: 'Tue', peakCrowd: 245, avgDuration: 90 },
      { day: 'Wed', peakCrowd: 210, avgDuration: 80 },
      { day: 'Thu', peakCrowd: 250, avgDuration: 95 },
      { day: 'Fri', peakCrowd: 230, avgDuration: 75 },
      { day: 'Sat', peakCrowd: 140, avgDuration: 110 },
      { day: 'Sun', peakCrowd: 90, avgDuration: 120 }
    ];

    return res.json({
      success: true,
      hourlyData,
      weeklyTrends,
      peakHour: '3:00 PM – 4:00 PM (Peak 215 visitors)',
      leastCrowdedHour: '8:00 AM – 10:00 AM (<40 visitors)',
      bestTimeToVisit: '10:00 AM – 11:30 AM'
    });
  } catch (err) {
    console.error('Get crowd analytics error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch crowd analytics.' });
  }
}

function updateCrowdConfig(req, res) {
  try {
    const { max_capacity, low_threshold_pct, moderate_threshold_pct, high_threshold_pct } = req.body;
    const db = getDatabase();

    db.run(`
      INSERT OR REPLACE INTO crowd_config (id, max_capacity, low_threshold_pct, moderate_threshold_pct, high_threshold_pct, updated_at)
      VALUES ('CFG_MAIN', ?, ?, ?, ?, datetime('now'))
    `, [
      Number(max_capacity) || RULES.DEFAULT_LIBRARY_CAPACITY,
      Number(low_threshold_pct) || RULES.CROWD_THRESHOLDS.LOW,
      Number(moderate_threshold_pct) || RULES.CROWD_THRESHOLDS.MODERATE,
      Number(high_threshold_pct) || RULES.CROWD_THRESHOLDS.HIGH
    ]);

    logAudit(req.user.id, req.user.name, req.user.role, 'UPDATE_CROWD_CONFIG', 'crowd_config', 'CFG_MAIN', `Updated library max capacity to ${max_capacity}`, req);

    return res.json({ success: true, message: 'Crowd configuration updated successfully.' });
  } catch (err) {
    console.error('Update crowd config error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update crowd configuration.' });
  }
}

module.exports = {
  getCurrentCrowd,
  processQrEntry,
  processQrExit,
  getCrowdAnalytics,
  updateCrowdConfig
};
