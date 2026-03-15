import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

function buildSystemPrompt(mode = "summarize", language = "english", userName = "Friend") {
  const isArabic = language === "arabic";

  const baseLanguageInstruction = isArabic
    ? `You must answer only in Arabic. Start every response by addressing the user by name exactly like this: "يا ${userName}،". Use clear modern Arabic. Keep structure elegant and readable.`
    : `You must answer only in English. Start every response by addressing the user by name exactly like this: "${userName},". Keep the tone polished, helpful, and easy to read.`;

  const modePrompts = {
    summarize: isArabic
      ? "لخّص النص بوضوح مع أهم الأفكار بشكل منظم ومفيد."
      : "Summarize the text clearly with the most important ideas in a well-structured way.",

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
      ? "ترجم المحتوى إلى العربية ترجمة طبيعية وواضحة."
      : "Translate the content into English naturally and clearly.",

    simplify: isArabic
      ? "بسّط المحتوى ليصبح أسهل للفهم مع الحفاظ على المعنى."
      : "Simplify the content so it becomes easier to understand without losing the meaning.",

    studynotes: isArabic
      ? "أنشئ ملاحظات دراسية منظمة بعناوين فرعية ونقاط مهمة وشرح مختصر."
      : "Generate organized study notes with headings, bullet points, and concise explanations."
  };

  return `${baseLanguageInstruction}
You are a premium AI learning assistant inside a modern educational productivity web app.
Format responses beautifully for chat.
Avoid markdown tables.
Use short headings when useful.
Task mode: ${modePrompts[mode] || modePrompts.summarize}`;
}

export async function generateAIResponse({
  messages = [],
  mode = "summarize",
  language = "english",
  userName = "Friend"
}) {
  const systemPrompt = buildSystemPrompt(mode, language, userName);

  const preparedMessages = [
    {
      role: "system",
      content: systemPrompt
    },
    ...messages
  ];

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
    max_tokens: 1400,
    messages: preparedMessages
  });

  return completion.choices?.[0]?.message?.content?.trim() || "No response received.";
}