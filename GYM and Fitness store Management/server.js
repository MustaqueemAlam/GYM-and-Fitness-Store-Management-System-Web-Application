const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
const app = express();
const session = require("express-session");
const cors = require("cors");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
dayjs.extend(utc);
const BD_OFFSET = 6 * 60;

app.use(
  cors({
    // Middleware for CORS
    origin: "http://localhost:4444", // Frontend origin
    credentials: true,
  })
);

// Middleware to parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: "your-secret-key-please-change-this-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 24 hours // Session configuration (1 day validity)
    },
  })
);

const PORT = process.env.PORT || 4444;

app.use(express.static(path.join(__dirname, "static"))); // Serve static files (e.g., if we store profile pictures publicly)
const storage = multer.memoryStorage(); // Multer setup for file uploads (using memory storage for profile pictures)
const upload = multer({ storage });

const pool = mysql.createPool({
  // MySQL connection pool setup
  host: "localhost",
  user: "root",
  password: "",
  database: "gym",
  connectionLimit: 10,
});

function validateEmail(email) {
  // Helper function to validate email format
  const re = /\S+@\S+\.\S+/;
  return re.test(email);
}

/**
 * API endpoint to get user session data
 */
app.get("/api/user-session", (req, res) => {
  if (req.session.userId && req.session.userType) {
    res.json({
      userId: req.session.userId,
      userType: req.session.userType,
      userName: req.session.userName,
      userEmail: req.session.userEmail,
    });
  } else {
    res.status(401).json({ message: "No active session" });
  }
});


/**
 * Admin Dashboard KPIs Middleware
 */ 

const isAdmin = (req, res, next) => {
  if (req.session.userId && req.session.userType === "admin") {
    next(); // User is an admin, proceed to the next middleware/route handler
  } else {
    res.status(403).json({ message: "Access denied. Admin privileges required." });
  }
};


/**
 * API endpoint to get Trainer Dashboard KPIs and media.
 * This endpoint fetches data from the `trainer_dashboard_kpis_vw` view
 * and also includes ProfilePic and IntroVideoURL from the `trainers` table.
 */
app.get("/api/trainer-dashboard-kpis", async (req, res) => {
  // 1. Authenticate and Authorize: Check if a trainer is logged in
  if (!req.session.userId || req.session.userType !== "trainer") {
    return res.status(403).json({ message: "Access denied. Trainer privileges required." });
  }

  const trainerId = req.session.userId; // Get trainer ID from session

  let connection;
  try {
    connection = await pool.getConnection();

    // 2. Query the database view for the specific trainer's KPIs
    // Also fetch ProfilePic and IntroVideoURL directly from the trainers table
    const [rows] = await connection.execute(
      `SELECT
         t.TrainerID,
         t.FullName AS TrainerName,
         t.ProfilePic,
         t.IntroVideoURL,
         kpis.TotalDietPlansCreated,
         kpis.TotalWorkoutPlansCreated,
         kpis.TotalVirtualClassesScheduled,
         kpis.TotalClientsManaged,
         kpis.AverageFeedbackRating,
         kpis.UnreadNotificationsTrainer
       FROM trainers t
       LEFT JOIN trainer_dashboard_kpis_vw kpis ON t.TrainerID = kpis.TrainerID
       WHERE t.TrainerID = ?`,
      [trainerId]
    );

    // 3. Process and send the data back to the frontend
    if (rows.length > 0) {
      const trainerData = rows[0];

      // Convert ProfilePic BLOB to base64 string if it exists
      if (trainerData.ProfilePic) {
        trainerData.ProfilePic = Buffer.from(trainerData.ProfilePic).toString('base64');
      }

      res.json(trainerData);
    } else {
      // If no data found for the trainer (e.g., new trainer with no activities yet)
      res.json({
        TrainerID: trainerId,
        TrainerName: req.session.userName, // Use session name as fallback
        ProfilePic: null,
        IntroVideoURL: null,
        TotalDietPlansCreated: 0,
        TotalWorkoutPlansCreated: 0,
        TotalVirtualClassesScheduled: 0,
        TotalClientsManaged: 0,
        AverageFeedbackRating: null, // Explicitly null if no feedback
        UnreadNotificationsTrainer: 0
      });
    }
  } catch (error) {
    console.error("Error fetching trainer dashboard KPIs:", error);
    res.status(500).json({ message: "Internal server error while fetching KPIs." });
  } finally {
    if (connection) {
      connection.release(); // Release the connection back to the pool
    }
  }
});



/**
 * API endpoint to get Trainer Dashboard KPIs and media.
 * This endpoint fetches data from the `trainer_dashboard_kpis_vw` view
 * and also includes ProfilePic and IntroVideoURL from the `trainers` table.
 */
app.get("/api/trainer-dashboard-kpis", async (req, res) => {
  // 1. Authenticate and Authorize: Check if a trainer is logged in
  if (!req.session.userId || req.session.userType !== "trainer") {
    return res.status(403).json({ message: "Access denied. Trainer privileges required." });
  }

  const trainerId = req.session.userId; // Get trainer ID from session

  let connection;
  try {
    connection = await pool.getConnection();

    // 2. Query the database view for the specific trainer's KPIs
    // Also fetch ProfilePic and IntroVideoURL directly from the trainers table
    const [rows] = await connection.execute(
      `SELECT
         t.TrainerID,
         t.FullName AS TrainerName,
         t.ProfilePic,
         t.IntroVideoURL,
         kpis.TotalDietPlansCreated,
         kpis.TotalWorkoutPlansCreated,
         kpis.TotalVirtualClassesScheduled,
         kpis.TotalClientsManaged,
         kpis.AverageFeedbackRating,
         kpis.UnreadNotificationsTrainer
       FROM trainers t
       LEFT JOIN trainer_dashboard_kpis_vw kpis ON t.TrainerID = kpis.TrainerID
       WHERE t.TrainerID = ?`,
      [trainerId]
    );

    // 3. Process and send the data back to the frontend
    if (rows.length > 0) {
      const trainerData = rows[0];

      // Convert ProfilePic BLOB to base64 string if it exists
      if (trainerData.ProfilePic) {
        trainerData.ProfilePic = Buffer.from(trainerData.ProfilePic).toString('base64');
      }

      res.json(trainerData);
    } else {
      // If no data found for the trainer (e.g., new trainer with no activities yet)
      res.json({
        TrainerID: trainerId,
        TrainerName: req.session.userName, // Use session name as fallback
        ProfilePic: null,
        IntroVideoURL: null,
        TotalDietPlansCreated: 0,
        TotalWorkoutPlansCreated: 0,
        TotalVirtualClassesScheduled: 0,
        TotalClientsManaged: 0,
        AverageFeedbackRating: null, // Explicitly null if no feedback
        UnreadNotificationsTrainer: 0
      });
    }
  } catch (error) {
    console.error("Error fetching trainer dashboard KPIs:", error);
    res.status(500).json({ message: "Internal server error while fetching KPIs." });
  } finally {
    if (connection) {
      connection.release(); // Release the connection back to the pool
    }
  }
});


/**
 * NEW API endpoint for updating trainer introduction video URL (e.g., YouTube link).
 * This replaces the file upload for intro videos.
 */
app.post("/api/trainer/update-intro-video-url", async (req, res) => {
  // 1. Authenticate and Authorize: Check if a trainer is logged in
  if (!req.session.userId || req.session.userType !== "trainer") {
    return res.status(403).json({ message: "Access denied. Trainer privileges required." });
  }

  const trainerId = req.session.userId;
  const { videoUrl } = req.body; // Expecting the video URL in the request body

  // Basic validation for the URL
  if (typeof videoUrl !== 'string' || (videoUrl.trim() === '' && videoUrl !== null)) {
      return res.status(400).json({ message: "A valid video URL (or null to clear) is required." });
  }

  // Optional: Add more robust URL validation (e.g., check if it's a valid YouTube URL format)
  // For now, we'll allow any string to be stored as the URL.

  let connection;
  try {
    connection = await pool.getConnection();

    // Update the IntroVideoURL in the trainers table
    await connection.execute(
      `UPDATE trainers SET IntroVideoURL = ? WHERE TrainerID = ?`,
      [videoUrl.trim() === '' ? null : videoUrl, trainerId] // Store null if empty string is provided
    );

    res.status(200).json({
      success: true,
      message: "Introduction video URL updated successfully!",
      videoUrl: videoUrl.trim() === '' ? null : videoUrl // Send back the URL that was saved
    });

  } catch (error) {
    console.error("Error updating intro video URL:", error);
    res.status(500).json({ message: "Internal server error during video URL update." });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});


/**
 * Login POST handler for all users (Client, Admin, Trainer)
 */
app.post("/login", async (req, res) => {
  try {
    const { email, password, userType } = req.body;
    if (!email || !password || !userType) {
      return res
        .status(400)
        .json({ success: false, message: "Please fill in all fields." });
    }
    if (!validateEmail(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email format." });
    }
    let tableName, idField;
    switch (userType.toLowerCase()) {
      case "client":
        tableName = "clients";
        idField = "ClientID";
        break;
      case "admin":
        tableName = "admins";
        idField = "AdminID";
        break;
      case "trainer":
        tableName = "trainers";
        idField = "TrainerID";
        break;
      default:
        return res
          .status(400)
          .json({ success: false, message: "Invalid user type." });
    }
    const [rows] = await pool.execute(
      `SELECT * FROM ${tableName} WHERE Email = ?`,
      [email]
    );
    if (rows.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: "User not found." });
    }
    const user = rows[0];
    if (!user.PasswordHash) {
      return res
        .status(500)
        .json({
          success: false,
          message: "Password not set for this account.",
        });
    }
    const match = await bcrypt.compare(password, user.PasswordHash.toString());
    if (!match) {
      return res
        .status(401)
        .json({ success: false, message: "Incorrect password." });
    }
    req.session.userId = user[idField]; // Save session
    req.session.userName = user.FullName;
    req.session.userEmail = user.Email;
    req.session.userType = userType.toLowerCase(); // Store lowercase in session
    const response = {
      success: true,
      message: `Welcome back, ${user.FullName}!`,
      userType: userType.toLowerCase(),
    };
    if (userType.toLowerCase() === "admin") {
      response.adminId = user[idField];
    } else if (userType.toLowerCase() === "trainer") {
      response.trainerId = user[idField];
    } else {
      response.clientId = user[idField];
    }
    res.json(response);
  } catch (err) {
    console.error("Login error:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error during login." });
  }
});



/**
 * API endpoint to fetch KPI data for the admin dashboard.
 * This endpoint requires admin authentication.
 */
app.get("/api/admin-dashboard-kpis", isAdmin, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    // Fetch data from the pre-defined view
    const [rows] = await connection.execute("SELECT * FROM admin_dashboard_kpis_vw");

    if (rows.length === 0) {
      return res.status(404).json({ message: "No KPI data found." });
    }

    // The view should return a single row with all the KPI columns
    res.json(rows[0]);
  } catch (error) {
    console.error("Error fetching admin dashboard KPIs:", error);
    res.status(500).json({ message: "Server error while fetching KPIs." });
  } finally {
    if (connection) connection.release();
  }
});

/**
 * Middleware to protect routes, ensuring only logged-in clients can access
 */
const requireClientAuth = (req, res, next) => {
  if (req.session.userId && req.session.userType === "client") {
    next(); // User is authenticated as a client, proceed
  } else {
    // Log for debugging:
    console.warn(
      `Attempted access to protected client route without auth. Session:`,
      req.session
    );
    res
      .status(403)
      .json({
        success: false,
        message: "Access denied. Client authentication required.",
      });
  }
};


/**
 * API endpoint to fetch KPI data for the client dashboard.
 * This endpoint requires client authentication.
 */
app.get("/api/client-dashboard-kpis", requireClientAuth, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const clientId = req.session.userId; // Get ClientID from session

    if (!clientId) {
      return res.status(401).json({ message: "Client ID not found in session." });
    }

    // Fetch data from the client_dashboard_kpis_vw view for the specific client
    const [rows] = await connection.execute(
      "SELECT * FROM client_dashboard_kpis_vw WHERE ClientID = ?",
      [clientId]
    );

    if (rows.length === 0) {
      // It's possible for a client to exist but have no KPI data yet
      return res.status(200).json({}); // Return an empty object instead of 404
    }

    const kpis = rows[0];

    // Explicitly convert relevant fields to numbers
    kpis.LatestWeightKg = parseFloat(kpis.LatestWeightKg);
    kpis.LatestBodyFatPercent = parseFloat(kpis.LatestBodyFatPercent);
    kpis.LatestBMI = parseFloat(kpis.LatestBMI);
    kpis.TotalWorkoutsLogged = parseInt(kpis.TotalWorkoutsLogged) || 0;
    kpis.TotalCaloriesBurnedWorkouts = parseInt(kpis.TotalCaloriesBurnedWorkouts) || 0;
    kpis.TotalDietLogsSubmitted = parseInt(kpis.TotalDietLogsSubmitted) || 0;
    kpis.UnachievedFitnessGoals = parseInt(kpis.UnachievedFitnessGoals) || 0;
    kpis.UpcomingBookings = parseInt(kpis.UpcomingBookings) || 0;
    kpis.UnreadNotificationsClient = parseInt(kpis.UnreadNotificationsClient) || 0;


    res.json(kpis);
  } catch (error) {
    console.error("Error fetching client dashboard KPIs:", error);
    res.status(500).json({ message: "Server error while fetching client KPIs." });
  } finally {
    if (connection) connection.release();
  }
});


/**
 * API endpoint to fetch Client orders
 * This endpoint requires client authentication.
 */

app.get("/api/client/orders", requireClientAuth, async (req, res) => {
  const clientId = req.session.userId;
  try {
    const [rows] = await pool.query(
      `SELECT
                o.OrderID,
                o.OrderDate,
                o.TotalAmount,
                o.Status,
                o.PaymentID
            FROM
                orders o
            WHERE
                o.ClientID = ?
            ORDER BY
                o.OrderDate DESC`,
      [clientId]
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching client orders:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch order history." });
  }
});

/**
 * GET /api/client/orders/:orderId/details
 * Fetches details (order items and product info) for a specific order.
 */
app.get(
  "/api/client/orders/:orderId/details",
  requireClientAuth,
  async (req, res) => {
    const clientId = req.session.userId;
    const orderId = req.params.orderId;

    try {
      // First, verify that the order belongs to the authenticated client
      const [orderCheck] = await pool.query(
        `SELECT OrderID FROM orders WHERE OrderID = ? AND ClientID = ?`,
        [orderId, clientId]
      );

      if (orderCheck.length === 0) {
        return res
          .status(404)
          .json({
            success: false,
            message: "Order not found or does not belong to this client.",
          });
      }

      // Fetch order items and product details
      const [rows] = await pool.query(
        `SELECT
                oi.OrderItemID,
                oi.ProductID,
                oi.Quantity,
                oi.UnitPrice,
                p.Name,
                p.Description,
                p.Category,
                p.Brand,
                p.Image -- Note: Image is a BLOB, handle on frontend (e.g., placeholder)
            FROM
                orderitems oi
            JOIN
                products p ON oi.ProductID = p.ProductID
            WHERE
                oi.OrderID = ?`,
        [orderId]
      );

      // If Image is a BLOB, you might want to convert it to base64 or serve it via a separate endpoint
      // For simplicity, we'll just send the buffer and let the frontend decide (or use a placeholder)
      const productsWithBase64Image = rows.map((row) => ({
        ...row,
        Image: row.Image ? Buffer.from(row.Image).toString("base64") : null, // Convert BLOB to base64 string
      }));

      res.json(productsWithBase64Image);
    } catch (error) {
      console.error("Error fetching order details:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch order details." });
    }
  }
);

/**
 * GET /api/client/payments
 * Fetches all subscription payments for the authenticated client.
 */
app.get("/api/client/payments", requireClientAuth, async (req, res) => {
  const clientId = req.session.userId;
  try {
    const [rows] = await pool.query(
      `SELECT
                PaymentID,
                SubscriptionID,
                Amount,
                PaymentDate,
                Method,
                Status,
                TransactionRef
            FROM
                payments
            WHERE
                ClientID = ?
            ORDER BY
                PaymentDate DESC`,
      [clientId]
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching client payments:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch payment history." });
  }
});

/**
 * GET /api/client/payments/:paymentId/receipt
 * Generates and serves a simple text receipt for a specific payment.
 */
app.get(
  "/api/client/payments/:paymentId/receipt",
  requireClientAuth,
  async (req, res) => {
    const clientId = req.session.userId;
    const paymentId = req.params.paymentId;

    try {
      const [paymentRows] = await pool.query(
        `SELECT
                PaymentID,
                ClientID,
                SubscriptionID,
                Amount,
                PaymentDate,
                Method,
                Status,
                TransactionRef
            FROM
                payments
            WHERE
                PaymentID = ? AND ClientID = ?`,
        [paymentId, clientId]
      );

      if (paymentRows.length === 0) {
        return res
          .status(404)
          .json({
            success: false,
            message: "Payment not found or does not belong to this client.",
          });
      }

      const payment = paymentRows[0];
      const clientInfo = await pool.query(
        `SELECT FullName, Email FROM clients WHERE ClientID = ?`,
        [clientId]
      );
      const client = clientInfo[0][0];

      // Format date for receipt
      const formattedDate = dayjs(payment.PaymentDate)
        .utcOffset(BD_OFFSET)
        .format("YYYY-MM-DD HH:mm:ss");

      const receiptContent = `
--- E-Fitness Payment Receipt ---

Payment ID: ${payment.PaymentID}
Client Name: ${client ? client.FullName : "N/A"}
Client Email: ${client ? client.Email : "N/A"}
Subscription ID: ${payment.SubscriptionID || "N/A"}
Amount: $${parseFloat(payment.Amount).toFixed(2)}
Payment Date: ${formattedDate} (UTC+6)
Method: ${payment.Method || "N/A"}
Status: ${payment.Status || "N/A"}
Transaction Reference: ${payment.TransactionRef || "N/A"}

Thank you for your payment!
-----------------------------
        `;

      res.json({ receiptContent: receiptContent });
    } catch (error) {
      console.error("Error generating receipt:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to generate receipt." });
    }
  }
);

/**
 * GET /api/client/orders/:orderId/receipt
 * Generates and serves a simple text receipt for a specific order.
 */
app.get(
  "/api/client/orders/:orderId/receipt",
  requireClientAuth,
  async (req, res) => {
    const clientId = req.session.userId;
    const orderId = req.params.orderId;

    try {
      const [orderRows] = await pool.query(
        `SELECT
                o.OrderID,
                o.ClientID,
                o.OrderDate,
                o.TotalAmount,
                o.Status,
                o.PaymentID,
                pp.PaymentMethod,
                pp.PaymentDate AS ProductPaymentDate
            FROM
                orders o
            LEFT JOIN
                product_payments pp ON o.OrderID = pp.OrderID AND o.ClientID = pp.ClientID
            WHERE
                o.OrderID = ? AND o.ClientID = ?`,
        [orderId, clientId]
      );

      if (orderRows.length === 0) {
        return res
          .status(404)
          .json({
            success: false,
            message: "Order not found or does not belong to this client.",
          });
      }

      const order = orderRows[0];
      const clientInfo = await pool.query(
        `SELECT FullName, Email FROM clients WHERE ClientID = ?`,
        [clientId]
      );
      const client = clientInfo[0][0];

      const [orderItems] = await pool.query(
        `SELECT
                oi.Quantity,
                oi.UnitPrice,
                p.Name
            FROM
                orderitems oi
            JOIN
                products p ON oi.ProductID = p.ProductID
            WHERE
                oi.OrderID = ?`,
        [orderId]
      );

      const formattedOrderDate = dayjs(order.OrderDate)
        .utcOffset(BD_OFFSET)
        .format("YYYY-MM-DD HH:mm:ss");
      const formattedProductPaymentDate = order.ProductPaymentDate
        ? dayjs(order.ProductPaymentDate)
            .utcOffset(BD_OFFSET)
            .format("YYYY-MM-DD HH:mm:ss")
        : "N/A";

      let receiptContent = `
--- E-Fitness Order Receipt ---

Company Name: E-Fitness
Order ID: ${order.OrderID}
Client Name: ${client ? client.FullName : "N/A"}
Client Email: ${client ? client.Email : "N/A"}
Order Date: ${formattedOrderDate} (UTC+6)
Total Amount: $${parseFloat(order.TotalAmount).toFixed(2)}
Order Status: ${order.Status}
Payment Method: ${order.PaymentMethod || "N/A"}
Payment Date (Product): ${formattedProductPaymentDate}

--- Order Items ---
`;

      orderItems.forEach((item) => {
        receiptContent += `
Product: ${item.Name}
Quantity: ${item.Quantity}
Unit Price: $${parseFloat(item.UnitPrice).toFixed(2)}
Subtotal: $${(parseFloat(item.UnitPrice) * item.Quantity).toFixed(2)}
`;
      });

      receiptContent += `
-----------------------------
Thank you for your purchase!
`;

      res.json({ receiptContent: receiptContent });
    } catch (error) {
      console.error("Error generating order receipt:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to generate order receipt." });
    }
  }
);

// --- Fitness Store Endpoints ---

// Endpoint to fetch all active products
app.get("/api/products", requireClientAuth, async (req, res) => {
  try {
    console.log("Fetching all active products...");
    const [rows] = await pool.query(
      "SELECT ProductID, Name, Description, Category, Brand, Price, Stock, Image FROM products WHERE IsActive = 1 AND Stock > 0"
    );

    // Convert image buffer to base64 string for each product
    const products = rows.map((product) => {
      if (product.Image) {
        // Assuming the image is a WEBP, adjust content type if necessary
        // You might need to store the image MIME type in the DB for more robust handling
        const imageBase64 = `data:image/webp;base64,${product.Image.toString(
          "base64"
        )}`;
        return {
          ...product,
          Image: imageBase64,
          Price: parseFloat(product.Price),
        }; // Convert Price to float here
      }
      console.log(
        `DEBUG: Product ${
          product.Name
        } Price type after conversion: ${typeof parseFloat(
          product.Price
        )}, value: ${parseFloat(product.Price)}`
      );
      return { ...product, Price: parseFloat(product.Price) }; // Convert Price to float here
    });

    console.log(`Fetched ${products.length} products.`);
    res.json({ success: true, products });
  } catch (err) {
    console.error("Error fetching products:", err);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch products",
        error: err.message,
      });
  }
});

// Endpoint to add a product to the cart
app.post("/api/cart/add", requireClientAuth, async (req, res) => {
  const { productId, quantity } = req.body;
  const clientId = req.session.userId;

  if (!productId || !quantity || quantity <= 0) {
    console.warn(
      `Invalid input for adding to cart: ProductID ${productId}, Quantity ${quantity}`
    );
    return res
      .status(400)
      .json({ success: false, message: "Invalid product ID or quantity." });
  }

  try {
    console.log(
      `Client ${clientId} attempting to add ProductID ${productId} with quantity ${quantity} to cart.`
    );
    // Fetch product details to ensure it's valid and get current stock/price
    const [productRows] = await pool.query(
      "SELECT ProductID, Name, Price, Stock FROM products WHERE ProductID = ? AND IsActive = 1",
      [productId]
    );

    if (productRows.length === 0) {
      console.warn(`Product ${productId} not found or inactive.`);
      return res
        .status(404)
        .json({
          success: false,
          message: "Product not found or not available.",
        });
    }

    const product = productRows[0];

    // Initialize cart in session if it doesn't exist
    if (!req.session.cart) {
      req.session.cart = [];
    }

    // DEBUG: Log cart state before map
    console.log(
      "DEBUG: Cart before map in add:",
      typeof req.session.cart,
      req.session.cart
    );

    let itemAdded = false;
    // Check if product already exists in cart, update quantity if so
    req.session.cart = req.session.cart.map((item) => {
      if (item.productId === productId) {
        const newQuantity = item.quantity + quantity;
        if (product.Stock < newQuantity) {
          // If updating quantity exceeds stock, limit to available stock
          console.warn(
            `Cannot add more of ProductID ${productId}. Total in cart would exceed stock. Current in cart: ${item.quantity}, Adding: ${quantity}, Available: ${product.Stock}`
          );
          itemAdded = false; // Mark as not fully added due to stock
          return item; // Return original item, don't update quantity
        }
        item.quantity = newQuantity;
        itemAdded = true;
      }
      return item;
    });

    if (!itemAdded) {
      // If product.Stock < quantity for a new item, it should fail here
      if (product.Stock < quantity) {
        console.warn(
          `Insufficient stock for ProductID ${productId}. Requested: ${quantity}, Available: ${product.Stock}`
        );
        return res
          .status(400)
          .json({
            success: false,
            message: `Insufficient stock. Only ${product.Stock} available.`,
          });
      }
      // Add new product to cart
      req.session.cart.push({
        productId: product.ProductID,
        name: product.Name,
        price: parseFloat(product.Price), // Ensure price is a number
        quantity: quantity,
      });
      itemAdded = true; // Mark as added
    }

    // After updating, check if the item was truly added (or its quantity was increased)
    if (itemAdded) {
      console.log(
        `ProductID ${productId} added to cart. Current cart:`,
        req.session.cart
      );
      res.json({
        success: true,
        message: "Product added to cart successfully!",
        cart: req.session.cart,
      });
    } else {
      // This path is hit if product was already in cart and attempted add exceeded stock.
      res
        .status(400)
        .json({
          success: false,
          message: `Could not add ProductID ${productId} to cart. Total quantity would exceed available stock (${product.Stock}).`,
        });
    }
  } catch (err) {
    console.error("Error adding product to cart:", err);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to add product to cart",
        error: err.message,
      });
  }
});

// Endpoint to get the current cart contents
app.get("/api/cart", requireClientAuth, (req, res) => {
  const cart = req.session.cart || [];
  // DEBUG: Log cart state when fetched
  console.log("DEBUG: Cart when fetched:", typeof cart, cart);
  console.log("Fetching cart contents. Current cart:", cart);
  res.json({ success: true, cart });
});

// Endpoint to remove an item from the cart
app.post("/api/cart/remove", requireClientAuth, (req, res) => {
  const { productId } = req.body;
  const clientId = req.session.userId;

  if (!productId) {
    return res
      .status(400)
      .json({ success: false, message: "Product ID is required." });
  }

  if (!req.session.cart) {
    console.log(
      `Client ${clientId} attempted to remove ProductID ${productId}, but cart is empty.`
    );
    return res.status(404).json({ success: false, message: "Cart is empty." });
  }

  // DEBUG: Log cart state before length access and filter
  console.log(
    "DEBUG: Cart before length access and filter in remove:",
    typeof req.session.cart,
    req.session.cart
  );

  const initialCartLength = req.session.cart.length;
  req.session.cart = req.session.cart.filter(
    (item) => item.productId !== productId
  );

  if (req.session.cart.length < initialCartLength) {
    console.log(
      `ProductID ${productId} removed from cart. Current cart:`,
      req.session.cart
    );
    res.json({
      success: true,
      message: "Product removed from cart.",
      cart: req.session.cart,
    });
  } else {
    console.warn(
      `Client ${clientId} attempted to remove non-existent ProductID ${productId} from cart.`
    );
    res
      .status(404)
      .json({ success: false, message: "Product not found in cart." });
  }
});

// Endpoint to handle the purchase process
app.post("/api/purchase", requireClientAuth, async (req, res) => {
  const { paymentMethod } = req.body;
  const clientId = req.session.userId;
  const cart = req.session.cart || [];

  if (!paymentMethod) {
    return res
      .status(400)
      .json({ success: false, message: "Payment method is required." });
  }

  // DEBUG: Log cart state before purchase length check
  console.log("DEBUG: Cart before purchase length check:", typeof cart, cart);

  if (cart.length === 0) {
    console.warn(
      `Client ${clientId} attempted to purchase with an empty cart.`
    );
    return res
      .status(400)
      .json({
        success: false,
        message: "Your cart is empty. Please add products before purchasing.",
      });
  }

  const connection = await pool.getConnection(); // Get a connection from the pool
  try {
    await connection.beginTransaction(); // Start transaction

    let totalAmount = 0;
    const productUpdates = [];

    // 1. Validate stock and calculate total amount
    for (const item of cart) {
      const [productRows] = await connection.query(
        "SELECT Stock, Price FROM products WHERE ProductID = ? AND IsActive = 1",
        [item.productId]
      );

      if (productRows.length === 0) {
        throw new Error(
          `Product ${item.name} (ID: ${item.productId}) not found or inactive.`
        );
      }

      const { Stock: currentStock, Price: unitPrice } = productRows[0];

      if (currentStock < item.quantity) {
        throw new Error(
          `Insufficient stock for ${item.name}. Only ${currentStock} available, but ${item.quantity} requested.`
        );
      }

      totalAmount += item.quantity * parseFloat(unitPrice);
      productUpdates.push({
        productId: item.productId,
        newStock: currentStock - item.quantity,
      });
    }

    // 2. Create Order
    const orderDate = dayjs()
      .utcOffset(BD_OFFSET)
      .format("YYYY-MM-DD HH:mm:ss");
    const [orderResult] = await connection.query(
      "INSERT INTO orders (ClientID, OrderDate, TotalAmount, Status) VALUES (?, ?, ?, ?)",
      [clientId, orderDate, totalAmount.toFixed(2), "Pending"]
    );
    const orderId = orderResult.insertId;
    console.log(
      `Order ${orderId} created for client ${clientId} with total amount ${totalAmount.toFixed(
        2
      )}.`
    );

    // 3. Create Order Items
    for (const item of cart) {
      // Re-fetch price from DB to ensure consistency and prevent client-side tampering
      const [productPriceRows] = await connection.query(
        "SELECT Price FROM products WHERE ProductID = ?",
        [item.productId]
      );
      const unitPrice = productPriceRows[0].Price; // This line could cause error if productPriceRows is empty

      await connection.query(
        "INSERT INTO orderitems (OrderID, ProductID, Quantity, UnitPrice) VALUES (?, ?, ?, ?)",
        [orderId, item.productId, item.quantity, unitPrice]
      );
    }
    console.log(`Order items for OrderID ${orderId} created.`);

    // 4. Create Payment
    const [paymentResult] = await connection.query(
      "INSERT INTO product_payments (OrderID, ClientID, Amount, PaymentMethod) VALUES (?, ?, ?, ?)",
      [orderId, clientId, totalAmount.toFixed(2), paymentMethod]
    );
    const paymentId = paymentResult.insertId;
    console.log(
      `Payment ${paymentId} recorded for OrderID ${orderId} using method ${paymentMethod}.`
    );

    // 5. Update Order with PaymentID
    await connection.query(
      "UPDATE orders SET PaymentID = ? WHERE OrderID = ?",
      [paymentId, orderId]
    );
    console.log(`Order ${orderId} updated with PaymentID ${paymentId}.`);

    // 6. Update Product Stock
    for (const update of productUpdates) {
      await connection.query(
        "UPDATE products SET Stock = ? WHERE ProductID = ?",
        [update.newStock, update.productId]
      );
    }
    console.log(`Product stocks updated for OrderID ${orderId}.`);

    await connection.commit(); // Commit the transaction
    req.session.cart = []; // Clear the cart after successful purchase
    console.log(`Purchase for OrderID ${orderId} completed successfully.`);
    res.json({
      success: true,
      message: "Purchase completed successfully!",
      orderId: orderId,
      totalAmount: totalAmount.toFixed(2),
    });
  } catch (err) {
    await connection.rollback(); // Rollback on error
    console.error("Error during purchase transaction:", err);
    res
      .status(500)
      .json({
        success: false,
        message: "Purchase failed.",
        error: err.message,
      });
  } finally {
    connection.release(); // Release the connection back to the pool
  }
});

/**
 * Admin manage profiles:
 */
// --- GET All Profiles ---

const saltRounds = 10;
//With "salt round" they actually mean the cost factor. The cost factor controls how much time is needed to calculate a single BCrypt hash.
// The higher the cost factor, the more hashing rounds are done. Increasing the cost factor by 1 doubles the necessary time.
//16 bytes (128 bits) or more is generally sufficient to provide a large enough space of possible values,
// minimizing the risk of collisions (i.e., two different passwords ending up with the same salt).
app.get("/manage/profile/admins", async (req, res) => {
  try {
    const [results] = await pool.query(
      "SELECT AdminID, FullName, Email, Phone, Role, DateJoined, ProfilePic FROM admins"
    );
    res.json(results);
  } catch (err) {
    console.error("Error fetching admins:", err);
    res
      .status(500)
      .json({ error: "Failed to retrieve admins", details: err.message });
  }
});

app.get("/manage/profile/clients", async (req, res) => {
  try {
    const [results] = await pool.query(
      "SELECT ClientID, FullName, Email, Phone, Gender, DOB, Address, City, Country, DateJoined, ProfilePic FROM clients"
    );
    res.json(results);
  } catch (err) {
    console.error("Error fetching clients:", err);
    res
      .status(500)
      .json({ error: "Failed to retrieve clients", details: err.message });
  }
});

app.get("/manage/profile/trainers", async (req, res) => {
  try {
    const [results] = await pool.query(
      `SELECT TrainerID, FullName, Email, Phone, Gender, DOB, Address, City, Country, 
            Qualifications, Expertise, IntroVideoURL, DateJoined, CertTitle, CertIssuer, CertYear, CertID, ProfilePic
            FROM trainers`
    );
    res.json(results);
  } catch (err) {
    console.error("Error fetching trainers:", err);
    res
      .status(500)
      .json({ error: "Failed to retrieve trainers", details: err.message });
  }
});

// --- GET Single Profile for Editing ---
app.get("/manage/profile/trainer/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      "SELECT * FROM trainers WHERE TrainerID = ?",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Trainer not found" });
    }
    const trainer = { ...rows[0] };
    delete trainer.PasswordHash;
    delete trainer.CertFile;
    delete trainer.ProfilePic;
    res.json(trainer);
  } catch (err) {
    console.error("Error fetching single trainer:", err);
    res
      .status(500)
      .json({
        error: "Failed to retrieve trainer details",
        details: err.message,
      });
  }
});

app.get("/manage/profile/client/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      "SELECT * FROM clients WHERE ClientID = ?",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Client not found" });
    }
    const client = { ...rows[0] };
    delete client.PasswordHash;
    delete client.ProfilePic;
    res.json(client);
  } catch (err) {
    console.error("Error fetching single client:", err);
    res
      .status(500)
      .json({
        error: "Failed to retrieve client details",
        details: err.message,
      });
  }
});

app.get("/manage/profile/admin/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query("SELECT * FROM admins WHERE AdminID = ?", [
      id,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ error: "Admin not found" });
    }
    const admin = { ...rows[0] };
    delete admin.PasswordHash;
    delete admin.ProfilePic;
    res.json(admin);
  } catch (err) {
    console.error("Error fetching single admin:", err);
    res
      .status(500)
      .json({
        error: "Failed to retrieve admin details",
        details: err.message,
      });
  }
});

// --- Profile Picture Serving Routes ---
app.get("/profile-pic/trainer/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT ProfilePic FROM trainers WHERE TrainerID = ?",
      [req.params.id]
    );
    if (!rows.length || !rows[0].ProfilePic)
      return res.status(404).send("No profile picture found.");
    res.setHeader("Content-Type", "image/jpeg");
    res.send(rows[0].ProfilePic);
  } catch (err) {
    console.error("Error serving trainer profile pic:", err);
    res.status(500).send("Failed to retrieve profile picture.");
  }
});

app.get("/profile-pic/client/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT ProfilePic FROM clients WHERE ClientID = ?",
      [req.params.id]
    );
    if (!rows.length || !rows[0].ProfilePic)
      return res.status(404).send("No profile picture found.");
    res.setHeader("Content-Type", "image/jpeg");
    res.send(rows[0].ProfilePic);
  } catch (err) {
    console.error("Error serving client profile pic:", err);
    res.status(500).send("Failed to retrieve profile picture.");
  }
});

app.get("/profile-pic/admin/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT ProfilePic FROM admins WHERE AdminID = ?",
      [req.params.id]
    );
    if (!rows.length || !rows[0].ProfilePic)
      return res.status(404).send("No profile picture found.");
    res.setHeader("Content-Type", "image/jpeg");
    res.send(rows[0].ProfilePic);
  } catch (err) {
    console.error("Error serving admin profile pic:", err);
    res.status(500).send("Failed to retrieve profile picture.");
  }
});

// --- Create Routes (POST) ---
app.post(
  "/manage/profile/trainers",
  upload.fields([
    { name: "ProfilePic", maxCount: 1 },
    { name: "CertFile", maxCount: 1 },
  ]),
  async (req, res) => {
    const {
      FullName,
      Email,
      PasswordHash,
      Phone,
      Gender,
      DOB,
      Address,
      City,
      Country,
      Qualifications,
      Expertise,
      IntroVideoURL,
      CertTitle,
      CertIssuer,
      CertYear,
      CertID,
    } = req.body;
    const profilePic =
      req.files && req.files["ProfilePic"]
        ? req.files["ProfilePic"][0].buffer
        : null;
    const certFile =
      req.files && req.files["CertFile"]
        ? req.files["CertFile"][0].buffer
        : null;

    if (!FullName || !Email || !PasswordHash) {
      return res
        .status(400)
        .json({ error: "Full Name, Email, and Password are required." });
    }
    if (!validateEmail(Email)) {
      return res.status(400).json({ error: "Invalid email format." });
    }

    try {
      const hashedPassword = await bcrypt.hash(PasswordHash, saltRounds);
      const [result] = await pool.query(
        `INSERT INTO trainers (FullName, Email, PasswordHash, Phone, Gender, DOB, Address, City, Country, 
            ProfilePic, Qualifications, Expertise, IntroVideoURL, CertTitle, CertIssuer, CertYear, CertID, CertFile) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          FullName,
          Email,
          hashedPassword,
          Phone,
          Gender,
          DOB,
          Address,
          City,
          Country,
          profilePic,
          Qualifications,
          Expertise,
          IntroVideoURL,
          CertTitle,
          CertIssuer,
          CertYear,
          CertID,
          certFile,
        ]
      );
      res
        .status(201)
        .json({
          message: "Trainer created successfully",
          trainerId: result.insertId,
        });
    } catch (err) {
      console.error("Error creating trainer:", err);
      res
        .status(500)
        .json({ error: "Failed to create trainer", details: err.message });
    }
  }
);

app.post(
  "/manage/profile/clients",
  upload.single("ProfilePic"),
  async (req, res) => {
    const {
      FullName,
      Email,
      PasswordHash,
      Phone,
      Gender,
      DOB,
      Address,
      City,
      Country,
    } = req.body;
    const profilePic = req.file ? req.file.buffer : null;

    if (!FullName || !Email || !PasswordHash) {
      return res
        .status(400)
        .json({ error: "Full Name, Email, and Password are required." });
    }
    if (!validateEmail(Email)) {
      return res.status(400).json({ error: "Invalid email format." });
    }

    try {
      const hashedPassword = await bcrypt.hash(PasswordHash, saltRounds);
      const [result] = await pool.query(
        `INSERT INTO clients (FullName, Email, PasswordHash, Phone, Gender, DOB, Address, City, Country, ProfilePic) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          FullName,
          Email,
          hashedPassword,
          Phone,
          Gender,
          DOB,
          Address,
          City,
          Country,
          profilePic,
        ]
      );
      res
        .status(201)
        .json({
          message: "Client created successfully",
          clientId: result.insertId,
        });
    } catch (err) {
      console.error("Error creating client:", err);
      res
        .status(500)
        .json({ error: "Failed to create client", details: err.message });
    }
  }
);

app.post(
  "/manage/profile/admins",
  upload.single("ProfilePic"),
  async (req, res) => {
    const { FullName, Email, PasswordHash, Phone, Role } = req.body;
    const profilePic = req.file ? req.file.buffer : null;

    if (!FullName || !Email || !PasswordHash || !Role) {
      return res
        .status(400)
        .json({ error: "Full Name, Email, Password, and Role are required." });
    }
    if (!validateEmail(Email)) {
      return res.status(400).json({ error: "Invalid email format." });
    }
    if (!["SuperAdmin", "Manager"].includes(Role)) {
      return res
        .status(400)
        .json({ error: "Invalid role. Must be SuperAdmin or Manager." });
    }

    try {
      const hashedPassword = await bcrypt.hash(PasswordHash, saltRounds);
      const [result] = await pool.query(
        `INSERT INTO admins (FullName, Email, PasswordHash, Phone, Role, ProfilePic) 
            VALUES (?, ?, ?, ?, ?, ?)`,
        [FullName, Email, hashedPassword, Phone, Role, profilePic]
      );
      res
        .status(201)
        .json({
          message: "Admin created successfully",
          adminId: result.insertId,
        });
    } catch (err) {
      console.error("Error creating admin:", err);
      res
        .status(500)
        .json({ error: "Failed to create admin", details: err.message });
    }
  }
);

// --- Update profiles
app.put(
  "/manage/profile/admin/:id",
  upload.single("ProfilePic"),
  async (req, res) => {
    const { id } = req.params;
    const { FullName, Email, PasswordHash, Phone, Role } = req.body;
    const profilePic = req.file ? req.file.buffer : undefined;

    if (!FullName || !Email) {
      return res
        .status(400)
        .json({ error: "Full Name and Email are required." });
    }
    if (Email && !validateEmail(Email)) {
      return res.status(400).json({ error: "Invalid email format." });
    }
    if (Role && !["SuperAdmin", "Manager"].includes(Role)) {
      return res
        .status(400)
        .json({ error: "Invalid role. Must be SuperAdmin or Manager." });
    }

    try {
      let updateFields = [];
      let queryParams = [];

      updateFields.push("FullName = ?");
      queryParams.push(FullName);
      updateFields.push("Email = ?");
      queryParams.push(Email);
      updateFields.push("Phone = ?");
      queryParams.push(Phone || null);
      updateFields.push("Role = ?");
      queryParams.push(Role || null);

      if (PasswordHash) {
        const hashedPassword = await bcrypt.hash(PasswordHash, saltRounds);
        updateFields.push("PasswordHash = ?");
        queryParams.push(hashedPassword);
      }
      if (profilePic !== undefined) {
        updateFields.push("ProfilePic = ?");
        queryParams.push(profilePic);
      }

      const updateQuery = `UPDATE admins SET ${updateFields.join(
        ", "
      )} WHERE AdminID = ?`;
      queryParams.push(id);

      const [result] = await pool.query(updateQuery, queryParams);

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ error: "Admin not found or no changes made." });
      }
      res.json({ message: "Admin updated successfully" });
    } catch (err) {
      console.error("Error updating admin:", err);
      res
        .status(500)
        .json({ error: "Failed to update admin", details: err.message });
    }
  }
);

app.put(
  "/manage/profile/client/:id",
  upload.single("ProfilePic"),
  async (req, res) => {
    const { id } = req.params;
    const {
      FullName,
      Email,
      PasswordHash,
      Phone,
      Gender,
      DOB,
      Address,
      City,
      Country,
    } = req.body;
    const profilePic = req.file ? req.file.buffer : undefined;

    if (!FullName || !Email) {
      return res
        .status(400)
        .json({ error: "Full Name and Email are required." });
    }
    if (Email && !validateEmail(Email)) {
      return res.status(400).json({ error: "Invalid email format." });
    }

    try {
      let updateFields = [];
      let queryParams = [];

      updateFields.push("FullName = ?");
      queryParams.push(FullName);
      updateFields.push("Email = ?");
      queryParams.push(Email);
      updateFields.push("Phone = ?");
      queryParams.push(Phone || null);
      updateFields.push("Gender = ?");
      queryParams.push(Gender || null);
      updateFields.push("DOB = ?");
      queryParams.push(DOB || null);
      updateFields.push("Address = ?");
      queryParams.push(Address || null);
      updateFields.push("City = ?");
      queryParams.push(City || null);
      updateFields.push("Country = ?");
      queryParams.push(Country || null);

      if (PasswordHash) {
        const hashedPassword = await bcrypt.hash(PasswordHash, saltRounds);
        updateFields.push("PasswordHash = ?");
        queryParams.push(hashedPassword);
      }
      if (profilePic !== undefined) {
        updateFields.push("ProfilePic = ?");
        queryParams.push(profilePic);
      }

      const updateQuery = `UPDATE clients SET ${updateFields.join(
        ", "
      )} WHERE ClientID = ?`;
      queryParams.push(id);

      const [result] = await pool.query(updateQuery, queryParams);

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ error: "Client not found or no changes made." });
      }
      res.json({ message: "Client updated successfully" });
    } catch (err) {
      console.error("Error updating client:", err);
      res
        .status(500)
        .json({ error: "Failed to update client", details: err.message });
    }
  }
);

app.put(
  "/manage/profile/trainer/:id",
  upload.fields([
    { name: "ProfilePic", maxCount: 1 },
    { name: "CertFile", maxCount: 1 },
  ]),
  async (req, res) => {
    const { id } = req.params;
    const {
      FullName,
      Email,
      PasswordHash,
      Phone,
      Gender,
      DOB,
      Address,
      City,
      Country,
      Qualifications,
      Expertise,
      IntroVideoURL,
      CertTitle,
      CertIssuer,
      CertYear,
      CertID,
    } = req.body;
    const profilePic =
      req.files && req.files["ProfilePic"]
        ? req.files["ProfilePic"][0].buffer
        : undefined;
    const certFile =
      req.files && req.files["CertFile"]
        ? req.files["CertFile"][0].buffer
        : undefined;

    if (!FullName || !Email) {
      return res
        .status(400)
        .json({ error: "Full Name and Email are required." });
    }
    if (Email && !validateEmail(Email)) {
      return res.status(400).json({ error: "Invalid email format." });
    }

    try {
      let updateFields = [];
      let queryParams = [];

      updateFields.push("FullName = ?");
      queryParams.push(FullName);
      updateFields.push("Email = ?");
      queryParams.push(Email);
      updateFields.push("Phone = ?");
      queryParams.push(Phone || null);
      updateFields.push("Gender = ?");
      queryParams.push(Gender || null);
      updateFields.push("DOB = ?");
      queryParams.push(DOB || null);
      updateFields.push("Address = ?");
      queryParams.push(Address || null);
      updateFields.push("City = ?");
      queryParams.push(City || null);
      updateFields.push("Country = ?");
      queryParams.push(Country || null);
      updateFields.push("Qualifications = ?");
      queryParams.push(Qualifications || null);
      updateFields.push("Expertise = ?");
      queryParams.push(Expertise || null);
      updateFields.push("IntroVideoURL = ?");
      queryParams.push(IntroVideoURL || null);
      updateFields.push("CertTitle = ?");
      queryParams.push(CertTitle || null);
      updateFields.push("CertIssuer = ?");
      queryParams.push(CertIssuer || null);
      updateFields.push("CertYear = ?");
      queryParams.push(CertYear || null);
      updateFields.push("CertID = ?");
      queryParams.push(CertID || null);

      if (PasswordHash) {
        const hashedPassword = await bcrypt.hash(PasswordHash, saltRounds);
        updateFields.push("PasswordHash = ?");
        queryParams.push(hashedPassword);
      }
      if (profilePic !== undefined) {
        updateFields.push("ProfilePic = ?");
        queryParams.push(profilePic);
      }
      if (certFile !== undefined) {
        updateFields.push("CertFile = ?");
        queryParams.push(certFile);
      }

      const updateQuery = `UPDATE trainers SET ${updateFields.join(
        ", "
      )} WHERE TrainerID = ?`;
      queryParams.push(id);

      const [result] = await pool.query(updateQuery, queryParams);

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ error: "Trainer not found or no changes made." });
      }
      res.json({ message: "Trainer updated successfully" });
    } catch (err) {
      console.error("Error updating trainer:", err);
      res
        .status(500)
        .json({ error: "Failed to update trainer", details: err.message });
    }
  }
);

// --- Delete ACCs (DELETE) ---
app.delete("/manage/profile/admin/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query("DELETE FROM admins WHERE AdminID = ?", [
      id,
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Admin not found." });
    }
    res.json({ message: "Admin deleted successfully" });
  } catch (err) {
    console.error("Error deleting admin:", err);
    res
      .status(500)
      .json({ error: "Failed to delete admin", details: err.message });
  }
});

app.delete("/manage/profile/trainer/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query(
      "DELETE FROM trainers WHERE TrainerID = ?",
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Trainer not found." });
    }
    res.json({ message: "Trainer deleted successfully" });
  } catch (err) {
    console.error("Error deleting trainer:", err);
    res
      .status(500)
      .json({ error: "Failed to delete trainer", details: err.message });
  }
});

app.delete("/manage/profile/client/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query(
      "DELETE FROM clients WHERE ClientID = ?",
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Client not found." });
    }
    res.json({ message: "Client deleted successfully" });
  } catch (err) {
    console.error("Error deleting client:", err);
    res
      .status(500)
      .json({ error: "Failed to delete client", details: err.message });
  }
});


/**
 * Client daily progress tracking API endpoints
 */

// GET all exercises
app.get("/api/exercises", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT ExerciseID, ExerciseName, Description, Category FROM exercises ORDER BY ExerciseName ASC"
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching exercises:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error fetching exercises." });
  }
});

// GET client's progress snapshots
app.get(
  "/api/client/:clientId/progress-snapshots",
  requireClientAuth,
  async (req, res) => {
    const { clientId } = req.params;
    try {
      const [rows] = await pool.execute(
        "SELECT SnapshotID, ClientID, DateTaken, WeightKg, BodyFatPercent, BMI, Notes FROM client_progress_snapshots WHERE ClientID = ? ORDER BY DateTaken DESC",
        [clientId]
      );
      // Do not send LONGBLOB directly in listing, create a separate endpoint for image retrieval
      // The frontend will call a specific endpoint for the image data when needed.
      res.json(rows);
    } catch (err) {
      console.error(
        "Error fetching progress snapshots for client",
        clientId,
        ":",
        err
      );
      res
        .status(500)
        .json({
          success: false,
          message: "Server error fetching progress snapshots.",
        });
    }
  }
);

// POST a new client progress snapshot
app.post(
  "/api/client/:clientId/progress-snapshots",
  requireClientAuth,
  upload.single("progressImage"),
  async (req, res) => {
    const { clientId } = req.params;
    const { dateTaken, weightKg, bodyFatPercent, bmi, notes } = req.body;
    const progressImageBuffer = req.file ? req.file.buffer : null; // Access the buffer directly
    // Removed progressImageMimeType as it's not in the provided DB schema
    if (!dateTaken || !weightKg || !bodyFatPercent || !bmi) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required snapshot fields." });
    }
    try {
      const [result] = await pool.execute(
        "INSERT INTO client_progress_snapshots (ClientID, DateTaken, WeightKg, BodyFatPercent, BMI, ProgressImage, Notes) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          clientId,
          dateTaken,
          weightKg,
          bodyFatPercent,
          bmi,
          progressImageBuffer,
          notes,
        ]
      );
      res
        .status(201)
        .json({
          success: true,
          message: "Progress snapshot added successfully!",
          snapshotId: result.insertId,
        });
    } catch (err) {
      console.error(
        "Error adding progress snapshot for client",
        clientId,
        ":",
        err
      );
      res
        .status(500)
        .json({
          success: false,
          message: "Server error adding progress snapshot.",
        });
    }
  }
);

// GET progress image by SnapshotID
app.get(
  "/api/client/:clientId/progress-snapshots/:snapshotId/image",
  requireClientAuth,
  async (req, res) => {
    const { clientId, snapshotId } = req.params;
    try {
      const [rows] = await pool.execute(
        "SELECT ProgressImage FROM client_progress_snapshots WHERE ClientID = ? AND SnapshotID = ?",
        [clientId, snapshotId]
      );
      if (rows.length === 0 || !rows[0].ProgressImage) {
        return res
          .status(404)
          .json({ success: false, message: "Image not found." });
      }
      const imageData = rows[0].ProgressImage;
      const imageMimeType = "application/octet-stream"; // Default to octet-stream as MimeType is not stored in DB based on provided schema
      res.writeHead(200, {
        "Content-Type": imageMimeType,
        "Content-Length": imageData.length,
      });
      res.end(imageData);
    } catch (err) {
      console.error(
        "Error serving progress image for snapshot",
        snapshotId,
        ":",
        err
      );
      res
        .status(500)
        .json({
          success: false,
          message: "Server error serving progress image.",
        });
    }
  }
);

// GET client's workout logs
app.get(
  "/api/client/:clientId/workouts",
  requireClientAuth,
  async (req, res) => {
    const { clientId } = req.params;
    try {
      const [rows] = await pool.execute(
        `SELECT cw.WorkoutLogID, cw.ClientID, cw.DatePerformed, cw.SetsDone, cw.RepsDone, cw.WeightUsedKg, 
                    cw.HeartRate, cw.CaloriesBurned, cw.FatigueLevel, cw.TrainerNotes, cw.ClientFeedback, 
                    e.ExerciseName
                    FROM client_workouts cw
                    JOIN exercises e ON cw.ExerciseID = e.ExerciseID
                    WHERE cw.ClientID = ?
                    ORDER BY cw.DatePerformed DESC`,
        [clientId]
      );
      // Do not send LONGBLOB directly, create a separate endpoint for attachment retrieval
      // AttachmentMimeType is removed as it's not in the provided DB schema.
      res.json(rows);
    } catch (err) {
      console.error(
        "Error fetching workout logs for client",
        clientId,
        ":",
        err
      );
      res
        .status(500)
        .json({
          success: false,
          message: "Server error fetching workout logs.",
        });
    }
  }
);

// POST a new client workout log
app.post(
  "/api/client/:clientId/workouts",
  requireClientAuth,
  upload.single("attachment"),
  async (req, res) => {
    const { clientId } = req.params;
    const {
      datePerformed,
      exerciseId,
      setsDone,
      repsDone,
      weightUsedKg,
      heartRate,
      caloriesBurned,
      fatigueLevel,
      clientFeedback,
    } = req.body;
    const attachmentBuffer = req.file ? req.file.buffer : null;
    // Removed attachmentMimeType as it's not in the provided DB schema

    if (
      !datePerformed ||
      !exerciseId ||
      !setsDone ||
      !repsDone ||
      !weightUsedKg
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Missing required workout log fields.",
        });
    }

    try {
      const [result] = await pool.execute(
        `INSERT INTO client_workouts (ClientID, ExerciseID, DatePerformed, SetsDone, RepsDone, WeightUsedKg, HeartRate, CaloriesBurned, FatigueLevel, TrainerNotes, ClientFeedback, Attachment) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          clientId,
          exerciseId,
          dayjs(datePerformed).format("YYYY-MM-DD"),
          setsDone,
          repsDone,
          weightUsedKg,
          heartRate || null,
          caloriesBurned || null,
          fatigueLevel,
          null,
          clientFeedback,
          attachmentBuffer,
        ]
      );
      res
        .status(201)
        .json({
          success: true,
          message: "Workout log added successfully!",
          workoutLogId: result.insertId,
        });
    } catch (err) {
      console.error("Error adding workout log for client", clientId, ":", err);
      res
        .status(500)
        .json({ success: false, message: "Server error adding workout log." });
    }
  }
);

// GET attachment by WorkoutLogID
app.get(
  "/api/client/:clientId/workouts/:workoutLogId/attachment",
  requireClientAuth,
  async (req, res) => {
    const { clientId, workoutLogId } = req.params;
    try {
      const [rows] = await pool.execute(
        "SELECT Attachment FROM client_workouts WHERE ClientID = ? AND WorkoutLogID = ?",
        [clientId, workoutLogId]
      );

      if (rows.length === 0 || !rows[0].Attachment) {
        return res
          .status(404)
          .json({ success: false, message: "Attachment not found." });
      }

      const attachmentData = rows[0].Attachment;
      // Default to octet-stream as MimeType is not stored in DB based on provided schema
      const attachmentMimeType = "application/octet-stream";

      res.writeHead(200, {
        "Content-Type": attachmentMimeType,
        "Content-Length": attachmentData.length,
      });
      res.end(attachmentData);
    } catch (err) {
      console.error(
        "Error serving workout attachment for log",
        workoutLogId,
        ":",
        err
      );
      res
        .status(500)
        .json({
          success: false,
          message: "Server error serving workout attachment.",
        });
    }
  }
);

/**
 * bcrypt.hash('12341234', 10).then(console.log); // for manually hashing pass
 */

/**
 * Signup POST handler  for clients
 */
app.post("/signup", upload.single("ProfilePic"), async (req, res) => {
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
    if (
      !FullName ||
      !Email ||
      !Password ||
      !Phone ||
      !Gender ||
      !DOB ||
      !Address ||
      !City ||
      !Country
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Please fill in all required fields.",
        });
    }
    if (!validateEmail(Email)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email format." });
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
    res.json({
      success: true,
      message: "Signup successful!",
      clientId: result.insertId,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Server error during signup." });
  }
});

/**
 * Client fetch their own data
 */
app.get("/profile", async (req, res) => {
  if (!req.session.userId) {
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized - not logged in" });
  }
  try {
    const [rows] = await pool.execute(
      `
      SELECT 
        ClientID, FullName, Email, Phone, Gender, DOB, Address, City, Country,
        TO_BASE64(ProfilePic) AS ProfilePic  -- convert binary to base64 for front-end
      FROM clients WHERE ClientID = ?
    `,
      [req.session.userId]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * Client update their own data
 */
app.post("/update-profile", upload.single("ProfilePic"), async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const { FullName, Phone, City, Country, Address } = req.body;
  const profilePicBuffer = req.file ? req.file.buffer : null;

  try {
    if (profilePicBuffer) {
      await pool.execute(
        `
        UPDATE clients 
        SET FullName = ?, Phone = ?, City = ?, Country = ?, Address = ?, ProfilePic = ?
        WHERE ClientID = ?`,
        [
          FullName,
          Phone,
          City,
          Country,
          Address,
          profilePicBuffer,
          req.session.userId,
        ]
      );
    } else {
      await pool.execute(
        `
        UPDATE clients 
        SET FullName = ?, Phone = ?, City = ?, Country = ?, Address = ?
        WHERE ClientID = ?`,
        [FullName, Phone, City, Country, Address, req.session.userId]
      );
    }

    res.json({ success: true, message: "Profile updated successfully" });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Failed to update profile" });
  }
});

/**
 * Client fetch virtual class routines
 */
app.get("/api/virtualclasses", async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT ClassID, Title, Description, StartTime, DurationMinutes, Platform, JoinLink 
      FROM virtualclasses
      ORDER BY StartTime ASC
    `);
    res.json({ success: true, classes: rows });
  } catch (err) {
    console.error("Error fetching virtual classes:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * Client fetch their attendance records
 */
app.get("/api/attendance", async (req, res) => {
  const clientId = req.session.userId;
  const [rows] = await pool.execute(
    `
    SELECT * FROM attendance 
    WHERE ClientID = ? 
    ORDER BY CheckInTime DESC 
    LIMIT 7
  `,
    [clientId]
  );

  res.json({ success: true, records: rows });
});

/**
 * Client check in and out their attendance records
 */
app.post("/api/attendance/checkin", async (req, res) => {
  const clientId = req.session?.userId;
  if (!clientId)
    return res.status(401).json({ success: false, message: "Unauthorized" });

  try {
    const todayBD = dayjs().utcOffset(BD_OFFSET).format("YYYY-MM-DD");

    const [existing] = await pool.execute(
      `SELECT * FROM attendance WHERE ClientID = ? AND DATE(CONVERT_TZ(CheckInTime, '+00:00', '+06:00')) = ?`,
      [clientId, todayBD]
    );

    if (existing.length > 0) {
      return res.json({ success: false, message: "Already checked in today" });
    }

    const nowUtc = dayjs().utc().format("YYYY-MM-DD HH:mm:ss");

    await pool.execute(
      `INSERT INTO attendance (ClientID, CheckInTime, Method) VALUES (?, ?, 'Manual')`,
      [clientId, nowUtc]
    );

    res.json({ success: true, message: "Checked in successfully" });
  } catch (err) {
    console.error("Check-in error:", err);
    res.status(500).json({ success: false, message: "Check-in failed" });
  }
});

app.post("/api/attendance/checkout", async (req, res) => {
  const clientId = req.session?.userId;
  if (!clientId)
    return res.status(401).json({ success: false, message: "Unauthorized" });

  try {
    const todayBD = dayjs().utcOffset(BD_OFFSET).format("YYYY-MM-DD");

    const [recordResult] = await pool.execute(
      `SELECT * FROM attendance WHERE ClientID = ? AND DATE(CONVERT_TZ(CheckInTime, '+00:00', '+06:00')) = ? ORDER BY CheckInTime DESC LIMIT 1`,
      [clientId, todayBD]
    );

    if (recordResult.length === 0) {
      return res.json({
        success: false,
        message: "No check-in record found for today.",
      });
    }

    const record = recordResult[0];

    if (record.CheckOutTime) {
      return res.json({ success: false, message: "Already checked out." });
    }

    const nowUtc = dayjs().utc();
    const checkInUtc = dayjs.utc(record.CheckInTime);

    if (nowUtc.isBefore(checkInUtc)) {
      return res.json({
        success: false,
        message: "Check-out must be after check-in.",
      });
    }

    const nowUtcFormatted = nowUtc.format("YYYY-MM-DD HH:mm:ss");

    await pool.execute(
      `UPDATE attendance SET CheckOutTime = ? WHERE AttendanceID = ?`,
      [nowUtcFormatted, record.AttendanceID]
    );

    res.json({ success: true, message: "Checked out successfully." });
  } catch (err) {
    console.error("Check-out error:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error during check-out." });
  }
});

/**
 * Client update their health log records
 */

app.post("/api/healthlog", express.json(), async (req, res) => {
  const clientId = req.session.userId;
  if (!clientId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  const {
    Weight,
    Calories,
    WaterIntakeLitres,
    SleepHours,
    WorkoutDescription,
  } = req.body;
  if (!Weight || !Calories || !WaterIntakeLitres || !SleepHours) {
    return res.json({
      success: false,
      message: "All fields except workout notes are required.",
    });
  }
  try {
    await pool.execute(
      `
      INSERT INTO healthlogs (ClientID, Weight, Calories, WaterIntakeLitres, SleepHours, WorkoutDescription, LogDate)
      VALUES (?, ?, ?, ?, ?, ?, CURDATE())
    `,
      [
        clientId,
        Weight,
        Calories,
        WaterIntakeLitres,
        SleepHours,
        WorkoutDescription,
      ]
    );

    res.json({ success: true, message: "Daily log submitted." });
  } catch (err) {
    console.error("Insert error:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error. Please try again." });
  }
});

/**
 * Client fetch their health log records
 */

app.get("/api/healthlog", async (req, res) => {
  const clientId = req.session.userId;
  if (!clientId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const [rows] = await pool.execute(
      `
      SELECT * FROM healthlogs 
      WHERE ClientID = ? 
      ORDER BY LogDate DESC
      LIMIT 7
    `,
      [clientId]
    );

    res.json({ success: true, logs: rows });
  } catch (err) {
    console.error("Fetch error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch health logs." });
  }
});

/**
 * fetch client daily goals
 */
app.get("/goals/me", async (req, res) => {
  const clientId = req.session.userId;
  const userType = req.session.userType;

  if (!clientId || userType !== "client") {
    return res
      .status(401)
      .json({ error: "Unauthorized. Please log in as a client." });
  }

  try {
    const [rows] = await pool.execute(
      "SELECT * FROM fitnessgoals WHERE ClientID = ? ORDER BY TargetDate",
      [clientId]
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching goals:", err);
    res.status(500).json({ error: "Failed to fetch fitness goals." });
  }
});

/**
 *  client update progress
 */
app.put("/goals/update-status/:goalId", async (req, res) => {
  const clientId = req.session.userId;
  const userType = req.session.userType;

  if (!clientId || userType !== "client") {
    return res.status(401).json({ success: false, message: "Unauthorized." });
  }

  const goalId = req.params.goalId;
  const { isAchieved } = req.body;

  try {
    const [check] = await pool.execute(
      "SELECT * FROM fitnessgoals WHERE GoalID = ? AND ClientID = ?",
      [goalId, clientId]
    );

    if (check.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Goal not found or not yours." });
    }

    await pool.execute(
      "UPDATE fitnessgoals SET IsAchieved = ? WHERE GoalID = ?",
      [isAchieved ? 1 : 0, goalId]
    );

    res.json({ success: true, message: "Goal status updated." });
  } catch (err) {
    console.error("Update error:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error updating goal status." });
  }
});

/**
 * Trainer manage client fitness goals
 * Get all clients with goals
 */

app.get("/trainer/goals", async (req, res) => {
  try {
    const [clients] = await pool.execute("SELECT * FROM clients");
    const [goals] = await pool.execute("SELECT * FROM fitnessgoals");

    const clientsWithGoals = clients.map((client) => ({
      ...client,
      goals: goals.filter((goal) => goal.ClientID === client.ClientID),
    }));

    res.json({ success: true, data: clientsWithGoals });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({
        success: false,
        message: "Server error fetching clients and goals",
      });
  }
});

/**
 * Trainer add new goal
 */

app.post("/trainer/goals", async (req, res) => {
  try {
    const { ClientID, GoalTitle, GoalDescription, TargetDate, IsAchieved } =
      req.body;

    const sql = `
      INSERT INTO fitnessgoals (ClientID, GoalTitle, GoalDescription, TargetDate, IsAchieved)
      VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(sql, [
      ClientID,
      GoalTitle,
      GoalDescription,
      TargetDate,
      IsAchieved,
    ]);
    res.json({
      success: true,
      message: "Goal added successfully",
      goalId: result.insertId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error adding goal" });
  }
});

/**
 * Trainer Update goal
 */
app.put("/trainer/goals/:goalId", async (req, res) => {
  try {
    const goalId = req.params.goalId;
    const { GoalTitle, GoalDescription, TargetDate, IsAchieved } = req.body;

    const sql = `
      UPDATE fitnessgoals
      SET GoalTitle = ?, GoalDescription = ?, TargetDate = ?, IsAchieved = ?
      WHERE GoalID = ?
    `;

    await pool.execute(sql, [
      GoalTitle,
      GoalDescription,
      TargetDate,
      IsAchieved,
      goalId,
    ]);
    res.json({ success: true, message: "Goal updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error updating goal" });
  }
});

/**
 * Trainer Delete goal
 */
app.delete("/trainer/goals/:goalId", async (req, res) => {
  try {
    const goalId = req.params.goalId;
    await pool.execute("DELETE FROM fitnessgoals WHERE GoalID = ?", [goalId]);
    res.json({ success: true, message: "Goal deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error deleting goal" });
  }
});

/**
 * Trainer add new goals
 */

app.post("/trainer/new/goals", async (req, res) => {
  try {
    const { ClientID, GoalTitle, GoalDescription, TargetDate } = req.body;

    const sql = `
      INSERT INTO fitnessgoals (ClientID, GoalTitle, GoalDescription, TargetDate)
      VALUES (?, ?, ?, ?)
    `;

    const [result] = await pool.execute(sql, [
      ClientID,
      GoalTitle,
      GoalDescription,
      TargetDate,
    ]);

    res.json({
      success: true,
      message: "Goal added successfully",
      goalId: result.insertId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error adding goal" });
  }
});

/**
 * Get trainer dashboard profile
 */
app.get("/trainer/profile", async (req, res) => {
  if (!req.session.userId) {
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized - not logged in" });
  }

  try {
    const [rows] = await pool.execute(
      `
      SELECT 
        TrainerID, FullName, Email, Phone, Gender, DOB, Address, City, Country,
        Qualifications, Expertise, IntroVideoURL, DateJoined,
        CertTitle, CertIssuer, CertYear, CertID,
        TO_BASE64(ProfilePic) AS ProfilePicBase64,
        TO_BASE64(CertFile) AS CertFileBase64
      FROM trainers WHERE TrainerID = ?
    `,
      [req.session.userId]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Trainer not found" });
    }

    res.json({ success: true, trainer: rows[0] });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({
        success: false,
        message: "Server error fetching trainer profile",
      });
  }
});

// Update trainer profile
const cpUpload = upload.fields([
  { name: "ProfilePic", maxCount: 1 },
  { name: "CertFile", maxCount: 1 },
]);

app.post("/trainer/profile/update", cpUpload, async (req, res) => {
  const trainerId = req.session.userId;
  if (!trainerId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  const {
    FullName,
    Phone,
    Gender,
    DOB,
    Address,
    City,
    Country,
    Qualifications,
    Expertise,
    IntroVideoURL,
    CertTitle,
    CertIssuer,
    CertYear,
    CertID,
  } = req.body;
  const profilePicBuffer = req.files["ProfilePic"]?.[0]?.buffer || null;
  const certFileBuffer = req.files["CertFile"]?.[0]?.buffer || null;
  // Dynamically build SET clause and values
  const fields = [
    "FullName",
    "Phone",
    "Gender",
    "DOB",
    "Address",
    "City",
    "Country",
    "Qualifications",
    "Expertise",
    "IntroVideoURL",
    "CertTitle",
    "CertIssuer",
    "CertYear",
    "CertID",
  ];
  const values = [
    FullName,
    Phone,
    Gender,
    DOB,
    Address,
    City,
    Country,
    Qualifications,
    Expertise,
    IntroVideoURL,
    CertTitle,
    CertIssuer,
    CertYear,
    CertID,
  ];

  if (profilePicBuffer) {
    fields.push("ProfilePic");
    values.push(profilePicBuffer);
  }

  if (certFileBuffer) {
    fields.push("CertFile");
    values.push(certFileBuffer);
  }

  const setClause = fields.map((f) => `${f} = ?`).join(", ");
  values.push(trainerId);

  try {
    await pool.execute(
      `
      UPDATE trainers SET ${setClause}
      WHERE TrainerID = ?
    `,
      values
    );

    res.json({ success: true, message: "Profile updated successfully." });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Error updating profile." });
  }
});

/**
 * Trainer view attendance and client profile
 */
app.get("/trainer/attendance/count", async (req, res) => {
  try {
    const [rows] = await pool.query(`
        SELECT ClientID, COUNT(*) AS AttendanceCount
        FROM attendance
        GROUP BY ClientID
    `);
    res.json({ success: true, counts: rows });
  } catch (err) {
    console.error("Error fetching attendance counts:", err);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to fetch attendance counts",
        error: err.message,
      });
  }
});

/**
 * Trainer view attendance (existing endpoint, no changes needed here, just for context)
 */
app.get("/trainer/view/attendance", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT AttendanceID, ClientID, CheckInTime, CheckOutTime, Method FROM attendance ORDER BY CheckInTime DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching attendance:", err);
    res.status(500).json({ error: "Failed to fetch attendance data" });
  }
});

/**
 * Trainer view client profile (existing endpoint, no changes needed here, just for context)
 */
app.get("/trainer/client/:clientId", async (req, res) => {
  const clientId = req.params.clientId;
  try {
    // You might want to include a verifyToken middleware here as well
    const [rows] = await pool.query(
      "SELECT ClientID, FullName, Email, Phone, Gender, DOB, Address, City, Country, ProfilePic, DateJoined FROM clients WHERE ClientID = ?",
      [clientId]
    );
    if (rows.length === 0)
      return res.status(404).json({ error: "Client not found" });
    const client = rows[0];
    // Convert BLOB to base64 string for frontend
    if (client.ProfilePic) {
      client.ProfilePic = client.ProfilePic.toString("base64"); // Only send the base64 string
    }
    res.json(client);
  } catch (err) {
    console.error("Error fetching client details:", err);
    res.status(500).json({ error: "Failed to fetch client details" });
  }
});

/**
 * Trainer: Fetch all check-in history for a specific client.
 * Requires client ID as a URL parameter.
 */
app.get("/trainer/client/:clientId/checkin-history", async (req, res) => {
  const { clientId } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT CheckInTime, Method
       FROM attendance
       WHERE ClientID = ? AND CheckInTime IS NOT NULL
       ORDER BY CheckInTime DESC`, // Most recent check-ins first
      [clientId]
    );

    if (rows.length > 0) {
      res.json({ success: true, records: rows });
    } else {
      res.json({ success: true, records: [] });
    }
  } catch (err) {
    console.error(
      `Error fetching check-in history for ClientID ${clientId}:`,
      err
    );
    res
      .status(500)
      .json({
        success: false,
        error: "Internal server error while fetching check-in history.",
      });
  }
});

/**
 * Trainer: Fetch all check-out history for a specific client.
 * Requires client ID as a URL parameter.
 */
app.get("/trainer/client/:clientId/checkout-history", async (req, res) => {
  const { clientId } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT CheckOutTime, Method
       FROM attendance
       WHERE ClientID = ? AND CheckOutTime IS NOT NULL
       ORDER BY CheckOutTime DESC`, // Most recent check-outs first
      [clientId]
    );

    if (rows.length > 0) {
      res.json({ success: true, records: rows });
    } else {
      // It's not an error if no history is found, just an empty set.
      res.json({ success: true, records: [] });
    }
  } catch (err) {
    console.error(
      `Error fetching check-out history for ClientID ${clientId}:`,
      err
    );
    res
      .status(500)
      .json({
        success: false,
        error: "Internal server error while fetching check-out history.",
      });
  }
});

/**
 * Trainer virtual-classes/create/update/delete
 */

app.post("/trainer/virtual-classes/create", async (req, res) => {
  if (!req.session.userId || req.session.userType !== "trainer") {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const { Title, Description, StartTime, DurationMinutes, Platform, JoinLink } =
    req.body;

  if (!Title || !StartTime || !DurationMinutes || !Platform || !JoinLink) {
    return res
      .status(400)
      .json({ success: false, message: "All required fields must be filled." });
  }

  try {
    await pool.query(
      `INSERT INTO virtualclasses 
       (TrainerID, Title, Description, StartTime, DurationMinutes, Platform, JoinLink) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.session.userId,
        Title,
        Description || "",
        StartTime,
        DurationMinutes,
        Platform,
        JoinLink,
      ]
    );

    res.json({ success: true, message: "Virtual class created successfully." });
  } catch (err) {
    console.error("❌ Error creating virtual class:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error during class creation." });
  }
});

app.get("/trainer/virtual-classes", async (req, res) => {
  if (!req.session.userId || req.session.userType !== "trainer") {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const [rows] = await pool.query(
      "SELECT * FROM virtualclasses WHERE TrainerID = ? ORDER BY StartTime DESC",
      [req.session.userId]
    );
    res.json(rows); // Send the list of classes
  } catch (err) {
    console.error("❌ Error fetching virtual classes:", err);
    res
      .status(500)
      .json({ success: false, message: "Error fetching classes." });
  }
});
app.put("/trainer/virtual-classes/update/:id", async (req, res) => {
  if (!req.session.userId || req.session.userType !== "trainer") {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const { id } = req.params;
  const { Title, Description, StartTime, DurationMinutes, Platform, JoinLink } =
    req.body;

  try {
    const [result] = await pool.query(
      `UPDATE virtualclasses 
       SET Title = ?, Description = ?, StartTime = ?, DurationMinutes = ?, Platform = ?, JoinLink = ?
       WHERE ClassID = ? AND TrainerID = ?`,
      [
        Title,
        Description,
        StartTime,
        DurationMinutes,
        Platform,
        JoinLink,
        id,
        req.session.userId,
      ]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Class not found or not yours." });
    }

    res.json({ success: true, message: "Class updated successfully." });
  } catch (err) {
    console.error("❌ Error updating class:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error during update." });
  }
});
app.delete("/trainer/virtual-classes/delete/:id", async (req, res) => {
  if (!req.session.userId || req.session.userType !== "trainer") {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const { id } = req.params;

  try {
    const [result] = await pool.query(
      "DELETE FROM virtualclasses WHERE ClassID = ? AND TrainerID = ?",
      [id, req.session.userId]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Class not found or not yours." });
    }

    res.json({ success: true, message: "Class deleted successfully." });
  } catch (err) {
    console.error("❌ Error deleting class:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error during delete." });
  }
});

/**
 * GET all products with optional search and filter (including unavailable ones)
 */

app.get("/admin/products", async (req, res) => {
  try {
    const { search = "", category = "" } = req.query;
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
    rows.forEach((product) => {
      if (product.Image) {
        product.Image = Buffer.from(product.Image).toString("base64");
      }
    });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Admin POST - Add product
 */

app.post("/admin/products", upload.single("Image"), async (req, res) => {
  try {
    const {
      Name,
      Description,
      Category,
      Brand,
      Price,
      Stock,
      IsActive = 1,
    } = req.body;
    const Image = req.file ? req.file.buffer : null;

    const sql = `
      INSERT INTO products (Name, Description, Category, Brand, Price, Stock, Image, IsActive)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    await pool.query(sql, [
      Name,
      Description,
      Category,
      Brand,
      Price,
      Stock,
      Image,
      IsActive,
    ]);

    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Admin PUT - Update product
 */
app.put("/admin/products/:id", upload.single("Image"), async (req, res) => {
  try {
    const {
      Name,
      Description,
      Category,
      Brand,
      Price,
      Stock,
      IsActive = 1,
    } = req.body;
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

/**
 * Admin - del product
 */

app.delete("/admin/products/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      "DELETE FROM products WHERE ProductID = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Admin - subs plans management:
 */

app.get("/api/plans", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM subscription_plans ORDER BY PlanID ASC"
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching plans:", error);
    res.status(500).json({ error: "Failed to fetch subscription plans" });
  }
});

/**
 * Admin - subs plans management ---Add new plan:
 */

app.post("/api/plans", async (req, res) => {
  const { PlanName, Description, DurationMonths, Price } = req.body;

  if (!PlanName || !DurationMonths || Price === undefined) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO subscription_plans (PlanName, Description, DurationMonths, Price) VALUES (?, ?, ?, ?)",
      [PlanName, Description || null, DurationMonths, Price]
    );
    res.status(201).json({ PlanID: result.insertId });
  } catch (error) {
    console.error("Error adding plan:", error);
    res.status(500).json({ error: "Failed to add subscription plan" });
  }
});

/**
 * Admin - subs plans management -Update existing plan:
 */

app.put("/api/plans/:id", async (req, res) => {
  const { id } = req.params;
  const { PlanName, Description, DurationMonths, Price } = req.body;

  if (!PlanName || !DurationMonths || Price === undefined) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const [result] = await pool.query(
      "UPDATE subscription_plans SET PlanName = ?, Description = ?, DurationMonths = ?, Price = ? WHERE PlanID = ?",
      [PlanName, Description || null, DurationMonths, Price, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Plan not found" });
    }

    res.json({ message: "Plan updated" });
  } catch (error) {
    console.error("Error updating plan:", error);
    res.status(500).json({ error: "Failed to update subscription plan" });
  }
});

/**
 * Admin - subs plans management -Dek existing plan:
 */
app.delete("/api/plans/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query(
      "DELETE FROM subscription_plans WHERE PlanID = ?",
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Plan not found" });
    }
    res.json({ message: "Plan deleted" });
  } catch (error) {
    console.error("Error deleting plan:", error);
    res.status(500).json({ error: "Failed to delete subscription plan" });
  }
});

/**
 * Client: View available subs plans
 */
app.get("/api/client/plans", async (req, res) => {
  try {
    const [plans] = await pool.query(
      "SELECT * FROM subscription_plans ORDER BY PlanID ASC"
    );
    res.json(plans);
  } catch (error) {
    console.error("Failed to fetch plans:", error);
    res.status(500).json({ error: "Failed to fetch subscription plans" });
  }
});

/**
 * Client: Purchase a plan
 */
app.post("/api/client/purchase", async (req, res) => {
  const clientId = req.session.userId;
  const { PlanID, StartDate, PaymentMethod, TransactionRef } = req.body;

  if (!clientId) return res.status(401).json({ error: "Client not logged in" });
  if (!PlanID || !StartDate || !PaymentMethod || !TransactionRef) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const [[plan]] = await pool.query(
      "SELECT DurationMonths, Price FROM subscription_plans WHERE PlanID = ?",
      [PlanID]
    );
    if (!plan) return res.status(404).json({ error: "Plan not found" });

    const start = new Date(StartDate);
    if (isNaN(start))
      return res.status(400).json({ error: "Invalid StartDate" });
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
    console.log("Inserted payment with ID:", paymentId);
    res.status(201).json({
      message: "Purchase successful",
      SubscriptionID: subscriptionId,
      PaymentID: paymentId,
    });
  } catch (err) {
    console.error("Purchase error:", err);
    res.status(500).json({ error: "Internal server error during purchase" });
  }
});

function formatDate(d) {
  return d.toISOString().split("T")[0];
}

/**
 * Client-View active subscriptions
 */

app.get("/api/client/active-subscriptions", async (req, res) => {
  const clientId = req.session.clientId || req.session.userId;
  if (!clientId) {
    return res.status(401).json({ error: "Unauthorized: Client ID missing" });
  }
  try {
    const [rows] = await pool.query(
      `
      SELECT s.SubscriptionID, s.StartDate, s.EndDate, p.PlanName, p.Description, p.Price
      FROM subscriptions s
      JOIN subscription_plans p ON s.PlanID = p.PlanID
      WHERE s.ClientID = ? AND s.IsActive = 1
    `,
      [clientId]
    );
    res.json(rows);
  } catch (err) {
    console.error("Failed to fetch active subscriptions:", err);
    res.status(500).json({ error: "Server error fetching subscriptions" });
  }
});

/**
 * Admin manage active subscriptions abd payments
 */

app.get("/api/admin/subscriptions", async (req, res) => {
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
    console.error("Error loading subscriptions:", err.message);
    res.status(500).json({ error: "Failed to load subscriptions" });
  }
});

// Delete a subscription and its related payment
app.delete("/api/admin/subscriptions/:id", async (req, res) => {
  const subscriptionId = req.params.id;

  try {
    await pool.query("DELETE FROM payments WHERE SubscriptionID = ?", [
      subscriptionId,
    ]);
    await pool.query("DELETE FROM subscriptions WHERE SubscriptionID = ?", [
      subscriptionId,
    ]);
    res.json({
      message: "Subscription and related payment deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting subscription:", err.message);
    res.status(500).json({ error: "Failed to delete subscription" });
  }
});

/**
 * Admin-- Update subscription status
 */

app.put("/api/admin/subscriptions/:id/status", async (req, res) => {
  const subscriptionId = req.params.id;
  const { isActive, paymentStatus } = req.body;

  if (typeof isActive === "undefined" || !paymentStatus) {
    return res
      .status(400)
      .json({ error: "isActive and paymentStatus are required" });
  }

  try {
    // Update subscription IsActive status
    const [subscriptionResult] = await pool.query(
      "UPDATE subscriptions SET IsActive = ? WHERE SubscriptionID = ?",
      [isActive ? 1 : 0, subscriptionId]
    );
    // Update payment Status for the given subscription
    const [paymentResult] = await pool.query(
      "UPDATE payments SET Status = ? WHERE SubscriptionID = ?",
      [paymentStatus, subscriptionId]
    );
    console.log("Subscription Update:", subscriptionResult);
    console.log("Payment Update:", paymentResult);
    if (subscriptionResult.affectedRows === 0) {
      return res.status(404).json({ error: "Subscription not found" });
    }
    if (paymentResult.affectedRows === 0) {
      //inform client no payment found to update!
      return res
        .status(404)
        .json({ error: "Payment for subscription not found" });
    }
    res.json({
      message: "Subscription and payment status updated successfully",
    });
  } catch (err) {
    console.error("Error updating subscription/payment status:", err);
    res
      .status(500)
      .json({ error: "Failed to update subscription/payment status" });
  }
});

/**
 * Trainer-- View client progress status
 */

app.get("/api/clients", async (req, res) => {
  // API to search and get client basic info
  try {
    const searchQuery = req.query.search;
    let query = "SELECT ClientID, FullName, Email, ProfilePic FROM clients";
    const params = [];
    if (searchQuery) {
      query += " WHERE FullName LIKE ? OR Email LIKE ?";
      params.push(`%${searchQuery}%`, `%${searchQuery}%`);
    }
    const [rows] = await pool.execute(query, params);
    const clients = rows.map((client) => ({
      // Convert Buffer ProfilePic to base64 for display
      ...client,
      ProfilePic: client.ProfilePic
        ? Buffer.from(client.ProfilePic).toString("base64")
        : null,
    }));

    res.json({ success: true, clients });
  } catch (error) {
    console.error("Error fetching clients:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error fetching clients." });
  }
});

app.get("/api/clients/:clientId/details", async (req, res) => {
  // API to get detailed client info, workouts, and progress snapshots
  try {
    const { clientId } = req.params;
    // Fetch client basic details
    const [clientRows] = await pool.execute(
      "SELECT ClientID, FullName, Email, Phone, Gender, DOB, Address, City, Country, ProfilePic, DateJoined FROM clients WHERE ClientID = ?",
      [clientId]
    );
    if (clientRows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Client not found." });
    }
    const client = clientRows[0];
    // Convert ProfilePic to base64
    client.ProfilePic = client.ProfilePic
      ? Buffer.from(client.ProfilePic).toString("base64")
      : null;
    // Fetch client workouts
    const [workoutRows] = await pool.execute(
      "SELECT WorkoutLogID, ExerciseID, DatePerformed, SetsDone, RepsDone, WeightUsedKg, HeartRate, CaloriesBurned, FatigueLevel, TrainerNotes, ClientFeedback, Attachment FROM client_workouts WHERE ClientID = ? ORDER BY DatePerformed DESC LIMIT 10", // Limit to recent 10 workouts
      [clientId]
    );
    const workouts = workoutRows.map((workout) => ({
      ...workout,
      Attachment: workout.Attachment
        ? Buffer.from(workout.Attachment).toString("base64")
        : null,
    }));
    // Fetch client progress snapshots
    const [progressRows] = await pool.execute(
      "SELECT SnapshotID, DateTaken, WeightKg, BodyFatPercent, BMI, ProgressImage, Notes FROM client_progress_snapshots WHERE ClientID = ? ORDER BY DateTaken DESC LIMIT 5", // Limit to recent 5 snapshots
      [clientId]
    );
    const progressSnapshots = progressRows.map((snapshot) => ({
      ...snapshot,
      ProgressImage: snapshot.ProgressImage
        ? Buffer.from(snapshot.ProgressImage).toString("base64")
        : null,
    }));

    res.json({
      success: true,
      client,
      workouts,
      progressSnapshots,
    });
  } catch (error) {
    console.error("Error fetching client details:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Server error fetching client details.",
      });
  }
});

// Middleware to check if user is a logged-in trainer
const isTrainer = (req, res, next) => {
  if (req.session.userId && req.session.userType === "trainer") {
    next();
  } else {
    res
      .status(403)
      .json({
        success: false,
        message: "Access denied. Trainer login required.",
      });
  }
};

/**
 * GET Trainer's Own Workout Plans
 */
app.get("/trainer/workout-plans", isTrainer, async (req, res) => {
  try {
    const trainerId = req.session.userId;
    const [rows] = await pool.query(
      "SELECT * FROM workout_plans WHERE TrainerID = ? ORDER BY CreatedAt DESC",
      [trainerId]
    );
    res.json({ success: true, plans: rows });
  } catch (err) {
    console.error("Error fetching trainer's workout plans:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch your workout plans." });
  }
});

/**
 * POST Create a New Workout Plan
 */
app.post("/trainer/workout-plans", isTrainer, async (req, res) => {
  const { Title, Goal, Level, DurationWeeks, FocusAreas, CustomInstructions } =
    req.body;
  const trainerId = req.session.userId;

  if (!Title || !Goal || !Level || !DurationWeeks) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Title, Goal, Level, and Duration are required fields.",
      });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO workout_plans (TrainerID, Title, Goal, Level, DurationWeeks, FocusAreas, CustomInstructions)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        trainerId,
        Title,
        Goal,
        Level,
        DurationWeeks,
        FocusAreas,
        CustomInstructions,
      ]
    );
    res
      .status(201)
      .json({
        success: true,
        message: "Workout plan created successfully.",
        planId: result.insertId,
      });
  } catch (err) {
    console.error("Error creating workout plan:", err);
    res
      .status(500)
      .json({
        success: false,
        message: "Server error during workout plan creation.",
      });
  }
});

/**
 * PUT Update an Existing Workout Plan
 * Trainer can only update their own plans.
 */
app.put("/trainer/workout-plans/:planId", isTrainer, async (req, res) => {
  const { planId } = req.params;
  const {
    Title,
    Goal,
    Level,
    DurationWeeks,
    FocusAreas,
    CustomInstructions,
    IsActive,
  } = req.body;
  const trainerId = req.session.userId;

  try {
    const [result] = await pool.query(
      `UPDATE workout_plans
       SET Title = ?, Goal = ?, Level = ?, DurationWeeks = ?, FocusAreas = ?, CustomInstructions = ?, IsActive = ?
       WHERE PlanID = ? AND TrainerID = ?`, // Ensure only trainer's own plans are updated
      [
        Title,
        Goal,
        Level,
        DurationWeeks,
        FocusAreas,
        CustomInstructions,
        IsActive,
        planId,
        trainerId,
      ]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({
          success: false,
          message:
            "Workout plan not found or you do not have permission to update it.",
        });
    }
    res.json({ success: true, message: "Workout plan updated successfully." });
  } catch (err) {
    console.error(`Error updating workout plan ${planId}:`, err);
    res
      .status(500)
      .json({
        success: false,
        message: "Server error during workout plan update.",
      });
  }
});

/**
 * DELETE a Workout Plan
 * Trainer can only delete their own plans.
 */
app.delete("/trainer/workout-plans/:planId", isTrainer, async (req, res) => {
  const { planId } = req.params;
  const trainerId = req.session.userId;

  try {
    const [result] = await pool.query(
      "DELETE FROM workout_plans WHERE PlanID = ? AND TrainerID = ?", // Ensure only trainer's own plans are deleted
      [planId, trainerId]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({
          success: false,
          message:
            "Workout plan not found or you do not have permission to delete it.",
        });
    }
    res.json({ success: true, message: "Workout plan deleted successfully." });
  } catch (err) {
    console.error(`Error deleting workout plan ${planId}:`, err);
    res
      .status(500)
      .json({
        success: false,
        message: "Server error during workout plan deletion.",
      });
  }
});

/**
 * GET All Universal Exercises
 */
app.get("/exercises", isTrainer, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM exercises ORDER BY ExerciseName ASC"
    );
    res.json({ success: true, exercises: rows });
  } catch (err) {
    console.error("Error fetching exercises:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch exercises." });
  }
});

/**
 * POST Create a New Exercise
 */
app.post("/exercises", isTrainer, async (req, res) => {
  const { ExerciseName, Description, Category } = req.body;

  if (!ExerciseName) {
    return res
      .status(400)
      .json({ success: false, message: "Exercise Name is required." });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO exercises (ExerciseName, Description, Category)
       VALUES (?, ?, ?)`,
      [ExerciseName, Description, Category]
    );
    res
      .status(201)
      .json({
        success: true,
        message: "Exercise created successfully.",
        exerciseId: result.insertId,
      });
  } catch (err) {
    console.error("Error creating exercise:", err);
    res
      .status(500)
      .json({
        success: false,
        message: "Server error during exercise creation.",
      });
  }
});

/**
 * PUT Update an Existing Exercise
 */
app.put("/exercises/:exerciseId", isTrainer, async (req, res) => {
  const { exerciseId } = req.params;
  const { ExerciseName, Description, Category } = req.body;

  if (!ExerciseName) {
    return res
      .status(400)
      .json({ success: false, message: "Exercise Name is required." });
  }

  try {
    const [result] = await pool.query(
      `UPDATE exercises
       SET ExerciseName = ?, Description = ?, Category = ?
       WHERE ExerciseID = ?`,
      [ExerciseName, Description, Category, exerciseId]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Exercise not found." });
    }
    res.json({ success: true, message: "Exercise updated successfully." });
  } catch (err) {
    console.error(`Error updating exercise ${exerciseId}:`, err);
    res
      .status(500)
      .json({
        success: false,
        message: "Server error during exercise update.",
      });
  }
});

/**
 * DELETE an Exercise
 */
app.delete("/exercises/:exerciseId", isTrainer, async (req, res) => {
  const { exerciseId } = req.params;

  try {
    const [result] = await pool.query(
      "DELETE FROM exercises WHERE ExerciseID = ?",
      [exerciseId]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Exercise not found." });
    }
    res.json({ success: true, message: "Exercise deleted successfully." });
  } catch (err) {
    console.error(`Error deleting exercise ${exerciseId}:`, err);
    res
      .status(500)
      .json({
        success: false,
        message: "Server error during exercise deletion.",
      });
  }
});

/**
 * GET All Workout Plans (for Clients to view)
 * Clients can view all active workout plans.
 */

const isClient = (req, res, next) => {
  if (req.session.userId && req.session.userType === "client") {
    next();
  } else {
    res
      .status(403)
      .json({
        success: false,
        message: "Access denied. Client login required.",
      });
  }
};

app.get("/client/workout-plans", isClient, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT wp.*, t.FullName as TrainerName, t.Email as TrainerEmail, t.Phone as TrainerPhone
       FROM workout_plans wp
       LEFT JOIN trainers t ON wp.TrainerID = t.TrainerID
       WHERE wp.IsActive = 1
       ORDER BY wp.CreatedAt DESC`
    );
    res.json({ success: true, plans: rows });
  } catch (err) {
    console.error("Error fetching workout plans for client:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch workout plans." });
  }
});

/**
 * GET All Universal Exercises (for Clients to view)
 */
app.get("/client/exercises", isClient, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM exercises ORDER BY ExerciseName ASC"
    );
    res.json({ success: true, exercises: rows });
  } catch (err) {
    console.error("Error fetching exercises for client:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch exercises." });
  }
});

/**
 * GET Trainer Details by TrainerID (for Client modal)
 */
app.get("/client/trainer/:trainerId", isClient, async (req, res) => {
  const { trainerId } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT TrainerID, FullName, Email, Phone, Expertise, Qualifications, ProfilePic, IntroVideoURL
       FROM trainers
       WHERE TrainerID = ?`,
      [trainerId]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Trainer not found." });
    }
    const trainer = rows[0];
    if (trainer.ProfilePic) {
      trainer.ProfilePic = trainer.ProfilePic.toString("base64");
    }
    res.json({ success: true, trainer: trainer });
  } catch (err) {
    console.error(
      `Error fetching trainer ${trainerId} details for client:`,
      err
    );
    res
      .status(500)
      .json({
        success: false,
        message: "Server error fetching trainer details.",
      });
  }
});






/**
 * GET /api/admin/orders
 * Fetches all orders with client details and associated order items.
 */
app.get("/api/admin/orders", isAdmin, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [orders] = await connection.execute(`
      SELECT
        o.OrderID,
        o.ClientID,
        c.FullName AS ClientName,
        o.OrderDate,
        o.TotalAmount,
        o.Status,
        o.PaymentID
      FROM orders o
      JOIN clients c ON o.ClientID = c.ClientID
      ORDER BY o.OrderDate DESC
    `);

    // For each order, fetch its items and product names (using 'Name' column)
    for (const order of orders) {
      const [items] = await connection.execute(
        `SELECT oi.OrderItemID, oi.ProductID, p.Name AS ProductName, oi.Quantity, oi.UnitPrice
         FROM orderitems oi
         LEFT JOIN products p ON oi.ProductID = p.ProductID
         WHERE oi.OrderID = ?`,
        [order.OrderID]
      );
      order.OrderItems = items;
    }

    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Failed to fetch orders." });
  } finally {
    if (connection) connection.release();
  }
});

/**
 * PUT /api/admin/orders/:orderId
 * Updates an existing order's details.
 * Now specifically handles partial updates for status or other fields.
 */
app.put("/api/admin/orders/:orderId", isAdmin, async (req, res) => {
  const { orderId } = req.params;
  const { OrderDate, TotalAmount, Status } = req.body; // Only expecting these editable fields

  let connection;
  try {
    connection = await pool.getConnection();
    let updateFields = [];
    let updateValues = [];

    if (OrderDate !== undefined) {
      updateFields.push("OrderDate = ?");
      updateValues.push(OrderDate);
    }
    if (TotalAmount !== undefined) {
      updateFields.push("TotalAmount = ?");
      updateValues.push(TotalAmount);
    }
    if (Status !== undefined) {
      updateFields.push("Status = ?");
      updateValues.push(Status);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: "No fields provided for update." });
    }

    const query = `UPDATE orders SET ${updateFields.join(", ")} WHERE OrderID = ?`;
    const [result] = await connection.execute(query, [...updateValues, orderId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Order not found." });
    }
    res.json({ message: "Order updated successfully." });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ message: "Failed to update order." });
  } finally {
    if (connection) connection.release();
  }
});

/**
 * DELETE /api/admin/orders/:orderId
 * Deletes an order and its associated order items.
 */
app.delete("/api/admin/orders/:orderId", isAdmin, async (req, res) => {
  const { orderId } = req.params;
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction(); // Start transaction

    // Delete associated order items first
    await connection.execute(`DELETE FROM orderitems WHERE OrderID = ?`, [orderId]);

    // Then delete the order
    const [result] = await connection.execute(`DELETE FROM orders WHERE OrderID = ?`, [orderId]);

    if (result.affectedRows === 0) {
      await connection.rollback(); // Rollback if order not found
      return res.status(404).json({ message: "Order not found." });
    }

    await connection.commit(); // Commit transaction
    res.json({ message: "Order and associated items deleted successfully." });
  } catch (error) {
    await connection.rollback(); // Rollback on error
    console.error("Error deleting order:", error);
    res.status(500).json({ message: "Failed to delete order." });
  } finally {
    if (connection) connection.release();
  }
});

/**
 * GET /api/admin/feedbacks
 * Fetches all feedback with sender details.
 */
app.get("/api/admin/feedbacks", isAdmin, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [feedbacks] = await connection.execute(`
      SELECT
        f.FeedbackID,
        f.SenderID,
        f.SenderRole,
        CASE
          WHEN f.SenderRole = 'Client' THEN c.FullName
          -- Add other roles (Trainer, Admin) if their names are in other tables
          ELSE 'Unknown'
        END AS SenderName,
        f.FeedbackType,
        f.Subject,
        f.Message,
        f.Rating,
        f.SubmittedAt
      FROM feedbacks f
      LEFT JOIN clients c ON f.SenderID = c.ClientID AND f.SenderRole = 'Client'
      -- LEFT JOIN trainers t ON f.SenderID = t.TrainerID AND f.SenderRole = 'Trainer'
      -- LEFT JOIN admins a ON f.SenderID = a.AdminID AND f.SenderRole = 'Admin'
      ORDER BY f.SubmittedAt DESC
    `);
    res.json(feedbacks);
  } catch (error) {
    console.error("Error fetching feedbacks:", error);
    res.status(500).json({ message: "Failed to fetch feedbacks." });
  } finally {
    if (connection) connection.release();
  }
});

/**
 * DELETE /api/admin/feedbacks/:feedbackId
 * Deletes a specific feedback entry.
 */
app.delete("/api/admin/feedbacks/:feedbackId", isAdmin, async (req, res) => {
  const { feedbackId } = req.params;
  let connection;
  try {
    connection = await pool.getConnection();
    const [result] = await connection.execute(`DELETE FROM feedbacks WHERE FeedbackID = ?`, [
      feedbackId,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Feedback not found." });
    }
    res.json({ message: "Feedback deleted successfully." });
  } catch (error) {
    console.error("Error deleting feedback:", error);
    res.status(500).json({ message: "Failed to delete feedback." });
  } finally {
    if (connection) connection.release();
  }
});

/**
 * POST /api/admin/notifications
 * Sends a custom notification to a client.
 */
app.post("/api/admin/notifications", isAdmin, async (req, res) => {
  const { receiverId, title, message, type, actionLink } = req.body;
  const senderId = req.session.userId; // Admin's ID
  const senderRole = req.session.userType; // Should be 'admin'

  if (!receiverId || !title || !message) {
    return res.status(400).json({ message: "Receiver ID, title, and message are required." });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    // Verify receiver exists and is a client
    const [client] = await connection.execute(`SELECT ClientID FROM clients WHERE ClientID = ?`, [receiverId]);
    if (client.length === 0) {
        return res.status(404).json({ message: "Receiver client not found." });
    }

    const [result] = await connection.execute(
      `
      INSERT INTO notifications (SenderID, SenderRole, ReceiverID, ReceiverRole, Title, Message, Type, ActionLink)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [senderId, senderRole, receiverId, 'Client', title, message, type || 'System', actionLink || null]
    );
    res.status(201).json({ message: "Notification sent successfully.", notificationId: result.insertId });
  } catch (error) {
    console.error("Error sending notification:", error);
    res.status(500).json({ message: "Failed to send notification." });
  } finally {
    if (connection) connection.release();
  }
});

/**
 * GET /api/admin/clients/:clientId
 * Fetches details of a specific client.
 */
app.get("/api/admin/clients/:clientId", isAdmin, async (req, res) => {
    const { clientId } = req.params;
    let connection;
    try {
        connection = await pool.getConnection();
        const [client] = await connection.execute(
            `SELECT ClientID, FullName, Email, Phone, Address, City, Country FROM clients WHERE ClientID = ?`,
            [clientId]
        );
        if (client.length === 0) {
            return res.status(404).json({ message: "Client not found." });
        }
        res.json(client[0]);
    } catch (error) {
        console.error("Error fetching client details:", error);
        res.status(500).json({ message: "Failed to fetch client details." });
    } finally {
        if (connection) connection.release();
    }
});

/**
 * GET /api/admin/clients/:clientId/profile-pic
 * Fetches the profile picture of a specific client, encoded in Base64.
 */
app.get("/api/admin/clients/:clientId/profile-pic", isAdmin, async (req, res) => {
  const { clientId } = req.params;
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.execute(
      `SELECT ProfilePic FROM clients WHERE ClientID = ?`,
      [clientId]
    );

    if (rows.length === 0 || !rows[0].ProfilePic) {
      // Return a 404 with a message if no profile picture is found
      return res.status(404).json({ message: "Profile picture not found." });
    }

    const profilePicBuffer = rows[0].ProfilePic;
    // Assuming JPEG for profile pictures. Adjust 'image/jpeg' if your stored format is different (e.g., 'image/png').
    const mimeType = 'image/jpeg'; // Or 'image/png', 'image/gif' based on your stored image type
    const base64Image = profilePicBuffer.toString('base64');

    res.json({ mimeType: mimeType, data: base64Image });

  } catch (error) {
    console.error("Error fetching client profile picture:", error);
    res.status(500).json({ message: "Failed to fetch client profile picture." });
  } finally {
    if (connection) connection.release();
  }
});

/**
 * GET /api/admin/products/:productId/image
 * Fetches the image of a specific product, encoded in Base64.
 */
app.get("/api/admin/products/:productId/image", isAdmin, async (req, res) => {
  const { productId } = req.params;
  let connection;
  try {
    connection = await pool.getConnection();
    // Changed from ProductPic to Image based on your provided schema
    const [rows] = await connection.execute(
      `SELECT Image, ImageMimeType FROM products WHERE ProductID = ?`,
      [productId]
    );

    if (rows.length === 0 || !rows[0].Image) {
      // Return a 404 with a message if no product picture is found
      return res.status(404).json({ message: "Product picture not found." });
    }

    const productPicBuffer = rows[0].Image;
    // Dynamically use ImageMimeType from the database, or default to 'image/jpeg'
    const mimeType = rows[0].ImageMimeType || 'image/jpeg';
    const base64Image = productPicBuffer.toString('base64');

    res.json({ mimeType: mimeType, data: base64Image });

  } catch (error) {
    console.error("Error fetching product image:", error);
    res.status(500).json({ message: "Failed to fetch product image." });
  } finally {
    if (connection) connection.release();
  }
});

/**
 * logout session
 */
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


app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
