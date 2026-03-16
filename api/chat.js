import express from "express";
import multer from "multer";
import { generateAIResponse } from "../server/groq.js";
import { extractTextFromFile } from "../server/fileProcessor.js";

const app = express();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024
  }
});

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.post(
  "/api/chat",
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "image", maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      let messages = [];
      let mode = "summarize";
      let language = "english";
      let userName = "Friend";
      let rawText = "";

      const isMultipart = req.headers["content-type"]?.includes("multipart/form-data");

      if (isMultipart) {
        messages = req.body.messages ? JSON.parse(req.body.messages) : [];
        mode = req.body.mode || "summarize";
        language = req.body.language || "english";
        userName = req.body.userName || "Friend";
        rawText = req.body.text || "";
      } else {
        messages = Array.isArray(req.body.messages) ? req.body.messages : [];
        mode = req.body.mode || "summarize";
        language = req.body.language || "english";
        userName = req.body.userName || "Friend";
        rawText = req.body.text || "";
      }

      const uploadedFile = req.files?.file?.[0] || null;
      const uploadedImage = req.files?.image?.[0] || null;

      let fileText = "";
      if (uploadedFile) {
        fileText = await extractTextFromFile(uploadedFile);
      }

      const combinedUserText = [rawText, fileText].filter(Boolean).join("\n\n");
      const finalMessages = [...messages];

      if (uploadedImage) {
        finalMessages.push({
          role: "user",
          content: combinedUserText.trim()
        });
      } else if (combinedUserText.trim()) {
        finalMessages.push({
          role: "user",
          content: combinedUserText.trim()
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

      return res.status(200).json({ reply });
    } catch (error) {
      console.error("API Error:", error);
      return res.status(500).json({
        error: error.message || "Something went wrong while processing your request."
      });
    }
  }
);

export default app;