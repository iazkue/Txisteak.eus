import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import nodemailer from "nodemailer";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL ? process.env.DATABASE_URL.split('&channel_binding=')[0] : undefined;

const pool = new Pool({
  connectionString,
  ssl: connectionString?.includes('sslmode=require') || connectionString?.includes('neon.tech')
    ? { rejectUnauthorized: false }
    : false,
});

async function sendDiscordNotification(joke: any) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: "🚀 Txiste berria jaso da!",
          color: 0xe63946, // Basque Red
          fields: [
            { name: "📝 Testua", value: joke.testua },
            { name: "👤 Egilea", value: `${joke.izena} ${joke.abizenak}`, inline: true },
            { name: "📍 Herria", value: joke.pueblo, inline: true },
            { name: "📧 Email", value: joke.email, inline: true }
          ],
          timestamp: new Date().toISOString()
        }]
      })
    });
    if (response.ok) {
      console.log("Discord notification sent successfully.");
    } else {
      console.error("Discord notification failed:", await response.text());
    }
  } catch (err) {
    console.error("Error sending Discord notification:", err);
  }
}

async function notifyNewJoke(joke: any) {
  // Try both methods
  await Promise.allSettled([
    sendDiscordNotification(joke)
  ]);
}

const app = express();

async function initDb() {
  console.log("Initializing database...");
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is missing!");
    return;
  }
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS jokes (
        id SERIAL PRIMARY KEY,
        testua TEXT NOT NULL,
        email TEXT NOT NULL,
        izena TEXT NOT NULL,
        abizenak TEXT NOT NULL,
        pueblo TEXT NOT NULL,
        boto_positiboak INTEGER DEFAULT 0,
        boto_negatiboak INTEGER DEFAULT 0,
        puntuazioa FLOAT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS votes (
        id SERIAL PRIMARY KEY,
        joke_id INTEGER REFERENCES jokes(id) ON DELETE CASCADE,
        vote_type VARCHAR(10) CHECK (vote_type IN ('gora', 'behera')),
        ip_address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Database initialized successfully.");
  } catch (err) {
    console.error("Error initializing database:", err);
  } finally {
    client.release();
  }
}

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors());
app.use(express.json());

// Initialize DB helper
let dbPromise: Promise<void> | null = null;

async function ensureDb() {
  if (!dbPromise) {
    dbPromise = initDb();
  }
  return dbPromise;
}

// Middleware to ensure DB is ready for API calls
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api')) {
    try {
      await ensureDb();
      next();
    } catch (err: any) {
      console.error("DB Init failed in middleware:", err);
      res.status(500).json({ error: "Database initialization failed", details: err.message });
    }
  } else {
    next();
  }
});

// API Routes
app.get("/api/health", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT NOW()");
    res.json({ status: "ok", db: "connected", time: rows[0].now });
  } catch (err: any) {
    res.status(500).json({ status: "error", db: "disconnected", error: err.message });
  }
});

app.get("/api/jokes/random", async (req, res) => {
  console.log("GET /api/jokes/random");
  try {
    const { rows } = await pool.query(`
      SELECT 
        id, testua, boto_positiboak, boto_negatiboak, puntuazioa, created_at as sortze_data,
        izena as submitted_by_izena, abizenak as submitted_by_abizenak, pueblo as submitted_by_pueblo, email as submitted_by_email
      FROM jokes 
      WHERE boto_positiboak > 0 AND puntuazioa > 0
      ORDER BY -ln(1.0 - random()) / puntuazioa ASC 
      LIMIT 1
    `);
    res.json(rows[0] || null);
  } catch (err: any) {
    console.error("Error fetching random joke:", err);
    res.status(500).json({ error: "Errorea txistea lortzean", details: err.message });
  }
});

app.get("/api/jokes/ranking", async (req, res) => {
  console.log("GET /api/jokes/ranking");
  try {
    const { rows } = await pool.query(`
      SELECT 
        id, testua, boto_positiboak, boto_negatiboak, puntuazioa, created_at as sortze_data,
        izena as submitted_by_izena, abizenak as submitted_by_abizenak, pueblo as submitted_by_pueblo, email as submitted_by_email,
        (boto_positiboak - boto_negatiboak) as net_votes 
      FROM jokes 
      WHERE boto_positiboak > 0
      ORDER BY puntuazioa DESC, boto_positiboak DESC 
      LIMIT 20
    `);
    res.json(rows);
  } catch (err: any) {
    console.error("Error fetching ranking:", err);
    res.status(500).json({ error: "Errorea sailkapena lortzean", details: err.message });
  }
});

app.get("/api/jokes/monthly", async (req, res) => {
  console.log("GET /api/jokes/monthly");
  try {
    const { rows } = await pool.query(`
      SELECT 
        id, testua, boto_positiboak, boto_negatiboak, puntuazioa, created_at as sortze_data,
        izena as submitted_by_izena, abizenak as submitted_by_abizenak, pueblo as submitted_by_pueblo, email as submitted_by_email,
        (boto_positiboak - boto_negatiboak) as net_votes 
      FROM jokes 
      WHERE created_at > NOW() - INTERVAL '31 days' AND boto_positiboak > 0
      ORDER BY puntuazioa DESC, boto_positiboak DESC 
      LIMIT 20
    `);
    res.json(rows);
  } catch (err: any) {
    console.error("Error fetching monthly ranking:", err);
    res.status(500).json({ error: "Errorea hileroko sailkapena lortzean", details: err.message });
  }
});

app.get("/api/submitters/ranking", async (req, res) => {
  console.log("GET /api/submitters/ranking");
  try {
    const { rows } = await pool.query(`
      SELECT 
        email as id, 
        izena, 
        abizenak, 
        COUNT(*) as txiste_kopurua, 
        AVG(puntuazioa) as puntuazio_batazbestekoa
      FROM jokes 
      GROUP BY email, izena, abizenak
      ORDER BY txiste_kopurua DESC, puntuazio_batazbestekoa DESC
      LIMIT 20
    `);
    res.json(rows);
  } catch (err: any) {
    console.error("Error fetching submitters ranking:", err);
    res.status(500).json({ error: "Errorea txistegileak lortzean", details: err.message });
  }
});

app.post("/api/jokes", async (req, res) => {
  console.log("POST /api/jokes", req.body);
  const { testua, email, izena, abizenak, pueblo } = req.body;
  if (!testua || !email || !izena || !abizenak || !pueblo) {
    return res.status(400).json({ success: false, message: "Eremu guztiak bete behar dira." });
  }
  try {
    const { rows } = await pool.query(
      "INSERT INTO jokes (testua, email, izena, abizenak, pueblo, boto_negatiboak, puntuazioa) VALUES ($1, $2, $3, $4, $5, 1, 0.333) RETURNING *",
      [testua, email, izena, abizenak, pueblo]
    );

    // Send notification asynchronously
    notifyNewJoke(rows[0]);

    res.json({ success: true, message: "Txistea ondo bidali da! Moderazioaren zain dago.", joke: rows[0] });
  } catch (err: any) {
    console.error("Error submitting joke:", err);
    res.status(500).json({ success: false, message: "Errorea txistea bidaltzean.", details: err.message });
  }
});

app.post("/api/jokes/:id/vote", async (req, res) => {
  console.log(`POST /api/jokes/${req.params.id}/vote`, req.body);
  const { id } = req.params;
  const { type } = req.body;
  if (!['gora', 'behera'].includes(type)) {
    return res.status(400).json({ success: false, message: "Boto mota okerra." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const voteCol = type === 'gora' ? 'boto_positiboak' : 'boto_negatiboak';
    await client.query(`
      UPDATE jokes 
      SET 
        ${voteCol} = ${voteCol} + 1,
        puntuazioa = (CAST(CASE WHEN '${type}' = 'gora' THEN boto_positiboak + 1 ELSE boto_positiboak END AS FLOAT) + 1.0) / 
                     (CAST(boto_positiboak + boto_negatiboak + 1 AS FLOAT) + 2.0)
      WHERE id = $1
    `, [id]);
    await client.query("INSERT INTO votes (joke_id, vote_type, ip_address) VALUES ($1, $2, $3)", [id, type, req.ip]);
    await client.query("COMMIT");
    res.json({ success: true, message: "Botoa ondo jaso da!" });
  } catch (err: any) {
    await client.query("ROLLBACK");
    console.error("Error voting:", err);
    res.status(500).json({ success: false, message: "Errorea bozkatzean.", details: err.message });
  } finally {
    client.release();
  }
});

// Vite middleware for development
if (process.env.NODE_ENV !== "production") {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else if (!process.env.VERCEL) {
  // Only serve static files if NOT on Vercel
  // Vercel serves the 'dist' folder automatically
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// Start server if not in Vercel
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
