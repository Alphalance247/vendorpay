import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Bot, User, Plus, MessageSquare, ChevronRight, X, CheckCircle, Clock, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { formatDate, extractErrorMessage } from '../../lib/utils';
import { supportService } from '../../lib/services/supportService';

const STATUS_STYLES = {
  open:        { label: 'Open',        className: 'bg-amber-100 text-amber-700', Icon: Clock },
  in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-700',  Icon: AlertCircle },
  closed:      { label: 'Closed',      className: 'bg-surface-container text-on-surface-variant', Icon: CheckCircle },
};

function TicketBadge({ status }) {
  const { label, className, Icon } = STATUS_STYLES[status] ?? STATUS_STYLES.open;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
      <Icon size={10} /> {label}
    </span>
  );
}

// ── Ticket Thread ─────────────────────────────────────────────────────────────

function TicketThread({ ticketId, isAdmin, onBack }) {
  const [ticket, setTicket]   = useState(null);
  const [replyText, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError]     = useState('');
  const bottomRef = useRef(null);

  const load = useCallback(() => {
    supportService.getTicket(ticketId).then((data) => {
      setTicket((prev) => {
        if (!prev) return data;
        // Only update if message count changed — avoids re-render on unchanged data
        if (prev.messages.length === data.messages.length && prev.status === data.status) return prev;
        return data;
      });
    }).catch(() => {});
  }, [ticketId]);

  useEffect(() => { load(); }, [load]);

  // Poll for new messages every 5 seconds while the thread is open
  useEffect(() => {
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [ticket?.messages]);

  async function sendReply() {
    if (!replyText.trim()) return;
    setSending(true);
    setError('');
    try {
      const msg = await supportService.reply(ticketId, replyText.trim());
      setReply('');
      setTicket((prev) => prev ? { ...prev, messages: [...prev.messages, msg], status: prev.status === 'open' ? 'in_progress' : prev.status } : prev);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSending(false);
    }
  }

  async function toggleClose() {
    if (!ticket) return;
    try {
      if (ticket.status === 'closed') {
        await supportService.reopenTicket(ticketId);
        setTicket((t) => t ? { ...t, status: 'open' } : t);
      } else {
        await supportService.closeTicket(ticketId);
        setTicket((t) => t ? { ...t, status: 'closed' } : t);
      }
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  if (!ticket) return <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-emerald" /></div>;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant bg-surface-low">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1 rounded hover:bg-surface-container text-on-surface-variant">
            <X size={16} />
          </button>
          <div>
            <p className="text-sm font-semibold text-on-surface">{ticket.subject}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <TicketBadge status={ticket.status} />
              {ticket.vendor_name && (
                <span className="text-xs text-on-surface-variant">{ticket.vendor_name}</span>
              )}
            </div>
          </div>
        </div>
        {isAdmin && (
          <Button
            variant={ticket.status === 'closed' ? 'outline' : 'ghost'}
            size="sm"
            onClick={toggleClose}
          >
            {ticket.status === 'closed' ? 'Reopen' : 'Close Ticket'}
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {ticket.messages.map((msg) => {
          const isOwnMessage = isAdmin ? msg.sender_role === 'admin' : msg.sender_role === 'vendor';
          return (
            <div key={msg.id} className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                msg.sender_role === 'admin' ? 'bg-navy text-white' : 'bg-emerald/10 text-emerald'
              }`}>
                {msg.sender_name.charAt(0).toUpperCase()}
              </div>
              <div className={`max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                <span className="text-[10px] text-on-surface-variant px-1">
                  {msg.sender_name} · {formatDate(msg.created_at)}
                </span>
                <div className={`rounded-lg px-3 py-2 text-sm leading-relaxed ${
                  isOwnMessage ? 'bg-navy text-white' : 'bg-surface-container text-on-surface'
                }`}>
                  {msg.body}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {error && <p className="px-4 pb-2 text-xs text-error">{error}</p>}

      {ticket.status !== 'closed' ? (
        <div className="px-4 py-3 border-t border-outline-variant flex gap-2">
          <textarea
            value={replyText}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
            placeholder="Type a reply... (Enter to send, Shift+Enter for newline)"
            rows={2}
            className="flex-1 rounded border border-outline-variant px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald"
          />
          <Button onClick={sendReply} disabled={sending || !replyText.trim()} className="self-end p-2">
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </Button>
        </div>
      ) : (
        <p className="px-4 py-3 border-t border-outline-variant text-xs text-center text-on-surface-variant">
          This ticket is closed.{isAdmin ? ' Reopen it to reply.' : ''}
        </p>
      )}
    </div>
  );
}

// ── Ticket List ───────────────────────────────────────────────────────────────

function TicketList({ tickets, onSelect, onNew, isAdmin }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
        <h3 className="text-sm font-semibold text-on-surface">
          {isAdmin ? 'All Support Tickets' : 'My Tickets'}
        </h3>
        {!isAdmin && (
          <Button size="sm" onClick={onNew}>
            <Plus size={14} className="mr-1" /> New Ticket
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-outline-variant">
        {tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <MessageSquare size={32} className="text-outline mb-3" />
            <p className="text-sm font-medium text-on-surface">No tickets yet</p>
            {!isAdmin && <p className="text-xs text-on-surface-variant mt-1">Raise a support ticket and our team will respond.</p>}
          </div>
        ) : tickets.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            className="w-full text-left px-4 py-3 hover:bg-surface-low/60 transition-colors flex items-start justify-between gap-3"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-on-surface truncate">{t.subject}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <TicketBadge status={t.status} />
                {isAdmin && t.vendor_name && (
                  <span className="text-xs text-on-surface-variant">{t.vendor_name}</span>
                )}
                <span className="text-xs text-outline">{t.message_count} message{t.message_count !== 1 ? 's' : ''}</span>
                <span className="text-xs text-outline">{formatDate(t.updated_at)}</span>
              </div>
            </div>
            <ChevronRight size={14} className="text-outline flex-shrink-0 mt-1" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ── New Ticket Form ────────────────────────────────────────────────────────────

function NewTicketForm({ onSubmit, onCancel }) {
  const [subject, setSubject] = useState('');
  const [body, setBody]       = useState('');
  const [submitting, setSub]  = useState(false);
  const [error, setError]     = useState('');

  async function handleSubmit() {
    if (!subject.trim() || !body.trim()) { setError('Subject and message are required.'); return; }
    setSub(true);
    setError('');
    try {
      await onSubmit({ subject: subject.trim(), body: body.trim() });
    } catch (err) {
      setError(extractErrorMessage(err));
      setSub(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
        <h3 className="text-sm font-semibold text-on-surface">New Support Ticket</h3>
        <button onClick={onCancel} className="p-1 rounded hover:bg-surface-container text-on-surface-variant">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 p-4 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1">Subject</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Brief description of your issue"
            className="w-full rounded border border-outline-variant px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1">Message</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Describe your issue in detail..."
            rows={6}
            className="w-full rounded border border-outline-variant px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald"
          />
        </div>
        {error && <p className="text-xs text-error">{error}</p>}
      </div>

      <div className="px-4 py-3 border-t border-outline-variant flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={handleSubmit} disabled={submitting}>
          {submitting ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
          Submit Ticket
        </Button>
      </div>
    </div>
  );
}

// ── AI Chat Tab ────────────────────────────────────────────────────────────────

const GREETING = { role: 'assistant', content: "Hi! I'm your VendorPay assistant. Ask me about your invoices, payments, onboarding, or anything else." };
const MAX_STORED = 100; // cap stored messages so localStorage doesn't grow unbounded

function getChatKey() {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) return 'ai_chat_history_guest';
    const payload = JSON.parse(atob(token.split('.')[1]));
    return `ai_chat_history_${payload.sub ?? 'unknown'}`;
  } catch {
    return 'ai_chat_history_guest';
  }
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(getChatKey());
    if (!raw) return [GREETING];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [GREETING];
  } catch {
    return [GREETING];
  }
}

function saveHistory(msgs) {
  try {
    // Always keep the greeting + last MAX_STORED-1 conversation messages
    const toStore = [GREETING, ...msgs.slice(1).slice(-(MAX_STORED - 1))];
    localStorage.setItem(getChatKey(), JSON.stringify(toStore));
  } catch { /* quota errors are non-fatal */ }
}

function AiChat() {
  const [messages, setMessages] = useState(loadHistory);
  const [input, setInput]   = useState('');
  const [loading, setLoad]  = useState(false);
  const bottomRef = useRef(null);

  // Persist to localStorage whenever messages change
  useEffect(() => { saveHistory(messages); }, [messages]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  function clearHistory() {
    localStorage.removeItem(getChatKey());
    setMessages([GREETING]);
  }

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoad(true);

    try {
      // Send the full stored history (minus the greeting) as context
      const history = [...messages.slice(1), userMsg].map((m) => ({ role: m.role, content: m.content }));
      const reply = await supportService.chat(history);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: "I'm having trouble connecting right now. Please try again or raise a support ticket." }]);
    } finally {
      setLoad(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-outline-variant bg-emerald/5 flex items-center gap-2">
        <Bot size={16} className="text-emerald" />
        <span className="text-sm font-semibold text-on-surface">AI Assistant</span>
        <span className="text-xs text-emerald bg-emerald/10 px-2 py-0.5 rounded-full ml-1">Online</span>
        <span className="text-xs text-on-surface-variant ml-auto">
          {messages.length > 1 ? `${messages.length - 1} message${messages.length > 2 ? 's' : ''}` : 'New conversation'}
        </span>
        {messages.length > 1 && (
          <button
            onClick={clearHistory}
            title="Clear chat history"
            className="p-1 rounded text-on-surface-variant hover:text-error hover:bg-red-50 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'assistant' ? 'bg-emerald/10' : 'bg-navy'}`}>
              {msg.role === 'assistant' ? <Bot size={14} className="text-emerald" /> : <User size={14} className="text-white" />}
            </div>
            <div className={`max-w-[72%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
              msg.role === 'assistant' ? 'bg-surface-container text-on-surface' : 'bg-navy text-white'
            }`}>
              {msg.content.split('\n').filter(l => l.trim()).map((para, j) => (
                <p key={j} className={j > 0 ? 'mt-2' : ''}>{para}</p>
              ))}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald/10 flex items-center justify-center flex-shrink-0">
              <Bot size={14} className="text-emerald" />
            </div>
            <div className="bg-surface-container rounded-lg px-3 py-2">
              <Loader2 size={14} className="animate-spin text-emerald" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 border-t border-outline-variant flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Ask about your invoice, payment, or account..."
          disabled={loading}
          className="flex-1 rounded border border-outline-variant px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald disabled:opacity-50"
        />
        <Button onClick={send} disabled={loading || !input.trim()} className="p-2">
          <Send size={16} />
        </Button>
      </div>
    </div>
  );
}

// ── Main Export ────────────────────────────────────────────────────────────────

export default function Support({ admin = false }) {
  const role = admin ? 'admin' : 'vendor';

  const [tab, setTab]           = useState(admin ? 'tickets' : 'ai');
  const [tickets, setTickets]   = useState([]);
  const [loadingTickets, setLT] = useState(false);
  const [activeTicket, setAT]   = useState(null);   // ticket id being viewed
  const [newForm, setNewForm]   = useState(false);

  const loadTickets = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLT(true);
    try {
      const data = admin ? await supportService.getAllTickets() : await supportService.getMyTickets();
      setTickets((prev) => {
        const next = data ?? [];
        // Skip re-render when length and latest update timestamp are unchanged
        if (prev.length === next.length && prev[0]?.updated_at === next[0]?.updated_at) return prev;
        return next;
      });
    } catch { /* ignore */ }
    finally { if (showSpinner) setLT(false); }
  }, [admin]);

  useEffect(() => {
    if (tab === 'tickets' || admin) loadTickets();
  }, [tab, admin, loadTickets]);

  // Poll ticket list every 5 seconds while on the list view (not inside a thread)
  useEffect(() => {
    if ((tab !== 'tickets' && !admin) || activeTicket) return;
    const timer = setInterval(() => loadTickets(false), 5000);
    return () => clearInterval(timer);
  }, [tab, admin, activeTicket, loadTickets]);

  // When returning from a thread, refresh list
  function handleBack() {
    setAT(null);
    loadTickets();
  }

  async function handleNewTicket(payload) {
    const ticket = await supportService.createTicket(payload);
    setNewForm(false);
    loadTickets();
    setAT(ticket.id);
    setTab('tickets');
  }

  const TABS = admin
    ? [{ key: 'tickets', label: 'Support Tickets' }]
    : [
        { key: 'ai',      label: 'AI Assistant' },
        { key: 'tickets', label: 'My Tickets'   },
      ];

  return (
    <AppLayout role={role}>
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-on-surface">
          {admin ? 'Vendor Support' : 'Support'}
        </h1>

        {/* Tab bar */}
        {TABS.length > 1 && (
          <div className="flex gap-1 border-b border-outline-variant">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setTab(key); setAT(null); setNewForm(false); }}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  tab === key
                    ? 'border-emerald text-emerald'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <Card className="p-0 overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
          {tab === 'ai' && <AiChat />}

          {tab === 'tickets' && (
            activeTicket ? (
              <TicketThread ticketId={activeTicket} isAdmin={admin} onBack={handleBack} />
            ) : newForm ? (
              <NewTicketForm onSubmit={handleNewTicket} onCancel={() => setNewForm(false)} />
            ) : loadingTickets ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={24} className="animate-spin text-emerald" />
              </div>
            ) : (
              <TicketList
                tickets={tickets}
                onSelect={setAT}
                onNew={() => setNewForm(true)}
                isAdmin={admin}
              />
            )
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
