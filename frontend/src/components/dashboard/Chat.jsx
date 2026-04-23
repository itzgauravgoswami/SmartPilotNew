import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Send, ArrowLeft, RefreshCw, MessageSquare, 
  TrendingUp, CheckSquare, Users, Receipt 
} from 'lucide-react';
import { api } from '../../utils/api';

export default function Chat({ onBack }) {
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: "Hi there! I am your Smart Pilot Autopilot Copilot. I'm fully synchronized with your workspace database.\n\nYou can ask me about:\n- **Sales Statistics**: Summary of invoices, unpaid balances, or total revenue.\n- **Customer Portfolio**: Top buyer segmentations, VIP clients, and balances.\n- **Catalog Rates**: Price lookups or catalog item listings.\n- **Task Checklists**: High-priority tasks, deadlines, or pending actions.\n\nChoose a quick suggestion below or type any question!" 
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [aiThinking, setAiThinking] = useState(false);
  const threadEndRef = useRef(null);

  // --- Scroll to Bottom ---
  const scrollToBottom = () => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, aiThinking]);

  // --- Load Local DB State for context-injection ---
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const loadContext = async () => {
      try {
        const [invData, custData, prodData, taskData] = await Promise.all([
          api.get('/invoices'),
          api.get('/customers'),
          api.get('/products'),
          api.get('/tasks')
        ]);
        setInvoices(invData);
        setCustomers(custData);
        setProducts(prodData);
        setTasks(taskData);
      } catch (err) {
        console.error("Failed to fetch dashboard context for AI chat", err);
      }
    };
    loadContext();
  }, []);

  const getDashboardContext = () => {
    try {
      // Create a simplified text representation of state to save token usage
      return {
        totalRevenue: invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + Number(i.grandTotal || 0), 0),
        outstandingBalance: invoices.filter(i => i.status === 'Unpaid').reduce((sum, i) => sum + Number(i.grandTotal || 0), 0),
        invoicesCount: invoices.length,
        invoicesList: invoices.map(i => ({ id: i.id || i._id, customerId: i.customerId, total: i.grandTotal, status: i.status, date: i.date })),
        customersList: customers.map(c => ({ id: c.id || c._id, name: c.name, business: c.business, segment: c.segment })),
        productsCatalog: products.map(p => ({ name: p.name, price: p.price, tax: p.tax, type: p.type })),
        pendingTasks: tasks.filter(t => t.status !== 'Completed' && !t.done).map(t => ({ text: t.text, priority: t.priority, deadline: t.deadline }))
      };
    } catch (e) {
      console.error("Failed to compile dashboard context", e);
      return {};
    }
  };

  // --- Send Message ---
  const handleSendMessage = async (textToSend) => {
    const text = textToSend || chatInput;
    if (!text.trim()) return;

    // Add user message to UI
    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setAiThinking(true);

    try {
      // Build past history (excluding previous system context injection to avoid loops)
      const cleanHistory = messages.slice(-6).map(m => ({
        role: m.role,
        content: m.content
      }));

      const data = await api.post('/ai/chat', { 
        message: text, 
        history: cleanHistory 
      });

      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (err) {
      console.error("AI Chat API failed:", err);
      const errorMsg = err.message || "Failed to reach AI assistant. Please check your connection.";
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ Error: ${errorMsg}` }]);
    } finally {
      setAiThinking(false);
    }
  };

  // --- Render Custom Markdown ---
  const formatMarkdown = (text) => {
    if (!text) return '';
    
    // Escape HTML to prevent injection
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Headings
    html = html.replace(/^### (.*$)/gim, '<h4 class="text-xs font-black text-zinc-900 dark:text-white mt-3 mb-1">$1</h4>');
    html = html.replace(/^## (.*$)/gim, '<h3 class="text-sm font-black text-zinc-900 dark:text-white mt-4 mb-2">$1</h3>');
    html = html.replace(/^# (.*$)/gim, '<h2 class="text-base font-black text-zinc-900 dark:text-white mt-5 mb-2.5">$1</h2>');

    // Bold (**text** or __text__)
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-extrabold text-zinc-950 dark:text-white">$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong class="font-extrabold text-zinc-950 dark:text-white">$1</strong>');

    // Italic (*text* or _text_)
    html = html.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');
    html = html.replace(/_(.*?)_/g, '<em class="italic">$1</em>');

    // Bullet Lists (lines starting with - or * or •)
    html = html.replace(/^\s*[-*•]\s+(.*)$/gm, '<li class="ml-4 list-disc my-0.5 text-zinc-600 dark:text-zinc-300">$1</li>');

    // Newlines conversion
    html = html.replace(/\n/g, '<br />');
    
    return <div dangerouslySetInnerHTML={{ __html: html }} className="space-y-0.5" />;
  };

  const suggestions = [
    { text: "Summarize my business statistics", icon: TrendingUp },
    { text: "List all pending high priority tasks", icon: CheckSquare },
    { text: "Who is my best customer by revenue?", icon: Users },
    { text: "Which product/service has generated the most sales?", icon: Receipt }
  ];

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-120px)] max-w-4xl mx-auto w-full">
      
      {/* Header controls */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/80 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 border border-zinc-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl transition-all cursor-pointer"
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <div className="text-left">
            <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest block font-sans">Business Copilot</span>
            <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-50 leading-tight">Gemini Business AI</h2>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[10px] font-black text-orange-500 uppercase tracking-wider bg-orange-500/10 px-3 py-1.5 rounded-full border border-orange-500/20">
          <Sparkles size={12} className="animate-pulse" />
          <span>Autopilot Context On</span>
        </div>
      </div>

      {/* Main chat layout */}
      <div className="flex-1 min-h-0 bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-900 rounded-[24px] shadow-2xs overflow-hidden flex flex-col justify-between">
        
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-[11px] font-semibold scrollbar-thin scrollbar-thumb-zinc-200 scrollbar-track-transparent">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-[18px] p-3.5 leading-relaxed shadow-3xs ${
                msg.role === 'user'
                  ? 'bg-orange-500 text-white rounded-tr-none text-right font-bold'
                  : 'bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800/50 text-zinc-800 dark:text-zinc-200 rounded-tl-none text-left'
              }`}>
                {msg.role !== 'user' && (
                  <div className="flex items-center gap-2 mb-1.5 border-b border-slate-100 dark:border-zinc-800/60 pb-1 text-[9px] font-black uppercase text-orange-500 tracking-wider">
                    <Sparkles size={11} className="animate-pulse" />
                    <span>Gemini Autopilot</span>
                  </div>
                )}
                {formatMarkdown(msg.content)}
              </div>
            </div>
          ))}
          {aiThinking && (
            <div className="flex justify-start">
              <div className="bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800/50 text-zinc-400 rounded-[18px] rounded-tl-none p-3 text-[11px] flex items-center gap-2 font-bold shadow-3xs">
                <RefreshCw className="animate-spin text-orange-500" size={12} />
                <span>Gemini is compiling dashboard analytics...</span>
              </div>
            </div>
          )}
          <div ref={threadEndRef} />
        </div>

        {/* Suggested Prompts Section */}
        {messages.length === 1 && (
          <div className="px-4 py-2 border-t border-zinc-150/60 dark:border-zinc-900 bg-slate-50/50 dark:bg-zinc-950/20 shrink-0">
            <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest block text-left mb-1.5">Suggested Questions</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(s.text)}
                  className="bg-white dark:bg-zinc-900 border border-[#e8ecf4] dark:border-zinc-800 text-zinc-700 dark:text-zinc-350 hover:text-orange-500 dark:hover:text-zinc-100 hover:border-orange-500/30 p-1.5 px-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer shadow-3xs text-left"
                >
                  <div className="w-5.5 h-5.5 rounded-md bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
                    <s.icon size={11} />
                  </div>
                  <span className="text-[10px] font-black line-clamp-1 leading-tight">{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input box */}
        <div className="p-3 border-t border-zinc-150/60 dark:border-zinc-900 bg-white dark:bg-zinc-950 shrink-0">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            className="flex items-center gap-2.5 bg-slate-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/80 px-3.5 py-1.5 rounded-xl shadow-3xs focus-within:border-orange-500/50"
          >
            <input
              type="text"
              placeholder="Ask anything about invoices, customers, tasks, or rates..."
              value={chatInput}
              disabled={aiThinking}
              onChange={(e) => setChatInput(e.target.value)}
              className="bg-transparent border-none outline-none focus:ring-0 text-[11px] w-full text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 disabled:opacity-50"
            />
            <button 
              type="submit" 
              disabled={aiThinking}
              className="p-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg transition-all cursor-pointer shadow-md shadow-orange-500/25 flex items-center justify-center shrink-0"
            >
              <Send size={12} />
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
