/*
 * Widget Chat Q&A Madrasah I AM.
 * Vanila JS, tiada kebergantungan. Dimuatkan dari index.html.
 */
(function () {
  "use strict";

  // Tukar kepada URL Cloudflare Worker selepas deploy.
  const ENDPOINT = "https://madrasah-chat.serbabaktiglobal.workers.dev/";

  const MAX_HISTORY = 10;
  const history = [];
  let busy = false;

  const css = `
    .mi-chat-btn{position:fixed;right:20px;bottom:20px;z-index:9999;background:#0f766e;color:#fff;border:0;border-radius:999px;padding:12px 18px;font:600 15px system-ui,sans-serif;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.2)}
    .mi-chat-btn:focus-visible,.mi-chat-send:focus-visible,.mi-chat-close:focus-visible,.mi-chat-input:focus-visible{outline:3px solid #99f6e4;outline-offset:2px}
    .mi-chat-panel{position:fixed;right:20px;bottom:84px;z-index:9999;width:min(360px,calc(100vw - 40px));height:min(480px,calc(100vh - 120px));background:#fff;border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,.25);display:none;flex-direction:column;overflow:hidden;font:15px/1.5 system-ui,sans-serif;color:#111}
    .mi-chat-panel.open{display:flex}
    .mi-chat-head{background:#0f766e;color:#fff;padding:12px 14px;display:flex;justify-content:space-between;align-items:center}
    .mi-chat-head strong{font-size:15px}
    .mi-chat-close{background:transparent;border:0;color:#fff;font-size:20px;cursor:pointer;line-height:1}
    .mi-chat-log{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px;background:#f8fafc}
    .mi-msg{max-width:85%;padding:8px 12px;border-radius:12px;white-space:pre-wrap;word-wrap:break-word}
    .mi-msg.user{align-self:flex-end;background:#0f766e;color:#fff;border-bottom-right-radius:4px}
    .mi-msg.bot{align-self:flex-start;background:#fff;border:1px solid #e2e8f0;border-bottom-left-radius:4px}
    .mi-msg.err{align-self:flex-start;background:#fef2f2;color:#991b1b;border:1px solid #fecaca}
    .mi-chat-form{display:flex;gap:8px;padding:10px;border-top:1px solid #e2e8f0;background:#fff}
    .mi-chat-input{flex:1;border:1px solid #cbd5e1;border-radius:10px;padding:8px 10px;font:inherit;resize:none;min-height:40px;max-height:110px}
    .mi-chat-send{background:#0f766e;color:#fff;border:0;border-radius:10px;padding:0 14px;font:600 14px system-ui,sans-serif;cursor:pointer}
    .mi-chat-send:disabled{opacity:.5;cursor:not-allowed}
    .mi-chat-note{font-size:12px;color:#64748b;padding:0 12px 10px;background:#fff}
  `;

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const k of Object.keys(attrs)) {
        if (k === "class") node.className = attrs[k];
        else if (k === "text") node.textContent = attrs[k];
        else node.setAttribute(k, attrs[k]);
      }
    }
    (children || []).forEach((c) => node.appendChild(c));
    return node;
  }

  function addMessage(log, text, kind) {
    // Teks dipapar dengan textContent, supaya HTML dalam jawapan tidak dilaksanakan.
    // Hanya URL http(s) dijadikan pautan yang boleh diklik.
    const node = el("div", { class: "mi-msg " + kind });
    const urlPattern = /https?:\/\/[^\s<>"']+/g;
    let last = 0;
    let match;
    while ((match = urlPattern.exec(text)) !== null) {
      // Buang tanda baca di hujung URL (contoh titik atau koma).
      let url = match[0].replace(/[.,;:!?)]+$/, "");
      if (match.index > last) {
        node.appendChild(document.createTextNode(text.slice(last, match.index)));
      }
      const a = el("a", { href: url, target: "_blank", rel: "noopener noreferrer", text: url });
      a.style.color = "inherit";
      a.style.textDecoration = "underline";
      node.appendChild(a);
      last = match.index + url.length;
      urlPattern.lastIndex = last;
    }
    if (last < text.length) {
      node.appendChild(document.createTextNode(text.slice(last)));
    }
    log.appendChild(node);
    log.scrollTop = log.scrollHeight;
    return node;
  }

  async function askBot(text) {
    const messages = history.concat([{ role: "user", content: text }]).slice(-MAX_HISTORY);
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: messages }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Ralat tidak diketahui.");
    return data.reply;
  }

  function build() {
    const style = el("style", { text: css });
    document.head.appendChild(style);

    const panel = el("div", { class: "mi-chat-panel", role: "dialog", "aria-label": "Tanya Madrasah I AM" });
    const closeBtn = el("button", { class: "mi-chat-close", "aria-label": "Tutup", text: "×" });
    const head = el("div", { class: "mi-chat-head" }, [el("strong", { text: "Tanya Madrasah I AM" }), closeBtn]);
    const log = el("div", { class: "mi-chat-log", "aria-live": "polite" });
    const input = el("textarea", { class: "mi-chat-input", rows: "1", placeholder: "Tulis soalan anda...", maxlength: "1000", "aria-label": "Soalan" });
    const sendBtn = el("button", { class: "mi-chat-send", type: "submit", text: "Hantar" });
    const form = el("form", { class: "mi-chat-form" }, [input, sendBtn]);
    const note = el("div", { class: "mi-chat-note", text: "Jawapan AI berdasarkan bahan Madrasah I AM dan bukan fatwa. Untuk persoalan agama, rujuk ustaz." });

    panel.append(head, log, form, note);

    const toggle = el("button", { class: "mi-chat-btn", "aria-expanded": "false", text: "Tanya kami" });
    document.body.append(panel, toggle);

    addMessage(log, "Assalamualaikum. Saya wakil digital Madrasah I AM. Apa yang ingin anda tanya tentang program dan kurikulum kami?", "bot");

    function setOpen(open) {
      panel.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
      if (open) input.focus();
    }
    toggle.addEventListener("click", () => setOpen(!panel.classList.contains("open")));
    closeBtn.addEventListener("click", () => { setOpen(false); toggle.focus(); });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        form.requestSubmit();
      }
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text || busy) return;

      busy = true;
      sendBtn.disabled = true;
      input.value = "";
      addMessage(log, text, "user");
      const pending = addMessage(log, "Sedang menjawab...", "bot");

      try {
        const reply = await askBot(text);
        pending.remove();
        addMessage(log, reply, "bot");
        history.push({ role: "user", content: text }, { role: "assistant", content: reply });
        while (history.length > MAX_HISTORY) history.shift();
      } catch (err) {
        pending.remove();
        addMessage(log, "Maaf, ada masalah sambungan. Sila cuba lagi sebentar.", "err");
      } finally {
        busy = false;
        sendBtn.disabled = false;
        input.focus();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
