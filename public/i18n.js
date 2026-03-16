const resources = {
  en: {
    translation: {
      headerSubtitle: "Elegant study and productivity assistant",
      headerDescription:
        "Smart AI tools designed to help you learn faster, understand complex topics, and organize your study workflow.",

      toolSummarize: "Summarize",
      toolFlashcards: "Flashcards",
      toolQuiz: "Quiz",
      toolKeyPoints: "Key Points",
      toolTranslate: "Translate",
      toolSimplify: "Simplify",
      toolStudyNotes: "Study Notes",

      workspaceDescription:
        "Choose a tool above, paste your text, upload a document, or analyze an image to start learning with AI.",

      aiWelcomeMessage:
        "Hi! I'm Owl AI. Send me text, a document, or an image and I'll help you summarize, create flashcards, generate quizzes, or simplify the content for studying.",

      answerEnglish: "Answer in English",
      answerArabic: "Answer in Arabic",
      uploadFile: "Upload PDF / DOCX / TXT",
      uploadImage: "Upload Image",
      noFile: "No file selected",
      noImage: "No image selected",
      inputPlaceholder: "Paste your text here...",
      send: "Send",
      welcomeTitle: "Welcome 👋",
      enterName: "Enter your name",
      start: "Start"
    }
  },
  ar: {
    translation: {
      headerSubtitle: "مساعد أنيق للدراسة والإنتاجية",
      headerDescription:
        "أدوات ذكاء اصطناعي متقدمة تساعدك على التعلم بسرعة، فهم المواضيع المعقدة، وتنظيم دراستك بذكاء.",

      toolSummarize: "تلخيص",
      toolFlashcards: "فلاش كارد",
      toolQuiz: "اختبار",
      toolKeyPoints: "النقاط الأساسية",
      toolTranslate: "ترجمة",
      toolSimplify: "تبسيط",
      toolStudyNotes: "ملاحظات دراسية",

      workspaceDescription:
        "اختر إحدى الأدوات أعلاه، ثم الصق النص أو ارفع ملفًا أو صورة لبدء التعلم باستخدام الذكاء الاصطناعي.",

      aiWelcomeMessage:
        "مرحبًا! أنا Owl AI. أرسل نصًا أو ملفًا أو صورة وسأساعدك في التلخيص، إنشاء فلاش كارد، إعداد اختبارات، أو تبسيط المحتوى للدراسة.",

      answerEnglish: "أجب بالإنجليزية",
      answerArabic: "أجب بالعربية",
      uploadFile: "رفع PDF / DOCX / TXT",
      uploadImage: "رفع صورة",
      noFile: "لم يتم اختيار ملف",
      noImage: "لم يتم اختيار صورة",
      inputPlaceholder: "الصق النص هنا...",
      send: "إرسال",
      welcomeTitle: "مرحباً 👋",
      enterName: "أدخل اسمك",
      start: "ابدأ"
    }
  }
};

window.initI18n = async function initI18n(defaultLang = "en") {
  await i18next.init({
    lng: defaultLang,
    resources
  });

  window.applyTranslations();
};

window.applyTranslations = function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = i18next.t(el.dataset.i18n);
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = i18next.t(el.dataset.i18nPlaceholder);
  });
};