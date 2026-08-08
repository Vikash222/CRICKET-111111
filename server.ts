import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      platform: "College Cricket Live Scoring & Player Platform",
      timestamp: new Date().toISOString(),
    });
  });

  // Export PostgreSQL Supabase Schema Migration endpoint
  app.get("/api/export-schema", async (_req, res) => {
    try {
      const fs = await import("fs/promises");
      const schemaPath = path.join(process.cwd(), "supabase/migrations/20260808000000_init_cricket_schema.sql");
      const sqlContent = await fs.readFile(schemaPath, "utf-8");
      res.setHeader("Content-Type", "text/plain");
      res.send(sqlContent);
    } catch (err) {
      res.status(500).json({ error: "Failed to read schema file" });
    }
  });

  // Mock API endpoints for REST integrations
  app.get("/api/matches/live", (_req, res) => {
    res.json({
      message: "Live cricket stream active",
      match_id: "match-live-1",
      realtime_websocket_endpoint: "wss://supabase.co/realtime/v1",
    });
  });

  // Vite middleware setup for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
