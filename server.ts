import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function initDb() {
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
  } finally {
    client.release();
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  await initDb();

  app.use(helmet({
    contentSecurityPolicy: false, // Disable for Vite dev
  }));
  app.use(cors());
  app.use(express.json());

  // Rate limiters
  const submitLimit = rateLimit({
    windowMs: 5 * 1000, // 5 seconds
    max: 1, // 1 request per window
    message: { success: false, message: "Itxaron 5 segundo berriro bidaltzeko." },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const voteLimit = rateLimit({
    windowMs: 5 * 1000, // 5 seconds
    max: 1, // 1 request per window
    message: { success: false, message: "Itxaron 5 segundo berriro bozkatzeko." },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // API Routes
  app.get("/api/jokes/random", async (req, res) => {
    try {
      const { rows } = await pool.query("SELECT * FROM jokes ORDER BY RANDOM() LIMIT 1");
      res.json(rows[0] || null);
    } catch (err) {
      res.status(500).json({ error: "Errorea txistea lortzean" });
    }
  });

  app.get("/api/jokes/ranking", async (req, res) => {
    try {
      const { rows } = await pool.query(`
        SELECT *, (boto_positiboak - boto_negatiboak) as net_votes 
        FROM jokes 
        ORDER BY puntuazioa DESC, boto_positiboak DESC 
        LIMIT 20
      `);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: "Errorea sailkapena lortzean" });
    }
  });

  app.get("/api/jokes/monthly", async (req, res) => {
    try {
      const { rows } = await pool.query(`
        SELECT *, (boto_positiboak - boto_negatiboak) as net_votes 
        FROM jokes 
        WHERE created_at > NOW() - INTERVAL '1 month'
        ORDER BY puntuazioa DESC, boto_positiboak DESC 
        LIMIT 20
      `);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: "Errorea hileroko sailkapena lortzean" });
    }
  });

  app.get("/api/submitters/ranking", async (req, res) => {
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
    } catch (err) {
      res.status(500).json({ error: "Errorea txistegileak lortzean" });
    }
  });

  app.post("/api/jokes", submitLimit, async (req, res) => {
    const { testua, email, izena, abizenak, pueblo } = req.body;
    if (!testua || !email || !izena || !abizenak || !pueblo) {
      return res.status(400).json({ success: false, message: "Eremu guztiak bete behar dira." });
    }
    try {
      const { rows } = await pool.query(
        "INSERT INTO jokes (testua, email, izena, abizenak, pueblo) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [testua, email, izena, abizenak, pueblo]
      );
      res.json({ success: true, message: "Txistea ondo bidali da!", joke: rows[0] });
    } catch (err) {
      res.status(500).json({ success: false, message: "Errorea txistea bidaltzean." });
    }
  });

  app.post("/api/jokes/:id/vote", voteLimit, async (req, res) => {
    const { id } = req.params;
    const { type } = req.body; // 'gora' or 'behera'
    if (!['gora', 'behera'].includes(type)) {
      return res.status(400).json({ success: false, message: "Boto mota okerra." });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      
      const voteCol = type === 'gora' ? 'boto_positiboak' : 'boto_negatiboak';
      await client.query(`UPDATE jokes SET ${voteCol} = ${voteCol} + 1 WHERE id = $1`, [id]);
      
      // Recalculate puntuazioa (simple Wilson score or just ratio for now)
      // Score = (pos + 1) / (pos + neg + 2) * 100
      await client.query(`
        UPDATE jokes 
        SET puntuazioa = (CAST(boto_positiboak AS FLOAT) + 1.0) / (CAST(boto_positiboak + boto_negatiboak AS FLOAT) + 2.0) * 100
        WHERE id = $1
      `, [id]);

      await client.query("INSERT INTO votes (joke_id, vote_type, ip_address) VALUES ($1, $2, $3)", [id, type, req.ip]);
      
      await client.query("COMMIT");
      res.json({ success: true, message: "Botoa ondo jaso da!" });
    } catch (err) {
      await client.query("ROLLBACK");
      res.status(500).json({ success: false, message: "Errorea bozkatzean." });
    } finally {
      client.release();
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
