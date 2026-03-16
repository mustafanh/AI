// public/app.js

const state = {
  mode: "summarize",
  answerLanguage: "english",
  uiLanguage: localStorage.getItem("uiLanguage") || "en",
  userName: "",
  userId: "",
  selectedFile: null,
  selectedImage: null,
  chatHistory: [],          // in-memory messages for current conversation
  currentConversationId: null,
  conversations: [],
  isLoggedIn: false
};

// ─── DOM REFS ────────────────────────────────────────────────────────────────

const authModal        = document.getElementById("authModal");
const authTabLogin     = document.getElementById("authTabLogin");
const authTabRegister  = document.getElementById("authTabRegister");
const loginSection     = document.getElementById("loginSection");
const registerSection  = document.getElementById("registerSection");

const loginIdInput     = document.getElementById("loginIdInput");
const loginBtn         = document.getElementById("loginBtn");
const loginError       = document.getElementById("loginError");

const regIdInput       = document.getElementById("regIdInput");
const regNameInput     = document.getElementById("regNameInput");
const regIdStatus      = document.getElementById("regIdStatus");
const registerBtn      = document.getElementById("registerBtn");
const registerError    = document.getElementById("registerError");

const greetingText     = document.getElementById("greetingText");
const userIdBadge      = document.getElementById("userIdBadge");
const logoutBtn        = document.getElementById("logoutBtn");

const chatMessages     = document.getElementById("chatMessages");
const userInput        = document.getElementById("userInput");
const sendBtn          = document.getElementById("sendBtn");

const fileInput        = document.getElementById("fileInput");
const fileName         = document.getElementById("fileName");
const removeFileBtn    = document.getElementById("removeFileBtn");

const imageInput       = document.getElementById("imageInput");
const imageName        = document.getElementById("imageName");
const removeImageBtn   = document.getElementById("removeImageBtn");

const themeToggle      = document.getElementById("themeToggle");
const newChatBtn       = document.getElementById("newChatBtn");
const sidebarToggle    = document.getElementById("sidebarToggle");
const sidebar          = document.getElementById("sidebar");
const convList         = document.getElementById("convList");

// ─── INIT ─────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", async () => {
  await window.initI18n(state.uiLanguage);
  setupLanguage(state.uiLanguage);
  restoreTheme();
  bindEvents();
  autoResizeTextarea();
  window.initParticles();
  window.attachRippleEffect();
  window.attachToolsBarDrag();

  // Try to restore session from localStorage
  const savedUserId = localStorage.getItem("userId");
  if (savedUserId) {
    try {
      const res = await fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: savedUserId })
      });
      const data = await res.json();
      if (res.ok && data.user) {
        loginSuccess(data.user, false);
        return;
      }
    } catch (_) {}
  }

  showAuthModal();
});

// ─── AUTH MODAL ───────────────────────────────────────────────────────────────

function showAuthModal() {
  authModal.style.display = "grid";
  switchAuthTab("register");
}

function hideAuthModal() {
  authModal.style.display = "none";
}

function switchAuthTab(tab) {
  const isLogin = tab === "login";
  authTabLogin.classList.toggle("active", isLogin);
  authTabRegister.classList.toggle("active", !isLogin);
  loginSection.style.display = isLogin ? "flex" : "none";
  registerSection.style.display = isLogin ? "none" : "flex";
  loginError.textContent = "";
  registerError.textContent = "";
}

// ─── REGISTER ────────────────────────────────────────────────────────────────

let checkIdTimer = null;

function onRegIdInput() {
  clearTimeout(checkIdTimer);
  const val = regIdInput.value.trim().toLowerCase().replace(/\s+/g, "_");
  regIdStatus.textContent = "";
  regIdStatus.className = "field-status";

  if (val.length < 3) return;

  if (/[\u0600-\u06FF]/.test(val) || !/^[a-z0-9_]{3,30}$/.test(val)) {
    regIdStatus.textContent = state.uiLanguage === "ar"
      ? "❌ الـ ID يجب أن يحتوي فقط على حروف إنجليزية وأرقام وشرطة سفلية — بدون عربي"
      : "❌ Only English letters, numbers, underscores — no Arabic";
    regIdStatus.className = "field-status error";
    return;
  }

  regIdStatus.textContent = state.uiLanguage === "ar" ? "⏳ جاري التحقق..." : "⏳ Checking...";

  checkIdTimer = setTimeout(async () => {
    try {
      const res = await fetch(`/api/users/check/${encodeURIComponent(val)}`);
      const data = await res.json();
      if (data.available) {
        regIdStatus.textContent = state.uiLanguage === "ar" ? "✅ متاح!" : "✅ Available!";
        regIdStatus.className = "field-status success";
      } else {
        regIdStatus.textContent = state.uiLanguage === "ar" ? "❌ هذا الـ ID محجوز" : "❌ Already taken";
        regIdStatus.className = "field-status error";
      }
    } catch (_) {
      regIdStatus.textContent = "";
    }
  }, 500);
}

async function doRegister() {
  registerError.textContent = "";
  const id   = regIdInput.value.trim().toLowerCase().replace(/\s+/g, "_");
  const name = regNameInput.value.trim();

  if (!id || !name) {
    registerError.textContent = state.uiLanguage === "ar" ? "يرجى تعبئة جميع الحقول" : "Please fill all fields.";
    return;
  }

  registerBtn.disabled = true;
  registerBtn.textContent = state.uiLanguage === "ar" ? "جاري الإنشاء..." : "Creating...";

  try {
    const res = await fetch("/api/users/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        name,
        language: state.uiLanguage,
        answer_language: state.answerLanguage,
        theme: document.body.classList.contains("dark") ? "dark" : "light"
      })
    });

    const data = await res.json();
    if (!res.ok) {
      registerError.textContent = data.error;
      return;
    }

    loginSuccess(data.user, true);
  } catch (e) {
    registerError.textContent = e.message;
  } finally {
    registerBtn.disabled = false;
    registerBtn.textContent = state.uiLanguage === "ar" ? "إنشاء حساب" : "Create Account";
  }
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────

async function doLogin() {
  loginError.textContent = "";
  const id = loginIdInput.value.trim().toLowerCase();

  if (!id) {
    loginError.textContent = state.uiLanguage === "ar" ? "أدخل الـ ID" : "Please enter your ID.";
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = state.uiLanguage === "ar" ? "جاري الدخول..." : "Signing in...";

  try {
    const res = await fetch("/api/users/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });

    const data = await res.json();
    if (!res.ok) {
      loginError.textContent = data.error;
      return;
    }

    loginSuccess(data.user, false);
  } catch (e) {
    loginError.textContent = e.message;
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = state.uiLanguage === "ar" ? "دخول" : "Sign In";
  }
}

// ─── SESSION ──────────────────────────────────────────────────────────────────

async function loginSuccess(user, isNew) {
  state.userId   = user.id;
  state.userName = user.name;
  state.isLoggedIn = true;

  localStorage.setItem("userId", user.id);
  localStorage.setItem("userName", user.name);

  // Restore user settings
  if (user.language && user.language !== state.uiLanguage) {
    state.uiLanguage = user.language;
    await i18next.changeLanguage(user.language);
    setupLanguage(user.language);
  }

  if (user.theme === "dark" && !document.body.classList.contains("dark")) {
    document.body.classList.add("dark");
    applyThemeIcon(true);
  } else if (user.theme === "light" && document.body.classList.contains("dark")) {
    document.body.classList.remove("dark");
    applyThemeIcon(false);
  }

  hideAuthModal();
  updateGreeting();

  if (userIdBadge) userIdBadge.textContent = `@${user.id}`;

  await loadConversations();

  if (!isNew) {
    showWelcomeBack();
  }
}

function logout() {
  state.userId = "";
  state.userName = "";
  state.isLoggedIn = false;
  state.chatHistory = [];
  state.currentConversationId = null;
  state.conversations = [];

  localStorage.removeItem("userId");
  localStorage.removeItem("userName");

  clearChatUI();
  renderConvList();
  showAuthModal();
}

// ─── CONVERSATIONS SIDEBAR ────────────────────────────────────────────────────

async function loadConversations() {
  if (!state.userId) return;
  try {
    const res = await fetch(`/api/conversations/${state.userId}`);
    const data = await res.json();
    state.conversations = data.conversations || [];
    renderConvList();
  } catch (_) {}
}

function renderConvList() {
  if (!convList) return;
  convList.innerHTML = "";

  if (!state.conversations.length) {
    const empty = document.createElement("div");
    empty.className = "conv-empty";
    empty.textContent = state.uiLanguage === "ar" ? "لا توجد محادثات بعد" : "No conversations yet";
    convList.appendChild(empty);
    return;
  }

  state.conversations.forEach((conv) => {
    const item = document.createElement("div");
    item.className = "conv-item" + (conv.id === state.currentConversationId ? " active" : "");
    item.dataset.id = conv.id;

    const modeLabel = conv.mode.charAt(0).toUpperCase() + conv.mode.slice(1);
    const date = new Date(conv.updated_at).toLocaleDateString(
      state.uiLanguage === "ar" ? "ar-IQ" : "en-GB",
      { month: "short", day: "numeric" }
    );

    item.innerHTML = `
      <div class="conv-item-inner">
        <div class="conv-mode-badge">${modeLabel}</div>
        <div class="conv-title">${escapeHtml(conv.title || "Untitled")}</div>
        <div class="conv-date">${date}</div>
      </div>
      <button class="conv-delete-btn" data-id="${conv.id}" title="Delete">✕</button>
    `;

    item.querySelector(".conv-item-inner").addEventListener("click", () => loadConversation(conv.id));
    item.querySelector(".conv-delete-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      deleteConv(conv.id);
    });

    convList.appendChild(item);
  });
}

async function loadConversation(convId) {
  try {
    const res = await fetch(`/api/conversations/${state.userId}/${convId}/messages`);
    const data = await res.json();
    const msgs = data.messages || [];

    state.currentConversationId = convId;
    state.chatHistory = msgs.map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content }));

    clearChatUI();

    msgs.forEach((msg) => {
      createMessage(msg.role === "assistant" ? "ai" : "user", msg.content);
    });

    renderConvList();
    closeSidebar();
  } catch (e) {
    console.error("Failed to load conversation:", e);
  }
}

async function deleteConv(convId) {
  try {
    await fetch(`/api/conversations/${convId}`, { method: "DELETE" });
    state.conversations = state.conversations.filter((c) => c.id !== convId);

    if (state.currentConversationId === convId) {
      state.currentConversationId = null;
      state.chatHistory = [];
      clearChatUI();
    }

    renderConvList();
  } catch (e) {
    console.error("Failed to delete:", e);
  }
}

function startNewChat() {
  state.currentConversationId = null;
  state.chatHistory = [];
  clearChatUI();
  renderConvList();
}

function clearChatUI() {
  chatMessages.innerHTML = `
    <div class="message ai soft-enter">
      <div class="avatar ai-avatar">AI</div>
      <div class="message-card">
        <p data-i18n="aiWelcomeMessage">${i18next.t("aiWelcomeMessage")}</p>
      </div>
    </div>
  `;
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────

function toggleSidebar() {
  if (!sidebar) return;
  sidebar.classList.toggle("open");
}

function closeSidebar() {
  if (!sidebar) return;
  sidebar.classList.remove("open");
}

// ─── EVENTS ───────────────────────────────────────────────────────────────────

function bindEvents() {
  authTabLogin?.addEventListener("click", () => switchAuthTab("login"));
  authTabRegister?.addEventListener("click", () => switchAuthTab("register"));

  loginBtn?.addEventListener("click", doLogin);
  loginIdInput?.addEventListener("keydown", (e) => { if (e.key === "Enter") doLogin(); });

  regIdInput?.addEventListener("input", onRegIdInput);
  registerBtn?.addEventListener("click", doRegister);
  regNameInput?.addEventListener("keydown", (e) => { if (e.key === "Enter") doRegister(); });

  logoutBtn?.addEventListener("click", logout);
  newChatBtn?.addEventListener("click", startNewChat);
  sidebarToggle?.addEventListener("click", toggleSidebar);

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

      if (state.isLoggedIn) {
        fetch(`/api/users/${state.userId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language: lang })
        }).catch(() => {});
      }
    });
  });

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    state.selectedFile = file || null;
    if (file) { state.selectedImage = null; imageInput.value = ""; }
    updateFileUI(); updateImageUI();
  });

  imageInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    state.selectedImage = file || null;
    if (file) { state.selectedFile = null; fileInput.value = ""; }
    updateImageUI(); updateFileUI();
  });

  removeFileBtn?.addEventListener("click", () => {
    state.selectedFile = null; fileInput.value = ""; updateFileUI();
  });

  removeImageBtn?.addEventListener("click", () => {
    state.selectedImage = null; imageInput.value = ""; updateImageUI();
  });

  userInput.addEventListener("input", autoResizeTextarea);
  userInput.addEventListener("keydown", (e) => {
    if (window.innerWidth > 768 && e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); sendMessage();
    }
  });

  sendBtn.addEventListener("click", sendMessage);
  themeToggle.addEventListener("click", () => {
    toggleTheme();
    if (state.isLoggedIn) {
      const isDark = document.body.classList.contains("dark");
      fetch(`/api/users/${state.userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: isDark ? "dark" : "light" })
      }).catch(() => {});
    }
  });

  window.addEventListener("resize", () => { autoResizeTextarea(); scrollToBottom(); });
}

// ─── SEND MESSAGE ─────────────────────────────────────────────────────────────

async function sendMessage() {
  const text = userInput.value.trim();
  if (!text && !state.selectedFile && !state.selectedImage) return;

  let userVisibleText = text
    || (state.selectedImage ? `[Image: ${state.selectedImage.name}]` : "")
    || (state.selectedFile  ? `[File: ${state.selectedFile.name}]`  : "");

  createMessage("user", userVisibleText);

  if (text) state.chatHistory.push({ role: "user", content: text });

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
    if (state.userId) {
      formData.append("userId", state.userId);
      if (state.currentConversationId) {
        formData.append("conversationId", state.currentConversationId);
      }
    }
    if (state.selectedFile)  formData.append("file",  state.selectedFile);
    if (state.selectedImage) formData.append("image", state.selectedImage);

    const response = await fetch("/api/chat", { method: "POST", body: formData });

    const contentType = response.headers.get("content-type") || "";
    let data;
    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      throw new Error((await response.text()) || "Server returned non-JSON response.");
    }

    if (!response.ok) throw new Error(data.error || "Request failed.");

    aiMsg.card.textContent = "";
    await typeText(aiMsg.card, data.reply);

    state.chatHistory.push({ role: "assistant", content: data.reply });

    // Update conversation id & sidebar
    if (data.conversationId) {
      const isNew = !state.currentConversationId;
      state.currentConversationId = data.conversationId;
      if (isNew) await loadConversations();
      else renderConvList();
    }

    state.selectedFile = null; state.selectedImage = null;
    fileInput.value = ""; imageInput.value = "";
    updateFileUI(); updateImageUI();
  } catch (error) {
    aiMsg.card.textContent = `Error: ${error.message}`;
  } finally {
    sendBtn.disabled = false;
    scrollToBottom();
  }
}

// ─── UI HELPERS ───────────────────────────────────────────────────────────────

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

function updateGreeting() {
  if (!greetingText) return;
  greetingText.textContent = state.uiLanguage === "ar"
    ? (state.userName ? `مرحبا ${state.userName}` : "مرحبا")
    : (state.userName ? `Hello ${state.userName}` : "Hello");
}

function showWelcomeBack() {
  const msg = state.uiLanguage === "ar"
    ? `مرحباً بعودتك يا ${state.userName}! 👋`
    : `Welcome back, ${state.userName}! 👋`;

  const banner = document.createElement("div");
  banner.className = "welcome-back-toast";
  banner.textContent = msg;
  document.body.appendChild(banner);
  setTimeout(() => banner.remove(), 3000);
}

function updateFileUI() {
  if (!fileName) return;
  if (state.selectedFile) {
    fileName.textContent = state.selectedFile.name;
    removeFileBtn?.classList.remove("hidden");
  } else {
    fileName.textContent = i18next.t("noFile");
    removeFileBtn?.classList.add("hidden");
  }
}

function updateImageUI() {
  if (!imageName) return;
  if (state.selectedImage) {
    imageName.textContent = state.selectedImage.name;
    removeImageBtn?.classList.remove("hidden");
  } else {
    imageName.textContent = i18next.t("noImage");
    removeImageBtn?.classList.add("hidden");
  }
}

function applyThemeIcon(isDark) {
  themeToggle.textContent = isDark ? "🌙" : "☀️";
  themeToggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
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
  userInput.style.height = `${Math.min(userInput.scrollHeight, window.innerWidth <= 768 ? 180 : 220)}px`;
}

function createMessage(role, content, typing = false) {
  const wrapper = document.createElement("div");
  wrapper.className = `message ${role} soft-enter`;

  const avatar = document.createElement("div");
  avatar.className = `avatar ${role === "ai" ? "ai-avatar" : "user-avatar"}`;
  avatar.textContent = role === "ai" ? "AI" : (state.userName?.charAt(0) || "U").toUpperCase();

  const card = document.createElement("div");
  card.className = "message-card";

  if (typing) {
    card.innerHTML = `<div class="typing-indicator"><span></span><span></span><span></span></div>`;
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
  requestAnimationFrame(() => { chatMessages.scrollTop = chatMessages.scrollHeight; });
}

function typeText(element, text) {
  return new Promise((resolve) => {
    element.textContent = "";
    let i = 0;
    function step() {
      if (i < text.length) {
        element.textContent += text.charAt(i++);
        scrollToBottom();
        setTimeout(step, 8);
      } else { resolve(); }
    }
    step();
  });
}

async function animateLanguageSwitch(lang) {
  const els = [
    document.querySelector(".topbar"),
    document.querySelector(".tools-bar"),
    document.querySelector(".chat-layout")
  ].filter(Boolean);

  els.forEach((el) => { el.classList.remove("lang-fade-in"); el.classList.add("lang-fade-out"); });
  await new Promise((r) => setTimeout(r, 140));

  state.uiLanguage = lang;
  localStorage.setItem("uiLanguage", lang);
  await i18next.changeLanguage(lang);
  setupLanguage(lang);
  renderConvList();

  els.forEach((el) => { el.classList.remove("lang-fade-out"); el.classList.add("lang-fade-in"); });
  setTimeout(() => els.forEach((el) => el.classList.remove("lang-fade-in")), 220);
}

function escapeHtml(str) {
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}
