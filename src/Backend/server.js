// backend/server.js - Serverless Compatible
import express from "express";
import pool from "./db.js";
import cors from "cors";
import bodyParser from "body-parser";
import bcrypt from 'bcryptjs';
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { generateToken, verifyToken } from "./auth.js";
import {
  uploadProfilePicture,
  uploadDriverSignup,
  uploadVehicleImage,
  uploadInquiry,
  uploadDriverLicense
} from "./cloudinary.js";
import { generateVerificationCode, sendVerificationEmail } from "./emailService.js";

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Temporary storage for verification codes (email -> {code, userData, expiresAt})
// In production, use Redis or database
const verificationCodes = new Map();

console.log("🔥 THIS SERVER FILE IS RUNNING");

const app = express();
app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy:
      process.env.NODE_ENV === "production"
        ? {
          directives: {
            defaultSrc: ["'self'"],
            baseUri: ["'self'"],
            frameAncestors: ["'none'"],
            objectSrc: ["'none'"],
            imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            connectSrc: ["'self'", process.env.CLIENT_ORIGIN || "http://localhost:5173"],
          },
        }
        : false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    referrerPolicy: { policy: "no-referrer" },
  })
);

// CORS Configuration
const allowedOrigins = ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", process.env.CLIENT_ORIGIN].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("❌ Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token", "X-Requested-With"],
  })
);

app.use(cookieParser());
app.use(express.json({ limit: "200kb" }));
app.use(express.urlencoded({ extended: true, limit: "200kb" }));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// basic request logger to help debug 404s
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Static file serving for uploaded images (local storage)
const uploadsPath = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsPath));
console.log('📁 Serving static files from:', uploadsPath);

// JWT-based authentication (replaces session)
// Token is sent in Authorization header or stored in httpOnly cookie

// Login route (for example)
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const sql = "SELECT * FROM passengers WHERE Email = ?";
    const [result] = await pool.query(sql, [email]);

    if (result.length > 0) {
      const passenger = result[0];
      const isMatch = await bcrypt.compare(password, passenger.Password);

      if (isMatch) {
        const token = generateToken({
          id: passenger.PassengerID,
          email: passenger.Email,
          role: 'passenger'
        });

        res.cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({ success: true, token, user: result[0] });
      } else {
        res.status(401).json({ success: false, message: "Invalid credentials" });
      }
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).json({ error: "Database error" });
  }
});

// Check login status (JWT version)
app.get("/api/check-auth", (req, res) => {
  let token = null;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.json({ loggedIn: false });
  }

  const decoded = verifyToken(token);
  if (decoded) {
    res.json({ loggedIn: true, user: decoded });
  } else {
    res.json({ loggedIn: false });
  }
});

// Logout route
app.post("/api/logout", (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

// ✅ Passenger signup endpoint
app.post('/api/passenger/signup', async (req, res) => {
  const { firstName, lastName, email, password, phoneNumber, address, birthDate } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = `
      INSERT INTO passengers 
      (FirstName, LastName, Email, Password, PhoneNumber, Address, BirthDate)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(
      sql,
      [firstName || 'Passenger', lastName || 'User', email, hashedPassword, phoneNumber || '', address || '', birthDate || null]
    );

    res.status(201).json({ success: true, message: 'Passenger registered successfully!' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Email already registered' });
    }
    console.error('❌ Error inserting passenger:', error);
    res.status(500).json({ message: 'Database error' });
  }
});

app.get("/api/passenger/signup", (req, res) => {
  res.send("✅ You reached the Passenger SignUp route! Use POST to submit data.");
});



// Passenger Login Route - JWT VERSION with Email Verification
app.post('/api/passenger/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: 'Please fill in all fields' });

  const sql = `SELECT * FROM passengers WHERE Email = ?`;

  try {
    const [results] = await pool.query(sql, [email]);

    if (results.length === 0) {
      return res.status(404).json({ message: 'Account not found' });
    }

    const passenger = results[0];
    const passwordMatch = await bcrypt.compare(password, passenger.Password);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Generate 6-digit verification code
    const verificationCode = generateVerificationCode();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store verification code with passenger data
    verificationCodes.set(email, {
      code: verificationCode,
      userData: {
        PassengerID: passenger.PassengerID,
        FirstName: passenger.FirstName,
        LastName: passenger.LastName,
        Email: passenger.Email,
        PhoneNumber: passenger.PhoneNumber || "",
        ProfilePicture: passenger.ProfilePicture || "",
      },
      userType: 'passenger',
      expiresAt
    });

    // Send verification email
    await sendVerificationEmail(
      email,
      verificationCode,
      `${passenger.FirstName} ${passenger.LastName}`
    );

    console.log(`✅ Verification code sent to ${email}`);

    res.json({
      message: 'Verification code sent to your email',
      requiresVerification: true,
      email: email
    });
  } catch (err) {
    console.error('❌ Database error:', err);
    return res.status(500).json({ message: 'Database error' });
  }
});

// Passenger - Verify code
app.post('/api/passenger/verify-code', async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ message: 'Email and code are required' });
  }

  const storedData = verificationCodes.get(email);

  if (!storedData) {
    return res.status(400).json({ message: 'No verification code found. Please login again.' });
  }

  // Check if code expired
  if (Date.now() > storedData.expiresAt) {
    verificationCodes.delete(email);
    return res.status(400).json({ message: 'Verification code expired. Please login again.' });
  }

  // Verify code
  if (storedData.code !== code) {
    return res.status(400).json({ message: 'Invalid verification code' });
  }

  // Code is valid - generate JWT token
  const passenger = storedData.userData;
  const token = generateToken({
    id: passenger.PassengerID,
    email: passenger.Email,
    firstName: passenger.FirstName,
    lastName: passenger.LastName,
    role: 'passenger'
  });

  // Set httpOnly cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  // Clear the verification code
  verificationCodes.delete(email);

  res.json({
    message: 'Verification successful',
    token,
    passenger
  });
});

// Passenger - Resend verification code
app.post('/api/passenger/resend-code', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  const storedData = verificationCodes.get(email);

  if (!storedData) {
    return res.status(400).json({ message: 'No verification session found. Please login again.' });
  }

  // Generate new code
  const newCode = generateVerificationCode();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  // Update stored data
  storedData.code = newCode;
  storedData.expiresAt = expiresAt;
  verificationCodes.set(email, storedData);

  // Send new email
  const userData = storedData.userData;
  const userName = storedData.userType === 'passenger'
    ? `${userData.FirstName} ${userData.LastName}`
    : `${userData.FirstName} ${userData.LastName}`;

  await sendVerificationEmail(email, newCode, userName);

  console.log(`✅ New verification code sent to ${email}`);

  res.json({
    message: 'Verification code resent successfully'
  });
});


// Default route
app.get("/", (req, res) => {
  res.send("✅ Backend API is running!");
});


// ----- DRIVER SIGNUP ROUTE -----
app.post(
  "/api/driver/signup",
  (req, res, next) => {
    console.log("➡️ POST /api/driver/signup hit");
    next();
  },
  uploadDriverSignup.fields([
    { name: "licenseImage", maxCount: 1 },
    { name: "vehicleImage", maxCount: 1 },
  ]),
  async (req, res, next) => {
    try {
      const {
        firstName,
        lastName,
        email,
        password,
        phoneNumber,
        address,
        licenseNumber,
        vehicleType,
        plateNumber,
        vehicleBrand,
      } = req.body;

      // Required validation
      if (!email || !password || !licenseNumber || !vehicleType || !plateNumber) {
        return res.status(400).json({ message: "Please fill in all required fields." });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Get uploaded file paths
      const licenseImagePath = req.files?.licenseImage?.[0]?.path || null;
      const vehicleImagePath = req.files?.vehicleImage?.[0]?.path || null;

      // Debug logs
      console.log("REQ.BODY =", JSON.stringify(req.body, null, 2));
      console.log("REQ.FILES =", req.files);

      // Insert into database
      const sql = `
        INSERT INTO drivers 
        (FirstName, LastName, Email, Password, PhoneNumber, Address, 
        LicenseNumber, LicenseImage, VehicleType, PlateNumber, VehicleBrand, VehiclePicture, Status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      `;

      const [result] = await pool.query(sql, [
        firstName || "Driver",
        lastName || "User",
        email,
        hashedPassword,
        phoneNumber || "",
        address || "",
        licenseNumber,
        licenseImagePath,
        vehicleType,
        plateNumber,
        vehicleBrand || "",
        vehicleImagePath,
      ]);

      // ✅ Success response
      res.status(201).json({
        success: true,
        message: "Driver registered successfully!",
        driverID: result.insertId,
      });
    } catch (error) {
      console.error("🔥 DRIVER SIGNUP ERROR:", error);

      // Duplicate email
      if (error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ message: "Email already registered" });
      }

      // Pass multer or other errors to global error handler
      next(error);
    }
  }
);

// ----- GET ROUTE FOR TESTING -----
app.get("/api/driver/signup", (req, res) => {
  res.send("✅ You reached the Driver SignUp route! Use POST to submit data.");
});

// ----- MULTER / UPLOAD ERROR HANDLER -----
app.use((err, req, res, next) => {
  console.error("🔥 UPLOAD ERROR HANDLER:", err);

  if (err.name === "MulterError") {
    return res.status(400).json({ message: err.message });
  }

  if (err.message) {
    return res.status(400).json({ message: err.message });
  }

  res.status(500).json({ message: "Server error" });
});


/*
app.post("/api/driver/signup", uploadDriverSignup.fields([
  { name: "licenseImage", maxCount: 1 },
  { name: "vehicleImage", maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phoneNumber,
      address,
      licenseNumber,
      vehicleType,
      plateNumber,
      vehicleBrand
    } = req.body;

    // Required validation
    if (!email || !password || !licenseNumber || !vehicleType || !plateNumber) {
      return res.status(400).json({ message: "Please fill in all required fields." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get Cloudinary URLs
    const licenseImagePath = req.files?.licenseImage?.[0]?.path || null;
    const vehicleImagePath = req.files?.vehicleImage?.[0]?.path || null;

    const sql = `
      INSERT INTO drivers 
      (FirstName, LastName, Email, Password, PhoneNumber, Address, 
      LicenseNumber, LicenseImage, VehicleType, PlateNumber, VehicleBrand, VehiclePicture, Status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `;

    const [result] = await pool.query(
      sql,
      [
        firstName || "Driver",
        lastName || "User",
        email,
        hashedPassword,
        phoneNumber || "",
        address || "",
        licenseNumber,
        licenseImagePath,
        vehicleType,
        plateNumber,
        vehicleBrand || "",
        vehicleImagePath
      ]
    );

    res.status(201).json({
      success: true,
      message: "Driver registered successfully!",
      driverID: result.insertId
    });


  } catch (error) {
    console.error("❌ Error:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Email already registered" });
    }
    res.status(500).json({ message: "Server error" });
  }
}); 
app.get("/api/driver/signup", (req, res) => {
  res.send("✅ You reached the Driver SignUp route! Use POST to submit data.");
}); */



app.post("/api/driver/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: "Missing email or password" });

  try {
    const query = "SELECT * FROM drivers WHERE Email = ?";
    const [results] = await pool.query(query, [email]);

    if (results.length === 0)
      return res.status(401).json({ message: "Driver not found" });

    const driver = results[0];
    const isMatch = await bcrypt.compare(password, driver.Password);

    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    // Generate 6-digit verification code
    const verificationCode = generateVerificationCode();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store verification code with driver data
    verificationCodes.set(email, {
      code: verificationCode,
      userData: {
        DriverID: driver.DriverID,
        FirstName: driver.FirstName,
        LastName: driver.LastName,
        Email: driver.Email,
        PhoneNumber: driver.PhoneNumber,
        ProfilePicture: driver.ProfilePicture,
        VehicleBrand: driver.VehicleBrand,
        VehicleType: driver.VehicleType,
        PlateNumber: driver.PlateNumber,
        Status: driver.Status
      },
      userType: 'driver',
      expiresAt
    });

    // Send verification email
    await sendVerificationEmail(
      email,
      verificationCode,
      `${driver.FirstName} ${driver.LastName}`
    );

    console.log(`✅ Verification code sent to ${email}`);

    res.json({
      message: 'Verification code sent to your email',
      requiresVerification: true,
      email: email
    });
  } catch (err) {
    console.error("Database error:", err);
    return res.status(500).json({ message: "Database error" });
  }
});

// Driver - Verify code
app.post('/api/driver/verify-code', async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ message: 'Email and code are required' });
  }

  const storedData = verificationCodes.get(email);

  if (!storedData) {
    return res.status(400).json({ message: 'No verification code found. Please login again.' });
  }

  // Check if code expired
  if (Date.now() > storedData.expiresAt) {
    verificationCodes.delete(email);
    return res.status(400).json({ message: 'Verification code expired. Please login again.' });
  }

  // Verify code
  if (storedData.code !== code) {
    return res.status(400).json({ message: 'Invalid verification code' });
  }

  // Code is valid - generate JWT token
  const driver = storedData.userData;
  const token = generateToken({
    id: driver.DriverID,
    email: driver.Email,
    firstName: driver.FirstName,
    lastName: driver.LastName,
    role: 'driver'
  });

  // Set httpOnly cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  // Clear the verification code
  verificationCodes.delete(email);

  res.json({
    message: 'Verification successful',
    token,
    driver
  });
});

// Driver - Resend verification code
app.post('/api/driver/resend-code', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  const storedData = verificationCodes.get(email);

  if (!storedData) {
    return res.status(400).json({ message: 'No verification session found. Please login again.' });
  }

  // Generate new code
  const newCode = generateVerificationCode();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  // Update stored data
  storedData.code = newCode;
  storedData.expiresAt = expiresAt;
  verificationCodes.set(email, storedData);

  // Send new email
  const userData = storedData.userData;
  const userName = `${userData.FirstName} ${userData.LastName}`;

  await sendVerificationEmail(email, newCode, userName);

  console.log(`✅ New verification code sent to ${email}`);

  res.json({
    message: 'Verification code resent successfully'
  });
});

app.get("/api/driver/login", (req, res) => {
  res.send("✅ You reached the Driver SignUp route! Use POST to submit data.");
});

// ✅ Get full passenger profile by ID
app.get("/api/passenger/profile/:id", async (req, res) => {
  const passengerId = req.params.id;

  const sql = `
    SELECT PassengerID, FirstName, LastName, Email, PhoneNumber, Address, BirthDate, Gender, ProfilePicture, Status
    FROM passengers
    WHERE PassengerID = ?
  `;

  try {
    const [results] = await pool.query(sql, [passengerId]);

    if (results.length === 0) {
      return res.status(404).json({ message: "Passenger not found" });
    }

    res.json(results[0]);
  } catch (err) {
    console.error("❌ Database error:", err);
    return res.status(500).json({ message: "Database error" });
  }
});

// ✅ Passenger Profile Picture Upload & Update - Cloudinary Version
app.post("/api/passenger/profile-picture/:id", uploadProfilePicture.single("profile"), async (req, res) => {
  const passengerId = req.params.id;

  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  // Cloudinary returns the URL in req.file.path
  const imagePath = req.file.path;

  try {
    const sql = "UPDATE passengers SET ProfilePicture = ? WHERE PassengerID = ?";
    await pool.query(sql, [imagePath, passengerId]);
    res.json({ success: true, imagePath, message: "Profile picture updated successfully" });
  } catch (err) {
    console.error("❌ Database error:", err);
    return res.status(500).json({ message: "Database error" });
  }
});

// ✅ Update Passenger Info (Name, Gender, Birthdate, etc.)
app.put("/api/passenger/update/:id", async (req, res) => {
  const passengerId = req.params.id;
  const { firstName, lastName, gender, birthdate } = req.body;

  const sql = `
    UPDATE passengers 
    SET FirstName = ?, LastName = ?, Gender = ?, BirthDate = ?
    WHERE PassengerID = ?
  `;

  try {
    await pool.query(sql, [firstName, lastName, gender, birthdate, passengerId]);
    res.json({ success: true, message: "Profile updated successfully!" });
  } catch (err) {
    console.error("❌ Database error:", err);
    return res.status(500).json({ message: "Database error" });
  }
});
// ✅ Update Passenger Contact and Email
app.put("/api/passenger/update-contact/:id", async (req, res) => {
  const passengerId = req.params.id;
  const { contactNo, email } = req.body;

  if (!contactNo || !email) {
    return res.status(400).json({ success: false, message: "Contact number and email are required" });
  }

  const sql = `
    UPDATE passengers 
    SET PhoneNumber = ?, Email = ?
    WHERE PassengerID = ?
  `;

  try {
    await pool.query(sql, [contactNo, email, passengerId]);
    res.json({ success: true, message: "Contact info updated successfully!" });
  } catch (err) {
    console.error("❌ Database error:", err);
    return res.status(500).json({ success: false, message: "Database error" });
  }
});



// ✅ Change Passenger Password
app.put("/api/passenger/change-password/:id", async (req, res) => {
  const passengerId = req.params.id;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ success: false, message: "Both old and new passwords are required" });
  }

  try {
    // Get the current password hash from the DB
    const getSql = `SELECT Password FROM passengers WHERE PassengerID = ?`;
    const [results] = await pool.query(getSql, [passengerId]);

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "Passenger not found" });
    }

    const storedHash = results[0].Password;
    const isMatch = await bcrypt.compare(oldPassword, storedHash);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Old password is incorrect" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updateSql = `UPDATE passengers SET Password = ? WHERE PassengerID = ?`;
    await pool.query(updateSql, [hashedPassword, passengerId]);

    res.json({ success: true, message: "Password changed successfully!" });
  } catch (err) {
    console.error("❌ Database error:", err);
    return res.status(500).json({ success: false, message: "Database error" });
  }
});


app.get("/api/driver/profile/:id", async (req, res) => {
  const driverId = req.params.id;

  const sql = `
    SELECT 
      DriverID,
      FirstName,
      LastName,
      Email,
      PhoneNumber,
      Address,
      BirthDate,
      Gender,
      ProfilePicture,
      LicenseImage,
      VehiclePicture,
      VehicleBrand,
      VehicleType,
      PlateNumber,
      Status
    FROM drivers
    WHERE DriverID = ?
  `;

  try {
    const [results] = await pool.query(sql, [driverId]);

    if (results.length === 0) {
      return res.status(404).json({ message: "Driver not found" });
    }

    // Send profile with image paths
    res.json({ success: true, driver: results[0] });
  } catch (err) {
    console.error("❌ Database error:", err);
    return res.status(500).json({ message: "Database error" });
  }
});


// ✅ Driver Profile Picture Upload & Update - Cloudinary Version
app.post("/api/driver/profile-picture/:id", uploadProfilePicture.single("profile"), async (req, res) => {
  const driverId = req.params.id;

  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const imagePath = req.file.path;

  try {
    const sql = "UPDATE drivers SET ProfilePicture = ? WHERE DriverID = ?";
    await pool.query(sql, [imagePath, driverId]);
    res.json({ success: true, imagePath, message: "Profile picture updated successfully" });
  } catch (err) {
    console.error("❌ Database error:", err);
    return res.status(500).json({ message: "Database error" });
  }
});

// ✅ Update Driver Info (Name, Gender, Birthdate, etc.)
app.put("/api/driver/update/:id", async (req, res) => {
  const driverId = req.params.id;
  const { firstName, lastName, gender, birthdate } = req.body;

  const sql = `
    UPDATE drivers 
    SET FirstName = ?, LastName = ?, Gender = ?, BirthDate = ?
    WHERE DriverID = ?
  `;

  try {
    await pool.query(sql, [firstName, lastName, gender, birthdate, driverId]);
    res.json({ success: true, message: "Profile updated successfully!" });
  } catch (err) {
    console.error("❌ Database error:", err);
    return res.status(500).json({ message: "Database error" });
  }
});

// ✅ Update Driver Contact and Email
app.put("/api/driver/update-contact/:id", async (req, res) => {
  const driverId = req.params.id;
  const { contactNo, email } = req.body;

  if (!contactNo || !email) {
    return res.status(400).json({ success: false, message: "Contact number and email are required" });
  }

  const sql = `
    UPDATE drivers 
    SET PhoneNumber = ?, Email = ?
    WHERE DriverID = ?
  `;

  try {
    await pool.query(sql, [contactNo, email, driverId]);
    res.json({ success: true, message: "Contact info updated successfully!" });
  } catch (err) {
    console.error("❌ Database error:", err);
    return res.status(500).json({ success: false, message: "Database error" });
  }
});

// ✅ Update Driver Vehicle Information
app.put("/api/driver/update-vehicle/:id", async (req, res) => {
  const driverId = req.params.id;
  const { vehicleBrand, vehicleType, plateNumber } = req.body;

  const sql = `
    UPDATE drivers 
    SET VehicleBrand = ?, VehicleType = ?, PlateNumber = ?
    WHERE DriverID = ?
  `;

  try {
    await pool.query(sql, [vehicleBrand, vehicleType, plateNumber, driverId]);
    res.json({ success: true, message: "Vehicle information updated successfully!" });
  } catch (err) {
    console.error("❌ Database error:", err);
    return res.status(500).json({ success: false, message: "Database error" });
  }
});

// ✅ Change Driver Password
app.put("/api/driver/change-password/:id", async (req, res) => {
  const driverId = req.params.id;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ success: false, message: "Both old and new passwords are required" });
  }

  try {
    // Get the current password hash from the DB
    const getSql = `SELECT Password FROM drivers WHERE DriverID = ?`;
    const [results] = await pool.query(getSql, [driverId]);

    if (results.length === 0) {
      return res.status(404).json({ success: false, message: "Driver not found" });
    }

    const storedHash = results[0].Password;
    const isMatch = await bcrypt.compare(oldPassword, storedHash);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Old password is incorrect" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updateSql = `UPDATE drivers SET Password = ? WHERE DriverID = ?`;
    await pool.query(updateSql, [hashedPassword, driverId]);

    res.json({ success: true, message: "Password changed successfully!" });
  } catch (err) {
    console.error("❌ Database error:", err);
    return res.status(500).json({ success: false, message: "Database error" });
  }
});

// ✅ Driver License Image Upload & Update - Cloudinary Version
app.post("/api/driver/license-image/:id", uploadDriverLicense.single("license"), async (req, res) => {
  const driverId = req.params.id;

  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const imagePath = req.file.path;

  try {
    const sql = "UPDATE drivers SET LicenseImage = ? WHERE DriverID = ?";
    await pool.query(sql, [imagePath, driverId]);
    res.json({ success: true, imagePath, message: "License image updated successfully" });
  } catch (err) {
    console.error("❌ Database error:", err);
    return res.status(500).json({ message: "Database error" });
  }
});

// ✅ Driver Vehicle Image Upload & Update - Cloudinary Version
app.post("/api/driver/vehicle-image/:id", uploadVehicleImage.single("vehicle"), async (req, res) => {
  try {
    const driverId = req.params.id;
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const imagePath = req.file.path;

    // Update drivers.VehiclePicture so subsequent profile fetches include the image
    const sql = "UPDATE drivers SET VehiclePicture = ? WHERE DriverID = ?";
    await pool.query(sql, [imagePath, driverId]);

    // Return the saved path so client can update UI/localStorage immediately
    return res.json({
      success: true,
      imagePath,
      message: "Vehicle image uploaded and saved to database"
    });
  } catch (err) {
    console.error("vehicle upload error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/api/passenger/book", async (req, res) => {
  const {
    PassengerID,
    PickupArea,
    DropoffArea,
    PickupFullAddress,
    DropoffFullAddress,
    RideDate,
    RideTime,
    VehicleType,
    Fare
  } = req.body;

  if (!PassengerID) {
    return res.status(400).json({ success: false, message: "Missing PassengerID" });
  }

  const sql = `
    INSERT INTO bookings 
    (PassengerID, PickupArea, DropoffArea, PickupFullAddress, DropoffFullAddress, RideDate, RideTime, VehicleType, Fare)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  try {
    const [result] = await pool.query(sql, [
      PassengerID,
      PickupArea,
      DropoffArea,
      PickupFullAddress,
      DropoffFullAddress,
      RideDate,
      RideTime,
      VehicleType,
      Fare
    ]);
    res.json({ success: true, message: "Booking created successfully", bookingID: result.insertId });
  } catch (err) {
    console.error("Booking error:", err);
    return res.status(500).json({ success: false, message: "Database error" });
  }
});

// ✅ Get all bookings (joined with driver details)
// ✅ Get bookings + passenger info
app.get("/api/driver/bookings", async (req, res) => {
  const driverId = req.query.driverId; // optional

  // base select
  let sql = `
    SELECT 
      b.BookingID,
      b.PassengerID,
      b.DriverID,
      b.PickupFullAddress,
      b.DropoffFullAddress,
      b.PickupArea,
      b.DropoffArea,
      b.RideDate,
      b.RideTime,
      b.Status,
      b.VehicleType,
      b.Fare,
      CONCAT(p.FirstName, ' ', p.LastName) AS PassengerName,
      p.ProfilePicture AS PassengerImage,
      p.PhoneNumber,
      p.Gender
    FROM bookings AS b
    LEFT JOIN passengers AS p ON b.PassengerID = p.PassengerID
  `;

  const params = [];

  if (driverId) {
    // only pending bookings and exclude those this driver already declined
    sql += ` WHERE b.Status = 'pending' AND b.BookingID NOT IN (
      SELECT BookingID FROM booking_declines WHERE DriverID = ?
    )`;
    params.push(driverId);
  }

  sql += ` ORDER BY b.BookingID DESC`;

  try {
    const [results] = await pool.query(sql, params);
    res.json({ success: true, bookings: results });
  } catch (err) {
    console.error("❌ Error fetching bookings:", err);
    return res.status(500).json({ success: false, message: "Database error" });
  }
});

// GET assigned bookings for a specific driver
app.get("/api/driver/assigned-bookings/:driverId", async (req, res) => {
  const driverId = req.params.driverId;
  if (!driverId) return res.status(400).json({ success: false, message: "Missing driverId" });

  const sql = `
    SELECT b.*, 
           CONCAT(p.FirstName, ' ', p.LastName) AS PassengerName,
           p.ProfilePicture AS PassengerImage,
           p.PhoneNumber
    FROM bookings b
    LEFT JOIN passengers p ON b.PassengerID = p.PassengerID
    WHERE b.DriverID = ? 
      AND b.Status IN ('accepted', 'pending') 
    ORDER BY b.CreatedAt DESC
  `;

  try {
    const [results] = await pool.query(sql, [driverId]);
    res.json({ success: true, bookings: results });
  } catch (err) {
    console.error("DB error fetching assigned bookings:", err);
    return res.status(500).json({ success: false, message: "Database error" });
  }
});

// Update booking status (driver can set accepted/completed/cancelled)
app.put("/api/bookings/:id/status", async (req, res) => {
  const bookingId = req.params.id;
  const { status, driverId } = req.body;
  if (!bookingId || !status) return res.status(400).json({ success: false, message: "Missing params" });

  // Only allow expected statuses
  const allowed = ["pending", "accepted", "completed", "cancelled"];
  if (!allowed.includes(status)) return res.status(400).json({ success: false, message: "Invalid status" });

  try {
    // If accepting, set DriverID as well and ensure booking is still pending to avoid race conditions
    if (status === "accepted") {
      const sql = "UPDATE bookings SET Status = ?, DriverID = ? WHERE BookingID = ? AND Status = 'pending'";
      const [result] = await pool.query(sql, [status, driverId, bookingId]);
      if (result.affectedRows === 0) return res.status(409).json({ success: false, message: "Booking already taken or not pending" });
      return res.json({ success: true, message: "Assigned and accepted" });
    }

    // other status updates
    const sql = "UPDATE bookings SET Status = ? WHERE BookingID = ?";
    const [result] = await pool.query(sql, [status, bookingId]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Booking not found" });
    return res.json({ success: true, message: "Status updated" });
  } catch (err) {
    console.error("DB error:", err);
    return res.status(500).json({ success: false, message: "DB error" });
  }
});

// ✅ Get latest booking of a passenger with driver info
app.get("/api/passenger/:id/booking", async (req, res) => {
  const passengerId = req.params.id;

  const sql = `
    SELECT 
      b.*,
      CONCAT(d.FirstName, ' ', d.LastName) AS DriverName,
      d.PhoneNumber AS DriverPhone,
      d.VehicleBrand,
      d.VehicleType,
      d.PlateNumber
    FROM bookings AS b
    LEFT JOIN drivers AS d ON b.DriverID = d.DriverID
    WHERE b.PassengerID = ?
    ORDER BY b.BookingID DESC
    LIMIT 1
  `;

  try {
    const [results] = await pool.query(sql, [passengerId]);

    if (results.length === 0) {
      return res.json({ success: true, booking: null }); // No active booking
    }

    res.json({ success: true, booking: results[0] });
  } catch (err) {
    console.error("❌ Error fetching booking:", err);
    return res.status(500).json({ success: false, message: "Database error" });
  }
});

// Add this route near other booking endpoints

app.post("/api/bookings/:id/rate", async (req, res) => {
  const bookingId = req.params.id;
  const { rating, comment } = req.body;
  if (!bookingId || !rating) return res.status(400).json({ success: false, message: "Missing params" });

  try {
    // Get booking to find driver & passenger
    const getSql = "SELECT PassengerID, DriverID FROM bookings WHERE BookingID = ?";
    const [results] = await pool.query(getSql, [bookingId]);

    if (!results || results.length === 0) return res.status(404).json({ success: false, message: "Booking not found" });

    const booking = results[0];
    if (!booking.DriverID) return res.status(400).json({ success: false, message: "No driver assigned for this booking" });

    const insertSql = "INSERT INTO driver_ratings (BookingID, DriverID, PassengerID, Rating, Comment) VALUES (?, ?, ?, ?, ?)";
    await pool.query(insertSql, [bookingId, booking.DriverID, booking.PassengerID, rating, comment || null]);

    return res.json({ success: true, message: "Rating saved" });
  } catch (err) {
    console.error("DB error:", err);
    return res.status(500).json({ success: false, message: "DB error" });
  }
});

// Delete booking by BookingID (passenger can cancel)
// This permanently removes the row. If you prefer to keep history, change to update Status='cancelled'.
app.delete("/api/bookings/:id", async (req, res) => {
  const bookingId = req.params.id;
  if (!bookingId) return res.status(400).json({ success: false, message: "Missing booking id" });

  try {
    const sql = "DELETE FROM bookings WHERE BookingID = ?";
    const [result] = await pool.query(sql, [bookingId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    return res.json({ success: true, message: "Booking cancelled and deleted" });
  } catch (err) {
    console.error("DB error deleting booking:", err);
    return res.status(500).json({ success: false, message: "Database error" });
  }
});

app.post("/api/driver/bookings/:id/decline", async (req, res) => {
  const bookingId = req.params.id;
  const { driverId, reason } = req.body || {};
  if (!bookingId || !driverId) return res.status(400).json({ success: false, message: "Missing bookingId or driverId" });

  try {
    // record decline so same driver won't see it again
    const sql = "INSERT INTO booking_declines (BookingID, DriverID, Reason) VALUES (?, ?, ?)";
    await pool.query(sql, [bookingId, driverId, reason || null]);

    // Optionally: return updated booking so client can refresh if needed
    return res.json({ success: true, message: "Recorded decline" });
  } catch (err) {
    console.error("DB error recording decline:", err);
    return res.status(500).json({ success: false, message: "Database error" });
  }
});

// Admin: list drivers by status
app.get("/api/admin/drivers", async (req, res) => {
  const status = req.query.status || "active";
  try {
    const sql = "SELECT * FROM drivers WHERE Status = ?";
    const [results] = await pool.query(sql, [status]);
    res.json({ success: true, drivers: results || [] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "DB error" });
  }
});

// Admin: update driver status
app.put("/api/admin/drivers/:id/status", async (req, res) => {
  const id = req.params.id;
  const { status } = req.body || {};
  if (!id || !status) return res.status(400).json({ success: false, message: "Missing params" });
  const allowed = ["pending", "active", "inactive", "banned"];
  if (!allowed.includes(status)) return res.status(400).json({ success: false, message: "Invalid status" });

  try {
    const sql = "UPDATE drivers SET Status = ? WHERE DriverID = ?";
    const [result] = await pool.query(sql, [status, id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Driver not found" });
    res.json({ success: true, message: "Status updated" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "DB error" });
  }
});

// Admin: bookings list (with passenger and driver names when available)
app.get("/api/admin/bookings", async (req, res) => {
  const sql = `
    SELECT b.*, 
           CONCAT(p.FirstName, ' ', p.LastName) AS PassengerName,
           CONCAT(d.FirstName, ' ', d.LastName) AS DriverName
    FROM bookings b
    LEFT JOIN passengers p ON b.PassengerID = p.PassengerID
    LEFT JOIN drivers d ON b.DriverID = d.DriverID
    ORDER BY b.CreatedAt DESC
  `;

  try {
    const [results] = await pool.query(sql);
    res.json({ success: true, bookings: results || [] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "DB error" });
  }
});

// (optional) ratings endpoint if not present
app.get("/api/driver/:id/ratings", async (req, res) => {
  const driverId = req.params.id;
  const sql = `
    SELECT r.Rating, r.Comment, r.CreatedAt, p.FirstName, p.LastName, p.ProfilePicture AS PassengerPicture
    FROM driver_ratings r
    LEFT JOIN passengers p ON r.PassengerID = p.PassengerID
    WHERE r.DriverID = ?
    ORDER BY r.CreatedAt DESC
  `;

  try {
    const [results] = await pool.query(sql, [driverId]);
    res.json({ success: true, ratings: results || [] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "DB error" });
  }
});

// Passenger -> report a driver (called from PassengerBookingStatus)
app.post("/api/drivers/:id/report", async (req, res) => {
  const driverId = Number(req.params.id);
  const { passengerId, bookingId, reason } = req.body || {};

  if (!driverId || !passengerId || !reason) {
    return res.status(400).json({ success: false, message: "Missing driverId, passengerId or reason" });
  }

  try {
    // limit reports per passenger -> driver to 2
    const countSql = "SELECT COUNT(*) AS cnt FROM driver_reports WHERE DriverID = ? AND PassengerID = ?";
    const [rows] = await pool.query(countSql, [driverId, passengerId]);
    const cnt = (rows && rows[0] && rows[0].cnt) ? Number(rows[0].cnt) : 0;
    const LIMIT_PER_PASSENGER_DRIVER = 2;
    if (cnt >= LIMIT_PER_PASSENGER_DRIVER) {
      return res.status(429).json({
        success: false,
        message: `Report limit reached. You can only report the same driver ${LIMIT_PER_PASSENGER_DRIVER} times.`,
      });
    }

    const insertSql = "INSERT INTO driver_reports (DriverID, PassengerID, BookingID, Message) VALUES (?, ?, ?, ?)";
    await pool.query(insertSql, [driverId, passengerId, bookingId || null, reason]);

    // increment driver's Reports counter
    const upd = "UPDATE drivers SET Reports = IFNULL(Reports,0) + 1 WHERE DriverID = ?";
    await pool.query(upd, [driverId]);

    return res.json({ success: true, message: "Report submitted" });
  } catch (err) {
    console.error("DB error:", err);
    return res.status(500).json({ success: false, message: "Database error" });
  }
});

// Admin: list driver reports with passenger & driver info
app.get("/api/admin/driver-reports", async (req, res) => {
  const sql = `
    SELECT r.ReportID, r.DriverID, r.PassengerID, r.BookingID, r.Message, r.CreatedAt,
           CONCAT(d.FirstName, ' ', d.LastName) AS DriverName, d.ProfilePicture AS DriverPicture, d.Reports,
           CONCAT(p.FirstName, ' ', p.LastName) AS PassengerName, p.ProfilePicture AS PassengerPicture
    FROM driver_reports r
    LEFT JOIN drivers d ON r.DriverID = d.DriverID
    LEFT JOIN passengers p ON r.PassengerID = p.PassengerID
    ORDER BY r.CreatedAt DESC
  `;

  try {
    const [results] = await pool.query(sql);
    res.json({ success: true, reports: results || [] });
  } catch (err) {
    console.error("DB error fetching driver reports:", err);
    return res.status(500).json({ success: false, message: "Database error" });
  }
});

// Admin: ban driver (convenience endpoint; admin panel may already call /api/admin/drivers/:id/status)
app.put("/api/admin/drivers/:id/ban", async (req, res) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ success: false, message: "Missing driver id" });

  try {
    const sql = "UPDATE drivers SET Status = 'banned' WHERE DriverID = ?";
    const [result] = await pool.query(sql, [id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "Driver not found" });
    return res.json({ success: true, message: "Driver banned" });
  } catch (err) {
    console.error("DB error banning driver:", err);
    return res.status(500).json({ success: false, message: "Database error" });
  }
});

// POST new inquiry (public) - Cloudinary Version
app.post("/api/inquiries", uploadInquiry.single("attachment"), async (req, res) => {
  const { firstName, lastName, phoneNumber, email, message, country, countryCode } = req.body;
  const attachmentPath = req.file ? req.file.path : null;

  if (!firstName || !lastName || !phoneNumber || !message) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  try {
    const sql = `INSERT INTO inquiries (FirstName, LastName, Country, CountryCode, PhoneNumber, Email, Message, AttachmentPath)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const [result] = await pool.query(sql, [
      firstName, lastName, country || "Philippines", countryCode || "+63",
      phoneNumber, email || null, message, attachmentPath
    ]);
    res.json({ success: true, message: "Inquiry submitted", inquiryId: result.insertId });
  } catch (err) {
    console.error("DB error inserting inquiry:", err);
    return res.status(500).json({ success: false, message: "Database error" });
  }
});

// Admin: fetch inquiries
app.get("/api/admin/inquiries", async (req, res) => {
  const sql = `SELECT InquiryID, FirstName, LastName, Country, CountryCode, PhoneNumber, Email, Message, AttachmentPath, CreatedAt
               FROM inquiries ORDER BY CreatedAt DESC`;

  try {
    const [results] = await pool.query(sql);
    res.json({ success: true, inquiries: results || [] });
  } catch (err) {
    console.error("DB error fetching inquiries:", err);
    return res.status(500).json({ success: false, message: "Database error" });
  }
});

// Handle all other undefined routes safely
// Note: On Vercel, static files are served by the edge network, not Express
app.use((req, res) => {
  res.status(404).send("❌ Route not found");
});

// Start server (only for local development, not on Vercel)
if (process.env.NODE_ENV !== 'production') {
  const port = process.env.PORT || 3001;
  app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
  });
}

// Export for Vercel serverless
export default app;


