"use client";

import { useState, useRef, useEffect } from "react";

interface ChatMessage {
  role: "user" | "ai";
  content: string;
  timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
  "Danh sách khách hàng đã làm dịch vụ cách đây hơn 3 tháng chưa quay lại",
  "Danh sách khách hàng ở Hà Nội có doanh thu cao nhất",
  "Những khách hàng dễ tính, ngoan, có nhu cầu cao",
  "Khách hàng nào đang còn nợ chưa thanh toán?",
  "Phân tích top dịch vụ được đặt nhiều nhất",
  "Khách hàng nào bị mất niềm tin, cần chăm sóc đặc biệt?",
  "So sánh doanh thu giữa cơ sở Hà Nội và Hồ Chí Minh",
  "Gợi ý chiến lược chăm sóc khách hàng cũ quay lại",
];

export default function CustomerAIPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading) return;

    setInput("");
    setError(null);

    const userMsg: ChatMessage = { role: "user", content: msg, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/customers/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Lỗi khi gọi AI");
        return;
      }

      const meta = data.meta ? `\n\n---\n📊 *Phân tích ${data.meta.sent}/${data.meta.total} khách hàng (lọc: ${data.meta.filtered})*` : "";
      const aiMsg: ChatMessage = { role: "ai", content: data.answer + meta, timestamp: new Date() };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setError("Không thể kết nối đến server");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-h1 text-h1 text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
            AI Phân tích khách hàng
          </h1>
          <p className="text-body-sm text-on-surface-variant">
            Hỏi AI bất kỳ điều gì về dữ liệu khách hàng CK — phân tích, thống kê, gợi ý chăm sóc
          </p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="rounded-lg border border-outline-variant px-4 py-2 text-label-md font-bold text-on-surface-variant hover:bg-slate-50 transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Cuộc trò chuyện mới
          </button>
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto bg-white rounded-xl border border-outline-variant shadow-sm p-4 space-y-4 mb-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <span className="material-symbols-outlined text-[64px] text-secondary/20 mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
            <h2 className="text-lg font-bold text-on-surface mb-1">Bắt đầu phân tích</h2>
            <p className="text-body-sm text-on-surface-variant mb-6 max-w-md">
              AI sẽ đọc toàn bộ dữ liệu khách hàng CK và trả lời câu hỏi của bạn. Thử một số gợi ý bên dưới:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-2xl w-full">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-left rounded-lg border border-outline-variant px-4 py-3 text-body-sm text-on-surface hover:bg-secondary/5 hover:border-secondary/30 transition-all group"
                >
                  <span className="material-symbols-outlined text-[16px] text-secondary/50 group-hover:text-secondary mr-2 align-middle">arrow_forward</span>
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-secondary text-white rounded-br-md"
                    : "bg-slate-50 border border-outline-variant text-on-surface rounded-bl-md"
                }`}>
                  {msg.role === "ai" ? (
                    <div className="prose prose-sm max-w-none prose-headings:text-on-surface prose-p:text-on-surface prose-strong:text-on-surface prose-td:text-[12px] prose-th:text-[11px] prose-table:text-[12px]">
                      <MarkdownRenderer content={msg.content} />
                    </div>
                  ) : (
                    <p className="text-body-sm whitespace-pre-wrap">{msg.content}</p>
                  )}
                  <p className={`text-[10px] mt-1.5 ${msg.role === "user" ? "text-white/50" : "text-slate-400"}`}>
                    {msg.timestamp.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-50 border border-outline-variant rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-2 text-on-surface-variant text-body-sm">
                    <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                    AI đang phân tích dữ liệu...
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-3 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-body-sm font-medium flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">error</span>
          {error}
        </div>
      )}

      {/* Input */}
      <div className="bg-white rounded-xl border border-outline-variant shadow-sm p-3 flex gap-3 items-end">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Hỏi AI về khách hàng... (Enter để gửi, Shift+Enter xuống dòng)"
          rows={1}
          className="flex-1 resize-none rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-body-md focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all max-h-32"
          style={{ minHeight: "42px" }}
          onInput={(e) => {
            const el = e.target as HTMLTextAreaElement;
            el.style.height = "auto";
            el.style.height = Math.min(el.scrollHeight, 128) + "px";
          }}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          className="rounded-xl bg-secondary px-5 py-2.5 text-white font-bold hover:bg-blue-700 disabled:opacity-30 transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
        >
          <span className="material-symbols-outlined text-[20px]">send</span>
          Gửi
        </button>
      </div>
    </div>
  );
}


function MarkdownRenderer({ content }: { content: string }) {
  // Simple markdown to HTML: bold, headers, tables, lists, line breaks
  const html = content
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-slate-100 rounded-lg p-3 overflow-x-auto text-[12px] my-2"><code>$2</code></pre>')
    // Tables
    .replace(/\|(.+)\|\n\|[-| :]+\|\n((?:\|.+\|\n?)*)/g, (_match, header: string, body: string) => {
      const ths = header.split("|").filter(Boolean).map((h: string) => `<th class="px-2 py-1.5 bg-slate-100 font-bold text-left border border-slate-200">${h.trim()}</th>`).join("");
      const rows = body.trim().split("\n").map((row: string) => {
        const tds = row.split("|").filter(Boolean).map((d: string) => `<td class="px-2 py-1 border border-slate-200">${d.trim()}</td>`).join("");
        return `<tr class="hover:bg-slate-50">${tds}</tr>`;
      }).join("");
      return `<div class="overflow-x-auto my-3"><table class="w-full text-[12px] border-collapse border border-slate-200 rounded"><thead><tr>${ths}</tr></thead><tbody>${rows}</tbody></table></div>`;
    })
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="font-bold text-sm mt-3 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="font-bold text-base mt-4 mb-1.5">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="font-bold text-lg mt-4 mb-2">$1</h1>')
    // Bold & italic
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Unordered lists
    .replace(/^[-*] (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
    // Line breaks
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}