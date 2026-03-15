import pdfParse from "pdf-parse";
import mammoth from "mammoth";

export async function extractTextFromFile(file) {
  if (!file) return "";

  const mimeType = file.mimetype;
  const originalName = file.originalname?.toLowerCase() || "";

  if (mimeType === "application/pdf" || originalName.endsWith(".pdf")) {
    const result = await pdfParse(file.buffer);
    return result.text?.trim() || "";
  }

  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    originalName.endsWith(".docx")
  ) {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value?.trim() || "";
  }

  if (mimeType === "text/plain" || originalName.endsWith(".txt")) {
    return file.buffer.toString("utf-8").trim();
  }

  throw new Error("Unsupported file type. Please upload PDF, DOCX, or TXT.");
}