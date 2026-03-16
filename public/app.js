const state = {
  mode: "summarize",
  answerLanguage: "english",
  uiLanguage: localStorage.getItem("uiLanguage") || "en",
  userName: localStorage.getItem("userName") || "",
  selectedFile: null,
  selectedImage: null,
  chatHistory: []
};

const nameModal = document.getElementById("nameModal");
const nameInput = document.getElementById("nameInput");
const startBtn = document.getElementById("startBtn");
const greetingText = document.getElementById("greetingText");
const chatMessages = document.getElementById("chatMessages");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

const fileInput = document.getElementById("fileInput");
const fileName = document.getElementById("fileName");
const removeFileBtn = document.getElementById("removeFileBtn");

const imageInput = document.getElementById("imageInput");
const imageName = document.getElementById("imageName");
const removeImageBtn = document.getElementById("removeImageBtn");

const themeToggle = document.getElementById("themeToggle");

document.addEventListener("DOMContentLoaded", async () => {
  await window.initI18n(state.uiLanguage);
  setupLanguage(state.uiLanguage);
  restoreTheme();
  updateGreeting();
  bindEvents();
  autoResizeTextarea();
  updateFileUI();
  updateImageUI();
  window.initParticles();
  window.attachRippleEffect();
  window.attachToolsBarDrag();

  if (state.userName) {
    nameModal.style.display = "none";
  } else {
    nameModal.style.display = "grid";
  }
});

function bindEvents() {
  startBtn.addEventListener("click", saveUserName);

  nameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") saveUserName();
  });

  document.querySelectorAll(".tool-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tool-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      state.mode = btn.dataset.mode;
    });
  });

  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const lang = btn.dataset.lang;
      if (lang === state.uiLanguage) return;
      await animateLanguageSwitch(lang);
    });
  });

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    state.selectedFile = file || null;

    if (file) {
      state.selectedImage = null;
      imageInput.value = "";
    }

    updateFileUI();
    updateImageUI();
  });

  imageInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    state.selectedImage = file || null;

    if (file) {
      state.selectedFile = null;
      fileInput.value = "";
    }

    updateImageUI();
    updateFileUI();
  });

  if (removeFileBtn) {
    removeFileBtn.addEventListener("click", () => {
      state.selectedFile = null;
      fileInput.value = "";
      updateFileUI();
    });
  }

  if (removeImageBtn) {
    removeImageBtn.addEventListener("click", () => {
      state.selectedImage = null;
      imageInput.value = "";
      updateImageUI();
    });
  }

  userInput.addEventListener("input", autoResizeTextarea);

  userInput.addEventListener("keydown", (e) => {
    const isMobile = window.innerWidth <= 768;

    if (!isMobile && e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  sendBtn.addEventListener("click", sendMessage);
  themeToggle.addEventListener("click", toggleTheme);

  window.addEventListener("resize", () => {
    autoResizeTextarea();
    scrollToBottom();
  });
}

function setupLanguage(lang) {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  document.body.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");

  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === lang);
  });

  window.applyTranslations();
  updateGreeting();
  updateFileUI();
  updateImageUI();
}

function saveUserName() {
  const value = nameInput.value.trim();
  if (!value) return;

  state.userName = value;
  localStorage.setItem("userName", value);
  updateGreeting();
  nameModal.style.display = "none";
}

function updateGreeting() {
  if (state.uiLanguage === "ar") {
    greetingText.textContent = state.userName ? `مرحبا ${state.userName}` : "مرحبا";
  } else {
    greetingText.textContent = state.userName ? `Hello ${state.userName}` : "Hello";
  }
}

function updateFileUI() {
  if (!fileName) return;

  if (state.selectedFile) {
    fileName.textContent = state.selectedFile.name;
    if (removeFileBtn) removeFileBtn.classList.remove("hidden");
  } else {
    fileName.textContent = i18next.t("noFile");
    if (removeFileBtn) removeFileBtn.classList.add("hidden");
  }
}

function updateImageUI() {
  if (!imageName) return;

  if (state.selectedImage) {
    imageName.textContent = state.selectedImage.name;
    if (removeImageBtn) removeImageBtn.classList.remove("hidden");
  } else {
    imageName.textContent = i18next.t("noImage");
    if (removeImageBtn) removeImageBtn.classList.add("hidden");
  }
}

function applyThemeIcon(isDark) {
  themeToggle.textContent = isDark ? "🌙" : "☀️";
  themeToggle.setAttribute(
    "aria-label",
    isDark ? "Switch to light mode" : "Switch to dark mode"
  );
}

function restoreTheme() {
  const savedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const shouldUseDark = savedTheme ? savedTheme === "dark" : prefersDark;

  document.body.classList.toggle("dark", shouldUseDark);
  applyThemeIcon(shouldUseDark);
}

function toggleTheme() {
  const isDark = document.body.classList.toggle("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  applyThemeIcon(isDark);
}

function autoResizeTextarea() {
  userInput.style.height = "58px";
  const newHeight = Math.min(
    userInput.scrollHeight,
    window.innerWidth <= 768 ? 180 : 220
  );
  userInput.style.height = `${newHeight}px`;
}

function createMessage(role, content, typing = false) {
  const wrapper = document.createElement("div");
  wrapper.className = `message ${role} soft-enter`;

  const avatar = document.createElement("div");
  avatar.className = `avatar ${role === "ai" ? "ai-avatar" : "user-avatar"}`;
  avatar.textContent =
    role === "ai" ? "AI" : (state.userName?.charAt(0) || "U").toUpperCase();

  const card = document.createElement("div");
  card.className = "message-card";

  if (typing) {
    card.innerHTML = `
      <div class="typing-indicator">
        <span></span><span></span><span></span>
      </div>
    `;
  } else {
    card.textContent = content;
  }

  wrapper.appendChild(avatar);
  wrapper.appendChild(card);
  chatMessages.appendChild(wrapper);
  scrollToBottom();

  return { wrapper, card };
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
}

function typeText(element, text) {
  return new Promise((resolve) => {
    element.textContent = "";
    let i = 0;

    function step() {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
        scrollToBottom();
        setTimeout(step, 8);
      } else {
        resolve();
      }
    }

    step();
  });
}

async function sendMessage() {
  const text = userInput.value.trim();

  if (!text && !state.selectedFile && !state.selectedImage) return;

  let userVisibleText = text;
  if (!userVisibleText && state.selectedImage) {
    userVisibleText = `[Image: ${state.selectedImage.name}]`;
  } else if (!userVisibleText && state.selectedFile) {
    userVisibleText = `[File: ${state.selectedFile.name}]`;
  }

  createMessage("user", userVisibleText);

  if (text) {
    state.chatHistory.push({
      role: "user",
      content: text
    });
  }

  userInput.value = "";
  autoResizeTextarea();

  const aiMsg = createMessage("ai", "", true);

  try {
    sendBtn.disabled = true;

    const formData = new FormData();
    formData.append("messages", JSON.stringify(state.chatHistory));
    formData.append("mode", state.mode);
    formData.append("language", state.answerLanguage);
    formData.append("userName", state.userName || "Friend");
    formData.append("text", text);

    if (state.selectedFile) {
      formData.append("file", state.selectedFile);
    }

    if (state.selectedImage) {
      formData.append("image", state.selectedImage);
    }

    const response = await fetch("/api/chat", {
      method: "POST",
      body: formData
    });

    const contentType = response.headers.get("content-type") || "";
    let data;

    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const rawText = await response.text();
      throw new Error(rawText || "Server returned non-JSON response.");
    }

    if (!response.ok) {
      throw new Error(data.error || "Request failed.");
    }

    aiMsg.card.textContent = "";
    await typeText(aiMsg.card, data.reply);

    state.chatHistory.push({
      role: "assistant",
      content: data.reply
    });

    state.selectedFile = null;
    state.selectedImage = null;
    fileInput.value = "";
    imageInput.value = "";
    updateFileUI();
    updateImageUI();
  } catch (error) {
    aiMsg.card.textContent = `Error: ${error.message}`;
  } finally {
    sendBtn.disabled = false;
    scrollToBottom();
  }
}

async function animateLanguageSwitch(lang) {
  const animatedElements = [
    document.querySelector(".topbar"),
    document.querySelector(".tools-bar"),
    document.querySelector(".chat-layout")
  ].filter(Boolean);

  animatedElements.forEach((el) => {
    el.classList.remove("lang-fade-in");
    el.classList.add("lang-fade-out");
  });

  await new Promise((resolve) => setTimeout(resolve, 140));

  state.uiLanguage = lang;
  localStorage.setItem("uiLanguage", lang);
  await i18next.changeLanguage(lang);
  setupLanguage(lang);

  animatedElements.forEach((el) => {
    el.classList.remove("lang-fade-out");
    el.classList.add("lang-fade-in");
  });

  setTimeout(() => {
    animatedElements.forEach((el) => {
      el.classList.remove("lang-fade-in");
    });
  }, 220);
}