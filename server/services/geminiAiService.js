const { getDatabase } = require('../config/database');
const { searchBooks, getBookDetails } = require('./searchService');
const { getSemesterRecommendations } = require('./recommendationService');
const { RULES } = require('../config/constants');

// Grounded database tools executed by AI Assistant
const libraryTools = {
  get_book_live_availability: ({ query }) => {
    const searchRes = searchBooks({ query, limit: 3 });
    if (!searchRes.books || searchRes.books.length === 0) {
      return { found: false, message: `No books found matching "${query}".` };
    }
    return searchRes.books.map(b => ({
      id: b.id,
      title: b.title,
      author: b.author,
      available_copies: b.available_copies,
      total_copies: b.total_copies,
      status: b.available_copies > 0 ? 'AVAILABLE_FOR_BORROWING' : 'CURRENTLY_UNAVAILABLE',
      location: b.primary_location,
      avg_rating: b.avg_rating
    }));
  },

  get_semester_syllabus_books: ({ department_code, semester }) => {
    const db = getDatabase();
    const dept = db.get(`SELECT id, name FROM departments WHERE code = ? OR id = ?`, [department_code.toUpperCase(), department_code]);
    if (!dept) {
      return { error: `Department "${department_code}" not found. Available codes: IT, CSE, ECE, EEE, MECH.` };
    }
    return getSemesterRecommendations(dept.id, Number(semester));
  },

  get_library_rules: () => {
    return {
      max_books_allowed_per_student: RULES.MAX_BOOKS_PER_STUDENT, // 4 books
      standard_borrow_period_days: RULES.STANDARD_BORROW_DAYS, // 14 days
      renewal_period_extension_days: RULES.RENEWAL_EXTENSION_DAYS, // 14 days
      max_allowed_renewals: RULES.MAX_RENEWALS, // 2 renewals
      overdue_fine_rate: `₹${RULES.FINE_PER_DAY} per day`, // ₹1/day
      library_max_capacity: RULES.DEFAULT_LIBRARY_CAPACITY,
      renewal_condition: 'Cannot renew if another student has reserved the book or if maximum 2 renewals reached.'
    };
  },

  get_crowd_status: () => {
    const db = getDatabase();
    const active = db.get(`SELECT COUNT(*) as count FROM library_visits WHERE status = 'ACTIVE'`);
    const count = active ? active.count : 0;
    const capacity = RULES.DEFAULT_LIBRARY_CAPACITY;
    const occupancy_pct = Math.round((count / capacity) * 100);
    let crowd_level = 'LOW';
    if (occupancy_pct > 70) crowd_level = 'HIGH';
    else if (occupancy_pct > 40) crowd_level = 'MODERATE';

    return {
      current_visitors: count,
      max_capacity: capacity,
      occupancy_percentage: `${occupancy_pct}%`,
      crowd_level,
      best_time_to_visit: '10:00 AM – 11:30 AM (Low expected crowd)'
    };
  }
};

async function handleAiAssistantChat({ message, conversationHistory = [], userContext = {} }) {
  const userQuery = message.toLowerCase().trim();
  const db = getDatabase();

  // Try Google Gemini API if GEMINI_API_KEY is provided
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{
                text: `You are the official Smart Library AI Assistant.
Library Ground Truth Facts:
- Borrowing limit: Maximum 4 books per student.
- Borrowing period: 14 days.
- Renewal extension: 14 days from due date.
- Overdue Fine: ₹1 per day per book.
- Current Crowd: ${JSON.stringify(libraryTools.get_crowd_status())}
User Query: "${message}"
Answer professionally, helpfully and concisely. If recommending textbooks, state exact shelf locations.`
              }]
            }
          ]
        })
      });

      const data = await response.json();
      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        return {
          success: true,
          reply: data.candidates[0].content.parts[0].text,
          groundedData: null
        };
      }
    } catch (apiErr) {
      console.warn('Gemini API call fallback to local grounded reasoning:', apiErr.message);
    }
  }

  // High-accuracy Grounded Assistant Engine
  let reply = '';
  let groundedData = null;

  if (userQuery.includes('rule') || userQuery.includes('fine') || userQuery.includes('limit') || userQuery.includes('renewal period') || userQuery.includes('how many book')) {
    const rules = libraryTools.get_library_rules();
    groundedData = rules;
    reply = `Here are the official Smart Library rules:\n\n` +
      `• **Borrowing Limit:** Maximum **${rules.max_books_allowed_per_student} books** at any time per student.\n` +
      `• **Borrowing Duration:** Standard loan period is **${rules.standard_borrow_period_days} days**.\n` +
      `• **Renewals:** You can renew eligible books up to **${rules.max_allowed_renewals} times**. Each renewal extends the due date by **${rules.renewal_period_extension_days} days**.\n` +
      `• **Overdue Fine:** Overdue fines are strictly **${rules.overdue_fine_rate}**.\n` +
      `• **Renewal Restrictions:** A book cannot be renewed if another student has placed a reservation on it.`;
  }
  else if (userQuery.includes('crowd') || userQuery.includes('occupancy') || userQuery.includes('best time') || userQuery.includes('how crowded')) {
    const crowd = libraryTools.get_crowd_status();
    groundedData = crowd;
    reply = `**Live Library Crowd Status:**\n\n` +
      `• **Current Visitors:** ${crowd.current_visitors} / ${crowd.max_capacity} students\n` +
      `• **Occupancy Level:** ${crowd.occupancy_percentage} (${crowd.crowd_level})\n` +
      `• **Best Time to Visit Today:** ${crowd.best_time_to_visit}\n\n` +
      `You can scan your Student ID QR code at the entrance turnstile for instant check-in.`;
  }
  else if (userQuery.includes('semester') || userQuery.includes('syllabus') || userQuery.includes('recommend') || userQuery.includes('it 4') || userQuery.includes('it semester')) {
    const deptCode = userQuery.includes('cse') ? 'CSE' : (userQuery.includes('ece') ? 'ECE' : 'IT');
    const semMatch = userQuery.match(/semester\s*(\d)/i) || userQuery.match(/sem\s*(\d)/i) || [null, '4'];
    const semester = semMatch[1] || 4;

    const syllabus = libraryTools.get_semester_syllabus_books({ department_code: deptCode, semester });
    groundedData = syllabus;

    if (syllabus.subjects && syllabus.subjects.length > 0) {
      reply = `Here are the prescribed academic textbooks for **${deptCode} — Semester ${semester}** based on the official curriculum:\n\n`;
      syllabus.subjects.slice(0, 3).forEach(sub => {
        reply += `📚 **${sub.subject_code}: ${sub.subject_name}**\n`;
        if (sub.core_textbooks.length > 0) {
          const tb = sub.core_textbooks[0];
          reply += `  • Core Textbook: *${tb.title}* by ${tb.author}\n`;
          reply += `  • Shelf Location: ${tb.primary_location || 'Floor 2, Rack A12'}\n`;
          reply += `  • Live Availability: ${tb.available_copies > 0 ? `🟢 ${tb.available_copies} copies available` : '🔴 Currently checked out'}\n`;
        }
        reply += `\n`;
      });
      reply += `You can navigate to "Academic Syllabus" in the navigation bar to see full course details.`;
    } else {
      reply = `Could not find curriculum details for ${deptCode} Semester ${semester}. Please check the department selection.`;
    }
  }
  else if (userQuery.includes('dbms') || userQuery.includes('database') || userQuery.includes('operating system') || userQuery.includes('algorithm') || userQuery.includes('python') || userQuery.includes('machine learning') || userQuery.includes('available')) {
    const searchRes = searchBooks({ query: message, limit: 3 });
    groundedData = searchRes.books;

    if (searchRes.books.length > 0) {
      reply = `Found ${searchRes.books.length} matching textbooks in the library catalog:\n\n`;
      searchRes.books.forEach((b, idx) => {
        reply += `${idx + 1}. **${b.title}** (⭐ ${b.avg_rating}/5)\n`;
        reply += `   • Author: ${b.author}\n`;
        reply += `   • Availability: ${b.available_copies > 0 ? `🟢 ${b.available_copies} copy/copies available` : '🔴 Currently issued'}\n`;
        reply += `   • Shelf Location: Building ${b.primary_location.building}, ${b.primary_location.floor}, ${b.primary_location.rack}, ${b.primary_location.shelf}\n\n`;
      });
      reply += `You can reserve any book directly through the search results page!`;
    } else {
      reply = `I searched the library database for "${message}" but couldn't find an exact match. You can submit a "Request a Book" request in your dashboard to ask the HOD and Admin to procure it!`;
    }
  }
  else {
    reply = `Hello! I am your Smart Library AI Assistant. I can assist you with:\n\n` +
      `1. **Book Search & Physical Shelf Locations** (e.g. "Where is Database System Concepts located?")\n` +
      `2. **Real-time Book Availability** (e.g. "Are copies of Operating Systems available?")\n` +
      `3. **Semester Syllabus Recommendations** (e.g. "Recommend IT Semester 4 textbooks")\n` +
      `4. **Live Library Crowd & Best Time to Visit** (e.g. "How crowded is the library right now?")\n` +
      `5. **Rules & Fines** (e.g. "What is the borrowing limit and fine rate?")\n\n` +
      `How can I assist your studies today?`;
  }

  return {
    success: true,
    reply,
    groundedData
  };
}

module.exports = {
  handleAiAssistantChat,
  libraryTools
};
