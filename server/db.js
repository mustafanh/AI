// server/db.js
// Supabase database helper for Owl AI

import { config } from "dotenv";
config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment variables.");
}

const headers = {
  "Content-Type": "application/json",
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Prefer": "return=representation"
};

async function supabase(path, method = "GET", body = null, extra = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: { ...headers, ...extra },
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const msg = data?.message || data?.error || res.statusText;
    throw new Error(`Supabase error (${res.status}): ${msg}`);
  }

  return data;
}

// ─── USERS ────────────────────────────────────────────────────────────────────

export async function checkUserIdAvailable(id) {
  const rows = await supabase(`users?id=eq.${encodeURIComponent(id)}&select=id`);
  return rows.length === 0;
}

export async function createUser({ id, name, language = "en", answer_language = "english", theme = "light" }) {
  const rows = await supabase("users", "POST", { id, name, language, answer_language, theme });
  return rows[0];
}

export async function getUser(id) {
  const rows = await supabase(`users?id=eq.${encodeURIComponent(id)}&select=*`);
  return rows[0] || null;
}

export async function updateUser(id, updates) {
  const rows = await supabase(
    `users?id=eq.${encodeURIComponent(id)}`,
    "PATCH",
    { ...updates, last_seen_at: new Date().toISOString() }
  );
  return rows[0];
}

// ─── CONVERSATIONS ─────────────────────────────────────────────────────────────

export async function createConversation({ user_id, mode, title }) {
  const rows = await supabase("conversations", "POST", { user_id, mode, title });
  return rows[0];
}

export async function getConversations(user_id) {
  const rows = await supabase(
    `conversations?user_id=eq.${encodeURIComponent(user_id)}&order=updated_at.desc&select=*`
  );
  return rows;
}

export async function getConversation(id) {
  const rows = await supabase(`conversations?id=eq.${id}&select=*`);
  return rows[0] || null;
}

export async function deleteConversation(id) {
  await supabase(`conversations?id=eq.${id}`, "DELETE");
}

// ─── MESSAGES ─────────────────────────────────────────────────────────────────

export async function addMessage({ conversation_id, role, content }) {
  const rows = await supabase("messages", "POST", { conversation_id, role, content });
  return rows[0];
}

export async function getMessages(conversation_id) {
  const rows = await supabase(
    `messages?conversation_id=eq.${conversation_id}&order=created_at.asc&select=*`
  );
  return rows;
}