const resources = {
  en: {
    translation: {
      headerSubtitle: "Elegant study and productivity assistant",
      toolSummarize: "Summarize",
      toolFlashcards: "Flashcards",
      toolQuiz: "Quiz",
      toolKeyPoints: "Key Points",
      toolTranslate: "Translate",
      toolSimplify: "Simplify",
      toolStudyNotes: "Study Notes",
      welcomeMessage: "Welcome. Paste your text, upload a document, or upload an image. Choose one of the AI tools above such as Summarize, Flashcards, Quiz, or Key Points, and Owl AI will help you study, understand, and organize your learning efficiently.",
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
      toolSummarize: "تلخيص",
      toolFlashcards: "فلاش كارد",
      toolQuiz: "اختبار",
      toolKeyPoints: "النقاط الأساسية",
      toolTranslate: "ترجمة",
      toolSimplify: "تبسيط",
      toolStudyNotes: "ملاحظات دراسية",
      welcomeMessage: "مرحباً. الصق النص أو ارفع ملفاً أو صورة، وسأساعدك على الدراسة بشكل أفضل.",
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