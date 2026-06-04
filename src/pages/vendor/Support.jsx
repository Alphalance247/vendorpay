import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function Support() {
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hi! I\'m your VendorPay assistant. Ask me about your invoices or payments.' }
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function sendMessage() {
    if (!input.trim()) return;

    setMessages(prev => [...prev, { role: 'user', text: input }]);
    setInput('');

    setTimeout(() => {
      const responses = [
        'I can see your invoice is under review. It should be approved within 2 business days.',
        'Your payment is scheduled for next Tuesday. You\'ll receive an email confirmation.',
        'For updating bank details, please go to the Onboarding page and edit your banking information.',
        'I\'m not sure about that. Let me connect you with a human agent.',
      ];
      const random = responses[Math.floor(Math.random() * responses.length)];
      setMessages(prev => [...prev, { role: 'ai', text: random }]);
    }, 1000);
  }

  return (
    <AppLayout role="vendor">
      <div className="h-[calc(100vh-100px)] p-6">
        <h1 className="text-2xl font-semibold text-on-surface mb-4">Support</h1>

        <Card className="h-full flex flex-col p-0 overflow-hidden">
          {/* Chat header */}
          <div className="px-4 py-3 border-b border-outline-variant bg-emerald/5">
            <div className="flex items-center gap-2">
              <Bot size={18} className="text-emerald" />
              <span className="text-sm font-semibold text-on-surface">AI Assistant</span>
              <span className="text-xs text-emerald bg-emerald/10 px-2 py-0.5 rounded-full">Online</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'ai' ? 'bg-emerald/10' : 'bg-navy'}`}>
                  {msg.role === 'ai' ? <Bot size={14} className="text-emerald" /> : <User size={14} className="text-white" />}
                </div>
                <div className={`max-w-[70%] rounded-lg p-3 text-sm ${msg.role === 'ai' ? 'bg-surface-container text-on-surface' : 'bg-navy text-white'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-outline-variant flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask about your invoice, payment, or account..."
              className="flex-1 rounded border border-outline-variant px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald"
            />
            <Button onClick={sendMessage} className="p-2">
              <Send size={16} />
            </Button>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}