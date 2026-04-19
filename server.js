require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fs = require('fs/promises');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const MODEL_ID = process.env.MODEL_ID || 'gemini-3-flash-preview';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const S3_BUCKET = process.env.S3_BUCKET;
const PROMPT = "Using only the applicant data below, provide exactly 15 college matches. Output a plain numbered list with each school name followed by one concise reason. Do NOT include any internal analysis, thought process, or metadata. Keep the response strictly the text of the matches and reasons.";

if (!GOOGLE_API_KEY) {
  throw new Error('Missing GOOGLE_API_KEY environment variable. Set it before starting the server.');
}

if (!S3_BUCKET) {
  throw new Error('Missing S3_BUCKET environment variable. Set it before starting the server.');
}

const s3Client = new S3Client({ region: AWS_REGION });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});
app.use(express.static(path.join(__dirname)));

app.post('/api/google-genai-query', upload.single('pdf'), async (req, res) => {
  const prompt = req.body?.prompt || PROMPT;
  const formDataText = req.body?.formData;
  const bodyParts = [
    { text: prompt }
  ];

  if (!req.file && !formDataText) {
    return res.status(400).json({
      error: 'Request must include either a PDF upload or form data from index.html before running a GenAI query.'
    });
  }

  try {
    if (req.file) {
      const pdfKey = `uploads/${Date.now()}-${req.file.originalname}`;
      const pdfBase64 = req.file.buffer.toString('base64');

      const s3Command = new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: pdfKey,
        Body: req.file.buffer,
        ContentType: 'application/pdf'
      });

      await s3Client.send(s3Command);

      bodyParts.push({
        file: {
          mimeType: 'application/pdf',
          data: pdfBase64
        }
      });
    } else if (formDataText) {
      bodyParts.push({
        text: `Form submission data:\n${formDataText}`
      });
    }

    const body = {
      contents: [
        {
          parts: bodyParts
        }
      ]
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': GOOGLE_API_KEY
        },
        body: JSON.stringify(body)
      }
    );

    const json = await response.json();

    function getTextFromContent(content) {
      if (!content) return null;
      if (Array.isArray(content)) {
        for (const item of content) {
          if (typeof item?.text === 'string') return item.text;
          if (Array.isArray(item?.parts) && typeof item.parts[0]?.text === 'string') return item.parts[0].text;
        }
        return null;
      }
      if (typeof content.text === 'string') return content.text;
      if (Array.isArray(content.parts) && typeof content.parts[0]?.text === 'string') return content.parts[0].text;
      return null;
    }

    function getTextFromOutput(outputItem) {
      if (!outputItem) return null;
      return getTextFromContent(outputItem.content) || getTextFromContent(outputItem.content?.[0]);
    }

    function getTextFromCandidate(candidateItem) {
      if (!candidateItem) return null;
      return getTextFromContent(candidateItem.content) || getTextFromContent(candidateItem.content?.[0]);
    }

    let candidateText =
      getTextFromOutput(json.output?.[0]) ||
      getTextFromCandidate(json.candidates?.[0]) ||
      JSON.stringify(json, null, 2);

    if (typeof candidateText === 'string' && candidateText.trim().startsWith('{') && candidateText.includes('"candidates"')) {
      try {
        const parsedCandidateJson = JSON.parse(candidateText);
        const nestedText =
          getTextFromOutput(parsedCandidateJson.output?.[0]) ||
          getTextFromCandidate(parsedCandidateJson.candidates?.[0]);
        if (typeof nestedText === 'string' && nestedText.trim()) {
          console.log('Parsed nested candidateText from JSON string.');
          candidateText = nestedText;
        }
      } catch (parseError) {
        // ignore invalid JSON fallback
      }
    }

    const candidateHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>GenAI Results</title>
    <style>
      body { font-family: system-ui, sans-serif; padding: 24px; margin: 0; background: #f8fafc; color: #111827; }
      .results { max-width: 940px; margin: 0 auto; display: grid; gap: 20px; }
      h1 { margin-top: 0; font-size: 2rem; letter-spacing: -0.03em; }
      h2 { margin: 1.8rem 0 0.75rem; font-size: 1.25rem; }
      p { margin: 0.85rem 0; line-height: 1.75; }
      a { color: #2563eb; text-decoration: none; }
      a:hover { text-decoration: underline; }
      ul, ol { margin: 0.7rem 0 1.25rem 1.25rem; }
      li { margin: 0.35rem 0; }
      strong { color: #0f172a; }
      .summary { padding: 18px 20px; background: white; border: 1px solid #dbeafe; border-radius: 20px; box-shadow: 0 12px 24px rgba(15, 23, 42, 0.05); }
      .result-list { display: grid; gap: 18px; }
      .result-card { background: white; border-radius: 24px; border: 1px solid #cbd5e1; box-shadow: 0 20px 40px rgba(15, 23, 42, 0.06); padding: 22px; display: grid; gap: 14px; position: relative; overflow: hidden; }
      .card-overlay { position: absolute; top: 18px; right: 18px; background: rgba(59, 130, 246, 0.14); color: #1d4ed8; padding: 6px 12px; border-radius: 999px; font-size: 0.82rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
      .result-card h2 { margin: 0; font-size: 1.25rem; }
      .result-card p { margin: 0; }
      .result-details { display: grid; gap: 10px; }
      .result-details li { margin-left: 1rem; margin-bottom: 0.5rem; list-style: disc inside; }
      .result-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
      .result-card:hover { transform: translateY(-3px); box-shadow: 0 28px 60px rgba(15, 23, 42, 0.14); }
      .edu-link { color: #2563eb; font-weight: 600; text-decoration: none; }
      .edu-link:hover { text-decoration: underline; }
    </style>
  </head>
  <body>
    <div class="results">
      <h1>GenAI Match Results</h1>
      <div class="summary">This result is generated from applicant form data and provides 15 recommended colleges/universities with reach, target, and safety classifications.</div>
      ${formatCandidateTextAsHtml(candidateText)}
    </div>
  </body>
</html>`;

    res.json({
      candidateText,
      candidateHtml,
      raw: json
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function linkify(text) {
  return String(text).replace(/(https?:\/\/[^\s"'<>]+\.edu[^\s"'<>]*)|(\b[A-Za-z0-9.-]+\.edu\b)/gi, (match) => {
    const trimmed = match.replace(/[.,;:?!]$/g, '');
    const url = trimmed.toLowerCase().startsWith('http') ? trimmed : `https://${trimmed}`;
    return `<a class="edu-link" href="${escapeHtml(url)}" target="_blank" rel="noreferrer noopener">${escapeHtml(trimmed)}</a>`;
  });
}

function formatCandidateTextAsHtml(text) {
  function safeSchoolTitle(rawTitle) {
    return String(rawTitle || '')
      .replace(/^\s*\d+[\.)]\s*/i, '')
      .replace(/\s*\((reach|target|safety)\)\s*$/i, '')
      .replace(/\s*[:\-–—]\s*$/, '')
      .trim();
  }

  function buildEduHref(schoolName) {
    const clean = safeSchoolTitle(schoolName)
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return clean ? `https://${clean}.edu` : '#';
  }

  function parseItems(rawText) {
    const lines = String(rawText || '')
      .replace(/\r/g, '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const items = [];
    let current = null;

    const flushCurrent = () => {
      if (current) {
        items.push(current);
        current = null;
      }
    };

    const isMetadataLine = (line) => /^(thought(?:signature)?|analysis|reasoning|assistant(?: reasoning)?|final|summary|plan|comment)\b[:\-\s]/i.test(line);

    lines.forEach((line) => {
      const itemMatch = line.match(/^(\d+)\s*[\.)]\s*(.*)$/);
      if (itemMatch) {
        flushCurrent();
        const titlePart = itemMatch[2].trim();
        const partMatch = titlePart.match(/^(.+?)(?:[:\-–—]\s*(.+))?$/);
        const title = partMatch ? partMatch[1].trim() : titlePart;
        const reason = partMatch && partMatch[2] ? partMatch[2].trim() : '';
        current = { title, body: reason ? [reason] : [] };
        return;
      }

      if (isMetadataLine(line)) {
        return;
      }

      if (!current) {
        const partMatch = line.match(/^(.+?)(?:[:\-–—]\s*(.+))?$/);
        const title = partMatch ? partMatch[1].trim() : line;
        const reason = partMatch && partMatch[2] ? partMatch[2].trim() : '';
        current = { title, body: reason ? [reason] : [] };
        return;
      }

      if (/^[\-*•]\s+/.test(line)) {
        current.body.push(line.replace(/^[\-*•]\s+/, '').trim());
        return;
      }

      if (line.length > 0) {
        current.body.push(line);
      }
    });

    flushCurrent();
    return items.slice(0, 15).map((item) => ({
      title: safeSchoolTitle(item.title),
      body: item.body
        .map((line) => line.replace(/^(because|since|for|as)\s+/i, '').trim())
        .filter(Boolean)
    }));
  }

  const items = parseItems(text);
  if (!items.length) {
    const bodyHtml = escapeHtml(String(text || 'No results returned.')).replace(/\n+/g, '<br />');
    return `<section class="result-card"><p>${bodyHtml}</p></section>`;
  }

  const cards = items.map((item) => {
    const href = buildEduHref(item.title);
    const reasonHtml = item.body.length
      ? item.body.map((line) => `<p>${escapeHtml(line)}</p>`).join('')
      : '<p>No reasoning provided.</p>';

    return `
      <section class="result-card">
        <h2><a class="edu-link" href="${escapeHtml(href)}" target="_blank" rel="noreferrer noopener">${escapeHtml(item.title)}</a></h2>
        <div class="result-reason">${reasonHtml}</div>
      </section>`;
  });

  return `<div class="results-container">
      <div class="results-summary">15 school matches are shown below. Each name links to a .edu-style URL and is followed only by the short reasoning text.</div>
      ${cards.join('')}
    </div>`;
}

app.post('/api/save-preview-page', async (req, res) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `preview-${timestamp}.html`;
    const key = `match-res-previews/${fileName}`;

    const sourceContent = await fs.readFile(path.join(__dirname, 'preview.html'), 'utf8');

    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: sourceContent,
      ContentType: 'text/html'
    });

    await s3Client.send(command);

    res.json({ success: true, file: fileName, folder: 'match-res-previews', bucket: S3_BUCKET });
  } catch (error) {
    console.error('Unable to save preview page to S3:', error);
    res.status(500).json({ error: error.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
