import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

function buildSystemPrompt(
  mode = "summarize",
  language = "english",
  userName = "Friend",
  hasImage = false
) {
  const isArabic = language === "arabic";

  const baseLanguageInstruction = isArabic
    ? `You must answer only in Arabic. Start every response by addressing the user by name exactly like this: "يا ${userName}،". Use clear modern Arabic. Keep structure elegant and readable.`
    : `You must answer only in English. Start every response by addressing the user by name exactly like this: "${userName},". Keep the tone polished, helpful, and easy to read.`;

  const modePrompts = {
    summarize: isArabic
      ? "لخّص المحتوى بوضوح مع أهم الأفكار بشكل منظم ومفيد."
      : "Summarize the content clearly with the most important ideas in a well-structured way.",

    flashcards: isArabic
      ? "حوّل المحتوى إلى بطاقات تعليمية. كل بطاقة يجب أن تحتوي: سؤال ثم جواب."
      : "Turn the content into study flashcards. Each flashcard must contain: Question then Answer.",

    quiz: isArabic
      ? "أنشئ اختباراً قصيراً منظمًا من المحتوى مع أسئلة متعددة الخيارات ثم ضع الإجابات الصحيحة في النهاية."
      : "Create a well-structured quiz from the content with multiple-choice questions, then provide the correct answers at the end.",

    keypoints: isArabic
      ? "استخرج النقاط الأساسية فقط بشكل مرتب وواضح."
      : "Extract only the key points in a clean and readable structure.",

    translate: isArabic
      ? "إذا كان المحتوى بلغة أخرى فترجمه إلى العربية ترجمة طبيعية وواضحة."
      : "If the content is in another language, translate it into English naturally and clearly.",

    simplify: isArabic
      ? "بسّط المحتوى ليصبح أسهل للفهم مع الحفاظ على المعنى."
      : "Simplify the content so it becomes easier to understand without losing the meaning.",

    studynotes: isArabic
      ? "أنشئ ملاحظات دراسية منظمة بعناوين فرعية ونقاط مهمة وشرح مختصر."
      : "Generate organized study notes with headings, bullet points, and concise explanations."
  };

  const imageInstruction = hasImage
    ? isArabic
      ? "إذا وُجدت صورة، قم بتحليلها بعناية واقرأ النص الظاهر فيها إن وجد، ثم طبّق المهمة المطلوبة على محتوى الصورة."
      : "If an image is provided, analyze it carefully, read any visible text if present, and apply the selected task to the image content."
    : "";

  return `${baseLanguageInstruction}
You are a premium AI learning assistant inside a modern educational productivity web app.
Format responses beautifully for chat.
Avoid markdown tables.
Use short headings when useful.
Task mode: ${modePrompts[mode] || modePrompts.summarize}
${imageInstruction}`.trim();
}

function encodeImageToDataUrl(imageFile) {
  if (!imageFile?.buffer) return null;
  const mimeType = imageFile.mimetype || "image/jpeg";
  const base64 = imageFile.buffer.toString("base64");
  return `data:${mimeType};base64,${base64}`;
}

export async function generateAIResponse({
  messages = [],
  mode = "summarize",
  language = "english",
  userName = "Friend",
  imageFile = null
}) {
  const hasImage = Boolean(imageFile);
  const systemPrompt = buildSystemPrompt(mode, language, userName, hasImage);

  const preparedMessages = [
    {
      role: "system",
      content: systemPrompt
    },
    ...messages
  ];

  let model = "llama-3.3-70b-versatile";

  if (hasImage) {
    model = "meta-llama/llama-4-maverick-17b-128e-instruct";

    const lastMessageIndex = [...preparedMessages]
      .reverse()
      .findIndex((msg) => msg.role === "user");

    const actualIndex =
      lastMessageIndex === -1
        ? -1
        : preparedMessages.length - 1 - lastMessageIndex;

    const imageUrl = encodeImageToDataUrl(imageFile);

    if (actualIndex >= 0) {
      const existingText =
        typeof preparedMessages[actualIndex].content === "string"
          ? preparedMessages[actualIndex].content
          : "";

      preparedMessages[actualIndex] = {
        role: "user",
        content: [
          {
            type: "text",
            text: existingText || "Analyze this image according to the selected mode."
          },
          {
            type: "image_url",
            image_url: {
              url: imageUrl
            }
          }
        ]
      };
    } else {
      preparedMessages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: "Analyze this image according to the selected mode."
          },
          {
            type: "image_url",
            image_url: {
              url: imageUrl
            }
          }
        ]
      });
    }
  }

  const completion = await groq.chat.completions.create({
    model,
    temperature: 0.7,
    max_tokens: 1400,
    messages: preparedMessages
  });

  return completion.choices?.[0]?.message?.content?.trim() || "No response received.";
}