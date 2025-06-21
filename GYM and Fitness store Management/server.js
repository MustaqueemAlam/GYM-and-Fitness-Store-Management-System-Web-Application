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

app.use(express.json());       // to parse JSON bodies 
app.use(express.urlencoded({ extended: true })); // to parse URL-encoded bodies (form submissions)

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
///fetch client daily goals
// Route to get fitness goals for the logged-in client
app.get('/goals/me', async (req, res) => {
  const clientId = req.session.userId;
  const userType = req.session.userType;

  if (!clientId || userType !== 'client') {
    return res.status(401).json({ error: 'Unauthorized. Please log in as a client.' });
  }

  try {
    const [rows] = await pool.execute(
      'SELECT * FROM fitnessgoals WHERE ClientID = ? ORDER BY TargetDate',
      [clientId]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching goals:', err);
    res.status(500).json({ error: 'Failed to fetch fitness goals.' });
  }
});
//update progress
app.put('/goals/update-status/:goalId', async (req, res) => {
  const clientId = req.session.userId;
  const userType = req.session.userType;

  if (!clientId || userType !== 'client') {
    return res.status(401).json({ success: false, message: 'Unauthorized.' });
  }

  const goalId = req.params.goalId;
  const { isAchieved } = req.body;

  try {
    const [check] = await pool.execute(
      'SELECT * FROM fitnessgoals WHERE GoalID = ? AND ClientID = ?',
      [goalId, clientId]
    );

    if (check.length === 0) {
      return res.status(404).json({ success: false, message: 'Goal not found or not yours.' });
    }

    await pool.execute(
      'UPDATE fitnessgoals SET IsAchieved = ? WHERE GoalID = ?',
      [isAchieved ? 1 : 0, goalId]
    );

    res.json({ success: true, message: 'Goal status updated.' });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ success: false, message: 'Server error updating goal status.' });
  }
});
// Trainer manage client fitness goals
// Get all clients with goals
app.get('/trainer/goals', async (req, res) => {
  try {
    const [clients] = await pool.execute('SELECT * FROM clients');
    const [goals] = await pool.execute('SELECT * FROM fitnessgoals');

    const clientsWithGoals = clients.map(client => ({
      ...client,
      goals: goals.filter(goal => goal.ClientID === client.ClientID)
    }));

    res.json({ success: true, data: clientsWithGoals });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error fetching clients and goals' });
  }
});

// Add new goal
app.post('/trainer/goals', async (req, res) => {
  try {
    const { ClientID, GoalTitle, GoalDescription, TargetDate, IsAchieved } = req.body;

    const sql = `
      INSERT INTO fitnessgoals (ClientID, GoalTitle, GoalDescription, TargetDate, IsAchieved)
      VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(sql, [ClientID, GoalTitle, GoalDescription, TargetDate, IsAchieved]);
    res.json({ success: true, message: 'Goal added successfully', goalId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error adding goal' });
  }
});

// Update goal
app.put('/trainer/goals/:goalId', async (req, res) => {
  try {
    const goalId = req.params.goalId;
    const { GoalTitle, GoalDescription, TargetDate, IsAchieved } = req.body;

    const sql = `
      UPDATE fitnessgoals
      SET GoalTitle = ?, GoalDescription = ?, TargetDate = ?, IsAchieved = ?
      WHERE GoalID = ?
    `;

    await pool.execute(sql, [GoalTitle, GoalDescription, TargetDate, IsAchieved, goalId]);
    res.json({ success: true, message: 'Goal updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error updating goal' });
  }
});

// Delete goal
app.delete('/trainer/goals/:goalId', async (req, res) => {
  try {
    const goalId = req.params.goalId;
    await pool.execute('DELETE FROM fitnessgoals WHERE GoalID = ?', [goalId]);
    res.json({ success: true, message: 'Goal deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error deleting goal' });
  }
});

//new goals 
app.post('/trainer/new/goals', async (req, res) => {
  try {
    const { ClientID, GoalTitle, GoalDescription, TargetDate } = req.body;

    const sql = `
      INSERT INTO fitnessgoals (ClientID, GoalTitle, GoalDescription, TargetDate)
      VALUES (?, ?, ?, ?)
    `;

    const [result] = await pool.execute(sql, [ClientID, GoalTitle, GoalDescription, TargetDate]);

    res.json({ success: true, message: 'Goal added successfully', goalId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error adding goal' });
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






// Get trainer dashboard profile
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



// admin manage profiles:

app.get('/manage/profile/admins', async (req, res) => {
  try {
    const [results] = await pool.query(
      'SELECT AdminID, FullName, Email, Phone, DateJoined, Role FROM admins'
    );
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'DB error', details: err });
  }
});
app.get('/manage/profile/clients', async (req, res) => {
  try {
    const [results] = await pool.query(
      'SELECT ClientID, FullName, Email, Phone, DateJoined, Gender, DOB, City, Country FROM clients'
    );
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'DB error', details: err });
  }
});
app.get('/manage/profile/trainers', async (req, res) => {
  try {
    const [results] = await pool.query(
      `SELECT TrainerID, FullName, Email, Phone, DateJoined, Gender, DOB, City, Country, 
      Qualifications, Expertise, IntroVideoURL as IntroVideoURL, CertTitle, CertIssuer, CertYear, CertID 
      FROM trainers`
    );
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'DB error', details: err });
  }
});

// Trainer profile picture route
app.get('/profile-pic/trainer/:id', async (req, res) => {
  const [rows] = await pool.query('SELECT ProfilePic FROM trainers WHERE TrainerID = ?', [req.params.id]);
  if (!rows.length || !rows[0].ProfilePic) return res.status(404).send('Not found');

  const picBuffer = rows[0].ProfilePic;

  // Detect MIME type from buffer
  const isPng = picBuffer.slice(0, 8).toString('hex') === '89504e470d0a1a0a';
  const isJpeg = picBuffer.slice(0, 3).toString('hex') === 'ffd8ff';

  if (isPng) {
    res.setHeader('Content-Type', 'image/png');
  } else if (isJpeg) {
    res.setHeader('Content-Type', 'image/jpeg');
  } else {
    res.setHeader('Content-Type', 'application/octet-stream'); // fallback
  }

  res.send(picBuffer);
});
app.get('/profile-pic/client/:id', async (req, res) => {
  const [rows] = await pool.query('SELECT ProfilePic FROM clients WHERE ClientID = ?', [req.params.id]);
  if (!rows.length || !rows[0].ProfilePic) return res.status(404).send('Not found');

  const picBuffer = rows[0].ProfilePic;

  const isPng = picBuffer.slice(0, 8).toString('hex') === '89504e470d0a1a0a';
  const isJpeg = picBuffer.slice(0, 3).toString('hex') === 'ffd8ff';

  if (isPng) {
    res.setHeader('Content-Type', 'image/png');
  } else if (isJpeg) {
    res.setHeader('Content-Type', 'image/jpeg');
  } else {
    res.setHeader('Content-Type', 'application/octet-stream');
  }

  res.send(picBuffer);
});


// Admin PUT (edit)
app.put('/manage/profile/admin/:id', async (req, res) => {
  const { id } = req.params;
  const { FullName, Email, Phone } = req.body;
  try {
    await pool.query(
      'UPDATE admins SET FullName = ?, Email = ?, Phone = ? WHERE AdminID = ?',
      [FullName || '', Email || '', Phone || '', id]
    );
    res.json({ message: 'Admin updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update admin', details: err });
  }
});

// Admin DELETE (already working)
app.delete('/manage/profile/admin/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM admins WHERE AdminID = ?', [id]);
    res.json({ message: 'Admin deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete admin', details: err });
  }
});

// Trainer PUT (edit)
app.put('/manage/profile/trainer/:id', async (req, res) => {
  const { id } = req.params;
  const { FullName, Email, Phone } = req.body;
  try {
    await pool.query(
      'UPDATE trainers SET FullName = ?, Email = ?, Phone = ? WHERE TrainerID = ?',
      [FullName || '', Email || '', Phone || '', id]
    );
    res.json({ message: 'Trainer updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update trainer', details: err });
  }
});

// Trainer DELETE
app.delete('/manage/profile/trainer/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM trainers WHERE TrainerID = ?', [id]);
    res.json({ message: 'Trainer deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete trainer', details: err });
  }
});

// Client PUT (edit)
app.put('/manage/profile/client/:id', async (req, res) => {
  const { id } = req.params;
  const { FullName, Email, Phone } = req.body;
  try {
    await pool.query(
      'UPDATE clients SET FullName = ?, Email = ?, Phone = ? WHERE ClientID = ?',
      [FullName || '', Email || '', Phone || '', id]
    );
    res.json({ message: 'Client updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update client', details: err });
  }
});

// Client DELETE
app.delete('/manage/profile/client/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM clients WHERE ClientID = ?', [id]);
    res.json({ message: 'Client deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete client', details: err });
  }
});

//trainer view attendance
app.get('/trainer/view/attendance', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM attendance ORDER BY CheckInTime DESC');
    res.json(rows);
  } catch (err) {
    console.error("Error fetching attendance:", err);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});
app.get('/trainer/client/:clientId', async (req, res) => {
  const clientId = req.params.clientId;
  try {
    const [rows] = await pool.query('SELECT ClientID, FullName, Email, Phone, Gender, DOB, Address, City, Country, ProfilePic, DateJoined FROM clients WHERE ClientID = ?', [clientId]);

    if (rows.length === 0) return res.status(404).json({ error: 'Client not found' });

    const client = rows[0];
    
    // Convert BLOB to base64 string for frontend
    if (client.ProfilePic) {
      client.ProfilePic = `data:image/jpeg;base64,${client.ProfilePic.toString('base64')}`;
    }

    res.json(client);
  } catch (err) {
    console.error("Error fetching client details:", err);
    res.status(500).json({ error: 'Failed to fetch client details' });
  }
});




//  trainer virtual-classes/create/update/delete

app.post('/trainer/virtual-classes/create', async (req, res) => {
  if (!req.session.userId || req.session.userType !== 'trainer') {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const { Title, Description, StartTime, DurationMinutes, Platform, JoinLink } = req.body;

  if (!Title || !StartTime || !DurationMinutes || !Platform || !JoinLink) {
    return res.status(400).json({ success: false, message: 'All required fields must be filled.' });
  }

  try {
    await pool.query(
      `INSERT INTO virtualclasses 
       (TrainerID, Title, Description, StartTime, DurationMinutes, Platform, JoinLink) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.session.userId,
        Title,
        Description || '',
        StartTime,
        DurationMinutes,
        Platform,
        JoinLink
      ]
    );

    res.json({ success: true, message: 'Virtual class created successfully.' });
  } catch (err) {
    console.error('❌ Error creating virtual class:', err);
    res.status(500).json({ success: false, message: 'Server error during class creation.' });
  }
});
app.get('/trainer/virtual-classes', async (req, res) => {
  if (!req.session.userId || req.session.userType !== 'trainer') {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT * FROM virtualclasses WHERE TrainerID = ? ORDER BY StartTime DESC',
      [req.session.userId]
    );
    res.json(rows); // Send the list of classes
  } catch (err) {
    console.error('❌ Error fetching virtual classes:', err);
    res.status(500).json({ success: false, message: 'Error fetching classes.' });
  }
});
app.put('/trainer/virtual-classes/update/:id', async (req, res) => {
  if (!req.session.userId || req.session.userType !== 'trainer') {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const { id } = req.params;
  const { Title, Description, StartTime, DurationMinutes, Platform, JoinLink } = req.body;

  try {
    const [result] = await pool.query(
      `UPDATE virtualclasses 
       SET Title = ?, Description = ?, StartTime = ?, DurationMinutes = ?, Platform = ?, JoinLink = ?
       WHERE ClassID = ? AND TrainerID = ?`,
      [Title, Description, StartTime, DurationMinutes, Platform, JoinLink, id, req.session.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Class not found or not yours.' });
    }

    res.json({ success: true, message: 'Class updated successfully.' });
  } catch (err) {
    console.error('❌ Error updating class:', err);
    res.status(500).json({ success: false, message: 'Server error during update.' });
  }
});
app.delete('/trainer/virtual-classes/delete/:id', async (req, res) => {
  if (!req.session.userId || req.session.userType !== 'trainer') {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const { id } = req.params;

  try {
    const [result] = await pool.query(
      'DELETE FROM virtualclasses WHERE ClassID = ? AND TrainerID = ?',
      [id, req.session.userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Class not found or not yours.' });
    }

    res.json({ success: true, message: 'Class deleted successfully.' });
  } catch (err) {
    console.error('❌ Error deleting class:', err);
    res.status(500).json({ success: false, message: 'Server error during delete.' });
  }
});




// GET all products with optional search and filter (including unavailable ones)
app.get('/api/products', async (req, res) => {
  try {
    const { search = '', category = '' } = req.query;
    let sql = `SELECT * FROM products WHERE 1`; // always true, allows adding optional filters
    const params = [];

    if (search) {
      sql += ` AND (Name LIKE ? OR Description LIKE ? OR Brand LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (category) {
      sql += ` AND Category = ?`;
      params.push(category);
    }

    const [rows] = await pool.query(sql, params);

    // convert image to base64
    rows.forEach(product => {
      if (product.Image) {
        product.Image = Buffer.from(product.Image).toString('base64');
      }
    });

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST - Add product
app.post('/api/products', upload.single('Image'), async (req, res) => {
  try {
    const { Name, Description, Category, Brand, Price, Stock, IsActive = 1 } = req.body;
    const Image = req.file ? req.file.buffer : null;

    const sql = `
      INSERT INTO products (Name, Description, Category, Brand, Price, Stock, Image, IsActive)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    await pool.query(sql, [Name, Description, Category, Brand, Price, Stock, Image, IsActive]);

    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT - Update product
app.put('/api/products/:id', upload.single('Image'), async (req, res) => {
  try {
    const { Name, Description, Category, Brand, Price, Stock, IsActive = 1 } = req.body;
    const Image = req.file ? req.file.buffer : null;
    const { id } = req.params;

    const sql = Image
      ? `UPDATE products SET Name=?, Description=?, Category=?, Brand=?, Price=?, Stock=?, Image=?, IsActive=? WHERE ProductID=?`
      : `UPDATE products SET Name=?, Description=?, Category=?, Brand=?, Price=?, Stock=?, IsActive=? WHERE ProductID=?`;

    const values = Image
      ? [Name, Description, Category, Brand, Price, Stock, Image, IsActive, id]
      : [Name, Description, Category, Brand, Price, Stock, IsActive, id];

    await pool.query(sql, values);
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      'DELETE FROM products WHERE ProductID = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


//plans managed by admin:
// Get all plans
app.get('/api/plans', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM subscription_plans ORDER BY PlanID ASC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ error: 'Failed to fetch subscription plans' });
  }
});

// Add new plan
app.post('/api/plans', async (req, res) => {
  const { PlanName, Description, DurationMonths, Price } = req.body;

  if (!PlanName || !DurationMonths || Price === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO subscription_plans (PlanName, Description, DurationMonths, Price) VALUES (?, ?, ?, ?)',
      [PlanName, Description || null, DurationMonths, Price]
    );
    res.status(201).json({ PlanID: result.insertId });
  } catch (error) {
    console.error('Error adding plan:', error);
    res.status(500).json({ error: 'Failed to add subscription plan' });
  }
});

// Update existing plan
app.put('/api/plans/:id', async (req, res) => {
  const { id } = req.params;
  const { PlanName, Description, DurationMonths, Price } = req.body;

  if (!PlanName || !DurationMonths || Price === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const [result] = await pool.query(
      'UPDATE subscription_plans SET PlanName = ?, Description = ?, DurationMonths = ?, Price = ? WHERE PlanID = ?',
      [PlanName, Description || null, DurationMonths, Price, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    res.json({ message: 'Plan updated' });
  } catch (error) {
    console.error('Error updating plan:', error);
    res.status(500).json({ error: 'Failed to update subscription plan' });
  }
});

// Delete plan
app.delete('/api/plans/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM subscription_plans WHERE PlanID = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    res.json({ message: 'Plan deleted' });
  } catch (error) {
    console.error('Error deleting plan:', error);
    res.status(500).json({ error: 'Failed to delete subscription plan' });
  }
});








// Client: View available plans (public)
app.get('/api/client/plans', async (req, res) => {
  try {
    const [plans] = await pool.query('SELECT * FROM subscription_plans ORDER BY PlanID ASC');
    res.json(plans);
  } catch (error) {
    console.error('Failed to fetch plans:', error);
    res.status(500).json({ error: 'Failed to fetch subscription plans' });
  }
});

// Client: Purchase a plan (no login middleware)
app.post('/api/client/purchase', async (req, res) => {
  const clientId = req.session.userId;
  const { PlanID, StartDate, PaymentMethod, TransactionRef } = req.body;

  if (!clientId) return res.status(401).json({ error: 'Client not logged in' });
  if (!PlanID || !StartDate || !PaymentMethod || !TransactionRef) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const [[plan]] = await pool.query(
      'SELECT DurationMonths, Price FROM subscription_plans WHERE PlanID = ?',
      [PlanID]
    );
    if (!plan) return res.status(404).json({ error: 'Plan not found' });

    const start = new Date(StartDate);
    if (isNaN(start)) return res.status(400).json({ error: 'Invalid StartDate' });
    const end = new Date(start);
    end.setMonth(end.getMonth() + plan.DurationMonths);

    const [subRes] = await pool.query(
      `INSERT INTO subscriptions (ClientID, PlanID, StartDate, EndDate, IsActive)
       VALUES (?, ?, ?, ?, 1)`,
      [clientId, PlanID, formatDate(start), formatDate(end)]
    );
    const subscriptionId = subRes.insertId;

    const [payRes] = await pool.query(
      `INSERT INTO payments (ClientID, SubscriptionID, Amount, PaymentDate, Method, Status, TransactionRef)
       VALUES (?, ?, ?, NOW(), ?, 'Completed', ?)`,
      [clientId, subscriptionId, plan.Price, PaymentMethod, TransactionRef]
    );
    const paymentId = payRes.insertId;
    
    // Log to verify
    console.log('Inserted payment with ID:', paymentId);

    res.status(201).json({
      message: 'Purchase successful',
      SubscriptionID: subscriptionId,
      PaymentID: paymentId
    });
  } catch (err) {
    console.error('Purchase error:', err);
    res.status(500).json({ error: 'Internal server error during purchase' });
  }
});

function formatDate(d) {
  return d.toISOString().split('T')[0];
}
//view client availabe subs:

app.get('/api/client/active-subscriptions', async (req, res) => {
  const clientId = req.session.clientId || req.session.userId; // ensure session set correctly

  if (!clientId) {
    return res.status(401).json({ error: 'Unauthorized: Client ID missing' });
  }

  try {
    const [rows] = await pool.query(`
      SELECT s.SubscriptionID, s.StartDate, s.EndDate, p.PlanName, p.Description, p.Price
      FROM subscriptions s
      JOIN subscription_plans p ON s.PlanID = p.PlanID
      WHERE s.ClientID = ? AND s.IsActive = 1
    `, [clientId]);

    res.json(rows);
  } catch (err) {
    console.error('Failed to fetch active subscriptions:', err);
    res.status(500).json({ error: 'Server error fetching subscriptions' });
  }
});

app.get('/api/admin/subscriptions', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        s.SubscriptionID,
        s.ClientID,
        c.FullName,
        c.Email,
        sp.PlanName,
        sp.Price,
        s.StartDate,
        s.EndDate,
        s.IsActive,
        p.PaymentID,
        p.Amount,
        p.PaymentDate,
        p.Method,
        p.Status,
        p.TransactionRef
      FROM subscriptions s
      LEFT JOIN clients c ON s.ClientID = c.ClientID
      LEFT JOIN subscription_plans sp ON s.PlanID = sp.PlanID
      LEFT JOIN payments p ON s.SubscriptionID = p.SubscriptionID
      ORDER BY s.StartDate DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('Error loading subscriptions:', err.message);
    res.status(500).json({ error: 'Failed to load subscriptions' });
  }
});

// Delete a subscription and its related payment
app.delete('/api/admin/subscriptions/:id', async (req, res) => {
  const subscriptionId = req.params.id;

  try {
    await pool.query('DELETE FROM payments WHERE SubscriptionID = ?', [subscriptionId]);
    await pool.query('DELETE FROM subscriptions WHERE SubscriptionID = ?', [subscriptionId]);
    res.json({ message: 'Subscription and related payment deleted successfully' });
  } catch (err) {
    console.error('Error deleting subscription:', err.message);
    res.status(500).json({ error: 'Failed to delete subscription' });
  }
});

// Update subscription status
app.put('/api/admin/subscriptions/:id/status', async (req, res) => {
  const subscriptionId = req.params.id;
  const { isActive, paymentStatus } = req.body;

  if (typeof isActive === 'undefined' || !paymentStatus) {
    return res.status(400).json({ error: 'isActive and paymentStatus are required' });
  }

  try {
    // Update subscription IsActive status
    const [subscriptionResult] = await pool.query(
      'UPDATE subscriptions SET IsActive = ? WHERE SubscriptionID = ?',
      [isActive ? 1 : 0, subscriptionId]
    );

    // Update payment Status for the given subscription
    const [paymentResult] = await pool.query(
      'UPDATE payments SET Status = ? WHERE SubscriptionID = ?',
      [paymentStatus, subscriptionId]
    );

    console.log('Subscription Update:', subscriptionResult);
    console.log('Payment Update:', paymentResult);

    if (subscriptionResult.affectedRows === 0) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    if (paymentResult.affectedRows === 0) {
      // Important: inform client no payment found to update!
      return res.status(404).json({ error: 'Payment for subscription not found' });
    }

    res.json({ message: 'Subscription and payment status updated successfully' });
  } catch (err) {
    console.error('Error updating subscription/payment status:', err);
    res.status(500).json({ error: 'Failed to update subscription/payment status' });
  }
});



// Fallback 404 route
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
