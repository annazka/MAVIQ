import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { applyCommand, briefingPoints, emptyLedger, summarize } from '../lib/ledger.js';

const bucket = 'maviq-private-receipts';
const limit = 10 * 1024 * 1024;
const select = 'revision,ledger';
const validPath = (path, owner) => typeof path === 'string' && path.startsWith(owner + '/') && /^[\w-]+\/[\w-]+\.(png|jpg)$/.test(path);

async function receiptFile(db, path, owner) {
  if (!validPath(path, owner)) throw new Error('Lokasi struk tidak valid.');
  const { data, error } = await db.storage.from(bucket).download(path);
  if (error || !data || data.size > limit) throw new Error('Struk tidak tersedia atau melampaui 10 MB.');
  const buffer = Buffer.from(await data.arrayBuffer());
  const png = buffer.subarray(0, 8).toString('hex') === '89504e470d0a1a0a';
  const jpg = buffer.subarray(0, 3).toString('hex') === 'ffd8ff';
  if (!((png && path.endsWith('.png')) || (jpg && path.endsWith('.jpg')))) throw new Error('Unggah foto JPEG atau PNG yang valid.');
  return buffer;
}

async function scanReceipt(buffer, path) {
  const { VERYFI_CLIENT_ID, VERYFI_USERNAME, VERYFI_API_KEY } = process.env;
  if (!VERYFI_CLIENT_ID || !VERYFI_USERNAME || !VERYFI_API_KEY) throw new Error('OCR belum dikonfigurasi. Anda bisa lanjut mengisi manual.');
  const response = await fetch('https://api.veryfi.com/api/v8/partner/documents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'CLIENT-ID': VERYFI_CLIENT_ID, AUTHORIZATION: 'apikey ' + VERYFI_USERNAME + ':' + VERYFI_API_KEY },
    body: JSON.stringify({ file_name: path.split('/').at(-1), file_data: buffer.toString('base64') }),
    signal: AbortSignal.timeout(18000)
  });
  if (!response.ok) throw new Error('Struk gagal dibaca. Coba lagi atau isi manual.');
  const data = await response.json();
  return {
    supplier: data.vendor?.name || '', date: String(data.date || '').slice(0, 10),
    total: data.total ?? '', fees: (Number(data.tax) || 0) + (Number(data.shipping) || 0),
    lines: (data.line_items || []).slice(0, 40).map(item => ({
      description: String(item.description || '').slice(0, 160),
      packs: item.quantity ?? 1, price: item.price ?? '', discount: item.discount ?? 0
    }))
  };
}

async function generateAdvice(snapshot) {
  const { GEMINI_API_KEY, GEMINI_MODEL = 'gemini-2.5-flash' } = process.env;
  if (!GEMINI_API_KEY || !/^[\w.-]+$/.test(GEMINI_MODEL)) return null;
  try {
    const points = briefingPoints(snapshot);
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + GEMINI_MODEL + ':generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Tulis satu kalimat saran operasional bahasa Indonesia berdasarkan data berikut. Hindari angka, prediksi, dan klaim laba bersih. Data: ' + JSON.stringify(points) }] }],
        generationConfig: { responseMimeType: 'application/json', responseSchema: { type: 'OBJECT', properties: { advice: { type: 'STRING' } }, required: ['advice'] } }
      }),
      signal: AbortSignal.timeout(12000)
    });
    if (!response.ok) return null;
    const output = await response.json();
    const advice = JSON.parse(output.candidates?.[0]?.content?.parts?.[0]?.text || '{}').advice;
    return typeof advice === 'string' && advice.trim().length > 0 && advice.length <= 300 && !/[0-9]|laba bersih|prediksi/i.test(advice) ? advice : null;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ error: 'Metode tidak didukung.' });
  const token = req.headers.authorization?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) return res.status(401).json({ error: 'Silakan masuk kembali.' });
  const { SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) return res.status(503).json({ error: 'Supabase belum dikonfigurasi di server.' });
  const db = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  try {
    const { data: auth, error: authError } = await db.auth.getUser(token);
    if (authError || !auth.user) return res.status(401).json({ error: 'Sesi berakhir. Silakan masuk kembali.' });
    const owner = auth.user.id;
    const table = () => db.from('maviq_workspaces');
    const { data: existing, error: loadError } = await table().select(select).eq('owner_id', owner).maybeSingle();
    if (loadError) return res.status(503).json({ error: 'Data usaha belum dapat dibuka. Periksa migrasi Supabase.' });
    if (req.method === 'GET') return res.json(existing);
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    if (body.action === 'setup') {
      if (existing) return res.json(existing);
      const ledger = emptyLedger(body.name, body.cash);
      const { data, error } = await table().insert({ owner_id: owner, ledger }).select(select).single();
      if (error) return res.status(409).json({ error: 'Usaha sudah dibuat atau tidak dapat disimpan. Muat ulang halaman.' });
      return res.status(201).json(data);
    }
    if (!existing) return res.status(409).json({ error: 'Buat usaha terlebih dahulu.' });
    if (body.action === 'scan') {
      const file = await receiptFile(db, body.path, owner);
      return res.json(await scanReceipt(file, body.path));
    }
    if (body.action !== 'commit' || !body.command) return res.status(400).json({ error: 'Permintaan tidak valid.' });
    const command = body.command;
    if (existing.ledger.commands.includes(command.id)) return res.json(existing);
    if (body.revision !== existing.revision) return res.status(409).json({ error: 'Data berubah di sesi lain. Data terbaru sudah dimuat. Periksa draf lalu coba lagi.', current: existing });
    if (command.kind === 'purchase') {
      const path = command.fields?.receiptPath;
      if (path) {
        const buffer = await receiptFile(db, path, owner);
        command.fields.receiptHash = createHash('sha256').update(buffer).digest('hex');
      } else {
        delete command.fields?.receiptHash;
      }
    }
    if (command.kind === 'briefing') {
      const day = command.fields?.day || '';
      command.fields = { day, advice: await generateAdvice(summarize(existing.ledger, day, day)) };
    }
    const ledger = applyCommand(existing.ledger, command);
    const { data, error } = await table().update({ ledger, revision: existing.revision + 1 })
      .eq('owner_id', owner).eq('revision', existing.revision).select(select).maybeSingle();
    if (error) return res.status(503).json({ error: 'Perubahan belum dapat disimpan. Coba lagi.' });
    if (!data) {
      const { data: current } = await table().select(select).eq('owner_id', owner).maybeSingle();
      if (current?.ledger.commands.includes(command.id)) return res.json(current);
      return res.status(409).json({ error: 'Data baru saja berubah. Periksa draf lalu coba lagi.', current });
    }
    return res.json(data);
  } catch (error) {
    const message = error.name === 'TimeoutError' ? 'Layanan terlalu lama merespons. Silakan coba lagi.' : error.message;
    return res.status(400).json({ error: message || 'Permintaan tidak dapat diproses.' });
  }
}
