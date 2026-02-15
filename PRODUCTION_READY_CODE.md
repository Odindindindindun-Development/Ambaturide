# Production-Ready Database Connection - Complete Code

## 1. Database Connection File: `src/Backend/db.js`

```javascript
// Database connection configuration for Vercel serverless and production
import mysql from 'mysql2/promise';

const poolConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
};

// Add SSL configuration for cloud providers (PlanetScale, Railway, AWS RDS)
if (process.env.DB_SSL === 'true') {
  poolConfig.ssl = {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
  };
}

// Create connection pool
const pool = mysql.createPool(poolConfig);

// Test connection and handle errors
pool.getConnection()
  .then(connection => {
    console.log('✅ MySQL Pool Connected!');
    connection.release();
  })
  .catch(err => {
    console.error('❌ MySQL Pool Connection Error:', err.message);
  });

export default pool;
```

## 2. Environment Variables: `.env.example`

```env
# Database Configuration
DB_HOST=your-database-host.com
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_NAME=ambaturide_db
DB_PORT=3306

# SSL Configuration (set to 'true' for cloud providers like PlanetScale/Railway)
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true

# Application Configuration
NODE_ENV=development
PORT=3001

# Frontend Origin (for CORS)
CLIENT_ORIGIN=http://localhost:5173

# Session Secret (generate a secure random string for production)
SESSION_SECRET=your-secure-session-secret-here
```

## 3. Server Configuration Updates: `src/Backend/server.js` (Key Changes)

```javascript
// Import the pool instead of mysql2
import pool from "./db.js";

// Session with environment variable
app.use(session({
  secret: process.env.SESSION_SECRET || "ambaturide_secret",
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Example route with async/await
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const sql = "SELECT * FROM passengers WHERE Email = ?";
    const [results] = await pool.query(sql, [email]);

    if (results.length === 0) {
      return res.status(404).json({ message: "Account not found" });
    }

    const passenger = results[0];
    const passwordMatch = await bcrypt.compare(password, passenger.Password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    req.session.user = {
      id: passenger.PassengerID,
      email: passenger.Email,
      firstName: passenger.FirstName,
      lastName: passenger.LastName,
    };

    res.json({
      message: "Login successful",
      passenger: {
        PassengerID: passenger.PassengerID,
        FirstName: passenger.FirstName,
        LastName: passenger.LastName,
        Email: passenger.Email,
      },
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Vercel-compatible server startup
if (process.env.NODE_ENV !== 'production') {
  const port = process.env.PORT || 3001;
  app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
  });
}

// Export for Vercel serverless
export default app;
```

## 4. Vercel Configuration: `vercel.json`

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/Backend/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "src/Backend/server.js"
    },
    {
      "src": "/uploads/(.*)",
      "dest": "src/Backend/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "src/Backend/server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

## Key Differences from Old Code

### ❌ Old (Development Only):
```javascript
import mysql from "mysql2";

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "ambaturide_db"
});

db.connect(err => {
  if (err) throw err;
  console.log("✅ MySQL Connected!");
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  const sql = "SELECT * FROM passengers WHERE Email = ?";
  
  db.query(sql, [email], (err, result) => {
    if (err) return res.status(500).json({ error: "Database error" });
    // ... rest of code
  });
});
```

### ✅ New (Production Ready):
```javascript
import pool from "./db.js";

// No connection needed - pool handles it

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const sql = "SELECT * FROM passengers WHERE Email = ?";
  
  try {
    const [results] = await pool.query(sql, [email]);
    // ... rest of code
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Database error" });
  }
});
```

## Benefits of This Approach

1. ✅ **Connection Pooling**: Reuses connections efficiently
2. ✅ **Environment Variables**: No hard-coded credentials
3. ✅ **SSL Support**: Works with cloud MySQL providers
4. ✅ **Vercel Compatible**: Serverless-ready architecture
5. ✅ **Promise-based**: Modern async/await syntax
6. ✅ **Error Handling**: Proper try-catch blocks
7. ✅ **Production Ready**: Secure and scalable

## Next Steps

1. Update all remaining `db.query` calls to `pool.query` with async/await (see MIGRATION_GUIDE.md)
2. Copy `.env.example` to `.env` and fill in your actual credentials
3. Test locally: `node src/Backend/server.js`
4. Deploy to Vercel: `vercel --prod`
5. Add environment variables in Vercel dashboard
