import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import cors from "cors";
import multer from "multer";
import os from "os";
import fsModule from "fs";
import { env } from "./src/server/env";
import { prisma, checkDatabaseConnection } from "./src/server/db";
import { apiRouter } from "./src/server/routes/api.routes";
import { errorHandler } from "./src/server/middleware/errorHandler";
import { wsManager } from "./src/server/websocket";

// Lazy Gemini AI Client Initialization
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });
  }
  return aiClient;
}

function cleanBilingualText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  const trimmed = text.trim();
  if (trimmed.includes('\n')) return trimmed;

  const hasArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(trimmed);
  const hasLatin = /[a-zA-Z]/.test(trimmed);

  if (hasArabic && hasLatin) {
    const matchArabThenLatin = trimmed.match(
      /^([\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s\d،؛؟!.ﷺ:()'"\-—]+?[؟!.؛،:\s])\s*([A-Za-z][\s\S]*)$/
    );
    if (matchArabThenLatin) {
      return `${matchArabThenLatin[1].trim()}\n${matchArabThenLatin[2].trim()}`;
    }
    const matchLatinThenArab = trimmed.match(
      /^([a-zA-Z0-9\s'"()?!:.,\u00C0-\u024F\u1E00-\u1EFF\-—]+?[!?:.])\s*([\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s\d،؛؟!.ﷺ:()'"\-—]+)$/
    );
    if (matchLatinThenArab) {
      return `${matchLatinThenArab[1].trim()}\n${matchLatinThenArab[2].trim()}`;
    }
  }
  return trimmed;
}

async function startServer() {
  const app = express();
  const PORT = env.PORT || (process.env.PORT ? parseInt(process.env.PORT, 10) : 3000);

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  const upload = multer({ dest: os.tmpdir() });

  // 1. Mandatory Health Check routes for Cloud Run deployment and infrastructure probes FIRST
  app.all(["/api/health", "/health", "/healthz", "/livez", "/readyz", "/ping"], async (req, res) => {
    const dbHealth = await checkDatabaseConnection();
    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: dbHealth.connected ? "connected" : "disconnected",
    });
  });

  // 1.5 Prevent browser/proxy caching for all dynamic API endpoints (critical for WebKit / iOS Safari)
  app.use(["/api", "/api/v1"], (req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
    next();
  });

  // Mount API v1 Router & alias /api
  app.use("/api/v1", apiRouter);
  app.use("/api", apiRouter);

  // Neutralize and self-unregister any lingering Service Worker from previous builds
  app.get(["/sw.js", "/service-worker.js"], (req, res) => {
    res.setHeader("Content-Type", "application/javascript");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
    res.send(`
      self.addEventListener('install', function(e) { self.skipWaiting(); });
      self.addEventListener('activate', function(e) {
        self.registration.unregister().then(function() {
          return self.clients.matchAll();
        }).then(function(clients) {
          clients.forEach(function(client) {
            if (client.url && 'navigate' in client) {
              client.navigate(client.url);
            }
          });
        });
      });
    `);
  });

  app.get("/registerSW.js", (req, res) => {
    res.setHeader("Content-Type", "application/javascript");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
    res.send(`
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function(regs) {
          for (var r of regs) r.unregister();
        });
      }
    `);
  });

  // 2. Migration endpoint for future FSRS and books migration
  app.post("/api/migration/sync-local-data", async (req, res) => {
    try {
      const data = req.body;
      console.log("Received migration payload size:", JSON.stringify(data).length, "bytes");
      res.json({ success: true, message: "Migration payload received successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "Internal server error" });
    }
  });

  // 3. AI Book Generation Endpoint
  app.post("/api/generate-book", async (req, res) => {
    try {
      const ai = getGenAI();
      if (!ai) return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
      const { topic, text, mode = 'formatted', language = "id" } = req.body;
      if (!topic && !text) return res.status(400).json({ error: "Harap berikan topik atau teks." });
      
      const prompt = "Tugas Anda adalah memformat teks yang sudah berisi pertanyaan dan jawaban berikut menjadi struktur buku berbab (maksimal 5 bab).\n" +
        (topic ? "Topik Utama: " + topic + "\n" : "") +
        (text ? "Teks Q&A:\n" + text + "\n" : "") +
        "Karena teks di atas memuat kumpulan pertanyaan dan jawaban (Q&A), kelompokkan mereka ke dalam beberapa bab yang masuk akal secara otomatis.\n" +
        "Berikan judul buku, deskripsi singkat, dan daftar bab.\n" +
        "Setiap bab harus berisi kartu (Q&A) yang sesuai dengan bab tersebut dari teks di atas.\n" +
        "PANDUAN KHUSUS DWI BAHASA (BILINGUAL ARAB & INDONESIA):\n" +
        "- Jika ada pertanyaan atau jawaban yang memuat teks dwi bahasa (misalnya teks Arab dan terjemahan atau penjelasan bahasa Indonesia), Anda WAJIB memisahkannya dengan baris baru (enter / '\\n'). JANGAN PERNAH menggabungkan teks Arab dan teks Indonesia dalam satu baris bersambung.\n" +
        "- Pertahankan teks Arab aslinya secara utuh beserta tanda bacanya.\n" +
        "- Contoh question: 'سُوْرَةُ النَّبَإِ مِنْ أَيِّ السُّوَرِ؟\\nSurah An-Naba\\' termasuk surah apa?'\n" +
        "- Contoh answer: 'مَكِّيَّةٌ، أَيْ نَزَلَتْ قَبْلَ هِجْرَةِ رَسُولِ اللَّهِ ﷺ إِلَى الْمَدِينَةِ.\\nSurah An-Naba\\' termasuk surah Makkiyah, yaitu surah yang turun sebelum hijrahnya Rasulullah ﷺ ke Madinah.'\n" +
        "Bahasa: " + (language === 'id' ? 'Bahasa Indonesia' : 'English');

      const contents = [prompt];

      let response: any;
      let retries = 3;
      let delayMs = 1500;
      while (retries > 0) {
        try {
          response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: contents,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Judul Buku" },
                  description: { type: Type.STRING, description: "Deskripsi Singkat Buku" },
                  chapters: {
                    type: Type.ARRAY,
                    description: "Daftar Bab",
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING, description: "Judul Bab" },
                        description: { type: Type.STRING, description: "Deskripsi Bab" },
                        cards: {
                          type: Type.ARRAY,
                          description: "Daftar kartu hafalan di bab ini",
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              question: { type: Type.STRING },
                              answer: { type: Type.STRING }
                            },
                            required: ["question", "answer"]
                          }
                        }
                      },
                      required: ["title", "cards"]
                    }
                  }
                },
                required: ["title", "description", "chapters"]
              },
            },
          });
          break; // success
        } catch (err: any) {
          const isRetryable = err.status === 503 || err.status === 429 || (err.error && (err.error.code === 503 || err.error.code === 429));
          if (isRetryable) {
            retries--;
            if (retries === 0) throw err;
            await new Promise(r => setTimeout(r, delayMs));
            delayMs *= 2; // exponential backoff
          } else {
            throw err;
          }
        }
      }

      const jsonStr = response.text?.trim() || "{}";
      let parsed: any = {};
      try {
        parsed = JSON.parse(jsonStr);
      } catch (e) {
        return res.status(500).json({ error: "Gagal memproses respons dari AI." });
      }

      // Post-process to guarantee bilingual lines are separated by \n
      if (parsed.chapters && Array.isArray(parsed.chapters)) {
        parsed.chapters = parsed.chapters.map((ch: any) => ({
          ...ch,
          cards: (ch.cards || []).map((card: any) => ({
            ...card,
            question: cleanBilingualText(card.question),
            answer: cleanBilingualText(card.answer)
          }))
        }));
      }

      res.json({ book: parsed });
    } catch (error: any) {
      console.error("AI Generation Error:", error);
      const isQuota = error?.status === 429 || (error?.message && (error.message.includes("resource_exhausted") || error.message.includes("quota") || error.message.includes("429")));
      if (isQuota) {
        return res.status(429).json({ error: "Kuota penggunaan AI gratis sedang penuh atau padat. Silakan coba lagi beberapa saat lagi atau buat secara manual." });
      }
      res.status(500).json({ error: error?.message || "Terjadi kesalahan internal" });
    }
  });

  // 4. AI Flashcards Generation Endpoint
  app.post("/api/generate-cards", async (req, res) => {
    try {
      const ai = getGenAI();
      if (!ai) return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
      const { topic, text, mode = 'formatted', language = "id" } = req.body;
      if (!topic && !text) return res.status(400).json({ error: "Harap berikan topik atau teks materi." });

      const prompt = "Tugas Anda adalah mengekstrak pasangan pertanyaan dan jawaban (flashcards) dari teks berikut secara SAMA PERSIS.\n" +
        (topic ? "Topik Utama: " + topic + "\n" : "") +
        (text ? "Teks Q&A:\n" + text + "\n" : "") +
        "PENTING: Anda dilarang keras menerjemahkan, mengedit, atau menulis ulang teks. Ekstrak masing-masing pertanyaan dan jawaban persis seperti aslinya dalam bahasa aslinya (contohnya bahasa Arab jangan diterjemahkan ke Indonesia).\n" +
        "PANDUAN KHUSUS DWI BAHASA (BILINGUAL ARAB & INDONESIA):\n" +
        "- Jika ada pertanyaan atau jawaban yang memuat teks dwi bahasa (misalnya teks Arab dan terjemahan atau penjelasan bahasa Indonesia), Anda WAJIB memisahkannya dengan baris baru (enter / '\\n'). JANGAN PERNAH menggabungkan teks Arab dan teks Indonesia dalam satu baris bersambung.\n" +
        "- Pertahankan teks Arab aslinya secara utuh beserta tanda bacanya.\n" +
        "- Contoh question: 'سُوْرَةُ النَّبَإِ مِنْ أَيِّ السُّوَرِ؟\\nSurah An-Naba\\' termasuk surah apa?'\n" +
        "- Contoh answer: 'مَكِّيَّةٌ، أَيْ نَزَلَتْ قَبْلَ هِجْرَةِ رَسُولِ اللَّهِ ﷺ إِلَى الْمَدِينَةِ.\\nSurah An-Naba\\' termasuk surah Makkiyah, yaitu surah yang turun sebelum hijrahnya Rasulullah ﷺ ke Madinah.'\n" +
        "Jadikan daftar objek JSON dengan kunci 'question' dan 'answer'.";

      let response: any;
      let retries = 3;
      let delayMs = 1500;
      while (retries > 0) {
        try {
          response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.ARRAY,
                description: "Daftar kartu hafalan (flashcards)",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING, description: "Pertanyaan (sisi depan kartu)" },
                    answer: { type: Type.STRING, description: "Jawaban (sisi belakang kartu)" },
                  },
                  required: ["question", "answer"],
                },
              },
            },
          });
          break; // success
        } catch (err: any) {
          const isRetryable = err.status === 503 || err.status === 429 || (err.error && (err.error.code === 503 || err.error.code === 429));
          if (isRetryable) {
            retries--;
            if (retries === 0) throw err;
            await new Promise(r => setTimeout(r, delayMs));
            delayMs *= 2;
          } else {
            throw err;
          }
        }
      }

      const jsonStr = response.text?.trim() || "[]";
      let parsed: any[] = [];
      try {
        parsed = JSON.parse(jsonStr);
      } catch (e) {
        return res.status(500).json({ error: "Gagal memproses respons dari AI." });
      }

      if (Array.isArray(parsed)) {
        parsed = parsed.map((card: any) => ({
          ...card,
          question: cleanBilingualText(card.question),
          answer: cleanBilingualText(card.answer)
        }));
      }

      res.json({ cards: parsed });
    } catch (error: any) {
      console.error("AI Generation Error:", error);
      const isQuota = error?.status === 429 || (error?.message && (error.message.includes("resource_exhausted") || error.message.includes("quota") || error.message.includes("429")));
      if (isQuota) {
        return res.status(429).json({ error: "Kuota penggunaan AI gratis sedang penuh atau padat. Silakan coba lagi beberapa saat lagi atau buat kartu secara manual." });
      }
      res.status(500).json({ error: error?.message || "Terjadi kesalahan internal" });
    }
  });

  // Centralized Error Handling for all API endpoints
  app.use("/api", errorHandler);

  // 5. Production detection & static asset serving
  // Determine if static dist assets exist on the filesystem
  const isCjsBundle = typeof __filename !== 'undefined' && __filename.endsWith('.cjs');
  const possibleDistPaths = [
    path.join(process.cwd(), 'dist'),
    path.join(process.cwd(), 'build'),
    typeof __dirname !== 'undefined' ? __dirname : '',
    typeof __dirname !== 'undefined' ? path.join(__dirname, 'dist') : '',
    typeof __dirname !== 'undefined' ? path.join(__dirname, 'build') : '',
    typeof __dirname !== 'undefined' ? path.join(__dirname, '..', 'dist') : '',
    typeof __dirname !== 'undefined' ? path.join(__dirname, '..', 'build') : '',
    path.resolve(process.cwd()),
    '/app/applet/dist',
    '/app/applet/build',
    '/app/dist',
    '/app/build'
  ].filter(Boolean);

  const foundDistPath = possibleDistPaths.find(p => fsModule.existsSync(path.join(p, 'index.html')));

  // In production (Cloud Run rollout, built container, or whenever dist/index.html is found and NODE_ENV is not explicitly 'development'), serve static assets immediately
  const isDev = process.env.NODE_ENV === "development" || (!foundDistPath && process.env.NODE_ENV !== "production" && !isCjsBundle);

  if (isDev) {
    try {
      console.log("[Development] Initializing Vite development middleware...");
      // Dynamic import prevents vite from being required in production builds
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (viteError) {
      console.error("Failed to start Vite middleware, falling back to static build:", viteError);
    }
  } else {
    const distPath = foundDistPath || path.join(process.cwd(), 'dist');

    console.log(`[Production] Serving static files from: ${distPath}`);
    app.use(express.static(distPath, {
      maxAge: '1h',
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
      }
    }));

    // Express v5 wildcard route for SPA client-side routing fallback
    app.get('*all', (req, res) => {
      // Do not serve index.html for missed API requests
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: "API endpoint not found" });
      }

      const indexPath = path.join(distPath, 'index.html');
      if (fsModule.existsSync(indexPath)) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.sendFile(indexPath);
      } else {
        // Safe 200 OK fallback to ensure Cloud Run health probes never receive 404
        res.status(200).send("<!DOCTYPE html><html><head><title>Unlupa | Ilmu yang tidak lupa</title></head><body><div id=\"root\">App is starting...</div></body></html>");
      }
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });

  wsManager.initialize(server);

  server.on("error", (err: any) => {
    console.error("Server listen error:", err);
  });

  // Handle termination signals cleanly for Cloud Run traffic shifting & shutdown
  process.on("SIGTERM", () => {
    console.log("SIGTERM received, closing HTTP server gracefully...");
    prisma.$disconnect().catch(() => {});
    server.close(() => {
      console.log("HTTP server closed.");
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 5000).unref();
  });

  process.on("SIGINT", () => {
    prisma.$disconnect().catch(() => {});
    server.close(() => process.exit(0));
  });
}

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

startServer();
