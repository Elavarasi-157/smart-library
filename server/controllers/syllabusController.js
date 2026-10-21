const { getDatabase } = require('../config/database');
const { getSemesterRecommendations, getTrendingAndPopularBooks, getProcurementInsights } = require('../services/recommendationService');

function getRecommendations(req, res) {
  try {
    const { department_id, semester } = req.query;

    if (!department_id || !semester) {
      // Default to student's own enrolled department & semester if logged in as student
      if (req.user && req.user.department_id && req.user.semester) {
        const results = getSemesterRecommendations(req.user.department_id, req.user.semester);
        return res.json(results);
      }
      return res.status(400).json({ success: false, message: 'Department and Semester are required.' });
    }

    const results = getSemesterRecommendations(department_id, semester);
    return res.json(results);
  } catch (err) {
    console.error('Get syllabus recommendations error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch syllabus recommendations.' });
  }
}

function getTrending(req, res) {
  try {
    const results = getTrendingAndPopularBooks();
    return res.json(results);
  } catch (err) {
    console.error('Get trending books error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch trending books.' });
  }
}

function getInsights(req, res) {
  try {
    const results = getProcurementInsights();
    return res.json(results);
  } catch (err) {
    console.error('Get procurement insights error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch procurement insights.' });
  }
}

module.exports = {
  getRecommendations,
  getTrending,
  getInsights
};
