// server/server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import { generateAIResponse } from "./groq.js";
import { extractTextFromFile } from "./fileProcessor.js";
import {
  checkUserIdAvailable,
  createUser,
  getUser,
  updateUser,
  createConversation,
  getConversations,
  getConversation,
  deleteConversation,
  addMessage,
  getMessages
} from "./db.js";

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }
});

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// ─── HEALTH ───────────────────────────────────────────────────────────────────

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, message: "Server is running." });
});

// ─── USER ROUTES ──────────────────────────────────────────────────────────────

// Check if a user ID is available
app.get("/api/users/check/:id", async (req, res) => {
  try {
    const available = await checkUserIdAvailable(req.params.id.trim());
    res.json({ available });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Register a new user
app.post("/api/users/register", async (req, res) => {
  try {
    const { id, name, language, answer_language, theme } = req.body;

    if (!id || !name) {
      return res.status(400).json({ error: "id and name are required." });
    }

    const idClean = id.trim().toLowerCase().replace(/\s+/g, "_");

    if (!/^[a-z0-9_]{3,30}$/.test(idClean) || /[\u0600-\u06FF]/.test(idClean)) {
      return res.status(400).json({
        error: "ID must be 3-30 characters: English letters, numbers, underscores only. Arabic is not allowed."
      });
    }

    const available = await checkUserIdAvailable(idClean);
    if (!available) {
      return res.status(409).json({ error: "This ID is already taken. Please choose another." });
    }

    const user = await createUser({
      id: idClean,
      name: name.trim(),
      language: language || "en",
      answer_language: answer_language || "english",
      theme: theme || "light"
    });

    res.status(201).json({ user });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Login — just fetch user by ID
app.post("/api/users/login", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "id is required." });

    const user = await getUser(id.trim().toLowerCase());
    if (!user) return res.status(404).json({ error: "No account found with this ID." });

    await updateUser(user.id, {});
    res.json({ user });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Update user settings
app.patch("/api/users/:id", async (req, res) => {
  try {
    const user = await updateUser(req.params.id, req.body);
    res.json({ user });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── CONVERSATION ROUTES ──────────────────────────────────────────────────────

// Get all conversations for a user
app.get("/api/conversations/:userId", async (req, res) => {
  try {
    const conversations = await getConversations(req.params.userId);
    res.json({ conversations });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get messages of a specific conversation
app.get("/api/conversations/:userId/:convId/messages", async (req, res) => {
  try {
    const messages = await getMessages(req.params.convId);
    res.json({ messages });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Delete a conversation
app.delete("/api/conversations/:convId", async (req, res) => {
  try {
    await deleteConversation(req.params.convId);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── CHAT ROUTE ───────────────────────────────────────────────────────────────

app.post(
  "/api/chat",
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "image", maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const isMultipart = req.headers["content-type"]?.includes("multipart/form-data");

      let messages = [];
      let mode = "summarize";
      let language = "english";
      let userName = "Friend";
      let rawText = "";
      let userId = null;
      let conversationId = null;

      if (isMultipart) {
        messages = req.body.messages ? JSON.parse(req.body.messages) : [];
        mode = req.body.mode || "summarize";
        language = req.body.language || "english";
        userName = req.body.userName || "Friend";
        rawText = req.body.text || "";
        userId = req.body.userId || null;
        conversationId = req.body.conversationId || null;
      } else {
        messages = Array.isArray(req.body.messages) ? req.body.messages : [];
        mode = req.body.mode || "summarize";
        language = req.body.language || "english";
        userName = req.body.userName || "Friend";
        rawText = req.body.text || "";
        userId = req.body.userId || null;
        conversationId = req.body.conversationId || null;
      }

      const uploadedFile = req.files?.file?.[0] || null;
      const uploadedImage = req.files?.image?.[0] || null;

      let fileText = "";
      if (uploadedFile) {
        fileText = await extractTextFromFile(uploadedFile);
      }

      const combinedUserText = [rawText, fileText].filter(Boolean).join("\n\n");
      const finalMessages = [...messages];

      if (combinedUserText.trim() || uploadedImage) {
        finalMessages.push({
          role: "user",
          content: combinedUserText.trim() || "Analyze this image according to the selected mode."
        });
      }

      if (!finalMessages.length && !uploadedImage) {
        return res.status(400).json({
          error: "No input provided. Please enter text, upload a file, or upload an image."
        });
      }

      const reply = await generateAIResponse({
        messages: finalMessages,
        mode,
        language,
        userName,
        imageFile: uploadedImage
      });

      // ── Persist to Supabase if user is logged in ──────────────────────────
      let savedConversationId = conversationId || null;

      if (userId) {
        try {
          // Create new conversation if needed
          if (!savedConversationId) {
            const title = (combinedUserText || "Image analysis")
              .slice(0, 60)
              .replace(/\n/g, " ")
              .trim();

            const conv = await createConversation({ user_id: userId, mode, title });
            savedConversationId = conv.id;
          }

          // Save the user message
          const userContent = combinedUserText.trim()
            || (uploadedImage ? `[Image: ${uploadedImage.originalname}]` : "")
            || (uploadedFile ? `[File: ${uploadedFile.originalname}]` : "");

          if (userContent) {
            await addMessage({
              conversation_id: savedConversationId,
              role: "user",
              content: userContent
            });
          }

          // Save the AI reply
          await addMessage({
            conversation_id: savedConversationId,
            role: "assistant",
            content: reply
          });
        } catch (dbErr) {
          console.error("DB save error (non-fatal):", dbErr.message);
        }
      }

      return res.status(200).json({ reply, conversationId: savedConversationId });
    } catch (error) {
      console.error("API Error:", error);
      return res.status(500).json({
        error: error.message || "Something went wrong while processing your request."
      });
    }
  }
);

const PORT = process.env.PORT || 3000;
if (process.env.VERCEL !== "1") {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

export default app;
