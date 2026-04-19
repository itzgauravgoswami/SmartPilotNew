const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { protect } = require('../middleware/auth');
const Task = require('../models/Task');
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const Product = require('../models/Product');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Rate limiting per user (in-memory simple counter)
const userRequestCounts = new Map();

function checkRateLimit(userId, limit = 20) {
  const key = `${userId}_${new Date().toDateString()}`;
  const count = userRequestCounts.get(key) || 0;
  if (count >= limit) return false;
  userRequestCounts.set(key, count + 1);
  return true;
}

const SYSTEM_PROMPT = `You are an AI assistant integrated into Smart Pilot — an AI-powered autopilot dashboard, invoicing maker, and business management suite.

Your role is to:
- Help the user with placement/career preparation (DSA, System Design, HR questions, resume tips) when asked.
- Provide business insights, summarize customer lists, analyze catalog products, check invoice statistics, and list pending tasks using the live context details provided in the prompt.
- Present calculations (sales, revenue, average rates) in clean markdown formats, tables, or bullet lists.
- Be supportive, professional, encouraging, and highly analytical.`;

/**
 * POST /api/ai/chat
 * Gemini Pro chat completion
 */
router.post('/chat', protect, async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'Message is required.' });
    }
    if (message.length > 5000) {
      return res.status(400).json({ message: 'Message too long. Maximum 5000 characters.' });
    }

    // Rate limit: 20 requests per day for Starter, 100 for Premium
    const dailyLimit = req.user.plan === 'Starter' ? 20 : 100;
    if (!checkRateLimit(String(req.user._id), dailyLimit)) {
      return res.status(429).json({
        message: `Daily AI request limit reached (${dailyLimit}/day). Upgrade your plan for more.`,
      });
    }

    // Fetch user's data for live context
    const [tasks, invoices, customers, products] = await Promise.all([
      Task.find({ userId: req.user._id }),
      Invoice.find({ userId: req.user._id }),
      Customer.find({ userId: req.user._id }),
      Product.find({ userId: req.user._id }),
    ]);

    // Format tasks info
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.done).length;
    const pendingTasks = totalTasks - completedTasks;
    const taskDetails = tasks.map(t => `- ${t.text} (${t.status || 'To Do'}${t.priority ? `, Priority: ${t.priority}` : ''})`).join('\n');

    // Format invoices info
    const totalInvoices = invoices.length;
    const paidInvoices = invoices.filter(i => i.status === 'Paid');
    const unpaidInvoices = invoices.filter(i => i.status === 'Unpaid' || i.status === 'Overdue');
    const totalSales = paidInvoices.reduce((sum, i) => sum + (Number(i.grandTotal) || 0), 0);
    const totalPending = unpaidInvoices.reduce((sum, i) => sum + (Number(i.grandTotal) || 0), 0);
    const invoiceDetails = invoices.map(i => `- Invoice #${i.invoiceNo || i._id}: ₹${(Number(i.grandTotal) || 0).toLocaleString('en-IN')} (Status: ${i.status}, Due Date: ${i.dueDate})`).join('\n');

    // Format customers info
    const totalCustomers = customers.length;
    const customerDetails = customers.map(c => `- ${c.name} (${c.business || 'Individual'}, Email: ${c.email || 'N/A'})`).join('\n');

    // Format products info
    const totalProducts = products.length;
    const productDetails = products.map(p => `- ${p.name} (Type: ${p.type}, Price: ₹${(Number(p.price) || 0).toLocaleString('en-IN')})`).join('\n');

    const liveContextPrompt = `
You must use the following live context details of user "${req.user.name}" (email: "${req.user.email}") to answer any business queries, analyze sales, list tasks, or write drafts:

LIVE USER BUSINESS STATISTICS:
INVOICES & FINANCIALS:
- Total Sales Revenue (Paid Invoices): ₹${totalSales.toLocaleString('en-IN')}
- Total Outstanding/Unpaid Amount: ₹${totalPending.toLocaleString('en-IN')}
- Total Invoice Count: ${totalInvoices}
- Paid Invoices Count: ${paidInvoices.length}
- Unpaid/Pending Invoices Count: ${unpaidInvoices.length}
- Invoices List:
${invoiceDetails || 'No invoices created yet.'}

TASKS & WORKLOAD:
- Total Tasks Count: ${totalTasks}
- Completed Tasks Count: ${completedTasks}
- Pending/Active Tasks Count: ${pendingTasks}
- Tasks List:
${taskDetails || 'No tasks added yet.'}

CUSTOMERS:
- Total Customers: ${totalCustomers}
- Customers List:
${customerDetails || 'No customers registered yet.'}

PRODUCT & SERVICE CATALOG:
- Total Catalog Items: ${totalProducts}
- Catalog Items:
${productDetails || 'No products/services in catalog.'}
`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_PROMPT + "\n\n" + liveContextPrompt,
    });

    // Build chat history in Gemini format
    // Gemini startChat history MUST start with 'user' and alternate strictly: user -> model -> user -> model.
    let geminiHistory = [];
    let expectedRole = 'user';
    for (const h of history) {
      if (!h.role || !h.content) continue;
      const role = h.role === 'assistant' ? 'model' : 'user';
      if (role === expectedRole) {
        geminiHistory.push({
          role,
          parts: [{ text: h.content }],
        });
        expectedRole = expectedRole === 'user' ? 'model' : 'user';
      }
    }

    const chat = model.startChat({ history: geminiHistory });
    const result = await chat.sendMessage(message);
    const response = result.response.text();

    res.json({
      response,
      model: 'gemini-2.5-flash',
    });
  } catch (err) {
    console.error('[ai/chat]', err);
    res.status(500).json({ 
      message: err.message || 'AI service temporarily unavailable. Please try again.',
    });
  }
});

module.exports = router;
