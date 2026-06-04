import { createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

// PDF.js worker setup
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

function extractPattern(text, regex) {
  const match = text.match(regex);
  return match ? (match[1] || match[0]).trim() : null;
}

function detectCurrency(text) {
  const patterns = [
    { code: 'USD', pattern: /(?:USD|US\s*Dollar|\$[0-9])/i },
    { code: 'EUR', pattern: /(?:EUR|Euro|€[0-9])/i },
    { code: 'GBP', pattern: /(?:GBP|pounds?|£[0-9])/i },
    { code: 'CAD', pattern: /(?:CAD|Canadian\s*Dollar|C\$[0-9])/i },
    { code: 'KES', pattern: /(?:KES|KSh|Kenyan\s*Shilling)/i },
    { code: 'NGN', pattern: /(?:NGN|Naira|₦[0-9])/i },
    { code: 'ZAR', pattern: /(?:ZAR|Rand|R\s*[0-9,]+)/i },
    { code: 'GHS', pattern: /(?:GHS|Cedi|GH₵)/i },
    { code: 'UGX', pattern: /(?:UGX|Ugandan\s*Shilling|USh)/i },
    { code: 'TZS', pattern: /(?:TZS|Tanzanian\s*Shilling|TSh)/i },
    { code: 'RWF', pattern: /(?:RWF|Rwandan\s*Franc|FRw)/i },
    { code: 'ETB', pattern: /(?:ETB|Birr|Br\s*[0-9])/i },
    { code: 'XOF', pattern: /(?:XOF|West\s*African\s*CFA|CFA\s*[0-9])/i },
    { code: 'XAF', pattern: /(?:XAF|Central\s*African\s*CFA|FCFA)/i },
    { code: 'EGP', pattern: /(?:EGP|Egyptian\s*Pound|E£)/i },
    { code: 'MAD', pattern: /(?:MAD|Moroccan\s*Dirham|DH\s*[0-9])/i },
  ];
  
  for (const { code, pattern } of patterns) {
    if (pattern.test(text)) return code;
  }
  return 'USD';
}

function parseAmount(text) {
  const patterns = [
    /(?:total|amount|sum|due|balance)[:\s]*[$€£₦R]?\s*([0-9,]+\.?[0-9]{0,2})/i,
    /[$€£₦R]\s*([0-9,]+\.?[0-9]{0,2})/,
    /([0-9,]+\.?[0-9]{0,2})\s*(?:USD|EUR|GBP|KES|NGN|ZAR)/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const cleaned = match[1].replace(/,/g, '');
      const value = parseFloat(cleaned);
      if (Number.isFinite(value) && value > 0) return value;
    }
  }
  return null;
}

function parseDate(text) {
  const patterns = [
    /(?:invoice\s*date|date)[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/,
    /(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const parsed = new Date(match[1]);
      if (!isNaN(parsed)) return parsed.toISOString().slice(0, 10);
    }
  }
  return null;
}

function parseDueDate(text, invoiceDate) {
  const patterns = [
    /(?:due\s*date|payment\s*due)[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
    /(?:terms?[:\s]*net\s*(\d+))/i,
    /(?:pay\s*within\s*(\d+)\s*days)/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      if (match[1] && match[1].length <= 3) {
        const days = parseInt(match[1]);
        const base = invoiceDate ? new Date(invoiceDate) : new Date();
        base.setDate(base.getDate() + days);
        return base.toISOString().slice(0, 10);
      }
      const parsed = new Date(match[1]);
      if (!isNaN(parsed)) return parsed.toISOString().slice(0, 10);
    }
  }
  
  if (invoiceDate) {
    const d = new Date(invoiceDate);
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  }
  return null;
}

async function pdfToImages(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const images = [];
  
  for (let i = 1; i <= Math.min(pdf.numPages, 3); i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 });
    
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    
    await page.render({ canvasContext: ctx, viewport }).promise;
    images.push(canvas.toDataURL('image/png'));
  }
  
  return images;
}

export async function extractInvoiceData(file) {
  let text = '';
  
  try {
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      const images = await pdfToImages(file);
      const worker = await createWorker('eng');
      
      for (const image of images) {
        const result = await worker.recognize(image);
        text += result.data.text + '\n';
      }
      
      await worker.terminate();
    } else {
      const worker = await createWorker('eng');
      const result = await worker.recognize(file);
      text = result.data.text;
      await worker.terminate();
    }
  } catch (err) {
    console.error('OCR failed:', err);
    return null;
  }
  
  const currency = detectCurrency(text);
  const amount = parseAmount(text);
  const invoiceDate = parseDate(text);
  const dueDate = parseDueDate(text, invoiceDate);
  
  return {
    invoiceNumber: extractPattern(text, /(?:invoice\s*(?:#|number|no)|inv|ref)[:\s#]*([A-Z0-9\-\/]+)/i),
    companyName: extractPattern(text, /(?:from|vendor|seller)[:\s]*([A-Z][A-Za-z0-9\s&.,]+(?:LLC|Inc|Ltd|Corp)?)/i),
    taxId: extractPattern(text, /(?:tax\s*id|ein|vat|tin)[:\s#]*([A-Z0-9\-]+)/i),
    bankName: extractPattern(text, /(?:bank)[:\s]*([A-Z][A-Za-z\s]+(?:Bank|Trust))/i),
    accountNumber: extractPattern(text, /(?:account\s*(?:#|number)|acct\s*#)[:\s]*([0-9\-]+)/i),
    routingNumber: extractPattern(text, /(?:routing|aba)[:\s#]*([0-9\-]+)/i),
    swiftCode: extractPattern(text, /(?:swift|bic)[:\s#]*([A-Z0-9]{8,11})/i),
    iban: extractPattern(text, /iban[:\s#]*([A-Z0-9\s]{15,34})/i),
    currency,
    amount,
    invoiceDate,
    dueDate,
  };
}