import { useEffect, useRef, useState } from 'react';
import { ArrowRight, CircleAlert, Send, X } from 'lucide-react';
import { chatContext, chatPrompts, chatReply, chatTopic } from '../lib/chat.js';
import './chatbot.css';

const avatar = '/maviq-maskot.webp';
const suggestions = [
  ['stock', 'Stok apa yang menipis?'],
  ['summary', 'Bagaimana penjualan hari ini?'],
  ['market', 'Di mana lihat harga pasar?']
];
const actions = { stock: 'Buka Bahan & Stok', dashboard: 'Buka Dashboard', cash: 'Buka Keuangan', market: 'Buka Harga Pasar' };

function TypingBubble({ prompt }) {
  const [shown, setShown] = useState('');
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(prompt.text);
      return;
    }
    const letters = Array.from(prompt.text);
    let index = 0;
    const timer = window.setInterval(() => {
      index += 2;
      setShown(letters.slice(0, index).join(''));
      if (index >= letters.length) clearInterval(timer);
    }, 26);
    return () => clearInterval(timer);
  }, [prompt]);
  return <div className={'mascot-bubble ' + (prompt.kind === 'stock' ? 'stock-alert' : '')}>
    {prompt.kind === 'stock' && <CircleAlert size={16} aria-hidden="true" />}
    <span aria-hidden="true">{shown}<i className={shown === prompt.text ? 'typed' : ''} /></span>
    <span id="mascot-preview-text" className="chat-sr">{prompt.text}</span>
  </div>;
}

export default function Chatbot({ ledger, demo, ask, go }) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState(null);
  const [messages, setMessages] = useState([]);
  const [pending, setPending] = useState(false);
  const [draft, setDraft] = useState('');
  const launcher = useRef(null);
  const closeButton = useRef(null);
  const transcript = useRef(null);
  const nextPrompt = useRef(0);
  const hover = useRef(false);
  const focus = useRef(false);
  const quietFocus = useRef(false);
  const sending = useRef(false);
  const lowCount = ledger.ingredients.filter(item => Number(item.quantity) <= Number(item.minimum)).length;

  useEffect(() => {
    if (!open) return;
    closeButton.current?.focus({ preventScroll: true });
  }, [open]);
  useEffect(() => {
    if (open && transcript.current) transcript.current.scrollTop = transcript.current.scrollHeight;
  }, [messages, pending, open]);

  const showBubble = () => {
    const scenarios = chatPrompts(chatContext(ledger));
    setPrompt({ ...scenarios[nextPrompt.current % scenarios.length], key: nextPrompt.current });
    nextPrompt.current += 1;
  };
  const close = (restoreFocus = true) => {
    setOpen(false);
    setPrompt(null);
    if (restoreFocus) {
      quietFocus.current = true;
      launcher.current?.focus({ preventScroll: true });
      quietFocus.current = false;
    }
  };
  const send = async (input, suggestedTopic) => {
    const question = input.trim();
    if (!question || sending.current) return;
    sending.current = true;
    setDraft('');
    setPending(true);
    const previous = messages.slice(-6).map(item => ({ role: item.role, text: item.text }));
    setMessages(current => [...current, { id: crypto.randomUUID(), role: 'user', text: question }]);
    let answer;
    try {
      answer = suggestedTopic || demo ? chatReply(suggestedTopic || chatTopic(question), chatContext(ledger)) : await ask(question, previous);
    } catch {
      answer = { text: 'Chat sedang tidak tersedia. Coba kirim lagi atau pilih salah satu pertanyaan cepat.' };
    }
    setMessages(current => [...current, { id: crypto.randomUUID(), role: 'model', ...answer }]);
    setPending(false);
    sending.current = false;
  };

  return <div className="maviq-chat" onKeyDown={event => {
    if (event.key !== 'Escape') return;
    if (open) {
      event.stopPropagation();
      close();
    } else setPrompt(null);
  }}>
    {!open && prompt && <TypingBubble key={prompt.key} prompt={prompt} />}
    {open && <section id="maviq-chat-panel" className="chat-panel" role="dialog" aria-label="Chat MAVIQ">
      <header className="chat-header">
        <span className="chat-header-avatar"><img src={avatar} alt="" width="44" height="44" /></span>
        <div><h2>Asisten MAVIQ</h2><p>{demo ? 'Data simulasi' : 'Stok, kas, dan penjualan'}</p></div>
        <button ref={closeButton} type="button" className="chat-icon-button" aria-label="Tutup chat" onClick={() => close()}><X size={20} /></button>
      </header>
      <div className="chat-transcript" ref={transcript} role="log" aria-label="Percakapan" aria-live="polite">
        <div className="chat-intro"><img src={avatar} alt="" width="92" height="74" /><strong>Halo! Saya MAVIQ.</strong>
          <p>Mau cek stok, penjualan hari ini, atau harga bahan pokok?</p></div>
        {messages.map(message => <div key={message.id} className={'chat-message ' + message.role}>
          <span className="chat-sr">{message.role === 'user' ? 'Anda: ' : 'MAVIQ: '}</span>
          {message.text}
          {actions[message.action] && <button type="button" className="chat-action" onClick={() => { go(message.action); close(); }}>{actions[message.action]} <ArrowRight size={14} /></button>}
        </div>)}
        {pending && <div className="chat-message model chat-pending" role="status"><span className="chat-sr">MAVIQ sedang mengetik</span><i /><i /><i /></div>}
      </div>
      <div className="chat-suggestions" aria-label="Pertanyaan cepat">{suggestions.map(([topic, label]) =>
        <button key={topic} type="button" disabled={pending} onClick={() => void send(label, topic)}>{label}</button>)}
      </div>
      <form className="chat-compose" onSubmit={event => { event.preventDefault(); void send(draft); }}>
        <input type="text" aria-label="Pesan untuk MAVIQ" placeholder="Tulis pesan…" maxLength={600} value={draft} onChange={event => setDraft(event.target.value)} />
        <button type="submit" className="chat-icon-button" aria-label="Kirim pesan" disabled={pending || !draft.trim()}><Send size={17} /></button>
      </form>
    </section>}
    <button ref={launcher} type="button" className="mascot-launcher" aria-label="Chat dengan MAVIQ" aria-expanded={open} aria-describedby={!open && prompt ? 'mascot-preview-text' : undefined} aria-controls={open ? 'maviq-chat-panel' : undefined}
      onPointerEnter={event => {
        if (open || event.pointerType === 'touch') return;
        hover.current = true;
        if (!focus.current) showBubble();
      }}
      onPointerLeave={() => {
        hover.current = false;
        if (!focus.current) setPrompt(null);
      }}
      onFocus={event => {
        if (quietFocus.current || open || !event.currentTarget.matches(':focus-visible')) return;
        focus.current = true;
        if (!hover.current) showBubble();
      }}
      onBlur={() => {
        focus.current = false;
        if (!hover.current) setPrompt(null);
      }}
      onClick={() => {
        focus.current = false;
        hover.current = false;
        setPrompt(null);
        if (open) close();
        else setOpen(true);
      }}>
      <img src={avatar} alt="" width="100" height="82" />
      {lowCount > 0 && !open && <span className="mascot-notification" aria-hidden="true">{lowCount > 9 ? '9+' : lowCount}</span>}
    </button>
  </div>;
}
