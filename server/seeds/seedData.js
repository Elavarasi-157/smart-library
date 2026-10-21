const bcrypt = require('bcryptjs');
const { getDatabaseAsync } = require('../config/database');
const { ROLES, RULES, BOOK_STATUS, BOOK_CONDITION, RESOURCE_STATUS, TICKET_STATUS, REQUEST_STATUS } = require('../config/constants');

async function seed() {
  console.log('🌱 Starting Smart Library (Madras Institute of Technology) Database Seeding...');
  const db = await getDatabaseAsync();

  const passwordHash = await bcrypt.hash('Password@123', 10);

  db.transaction(() => {
    // 1. Clear existing data
    db.exec(`
      DELETE FROM audit_logs;
      DELETE FROM in_app_notifications;
      DELETE FROM reminder_logs;
      DELETE FROM notification_preferences;
      DELETE FROM library_visits;
      DELETE FROM crowd_config;
      DELETE FROM ticket_messages;
      DELETE FROM tickets;
      DELETE FROM resource_reports;
      DELETE FROM resource_ratings;
      DELETE FROM academic_resources;
      DELETE FROM book_reviews;
      DELETE FROM fines;
      DELETE FROM reservations;
      DELETE FROM renewal_history;
      DELETE FROM borrow_transactions;
      DELETE FROM book_copies;
      DELETE FROM syllabus_book_mappings;
      DELETE FROM book_requests;
      DELETE FROM books;
      DELETE FROM subjects;
      DELETE FROM users;
      DELETE FROM departments;
      DELETE FROM authorized_identities;
    `);

    // 2. Insert Crowd Config (300 Max Capacity for Main Central Library)
    db.run(`
      INSERT OR REPLACE INTO crowd_config (id, max_capacity, low_threshold_pct, moderate_threshold_pct, high_threshold_pct)
      VALUES ('CFG_MAIN', 300, 35, 70, 90)
    `);

    // 3. Insert Departments
    const departments = [
      { id: 'DEPT_IT', code: 'IT', name: 'Information Technology', description: 'Department of Information Technology & Software Systems' },
      { id: 'DEPT_CSE', code: 'CSE', name: 'Computer Science & Engineering', description: 'Department of Computer Science & Engineering' },
      { id: 'DEPT_ECE', code: 'ECE', name: 'Electronics & Communication', description: 'Department of Electronics & Communication Engineering' },
      { id: 'DEPT_EEE', code: 'EEE', name: 'Electrical & Electronics', description: 'Department of Electrical & Electronics Engineering' },
      { id: 'DEPT_MECH', code: 'MECH', name: 'Mechanical Engineering', description: 'Department of Mechanical & Automation Engineering' },
      { id: 'DEPT_GEN', code: 'GEN', name: 'General Sciences & Humanities', description: 'Department of First Year Foundation Studies' }
    ];

    departments.forEach(dept => {
      db.run(`INSERT OR REPLACE INTO departments (id, code, name, description) VALUES (?, ?, ?, ?)`, [dept.id, dept.code, dept.name, dept.description]);
    });

    // 4. Insert Authorized Identities
    const identities = [
      // Students
      { institutional_id: 'STU2024001', name: 'Karthik R', email: 'karthik.r@mit.edu', role: ROLES.STUDENT, department_code: 'IT', year: 2, semester: 4 },
      { institutional_id: 'STU2024002', name: 'Ananya Iyer', email: 'ananya@mit.edu', role: ROLES.STUDENT, department_code: 'CSE', year: 2, semester: 4 },
      { institutional_id: 'STU2024003', name: 'Vikram Patel', email: 'vikram@mit.edu', role: ROLES.STUDENT, department_code: 'ECE', year: 1, semester: 2 },
      { institutional_id: 'STU2024004', name: 'Pooja Reddy', email: 'pooja@mit.edu', role: ROLES.STUDENT, department_code: 'IT', year: 3, semester: 6 },
      { institutional_id: 'STU2024005', name: 'Karan Malhotra', email: 'karan@mit.edu', role: ROLES.STUDENT, department_code: 'MECH', year: 2, semester: 4 },
      // HODs
      { institutional_id: 'HOD-IT-001', name: 'Dr. Ramesh Chandra', email: 'hod.it@mit.edu', role: ROLES.HOD, department_code: 'IT', year: null, semester: null },
      { institutional_id: 'HOD-CSE-001', name: 'Dr. Sunita Rao', email: 'hod.cse@mit.edu', role: ROLES.HOD, department_code: 'CSE', year: null, semester: null },
      // Librarians
      { institutional_id: 'LIB2024001', name: 'Meera Nair', email: 'librarian@mit.edu', role: ROLES.LIBRARIAN, department_code: 'GEN', year: null, semester: null },
      { institutional_id: 'LIB2024002', name: 'Rajesh Verma', email: 'rajesh.lib@mit.edu', role: ROLES.LIBRARIAN, department_code: 'GEN', year: null, semester: null },
      // Admins
      { institutional_id: 'ADM2024001', name: 'Dr. Arvind Swaminathan', email: 'admin@mit.edu', role: ROLES.ADMIN, department_code: null, year: null, semester: null }
    ];

    identities.forEach(id => {
      db.run(`
        INSERT OR REPLACE INTO authorized_identities (institutional_id, name, email, role, department_code, year, semester, is_registered)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)
      `, [id.institutional_id, id.name, id.email, id.role, id.department_code, id.year, id.semester]);
    });

    // 5. Insert Users
    const users = [
      { id: 'USR_STU_1', institutional_id: 'STU2024001', name: 'Karthik R', email: 'karthik.r@mit.edu', role: ROLES.STUDENT, department_id: 'DEPT_IT', year: 2, semester: 4, phone: '+91 98765 43210' },
      { id: 'USR_STU_2', institutional_id: 'STU2024002', name: 'Ananya Iyer', email: 'ananya@mit.edu', role: ROLES.STUDENT, department_id: 'DEPT_CSE', year: 2, semester: 4, phone: '+91 98765 43211' },
      { id: 'USR_STU_3', institutional_id: 'STU2024003', name: 'Vikram Patel', email: 'vikram@mit.edu', role: ROLES.STUDENT, department_id: 'DEPT_ECE', year: 1, semester: 2, phone: '+91 98765 43212' },
      { id: 'USR_HOD_IT', institutional_id: 'HOD-IT-001', name: 'Dr. Ramesh Chandra', email: 'hod.it@mit.edu', role: ROLES.HOD, department_id: 'DEPT_IT', year: null, semester: null, phone: '+91 98765 11111' },
      { id: 'USR_HOD_CSE', institutional_id: 'HOD-CSE-001', name: 'Dr. Sunita Rao', email: 'hod.cse@mit.edu', role: ROLES.HOD, department_id: 'DEPT_CSE', year: null, semester: null, phone: '+91 98765 22222' },
      { id: 'USR_LIB_1', institutional_id: 'LIB2024001', name: 'Meera Nair', email: 'librarian@mit.edu', role: ROLES.LIBRARIAN, department_id: 'DEPT_GEN', year: null, semester: null, phone: '+91 98765 33333' },
      { id: 'USR_ADM_1', institutional_id: 'ADM2024001', name: 'Dr. Arvind Swaminathan', email: 'admin@mit.edu', role: ROLES.ADMIN, department_id: null, year: null, semester: null, phone: '+91 98765 00000' }
    ];

    users.forEach(u => {
      db.run(`
        INSERT OR REPLACE INTO users (id, institutional_id, name, email, password_hash, role, department_id, year, semester, phone, account_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
      `, [u.id, u.institutional_id, u.name, u.email, passwordHash, u.role, u.department_id, u.year, u.semester, u.phone]);

      if (u.role === ROLES.STUDENT) {
        db.run(`INSERT OR REPLACE INTO notification_preferences (student_id) VALUES (?)`, [u.id]);
      }
    });

    // 6. Insert Subjects
    const subjects = [
      // IT Semester 4
      { id: 'SUB_IT_401', code: 'IT401', name: 'Database Management Systems', department_id: 'DEPT_IT', semester: 4, year: 2, credits: 4, description: 'Relational data models, SQL, indexing, transaction processing, concurrency control, NoSQL.' },
      { id: 'SUB_IT_402', code: 'IT402', name: 'Operating Systems', department_id: 'DEPT_IT', semester: 4, year: 2, credits: 4, description: 'Processes, threads, CPU scheduling, synchronization, deadlocks, memory management, file systems.' },
      { id: 'SUB_IT_403', code: 'IT403', name: 'Design & Analysis of Algorithms', department_id: 'DEPT_IT', semester: 4, year: 2, credits: 4, description: 'Asymptotic notation, divide-and-conquer, greedy, dynamic programming, graph algorithms, NP-completeness.' },
      { id: 'SUB_IT_404', code: 'IT404', name: 'Computer Networks', department_id: 'DEPT_IT', semester: 4, year: 2, credits: 3, description: 'OSI/TCP-IP models, routing protocols, TCP/UDP transport, socket programming, network security.' },
      { id: 'SUB_IT_405', code: 'IT405', name: 'Discrete Mathematics', department_id: 'DEPT_IT', semester: 4, year: 2, credits: 4, description: 'Set theory, mathematical logic, combinatorics, graph theory, algebraic structures.' },

      // IT Semester 1
      { id: 'SUB_IT_101', code: 'IT101', name: 'Programming in C', department_id: 'DEPT_IT', semester: 1, year: 1, credits: 4, description: 'C language syntax, control structures, pointers, arrays, memory allocation, file I/O.' },
      { id: 'SUB_IT_102', code: 'IT102', name: 'Engineering Mathematics - I', department_id: 'DEPT_IT', semester: 1, year: 1, credits: 4, description: 'Linear algebra, calculus, matrices, differential equations, Laplace transforms.' },
      { id: 'SUB_IT_103', code: 'IT103', name: 'Digital Logic Design', department_id: 'DEPT_IT', semester: 1, year: 1, credits: 3, description: 'Boolean algebra, combinational circuits, sequential circuits, flip-flops, registers, counters.' },
      { id: 'SUB_IT_104', code: 'IT104', name: 'Problem Solving and C Programming', department_id: 'DEPT_IT', semester: 1, year: 1, credits: 3, description: 'Algorithmic problem solving and structured programming.' },
      { id: 'SUB_IT_105', code: 'IT105', name: 'Computer Fundamentals', department_id: 'DEPT_IT', semester: 1, year: 1, credits: 3, description: 'Architecture, hardware components, number systems.' }
    ];

    subjects.forEach(sub => {
      db.run(`
        INSERT OR REPLACE INTO subjects (id, code, name, department_id, semester, year, credits, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [sub.id, sub.code, sub.name, sub.department_id, sub.semester, sub.year, sub.credits, sub.description]);
    });

    // 7. Insert Books Catalog
    const books = [
      {
        id: 'BK1001',
        isbn: '978-0078022159',
        title: 'Database System Concepts',
        author: 'Abraham Silberschatz, Henry F. Korth, S. Sudarshan',
        publisher: 'McGraw-Hill Education',
        edition: '7th Edition',
        publication_year: 2019,
        category: 'Computer Science',
        department_id: 'DEPT_IT',
        description: 'Comprehensive textbook on relational databases, query processing, transaction management, concurrency control, and distributed architectures.',
        keywords: 'database dbms sql korth silberschatz transactions relational acid indexing query-optimization',
        cover_image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80',
        sample_preview_url: 'https://www.db-book.com/db7/slide-dir/',
        avg_rating: 4.6,
        review_count: 128
      },
      {
        id: 'BK1000',
        isbn: '978-0133397077',
        title: 'Database Management Systems',
        author: 'Raghu Ramakrishnan, Johannes Gehrke',
        publisher: 'McGraw-Hill',
        edition: '3rd Edition',
        publication_year: 2014,
        category: 'Computer Science',
        department_id: 'DEPT_IT',
        description: 'This book provides a comprehensive introduction to database management systems, including design, implementation, and management of databases.',
        keywords: 'database dbms sql raghu ramakrishnan gehrke relational storage query transactions',
        cover_image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80',
        sample_preview_url: 'https://en.wikipedia.org/wiki/Database',
        avg_rating: 4.6,
        review_count: 128
      },
      {
        id: 'BK1002',
        isbn: '978-0133970777',
        title: 'Fundamentals of Database Systems',
        author: 'Ramez Elmasri, Shamkant B. Navathe',
        publisher: 'Pearson',
        edition: '7th Edition',
        publication_year: 2017,
        category: 'Computer Science',
        department_id: 'DEPT_IT',
        description: 'Leading introduction to database design, ER modeling, SQL querying, normalization, and modern NoSQL systems.',
        keywords: 'database dbms elmasri navathe sql er-model normalization nosql',
        cover_image: 'https://images.unsplash.com/photo-1532012164546-f432f2e3edd3?auto=format&fit=crop&w=400&q=80',
        sample_preview_url: 'https://en.wikipedia.org/wiki/Database',
        avg_rating: 4.4,
        review_count: 95
      },
      {
        id: 'BK1006',
        isbn: '978-1491957660',
        title: 'Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow',
        author: 'Aurélien Géron',
        publisher: "O'Reilly Media",
        edition: '2nd Edition',
        publication_year: 2019,
        category: 'Computer Science',
        department_id: 'DEPT_IT',
        description: 'Practical guide to building intelligent machine learning systems in Python using scikit-learn, neural networks, deep learning, and TensorFlow.',
        keywords: 'machine learning python ai deep learning neural networks scikit-learn tensorflow keras geron',
        cover_image: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&w=400&q=80',
        sample_preview_url: 'https://github.com/ageron/handson-ml2',
        avg_rating: 4.9,
        review_count: 67
      },
      {
        id: 'BK1007',
        isbn: '978-0070141698',
        title: 'Programming in C',
        author: 'E. Balagurusamy',
        publisher: 'Tata McGraw-Hill',
        edition: '8th Edition',
        publication_year: 2019,
        category: 'Computer Science',
        department_id: 'DEPT_IT',
        description: 'Comprehensive guide to ANSI C programming with clear explanations of arrays, pointers, functions, structures, and dynamic memory.',
        keywords: 'programming c balagurusamy pointers arrays functions algorithms',
        cover_image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=400&q=80',
        sample_preview_url: 'https://en.wikipedia.org/wiki/C_(programming_language)',
        avg_rating: 4.5,
        review_count: 84
      },
      {
        id: 'BK1008',
        isbn: '978-0070634152',
        title: 'Engineering Mathematics - I',
        author: 'B. S. Grewal',
        publisher: 'Khanna Publishers',
        edition: '44th Edition',
        publication_year: 2017,
        category: 'Mathematics',
        department_id: 'DEPT_GEN',
        description: 'Essential mathematics textbook for engineering undergraduates covering matrices, calculus, vector analysis, and differential equations.',
        keywords: 'mathematics engineering calculus linear algebra matrices differential equations grewal',
        cover_image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=400&q=80',
        sample_preview_url: 'https://en.wikipedia.org/wiki/Engineering_mathematics',
        avg_rating: 4.4,
        review_count: 76
      },
      {
        id: 'BK1009',
        isbn: '978-0132747189',
        title: 'Digital Logic Design',
        author: 'M. Morris Mano, Michael D. Ciletti',
        publisher: 'Pearson',
        edition: '5th Edition',
        publication_year: 2012,
        category: 'Electronics & Hardware',
        department_id: 'DEPT_ECE',
        description: 'Clear presentation of digital circuit design, logic gates, Karnaugh maps, sequential synchronous logic, and Verilog.',
        keywords: 'digital logic morris mano boolean gates flip-flops verilog hardware',
        cover_image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80',
        sample_preview_url: 'https://en.wikipedia.org/wiki/Digital_electronics',
        avg_rating: 4.3,
        review_count: 52
      },
      {
        id: 'BK1004',
        isbn: '978-0131103627',
        title: 'Data Structures and Algorithm Analysis in C',
        author: 'Mark Allen Weiss',
        publisher: 'Pearson',
        edition: '2nd Edition',
        publication_year: 2014,
        category: 'Computer Science',
        department_id: 'DEPT_IT',
        description: 'In-depth treatment of data structures, algorithm efficiency, stacks, queues, trees, heaps, hashing, and graph algorithms.',
        keywords: 'data structures algorithms weiss c trees heaps graphs sorting',
        cover_image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=400&q=80',
        sample_preview_url: 'https://en.wikipedia.org/wiki/Data_structure',
        avg_rating: 4.7,
        review_count: 65
      },
      {
        id: 'BK1005',
        isbn: '978-0073383095',
        title: 'Discrete Mathematics and its Applications',
        author: 'Kenneth H. Rosen',
        publisher: 'McGraw-Hill',
        edition: '7th Edition',
        publication_year: 2012,
        category: 'Mathematics',
        department_id: 'DEPT_IT',
        description: 'Mathematical foundation for computer science, covering logic, proofs, sets, functions, counting, relations, and graphs.',
        keywords: 'discrete mathematics rosen logic proofs sets combinatorics graphs',
        cover_image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=400&q=80',
        sample_preview_url: 'https://en.wikipedia.org/wiki/Discrete_mathematics',
        avg_rating: 4.6,
        review_count: 88
      },
      {
        id: 'BK1003',
        isbn: '978-1118063330',
        title: 'Operating System Concepts',
        author: 'Abraham Silberschatz, Peter B. Galvin, Greg Gagne',
        publisher: 'Wiley',
        edition: '10th Edition',
        publication_year: 2018,
        category: 'Computer Science',
        department_id: 'DEPT_IT',
        description: 'The definitive Dinosaur Book covering processes, scheduling, virtual memory, threads, deadlocks, and storage systems.',
        keywords: 'operating systems os silberschatz galvin memory process scheduling threads virtualization linux',
        cover_image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=400&q=80',
        sample_preview_url: 'https://os-book.com/OS10/slide-dir/',
        avg_rating: 4.8,
        review_count: 112
      },
      {
        id: 'BK1011',
        isbn: '978-8120305960',
        title: 'Problem Solving and C Programming',
        author: 'Yashavant Kanetkar',
        publisher: 'BPB Publications',
        edition: '5th Edition',
        publication_year: 2018,
        category: 'Computer Science',
        department_id: 'DEPT_IT',
        description: 'Step-by-step problem solving with C, control loops, arrays, structures, and algorithmic puzzles.',
        keywords: 'problem solving c kanetkar programming puzzles arrays',
        cover_image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=400&q=80',
        sample_preview_url: 'https://en.wikipedia.org/wiki/C_(programming_language)',
        avg_rating: 4.2,
        review_count: 45
      },
      {
        id: 'BK1012',
        isbn: '978-8120304994',
        title: 'Computer Fundamentals',
        author: 'P. K. Sinha, Priti Sinha',
        publisher: 'BPB Publications',
        edition: '6th Edition',
        publication_year: 2016,
        category: 'Computer Science',
        department_id: 'DEPT_IT',
        description: 'Foundational concepts of computing, hardware units, memory architecture, and digital representation.',
        keywords: 'computer fundamentals sinha hardware architecture memory',
        cover_image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=400&q=80',
        sample_preview_url: 'https://en.wikipedia.org/wiki/Computer',
        avg_rating: 4.1,
        review_count: 38
      }
    ];

    books.forEach(b => {
      db.run(`
        INSERT OR REPLACE INTO books (
          id, isbn, title, author, publisher, edition, publication_year, category,
          department_id, description, keywords, cover_image, sample_preview_url, avg_rating, review_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        b.id, b.isbn, b.title, b.author, b.publisher, b.edition, b.publication_year, b.category,
        b.department_id, b.description, b.keywords, b.cover_image, b.sample_preview_url, b.avg_rating, b.review_count
      ]);
    });

    // 8. Map Syllabus Books (Core Textbooks & References for Semester 1 and 4)
    const mappings = [
      { id: 'MAP_1', subject_id: 'SUB_IT_401', book_id: 'BK1001', mapping_type: 'CORE_TEXTBOOK', notes: 'Primary textbook for IT401 DBMS' },
      { id: 'MAP_2', subject_id: 'SUB_IT_401', book_id: 'BK1000', mapping_type: 'CORE_TEXTBOOK', notes: 'Core textbook for IT401 DBMS' },
      { id: 'MAP_3', subject_id: 'SUB_IT_401', book_id: 'BK1002', mapping_type: 'REFERENCE_BOOK', notes: 'Recommended reference for Relational Algebra and Normalization' },
      { id: 'MAP_3', subject_id: 'SUB_IT_402', book_id: 'BK1003', mapping_type: 'CORE_TEXTBOOK', notes: 'Prescribed textbook for IT402 OS' },
      { id: 'MAP_4', subject_id: 'SUB_IT_403', book_id: 'BK1004', mapping_type: 'CORE_TEXTBOOK', notes: 'Official textbook for IT403 Algorithms' },
      { id: 'MAP_5', subject_id: 'SUB_IT_405', book_id: 'BK1005', mapping_type: 'CORE_TEXTBOOK', notes: 'Prescribed textbook for IT405 Discrete Math' },
      // Sem 1
      { id: 'MAP_6', subject_id: 'SUB_IT_101', book_id: 'BK1007', mapping_type: 'CORE_TEXTBOOK', notes: 'Prescribed textbook for IT101 Programming in C' },
      { id: 'MAP_7', subject_id: 'SUB_IT_102', book_id: 'BK1008', mapping_type: 'CORE_TEXTBOOK', notes: 'Core textbook for Engineering Math I' },
      { id: 'MAP_8', subject_id: 'SUB_IT_103', book_id: 'BK1009', mapping_type: 'CORE_TEXTBOOK', notes: 'Core textbook for Digital Logic' },
      { id: 'MAP_9', subject_id: 'SUB_IT_104', book_id: 'BK1011', mapping_type: 'REFERENCE_BOOK', notes: 'Reference for Problem Solving' },
      { id: 'MAP_10', subject_id: 'SUB_IT_105', book_id: 'BK1012', mapping_type: 'REFERENCE_BOOK', notes: 'Reference for Computer Fundamentals' }
    ];

    mappings.forEach(m => {
      db.run(`
        INSERT OR REPLACE INTO syllabus_book_mappings (id, subject_id, book_id, mapping_type, notes)
        VALUES (?, ?, ?, ?, ?)
      `, [m.id, m.subject_id, m.book_id, m.mapping_type, m.notes]);
    });

    // 9. Physical Book Copies with Rack & Shelf Locations (5 physical copies for BK1001)
    const copies = [
      // BK1001: Database System Concepts (5 copies)
      { id: 'DBMS-001', book_id: 'BK1001', condition: BOOK_CONDITION.GOOD, status: BOOK_STATUS.ISSUED, building: 'Block A', floor: 'Floor 2', rack: 'Rack A12', shelf: 'Shelf 4' },
      { id: 'DBMS-002', book_id: 'BK1001', condition: BOOK_CONDITION.GOOD, status: BOOK_STATUS.AVAILABLE, building: 'Block A', floor: 'Floor 2', rack: 'Rack A12', shelf: 'Shelf 4' },
      { id: 'DBMS-003', book_id: 'BK1001', condition: BOOK_CONDITION.GOOD, status: BOOK_STATUS.AVAILABLE, building: 'Block A', floor: 'Floor 2', rack: 'Rack A12', shelf: 'Shelf 4' },
      { id: 'DBMS-004', book_id: 'BK1001', condition: BOOK_CONDITION.FAIR, status: BOOK_STATUS.AVAILABLE, building: 'Block A', floor: 'Floor 2', rack: 'Rack A12', shelf: 'Shelf 4' },
      { id: 'DBMS-005', book_id: 'BK1001', condition: BOOK_CONDITION.GOOD, status: BOOK_STATUS.RESERVED, building: 'Block A', floor: 'Floor 2', rack: 'Rack A12', shelf: 'Shelf 4' },

      // BK1000: Database Management Systems (5 copies)
      { id: 'DBMS-R-01', book_id: 'BK1000', condition: BOOK_CONDITION.GOOD, status: BOOK_STATUS.AVAILABLE, building: 'Block A', floor: 'Floor 2', rack: 'Rack A12', shelf: 'Shelf 4' },
      { id: 'DBMS-R-02', book_id: 'BK1000', condition: BOOK_CONDITION.GOOD, status: BOOK_STATUS.AVAILABLE, building: 'Block A', floor: 'Floor 2', rack: 'Rack A12', shelf: 'Shelf 4' },
      { id: 'DBMS-R-03', book_id: 'BK1000', condition: BOOK_CONDITION.GOOD, status: BOOK_STATUS.ISSUED, building: 'Block A', floor: 'Floor 2', rack: 'Rack A12', shelf: 'Shelf 4' },
      { id: 'DBMS-R-04', book_id: 'BK1000', condition: BOOK_CONDITION.GOOD, status: BOOK_STATUS.ISSUED, building: 'Block A', floor: 'Floor 2', rack: 'Rack A12', shelf: 'Shelf 4' },
      { id: 'DBMS-R-05', book_id: 'BK1000', condition: BOOK_CONDITION.GOOD, status: BOOK_STATUS.RESERVED, building: 'Block A', floor: 'Floor 2', rack: 'Rack A12', shelf: 'Shelf 4' },

      // BK1002: Fundamentals of Database Systems (4 copies)
      { id: 'ELM-001', book_id: 'BK1002', condition: BOOK_CONDITION.GOOD, status: BOOK_STATUS.AVAILABLE, building: 'Block A', floor: 'Floor 2', rack: 'Rack A13', shelf: 'Shelf 2' },
      { id: 'ELM-002', book_id: 'BK1002', condition: BOOK_CONDITION.GOOD, status: BOOK_STATUS.ISSUED, building: 'Block A', floor: 'Floor 2', rack: 'Rack A13', shelf: 'Shelf 2' },
      { id: 'ELM-003', book_id: 'BK1002', condition: BOOK_CONDITION.GOOD, status: BOOK_STATUS.ISSUED, building: 'Block A', floor: 'Floor 2', rack: 'Rack A13', shelf: 'Shelf 2' },
      { id: 'ELM-004', book_id: 'BK1002', condition: BOOK_CONDITION.GOOD, status: BOOK_STATUS.ISSUED, building: 'Block A', floor: 'Floor 2', rack: 'Rack A13', shelf: 'Shelf 2' },

      // BK1006: Hands-On Machine Learning (3 copies)
      { id: 'ML-001', book_id: 'BK1006', condition: BOOK_CONDITION.GOOD, status: BOOK_STATUS.AVAILABLE, building: 'Block A', floor: 'Floor 3', rack: 'Rack A20', shelf: 'Shelf 1' },
      { id: 'ML-002', book_id: 'BK1006', condition: BOOK_CONDITION.GOOD, status: BOOK_STATUS.AVAILABLE, building: 'Block A', floor: 'Floor 3', rack: 'Rack A20', shelf: 'Shelf 1' },
      { id: 'ML-003', book_id: 'BK1006', condition: BOOK_CONDITION.GOOD, status: BOOK_STATUS.AVAILABLE, building: 'Block A', floor: 'Floor 3', rack: 'Rack A20', shelf: 'Shelf 1' },

      // BK1007: Programming in C (5 copies)
      { id: 'C-001', book_id: 'BK1007', condition: BOOK_CONDITION.GOOD, status: BOOK_STATUS.AVAILABLE, building: 'Block B', floor: 'Floor 1', rack: 'Rack B01', shelf: 'Shelf 2' },
      { id: 'C-002', book_id: 'BK1007', condition: BOOK_CONDITION.GOOD, status: BOOK_STATUS.AVAILABLE, building: 'Block B', floor: 'Floor 1', rack: 'Rack B01', shelf: 'Shelf 2' },
      { id: 'C-003', book_id: 'BK1007', condition: BOOK_CONDITION.GOOD, status: BOOK_STATUS.AVAILABLE, building: 'Block B', floor: 'Floor 1', rack: 'Rack B01', shelf: 'Shelf 2' },
      { id: 'C-004', book_id: 'BK1007', condition: BOOK_CONDITION.GOOD, status: BOOK_STATUS.ISSUED, building: 'Block B', floor: 'Floor 1', rack: 'Rack B01', shelf: 'Shelf 2' },
      { id: 'C-005', book_id: 'BK1007', condition: BOOK_CONDITION.GOOD, status: BOOK_STATUS.ISSUED, building: 'Block B', floor: 'Floor 1', rack: 'Rack B01', shelf: 'Shelf 2' },

      // BK1008: Engineering Mathematics - I (4 copies)
      { id: 'MATH-001', book_id: 'BK1008', condition: BOOK_CONDITION.GOOD, status: BOOK_STATUS.AVAILABLE, building: 'Block B', floor: 'Floor 1', rack: 'Rack B04', shelf: 'Shelf 1' },
      { id: 'MATH-002', book_id: 'BK1008', condition: BOOK_CONDITION.GOOD, status: BOOK_STATUS.AVAILABLE, building: 'Block B', floor: 'Floor 1', rack: 'Rack B04', shelf: 'Shelf 1' },
      { id: 'MATH-003', book_id: 'BK1008', condition: BOOK_CONDITION.GOOD, status: BOOK_STATUS.ISSUED, building: 'Block B', floor: 'Floor 1', rack: 'Rack B04', shelf: 'Shelf 1' },
      { id: 'MATH-004', book_id: 'BK1008', condition: BOOK_CONDITION.GOOD, status: BOOK_STATUS.ISSUED, building: 'Block B', floor: 'Floor 1', rack: 'Rack B04', shelf: 'Shelf 1' },

      // BK1009: Digital Logic Design (3 copies)
      { id: 'DLD-001', book_id: 'BK1009', condition: BOOK_CONDITION.GOOD, status: BOOK_STATUS.ISSUED, building: 'Block B', floor: 'Floor 2', rack: 'Rack B10', shelf: 'Shelf 3' },
      { id: 'DLD-002', book_id: 'BK1009', condition: BOOK_CONDITION.GOOD, status: BOOK_STATUS.ISSUED, building: 'Block B', floor: 'Floor 2', rack: 'Rack B10', shelf: 'Shelf 3' },
      { id: 'DLD-003', book_id: 'BK1009', condition: BOOK_CONDITION.GOOD, status: BOOK_STATUS.RESERVED, building: 'Block B', floor: 'Floor 2', rack: 'Rack B10', shelf: 'Shelf 3' },

      // BK1004: Data Structures (5 copies)
      { id: 'DS-001', book_id: 'BK1004', condition: BOOK_CONDITION.GOOD, status: BOOK_STATUS.ISSUED, building: 'Block A', floor: 'Floor 1', rack: 'Rack A05', shelf: 'Shelf 2' },
      { id: 'DS-002', book_id: 'BK1004', condition: BOOK_CONDITION.GOOD, status: BOOK_STATUS.AVAILABLE, building: 'Block A', floor: 'Floor 1', rack: 'Rack A05', shelf: 'Shelf 2' },
      { id: 'DS-003', book_id: 'BK1004', condition: BOOK_CONDITION.GOOD, status: BOOK_STATUS.AVAILABLE, building: 'Block A', floor: 'Floor 1', rack: 'Rack A05', shelf: 'Shelf 2' },
      { id: 'DS-004', book_id: 'BK1004', condition: BOOK_CONDITION.GOOD, status: BOOK_STATUS.AVAILABLE, building: 'Block A', floor: 'Floor 1', rack: 'Rack A05', shelf: 'Shelf 2' },
      { id: 'DS-005', book_id: 'BK1004', condition: BOOK_CONDITION.GOOD, status: BOOK_STATUS.ISSUED, building: 'Block A', floor: 'Floor 1', rack: 'Rack A05', shelf: 'Shelf 2' },

      // BK1005: Discrete Mathematics (4 copies)
      { id: 'DM-001', book_id: 'BK1005', condition: BOOK_CONDITION.GOOD, status: BOOK_STATUS.ISSUED, building: 'Block B', floor: 'Floor 1', rack: 'Rack B08', shelf: 'Shelf 4' },
      { id: 'DM-002', book_id: 'BK1005', condition: BOOK_CONDITION.GOOD, status: BOOK_STATUS.AVAILABLE, building: 'Block B', floor: 'Floor 1', rack: 'Rack B08', shelf: 'Shelf 4' },
      { id: 'DM-003', book_id: 'BK1005', condition: BOOK_CONDITION.GOOD, status: BOOK_STATUS.AVAILABLE, building: 'Block B', floor: 'Floor 1', rack: 'Rack B08', shelf: 'Shelf 4' },
      { id: 'DM-004', book_id: 'BK1005', condition: BOOK_CONDITION.GOOD, status: BOOK_STATUS.ISSUED, building: 'Block B', floor: 'Floor 1', rack: 'Rack B08', shelf: 'Shelf 4' },

      // BK1003: Operating Systems (4 copies)
      { id: 'OS-001', book_id: 'BK1003', condition: BOOK_CONDITION.GOOD, status: BOOK_STATUS.ISSUED, building: 'Block A', floor: 'Floor 2', rack: 'Rack A15', shelf: 'Shelf 1' },
      { id: 'OS-002', book_id: 'BK1003', condition: BOOK_CONDITION.GOOD, status: BOOK_STATUS.AVAILABLE, building: 'Block A', floor: 'Floor 2', rack: 'Rack A15', shelf: 'Shelf 1' },
      { id: 'OS-003', book_id: 'BK1003', condition: BOOK_CONDITION.GOOD, status: BOOK_STATUS.AVAILABLE, building: 'Block A', floor: 'Floor 2', rack: 'Rack A15', shelf: 'Shelf 1' },
      { id: 'OS-004', book_id: 'BK1003', condition: BOOK_CONDITION.GOOD, status: BOOK_STATUS.ISSUED, building: 'Block A', floor: 'Floor 2', rack: 'Rack A15', shelf: 'Shelf 1' },

      // BK1011: Problem Solving (6 copies)
      { id: 'PS-001', book_id: 'BK1011', condition: BOOK_CONDITION.GOOD, status: BOOK_STATUS.AVAILABLE, building: 'Block B', floor: 'Floor 1', rack: 'Rack B03', shelf: 'Shelf 1' },
      { id: 'PS-002', book_id: 'BK1011', condition: BOOK_CONDITION.GOOD, status: BOOK_STATUS.AVAILABLE, building: 'Block B', floor: 'Floor 1', rack: 'Rack B03', shelf: 'Shelf 1' },
      { id: 'PS-003', book_id: 'BK1011', condition: BOOK_CONDITION.GOOD, status: BOOK_STATUS.ISSUED, building: 'Block B', floor: 'Floor 1', rack: 'Rack B03', shelf: 'Shelf 1' },
      { id: 'PS-004', book_id: 'BK1011', condition: BOOK_CONDITION.GOOD, status: BOOK_STATUS.ISSUED, building: 'Block B', floor: 'Floor 1', rack: 'Rack B03', shelf: 'Shelf 1' },
      { id: 'PS-005', book_id: 'BK1011', condition: BOOK_CONDITION.GOOD, status: BOOK_STATUS.ISSUED, building: 'Block B', floor: 'Floor 1', rack: 'Rack B03', shelf: 'Shelf 1' },
      { id: 'PS-006', book_id: 'BK1011', condition: BOOK_CONDITION.GOOD, status: BOOK_STATUS.ISSUED, building: 'Block B', floor: 'Floor 1', rack: 'Rack B03', shelf: 'Shelf 1' },

      // BK1012: Computer Fundamentals (7 copies)
      { id: 'CF-001', book_id: 'BK1012', condition: BOOK_CONDITION.GOOD, status: BOOK_STATUS.AVAILABLE, building: 'Block B', floor: 'Floor 1', rack: 'Rack B02', shelf: 'Shelf 3' },
      { id: 'CF-002', book_id: 'BK1012', condition: BOOK_CONDITION.GOOD, status: BOOK_STATUS.AVAILABLE, building: 'Block B', floor: 'Floor 1', rack: 'Rack B02', shelf: 'Shelf 3' },
      { id: 'CF-003', book_id: 'BK1012', condition: BOOK_CONDITION.GOOD, status: BOOK_STATUS.AVAILABLE, building: 'Block B', floor: 'Floor 1', rack: 'Rack B02', shelf: 'Shelf 3' },
      { id: 'CF-004', book_id: 'BK1012', condition: BOOK_CONDITION.GOOD, status: BOOK_STATUS.AVAILABLE, building: 'Block B', floor: 'Floor 1', rack: 'Rack B02', shelf: 'Shelf 3' },
      { id: 'CF-005', book_id: 'BK1012', condition: BOOK_CONDITION.GOOD, status: BOOK_STATUS.ISSUED, building: 'Block B', floor: 'Floor 1', rack: 'Rack B02', shelf: 'Shelf 3' },
      { id: 'CF-006', book_id: 'BK1012', condition: BOOK_CONDITION.GOOD, status: BOOK_STATUS.ISSUED, building: 'Block B', floor: 'Floor 1', rack: 'Rack B02', shelf: 'Shelf 3' },
      { id: 'CF-007', book_id: 'BK1012', condition: BOOK_CONDITION.GOOD, status: BOOK_STATUS.ISSUED, building: 'Block B', floor: 'Floor 1', rack: 'Rack B02', shelf: 'Shelf 3' }
    ];

    copies.forEach(c => {
      db.run(`
        INSERT OR REPLACE INTO book_copies (id, book_id, condition, status, building, floor, rack, shelf, purchase_date, acquisition_source)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, '2024-01-15', 'MIT Central Library Grant')
      `, [c.id, c.book_id, c.condition, c.status, c.building, c.floor, c.rack, c.shelf]);
    });

    // 10. Issued Books for Student Karthik R (STU2024001)
    const now = new Date('2026-08-26T11:45:00Z');

    // Book 1: Operating Systems (TXN_1001)
    const osBorrowedDate = new Date(now.getTime() - (12 * 24 * 60 * 60 * 1000)).toISOString();
    const osDueDate = new Date(now.getTime() + (2 * 24 * 60 * 60 * 1000)).toISOString();
    
    db.run(`
      INSERT OR REPLACE INTO borrow_transactions (id, book_id, copy_id, student_id, issued_by, borrowed_date, due_date, renewal_count, max_renewals, status)
      VALUES ('TXN_1001', 'BK1003', 'OS-001', 'USR_STU_1', 'USR_LIB_1', ?, ?, 1, 2, 'ACTIVE')
    `, [osBorrowedDate, osDueDate]);

    // Renewal record for OS-001
    db.run(`
      INSERT OR REPLACE INTO renewal_history (id, transaction_id, book_id, student_id, previous_due_date, new_due_date, renewed_at)
      VALUES ('RNW_1001', 'TXN_1001', 'BK1003', 'USR_STU_1', ?, ?, ?)
    `, [
      new Date(now.getTime() - (12 * 24 * 60 * 60 * 1000) + (14 * 24 * 60 * 60 * 1000)).toISOString(),
      osDueDate,
      new Date(now.getTime() - (5 * 24 * 60 * 60 * 1000)).toISOString()
    ]);

    // Book 2: Database System Concepts (DBMS-001) - Overdue by 4 days!
    const dbmsBorrowedDate = new Date(now.getTime() - (18 * 24 * 60 * 60 * 1000)).toISOString();
    const dbmsDueDate = new Date(now.getTime() - (4 * 24 * 60 * 60 * 1000)).toISOString();

    db.run(`
      INSERT OR REPLACE INTO borrow_transactions (id, book_id, copy_id, student_id, issued_by, borrowed_date, due_date, renewal_count, max_renewals, status)
      VALUES ('TXN_1002', 'BK1001', 'DBMS-001', 'USR_STU_1', 'USR_LIB_1', ?, ?, 0, 2, 'OVERDUE')
    `, [dbmsBorrowedDate, dbmsDueDate]);

    // Overdue fine for DBMS-001 (4 days * ₹1/day = ₹4)
    db.run(`
      INSERT OR REPLACE INTO fines (id, transaction_id, student_id, book_id, overdue_days, fine_rate, fine_amount, reason, status)
      VALUES ('FINE_1001', 'TXN_1002', 'USR_STU_1', 'BK1001', 4, 1.0, 4.0, 'Overdue return by 4 days', 'UNPAID')
    `);

    // Book 3: Discrete Mathematics (DM-001)
    const dmBorrowedDate = new Date(now.getTime() - (1 * 24 * 60 * 60 * 1000)).toISOString();
    const dmDueDate = new Date(now.getTime() + (13 * 24 * 60 * 60 * 1000)).toISOString();

    db.run(`
      INSERT OR REPLACE INTO borrow_transactions (id, book_id, copy_id, student_id, issued_by, borrowed_date, due_date, renewal_count, max_renewals, status)
      VALUES ('TXN_1003', 'BK1005', 'DM-001', 'USR_STU_1', 'USR_LIB_1', ?, ?, 0, 2, 'ACTIVE')
    `, [dmBorrowedDate, dmDueDate]);

    // Active reservation for Student Karthik R
    db.run(`
      INSERT OR REPLACE INTO reservations (id, book_id, student_id, copy_id, reserved_at, expires_at, status, queue_position)
      VALUES ('RES_1001', 'BK1001', 'USR_STU_1', 'DBMS-005', ?, ?, 'READY_FOR_PICKUP', 1)
    `, [
      new Date(now.getTime() - (6 * 60 * 60 * 1000)).toISOString(),
      new Date(now.getTime() + (42 * 60 * 60 * 1000)).toISOString()
    ]);

    // 11. Book Reviews
    const reviews = [
      { id: 'REV_1', book_id: 'BK1001', student_id: 'USR_STU_1', rating: 5, review_title: 'Must-read for DBMS concepts', review_text: 'Very useful for understanding relational algebra, B-Trees, and transaction ACID properties. The exercises match university exams perfectly.' },
      { id: 'REV_2', book_id: 'BK1003', student_id: 'USR_STU_2', rating: 5, review_title: 'Clear memory management explanations', review_text: 'The dinosaur book is great for understanding virtual memory and deadlock prevention algorithms.' },
      { id: 'REV_3', book_id: 'BK1004', student_id: 'USR_STU_3', rating: 5, review_title: 'The bible of algorithms', review_text: 'Rigorous mathematical analysis of dynamic programming and shortest path algorithms. Highly recommended!' }
    ];

    reviews.forEach(r => {
      db.run(`
        INSERT OR REPLACE INTO book_reviews (id, book_id, student_id, rating, review_title, review_text, is_verified_borrower)
        VALUES (?, ?, ?, ?, ?, ?, 1)
      `, [r.id, r.book_id, r.student_id, r.rating, r.review_title, r.review_text]);
    });

    // 12. Academic Resources (Matching exact screenshot)
    const resources = [
      {
        id: 'RES_101',
        title: 'DBMS Question Paper - Apr 2024',
        description: 'Official university previous-year question paper with solution outlines for Unit 1 to 5.',
        department_id: 'DEPT_IT',
        semester: 4,
        subject_id: 'SUB_IT_401',
        resource_type: 'QUESTION_PAPER',
        file_path: '/uploads/sample_dbms_pyq_2024.pdf',
        file_name: 'DBMS_Apr_2024.pdf',
        file_size: 1450200,
        mime_type: 'application/pdf',
        uploaded_by: 'USR_STU_1',
        uploader_role: ROLES.STUDENT,
        status: RESOURCE_STATUS.APPROVED,
        download_count: 1200,
        avg_rating: 4.7,
        rating_count: 86
      },
      {
        id: 'RES_102',
        title: 'Data Structures Notes',
        description: 'Concise lecture summary notes including trees, graphs, sorting, and recursion patterns.',
        department_id: 'DEPT_IT',
        semester: 4,
        subject_id: 'SUB_IT_403',
        resource_type: 'NOTES',
        file_path: '/uploads/sample_ds_notes.pdf',
        file_name: 'DS_Comprehensive_Notes.pdf',
        file_size: 892000,
        mime_type: 'application/pdf',
        uploaded_by: 'USR_STU_2',
        uploader_role: ROLES.STUDENT,
        status: RESOURCE_STATUS.APPROVED,
        download_count: 858,
        avg_rating: 4.6,
        rating_count: 54
      },
      {
        id: 'RES_103',
        title: 'Operating Systems Unit 1 Notes',
        description: 'Complete step-by-step notes for CPU Scheduling, Process Synchronization, and IPC.',
        department_id: 'DEPT_IT',
        semester: 4,
        subject_id: 'SUB_IT_402',
        resource_type: 'NOTES',
        file_path: '/uploads/sample_os_unit1.pdf',
        file_name: 'OS_Unit1_Notes.pdf',
        file_size: 1100000,
        mime_type: 'application/pdf',
        uploaded_by: 'USR_STU_1',
        uploader_role: ROLES.STUDENT,
        status: RESOURCE_STATUS.APPROVED,
        download_count: 644,
        avg_rating: 4.5,
        rating_count: 42
      },
      {
        id: 'RES_104',
        title: 'DBMS Complete Notes',
        description: 'Full syllabus handwritten and digitized notes covering Normalization, Relational Calculus, and Indexing.',
        department_id: 'DEPT_IT',
        semester: 4,
        subject_id: 'SUB_IT_401',
        resource_type: 'NOTES',
        file_path: '/uploads/sample_dbms_complete.pdf',
        file_name: 'DBMS_Complete_Notes.pdf',
        file_size: 2400000,
        mime_type: 'application/pdf',
        uploaded_by: 'USR_STU_1',
        uploader_role: ROLES.STUDENT,
        status: RESOURCE_STATUS.APPROVED,
        download_count: 923,
        avg_rating: 4.6,
        rating_count: 68
      }
    ];

    resources.forEach(res => {
      db.run(`
        INSERT OR REPLACE INTO academic_resources (
          id, title, description, department_id, semester, subject_id, resource_type,
          file_path, file_name, file_size, mime_type, uploaded_by, uploader_role,
          copyright_confirmed, status, download_count, avg_rating, rating_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
      `, [
        res.id, res.title, res.description, res.department_id, res.semester, res.subject_id, res.resource_type,
        res.file_path, res.file_name, res.file_size, res.mime_type, res.uploaded_by, res.uploader_role,
        res.status, res.download_count, res.avg_rating, res.rating_count
      ]);
    });

    // 13. Student-Librarian Tickets
    db.run(`
      INSERT OR REPLACE INTO tickets (id, student_id, category, subject, description, book_id, expected_location, priority, status, assigned_to)
      VALUES ('LIB-10234', 'USR_STU_1', 'BOOK_NOT_FOUND', 'Book not found at Block A, Rack A12', 'The portal shows 2 copies of Database Management Systems available, but I searched Rack A12 Shelf 4 and need assistance.', 'BK1001', 'Block A > Floor 2 > Rack A12 > Shelf 4', 'MEDIUM', 'IN_PROGRESS', 'USR_LIB_1')
    `);

    db.run(`
      INSERT OR REPLACE INTO ticket_messages (id, ticket_id, sender_id, sender_role, message)
      VALUES ('MSG_1', 'LIB-10234', 'USR_STU_1', 'STUDENT', 'The website shows 2 copies available, but I cannot locate it on Shelf 4. Can you please check if it is being processed at the desk?')
    `);

    db.run(`
      INSERT OR REPLACE INTO ticket_messages (id, ticket_id, sender_id, sender_role, message)
      VALUES ('MSG_2', 'LIB-10234', 'USR_LIB_1', 'LIBRARIAN', 'Hello Karthik, one copy was just checked in at 11:00 AM and is placed at the circulation hold desk for you.')
    `);

    // 14. Book Request Approval Workflow (Request 1: HOD Approved -> In Admin queue; Request 2: Pending at HOD)
    db.run(`
      INSERT OR REPLACE INTO book_requests (
        id, student_id, title, author, isbn, publisher, edition, department_id, semester, subject_id,
        reason, priority, hod_status, hod_id, hod_notes, hod_action_at, admin_status
      ) VALUES (
        'REQ_1001', 'USR_STU_1', 'Designing Data-Intensive Applications', 'Martin Kleppmann', '978-1449373320',
        "O'Reilly Media", '1st Edition', 'DEPT_IT', 4, 'SUB_IT_401',
        'Required for Semester 4 Advanced Database & Distributed Systems elective course.',
        'HIGH', 'APPROVED', 'USR_HOD_IT', 'Recommended for Department Curriculum. High student demand.',
        datetime('now', '-1 day'), 'PENDING'
      )
    `);

    db.run(`
      INSERT OR REPLACE INTO book_requests (
        id, student_id, title, author, isbn, publisher, edition, department_id, semester, subject_id,
        reason, priority, hod_status, admin_status, procurement_status
      ) VALUES (
        'REQ_1002', 'USR_STU_1', 'Artificial Intelligence: A Modern Approach', 'Stuart Russell, Peter Norvig', '978-0134610993',
        'Pearson', '4th Edition', 'DEPT_IT', 4, 'SUB_IT_401',
        'Highly recommended for our AI & Machine Learning semester projects.', 'HIGH', 'PENDING', 'PENDING', 'PENDING'
      )
    `);

    // 15. Real-Time Crowd Simulation (135 active visitors = 45% Moderate occupancy)
    for (let i = 1; i <= 135; i++) {
      const entryOffsetMinutes = Math.floor(Math.random() * 180) + 5;
      db.run(`
        INSERT OR REPLACE INTO library_visits (id, student_id, entry_time, status)
        VALUES (?, ?, datetime('now', ?), 'ACTIVE')
      `, [`VISIT_ACT_${i}`, 'USR_STU_1', `-${entryOffsetMinutes} minutes`]);
    }

    console.log('✅ Madras Institute of Technology (MIT) Library Seed Completed Successfully!');
  });
}

if (require.main === module) {
  seed()
    .then(() => {
      console.log('🚀 Seeding complete.');
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Seeding error:', err);
      process.exit(1);
    });
}

module.exports = { seed };
