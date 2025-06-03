const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const app = express();
const session = require('express-session');
const cors = require('cors');
const upload = multer(); //FOR EDITING DP




app.use(cors({
  origin: 'http://localhost:4444',
  credentials: true
}));

app.use(session({
  secret: 'your-secret-key',      // change this to a strong secret in production
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




// Signup POST handler
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
    //  can add more validations (phone number, DOB format, gender values) here as needed
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
// Login POST handler
app.post('/login', express.urlencoded({ extended: true }), async (req, res) => {
  try {
    const { email, password, userType } = req.body;

    if (!email || !password || !userType) {
      return res.status(400).json({ success: false, message: 'Please fill in all fields.' });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format.' });
    }

    const [rows] = await pool.execute('SELECT * FROM clients WHERE Email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }
    const user = rows[0];
    const match = await bcrypt.compare(password, user.PasswordHash.toString());
    if (!match) {
      return res.status(401).json({ success: false, message: 'Incorrect password.' });
    }
    if (userType.toLowerCase() !== 'client') {
      return res.status(403).json({ success: false, message: 'User type mismatch or not supported yet.' });
    }

    // Save user info in session (minimal info for security)
    req.session.userId = user.ClientID;
    req.session.userName = user.FullName;
    req.session.userEmail = user.Email;
    req.session.userType = userType;

    res.json({
      success: true,
      message: `Welcome back, ${user.FullName}!`
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});


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





// app.get('/profile', async (req, res) => {
//   if (!req.session.userId) {
//     return res.status(401).json({ success: false, message: 'Unauthorized' });
//   }

//   try {
//     const [rows] = await pool.execute(`
//       SELECT ClientID, FullName, Email, Phone, Gender, DOB, Address, City, Country
//       FROM clients WHERE ClientID = ?`, [req.session.userId]);

//     if (rows.length === 0) {
//       return res.status(404).json({ success: false, message: 'User not found' });
//     }

//     res.json({ success: true, user: rows[0] });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// });



// app.post('/update-profile', express.urlencoded({ extended: true }), async (req, res) => {
//   if (!req.session.userId) {
//     return res.status(401).json({ success: false, message: 'Unauthorized' });
//   }

//   const { FullName, Phone, City, Country, Address } = req.body;

//   try {
//     await pool.execute(`
//       UPDATE clients SET FullName = ?, Phone = ?, City = ?, Country = ?, Address = ?
//       WHERE ClientID = ?`, [FullName, Phone, City, Country, Address, req.session.userId]);

//     res.json({ success: true, message: 'Profile updated successfully' });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: 'Failed to update profile' });
//   }
// });


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




app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
