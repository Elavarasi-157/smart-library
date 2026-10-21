const { handleAiAssistantChat } = require('../services/geminiAiService');

async function chat(req, res) {
  try {
    const { message, history } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message text is required.' });
    }

    const userContext = req.user ? {
      name: req.user.name,
      role: req.user.role,
      department_id: req.user.department_id,
      semester: req.user.semester
    } : {};

    const aiResponse = await handleAiAssistantChat({
      message: message.trim(),
      conversationHistory: history || [],
      userContext
    });

    return res.json(aiResponse);
  } catch (err) {
    console.error('AI Assistant controller error:', err);
    return res.status(500).json({
      success: false,
      message: 'AI Assistant temporarily unavailable. Please try again in a moment.'
    });
  }
}

module.exports = {
  chat
};
