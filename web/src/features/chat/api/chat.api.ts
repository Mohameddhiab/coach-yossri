import { apiClient } from "@/shared/lib/api-client";

export interface Conversation {
  id: string;
  user_id: string;
  user_name: string;
  unread_count: number;
  last_message: string | null;
  last_message_at: string | null;
}

export interface MyConversation {
  id: string;
  coach_id: string;
  unread_count: number;
}

export interface ChatMessageApi {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role?: "COACH" | "USER";
  contenu: string;
  attachment_url?: string | null;
  attachment_type?: string | null;
  attachment_name?: string | null;
  lu: boolean;
  created_at: string;
}

export function listConversations() {
  return apiClient<Conversation[]>("GET", "/conversations");
}

export function getMyConversation() {
  return apiClient<MyConversation | null>("GET", "/me/conversation");
}

export function getMessages(conversationId: string, after?: string) {
  const q = after ? `?after=${encodeURIComponent(after)}` : "";
  return apiClient<ChatMessageApi[]>("GET", `/conversations/${conversationId}/messages${q}`);
}

export function sendMessage(conversationId: string, contenu: string, file?: File | null) {
  if (file) {
    const fd = new FormData();
    fd.append("file", file);
    if (contenu) fd.append("contenu", contenu);
    return apiClient<ChatMessageApi>("POST", `/conversations/${conversationId}/messages`, fd);
  }
  return apiClient<ChatMessageApi>("POST", `/conversations/${conversationId}/messages`, {
    contenu,
  });
}

export function sendFirstToCoach(contenu: string, file?: File | null) {
  if (file) {
    const fd = new FormData();
    fd.append("file", file);
    if (contenu) fd.append("contenu", contenu);
    return apiClient<ChatMessageApi>("POST", "/me/conversation/messages", fd);
  }
  return apiClient<ChatMessageApi>("POST", "/me/conversation/messages", { contenu });
}

export function sendToMember(userId: string, contenu: string, file?: File | null) {
  if (file) {
    const fd = new FormData();
    fd.append("file", file);
    if (contenu) fd.append("contenu", contenu);
    return apiClient<ChatMessageApi>("POST", `/users/${userId}/messages`, fd);
  }
  return apiClient<ChatMessageApi>("POST", `/users/${userId}/messages`, { contenu });
}

export function markRead(conversationId: string) {
  return apiClient<{ ok: boolean }>("POST", `/conversations/${conversationId}/read`);
}
