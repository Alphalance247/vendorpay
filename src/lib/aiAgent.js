const KNOWLEDGE_BASE = {
  greeting: [
    "Hello! I'm your VendorPay AI assistant. How can I help you today?",
    "Hi there! I'm here to help with your invoices, payments, or onboarding. What do you need?",
  ],
  payment_status: (invoices) => {
    const pending = invoices.filter(inv => inv.status === 'Awaiting Payment' || inv.status === 'InProgress');
    const paid = invoices.filter(inv => inv.status === 'Paid');
    if (pending.length === 0) {
      return `Good news! All your invoices are paid. You've received ${paid.length} payments.`;
    }
    return `You have ${pending.length} invoice(s) awaiting payment: ${pending.map(i => i.id).join(', ')}. These are being processed and should be disbursed within 5-7 business days.`;
  },
  invoice_status: (invoices, invoiceId) => {
    if (invoiceId) {
      const inv = invoices.find(i => i.id.toLowerCase() === invoiceId.toLowerCase());
      if (!inv) return `I couldn't find invoice ${invoiceId}. Please check the invoice number.`;
      return `Invoice ${inv.id} is currently **${inv.status}**. Amount: ${inv.amount} ${inv.currency}. ${inv.paymentDate !== '—' ? `Payment: ${inv.paymentDate}` : 'Payment pending approval.'}`;
    }
    const submitted = invoices.filter(i => i.status === 'Submitted');
    const reviewed = invoices.filter(i => i.status === 'InProgress' || i.status === 'Awaiting Payment');
    const paid = invoices.filter(i => i.status === 'Paid');
    return `You have ${invoices.length} total invoice(s): ${submitted.length} submitted, ${reviewed.length} under review, ${paid.length} paid.`;
  },
  onboarding_help: () => 
    "To complete your onboarding, please fill out: Company Information, Banking Details (select your country first), and Contact Information. If you uploaded an invoice, we can auto-extract your details!",
  bank_details: () => 
    "To update bank details, go to the Onboarding page. Select your country first to see the correct banking fields (ACH for US, NIP for Nigeria, SEPA for Europe, etc.).",
  payment_methods: () => 
    "We support ACH (US), Wire Transfer (international), SEPA (Europe), NIP (Nigeria), and other regional payment rails. Your available methods depend on your selected country.",
  tax_documents: () => 
    "Tax documents like 1099s are generated automatically at year-end. You can download them from the Payments page under 'Documents'.",
  escalation: () => 
    "I'm connecting you to a human agent. Average wait time: 3 minutes. Please hold...",
  default: () => 
    "I can help with: invoice status, payment tracking, onboarding steps, bank details, or payment methods. What would you like to know?",
};

function extractInvoiceId(text) {
  const match = text.match(/INV[-]?\d{4}[-]?\d{3,}/i);
  return match ? match[0] : null;
}

function detectIntent(text) {
  const lower = text.toLowerCase();
  
  if (lower.match(/hi|hello|hey|good morning|good afternoon/)) return 'greeting';
  if (lower.match(/payment|paid|disburse|money|when.*pay|where.*money/)) return 'payment_status';
  if (lower.match(/invoice|inv-|bill|submitted|status.*invoice/)) return 'invoice_status';
  if (lower.match(/onboard|setup|register|profile|complete.*account/)) return 'onboarding_help';
  if (lower.match(/bank|account.*number|routing|swift|iban|sort.*code/)) return 'bank_details';
  if (lower.match(/method|how.*pay|ach|wire|sepa|nip/)) return 'payment_methods';
  if (lower.match(/tax|1099|document|w-9|form/)) return 'tax_documents';
  if (lower.match(/human|agent|person|representative|talk.*someone/)) return 'escalation';
  
  return 'default';
}

export function getAIResponse(message, context = {}) {
  const intent = detectIntent(message);
  const invoiceId = extractInvoiceId(message);
  
  if (intent === 'greeting') {
    const options = KNOWLEDGE_BASE.greeting;
    return options[Math.floor(Math.random() * options.length)];
  }
  
  const responseFn = KNOWLEDGE_BASE[intent] || KNOWLEDGE_BASE.default;
  return responseFn(context.invoices || [], invoiceId);
}