const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const app = express();
const session = require('express-session');
const cors = require('cors');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
dayjs.extend(utc);
const BD_OFFSET = 6 * 60; 
app.use(cors({
  origin: 'http://localhost:4444',
  credentials: true
}));
app.use(session({
  secret: 'your-secret-key',    
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24   // 1 day session
  }
}));
const PORT = process.env.PORT || 4444;
// Middleware for parsing urlencoded form data
app.use(express.urlencoded({ extended: true }));
// Serve static files
app.use(express.static(path.join(__dirname, 'static')));
// Setup multer for file uploads (profile picture)
const storage = multer.memoryStorage();
const upload = multer({ storage });
// MySQL connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'gym',
});
// Helper to validate email format
function validateEmail(email) {
  const re = /\S+@\S+\.\S+/;
  return re.test(email);
}

// Signup POST handler  for clients
app.post('/signup', upload.single('ProfilePic'), async (req, res) => {
  try {
    const {
      FullName,
      Email,
      Password,
      Phone,
      Gender,
      DOB,
      Address,
      City,
      Country,
    } = req.body;
    // Simple validation
    if (!FullName || !Email || !Password || !Phone || !Gender || !DOB || !Address || !City || !Country) {
      return res.status(400).json({ success: false, message: 'Please fill in all required fields.' });
    }
    if (!validateEmail(Email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format.' });
    }
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(Password, saltRounds);
    const profilePicBuffer = req.file ? req.file.buffer : null;
    const sql = `
      INSERT INTO clients (
        FullName, Email, PasswordHash, Phone, Gender, DOB, Address, City, Country, ProfilePic
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      FullName,
      Email,
      hashedPassword,
      Phone,
      Gender,
      DOB,
      Address,
      City,
      Country,
      profilePicBuffer,
    ];
    const [result] = await pool.execute(sql, params);
    res.json({ success: true, message: 'Signup successful!', clientId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error during signup.' });
  }
});
// Login POST handler for all users
app.post('/login', async (req, res) => {
  try {
    const { email, password, userType } = req.body;

    console.log('--- Login Request Received ---');
    console.log('Email:', email);
    console.log('Password (hidden for security)');
    console.log('User Type:', userType);

    if (!email || !password || !userType) {
      console.log('❌ Missing required fields.');
      return res.status(400).json({ success: false, message: 'Please fill in all fields.' });
    }

    if (!validateEmail(email)) {
      console.log('❌ Invalid email format.');
      return res.status(400).json({ success: false, message: 'Invalid email format.' });
    }

    let tableName, idField;
    switch (userType.toLowerCase()) {
      case 'client':
        tableName = 'clients';
        idField = 'ClientID';
        break;
      case 'admin':
        tableName = 'admins';
        idField = 'AdminID';
        break;
      case 'trainer':
        tableName = 'trainers';
        idField = 'TrainerID';
        break;
      default:
        console.log('❌ Invalid user type:', userType);
        return res.status(400).json({ success: false, message: 'Invalid user type.' });
    }

    console.log(`🔍 Querying table: ${tableName} for email: ${email}`);

    const [rows] = await pool.execute(`SELECT * FROM ${tableName} WHERE Email = ?`, [email]);

    if (rows.length === 0) {
      console.log(`❌ No user found in ${tableName} with email ${email}`);
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    const user = rows[0];
    console.log('✅ User found:', user.Email);

    if (!user.PasswordHash) {
      console.log(`❌ PasswordHash missing for user: ${user.Email}`);
      return res.status(500).json({ success: false, message: 'Password not set for this account.' });
    }

    console.log('🔐 Comparing password...');
    const match = await bcrypt.compare(password, user.PasswordHash.toString());

    if (!match) {
      console.log('❌ Incorrect password for:', email);
      return res.status(401).json({ success: false, message: 'Incorrect password.' });
    }
    // Save session
    req.session.userId = user[idField];
    req.session.userName = user.FullName;
    req.session.userEmail = user.Email;
    req.session.userType = userType;

    console.log(`✅ Login successful for ${userType}: ${user.FullName}`);

    const response = {
      success: true,
      message: `Welcome back, ${user.FullName}!`,
      userType: userType.toLowerCase(),
    };

    if (userType.toLowerCase() === 'admin') {
      response.adminId = user[idField];
    } else if (userType.toLowerCase() === 'trainer') {
      response.trainerId = user[idField];
    } else {
      response.clientId = user[idField];
    }

    res.json(response);

  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});
// bcrypt.hash('12341234', 10).then(console.log); // for manually hashing pass
app.get('/profile', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized - not logged in' });
  }
  try {
    const [rows] = await pool.execute(`
      SELECT 
        ClientID, FullName, Email, Phone, Gender, DOB, Address, City, Country,
        TO_BASE64(ProfilePic) AS ProfilePic  -- convert binary to base64 for front-end
      FROM clients WHERE ClientID = ?
    `, [req.session.userId]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
app.post('/update-profile', upload.single('ProfilePic'), async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const { FullName, Phone, City, Country, Address } = req.body;
  const profilePicBuffer = req.file ? req.file.buffer : null;

  try {
    if (profilePicBuffer) {
      await pool.execute(`
        UPDATE clients 
        SET FullName = ?, Phone = ?, City = ?, Country = ?, Address = ?, ProfilePic = ?
        WHERE ClientID = ?`,
        [FullName, Phone, City, Country, Address, profilePicBuffer, req.session.userId]);
    } else {
      await pool.execute(`
        UPDATE clients 
        SET FullName = ?, Phone = ?, City = ?, Country = ?, Address = ?
        WHERE ClientID = ?`,
        [FullName, Phone, City, Country, Address, req.session.userId]);
    }

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});
app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Session destruction failed:', err);
      return res.status(500).json({ success: false, message: 'Logout failed' });
    }
    res.clearCookie('connect.sid'); // name of default session cookie
    res.json({ success: true, message: 'Logged out successfully' });
  });
});
app.get('/api/virtualclasses', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT ClassID, Title, Description, StartTime, DurationMinutes, Platform, JoinLink 
      FROM virtualclasses
      ORDER BY StartTime ASC
    `);
    res.json({ success: true, classes: rows });
  } catch (err) {
    console.error('Error fetching virtual classes:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
app.get('/api/attendance', async (req, res) => {
  const clientId = req.session.userId;
  const [rows] = await pool.execute(`
    SELECT * FROM attendance 
    WHERE ClientID = ? 
    ORDER BY CheckInTime DESC 
    LIMIT 7
  `, [clientId]);

  res.json({ success: true, records: rows });
});
app.post('/api/attendance/checkin', async (req, res) => {
  const clientId = req.session?.userId;
  if (!clientId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  try {
    const todayBD = dayjs().utcOffset(BD_OFFSET).format('YYYY-MM-DD');

    const [existing] = await pool.execute(
      `SELECT * FROM attendance WHERE ClientID = ? AND DATE(CONVERT_TZ(CheckInTime, '+00:00', '+06:00')) = ?`,
      [clientId, todayBD]
    );

    if (existing.length > 0) {
      return res.json({ success: false, message: 'Already checked in today' });
    }

    const nowUtc = dayjs().utc().format('YYYY-MM-DD HH:mm:ss');

    await pool.execute(
      `INSERT INTO attendance (ClientID, CheckInTime, Method) VALUES (?, ?, 'Manual')`,
      [clientId, nowUtc]
    );

    res.json({ success: true, message: 'Checked in successfully' });
  } catch (err) {
    console.error('Check-in error:', err);
    res.status(500).json({ success: false, message: 'Check-in failed' });
  }
});

app.post('/api/attendance/checkout', async (req, res) => {
  const clientId = req.session?.userId;
  if (!clientId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  try {
    const todayBD = dayjs().utcOffset(BD_OFFSET).format('YYYY-MM-DD');

    const [recordResult] = await pool.execute(
      `SELECT * FROM attendance WHERE ClientID = ? AND DATE(CONVERT_TZ(CheckInTime, '+00:00', '+06:00')) = ? ORDER BY CheckInTime DESC LIMIT 1`,
      [clientId, todayBD]
    );

    if (recordResult.length === 0) {
      return res.json({ success: false, message: 'No check-in record found for today.' });
    }

    const record = recordResult[0];

    if (record.CheckOutTime) {
      return res.json({ success: false, message: 'Already checked out.' });
    }

    const nowUtc = dayjs().utc();
    const checkInUtc = dayjs.utc(record.CheckInTime);

    if (nowUtc.isBefore(checkInUtc)) {
      return res.json({ success: false, message: 'Check-out must be after check-in.' });
    }

    const nowUtcFormatted = nowUtc.format('YYYY-MM-DD HH:mm:ss');

    await pool.execute(
      `UPDATE attendance SET CheckOutTime = ? WHERE AttendanceID = ?`,
      [nowUtcFormatted, record.AttendanceID]
    );

    res.json({ success: true, message: 'Checked out successfully.' });
  } catch (err) {
    console.error('Check-out error:', err);
    res.status(500).json({ success: false, message: 'Server error during check-out.' });
  }
});
app.post('/api/healthlog', express.json(), async (req, res) => {
  const clientId = req.session.userId;
  if (!clientId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  const { Weight, Calories, WaterIntakeLitres, SleepHours, WorkoutDescription } = req.body;
  if (!Weight || !Calories || !WaterIntakeLitres || !SleepHours) {
    return res.json({ success: false, message: 'All fields except workout notes are required.' });
  }
  try {
    await pool.execute(`
      INSERT INTO healthlogs (ClientID, Weight, Calories, WaterIntakeLitres, SleepHours, WorkoutDescription, LogDate)
      VALUES (?, ?, ?, ?, ?, ?, CURDATE())
    `, [clientId, Weight, Calories, WaterIntakeLitres, SleepHours, WorkoutDescription]);

    res.json({ success: true, message: 'Daily log submitted.' });
  } catch (err) {
    console.error('Insert error:', err);
    res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
});
app.get('/api/healthlog', async (req, res) => {
  const clientId = req.session.userId;
  if (!clientId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const [rows] = await pool.execute(`
      SELECT * FROM healthlogs 
      WHERE ClientID = ? 
      ORDER BY LogDate DESC
      LIMIT 7
    `, [clientId]);

    res.json({ success: true, logs: rows });
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch health logs.' });
  }
});

// Fetch client notifications
app.get('/notifications', async (req, res) => {
  try {
    const clientId = req.session.userId;

    if (!clientId) {
      return res.status(401).json({ success: false, message: 'Not logged in.' });
    }

    const [notifications] = await pool.execute(
      `SELECT NotificationID, Message, Type, IsRead, TrainerID,
              DATE_FORMAT(SentAt, '%Y-%m-%d %H:%i:%s') as SentAt 
       FROM notifications 
       WHERE ClientID = ? 
       ORDER BY SentAt DESC`, 
      [clientId]
    );

    res.json({ success: true, notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Error fetching notifications.' });
  }
});






// Get trainer profile
app.get('/trainer/profile', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized - not logged in' });
  }

  try {
    const [rows] = await pool.execute(`
      SELECT 
        TrainerID, FullName, Email, Phone, Gender, DOB, Address, City, Country,
        Qualifications, Expertise, IntroVideoURL, DateJoined,
        CertTitle, CertIssuer, CertYear, CertID,
        TO_BASE64(ProfilePic) AS ProfilePicBase64,
        TO_BASE64(CertFile) AS CertFileBase64
      FROM trainers WHERE TrainerID = ?
    `, [req.session.userId]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Trainer not found' });
    }

    res.json({ success: true, trainer: rows[0] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error fetching trainer profile' });
  }
});
// Update trainer profile
const cpUpload = upload.fields([
  { name: 'ProfilePic', maxCount: 1 },
  { name: 'CertFile', maxCount: 1 }
]);

app.post('/trainer/profile/update', cpUpload, async (req, res) => {
  const trainerId = req.session.userId;
  if (!trainerId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  const {
    FullName, Phone, Gender, DOB, Address, City, Country,
    Qualifications, Expertise, IntroVideoURL,
    CertTitle, CertIssuer, CertYear, CertID
  } = req.body;
  const profilePicBuffer = req.files['ProfilePic']?.[0]?.buffer || null;
  const certFileBuffer = req.files['CertFile']?.[0]?.buffer || null;
  // Dynamically build SET clause and values
  const fields = [
    'FullName', 'Phone', 'Gender', 'DOB', 'Address',
    'City', 'Country', 'Qualifications', 'Expertise',
    'IntroVideoURL', 'CertTitle', 'CertIssuer', 'CertYear', 'CertID'
  ];
  const values = [
    FullName, Phone, Gender, DOB, Address,
    City, Country, Qualifications, Expertise,
    IntroVideoURL, CertTitle, CertIssuer, CertYear, CertID
  ];

  if (profilePicBuffer) {
    fields.push('ProfilePic');
    values.push(profilePicBuffer);
  }

  if (certFileBuffer) {
    fields.push('CertFile');
    values.push(certFileBuffer);
  }

  const setClause = fields.map(f => `${f} = ?`).join(', ');
  values.push(trainerId);

  try {
    await pool.execute(`
      UPDATE trainers SET ${setClause}
      WHERE TrainerID = ?
    `, values);

    res.json({ success: true, message: 'Profile updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error updating profile.' });
  }
});


 
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
