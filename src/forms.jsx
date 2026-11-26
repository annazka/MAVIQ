import { cloneElement, useEffect, useId, useRef, useState } from 'react';
import { AlertCircle, FileImage, Plus, ScanLine, Trash2, X } from 'lucide-react';
import { jakartaDay, productCost, types, units } from '../lib/ledger.js';
import { amount, Button, clock, dateLabel, money } from './ui.jsx';

const titles = {
  sale: 'Catat penjualan', purchase: 'Catat pembelian', ingredient: 'Tambah bahan',
  product: 'Simpan produk dan resep', expense: 'Catat pengeluaran', adjustment: 'Sesuaikan stok', reversal: 'Batalkan transaksi'
};

export function Field({ label, children, wide = false, hint }) {
  const id = useId();
  const hintId = hint ? id + '-hint' : undefined;
  return <div className={'form-field ' + (wide ? 'wide' : '')}>
    <label htmlFor={id}>{label}</label>
    {cloneElement(children, { id, 'aria-describedby': hintId })}
    {hint && <small id={hintId}>{hint}</small>}
  </div>;
}

const numeric = { type: 'number', min: '0', step: '0.000001', required: true };
const textInput = { required: true, maxLength: 160 };
const recipeLine = item => ({ key: crypto.randomUUID(), ingredientId: item?.ingredientId || '', quantity: item?.quantity || '' });
const purchaseLine = item => ({ key: crypto.randomUUID(), ingredientId: '', packs: item?.packs ?? '1', size: '1', price: item?.price ?? '', discount: item?.discount ?? '0', description: item?.description || '' });
const receiptLimit = 10 * 1024 * 1024;

function IngredientOptions({ ingredients }) {
  return <><option value="">Pilih bahan</option>{ingredients.map(item => <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>)}</>;
}

function LineEditor({ kind, lines, setLines, ingredients }) {
  const purchase = kind === 'purchase';
  const update = (key, name, value) => setLines(current => current.map(line => line.key === key ? { ...line, [name]: value } : line));
  return <div className="line-editor wide">
    <div className="line-header"><strong>{purchase ? 'Rincian pembelian' : 'Bahan resep'}</strong>
      <Button icon={Plus} onClick={() => setLines([...lines, purchase ? purchaseLine() : recipeLine()])} disabled={lines.length >= 40}>Tambah baris</Button></div>
    {lines.map((line, index) => <fieldset key={line.key} className="line-fields">
      <legend>{line.description || 'Bahan ' + (index + 1)}</legend>
      <Field label="Bahan" wide><select required value={line.ingredientId} onChange={event => update(line.key, 'ingredientId', event.target.value)}><IngredientOptions ingredients={ingredients} /></select></Field>
      {purchase ? <>
        <Field label="Jumlah kemasan"><input {...numeric} min="0.000001" value={line.packs} onChange={event => update(line.key, 'packs', event.target.value)} /></Field>
        <Field label={'Isi per kemasan (' + (ingredients.find(item => item.id === line.ingredientId)?.unit || 'satuan dasar') + ')'}><input {...numeric} min="0.000001" value={line.size} onChange={event => update(line.key, 'size', event.target.value)} /></Field>
        <Field label="Harga per kemasan (Rp)"><input {...numeric} value={line.price} onChange={event => update(line.key, 'price', event.target.value)} /></Field>
        <Field label="Diskon baris (Rp)"><input {...numeric} value={line.discount} onChange={event => update(line.key, 'discount', event.target.value)} /></Field>
      </> : <Field label="Jumlah bahan dalam satuan dasar"><input {...numeric} min="0.000001" value={line.quantity} onChange={event => update(line.key, 'quantity', event.target.value)} /></Field>}
      <Button icon={Trash2} className="remove-line" aria-label={'Hapus baris ' + (index + 1)} disabled={lines.length === 1} onClick={() => setLines(lines.filter(item => item.key !== line.key))}>Hapus</Button>
    </fieldset>)}
  </div>;
}

export default function Modal({ modal, ledger, close, open, commit, notify, receiptTools }) {
  const { kind, data } = modal;
  const dialog = useRef(null);
  const fieldsRef = useRef(null);
  const id = useRef(crypto.randomUUID());
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [lines, setLines] = useState(() => kind === 'product' ? data?.recipe?.map(recipeLine) || [recipeLine()] : [purchaseLine()]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [count, setCount] = useState('1');
  const [receipt, setReceipt] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [attached, setAttached] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [result, setResult] = useState(null);
  const [delta, setDelta] = useState('');
  const [lineage, setLineage] = useState(false);
  const pendingReceipt = useRef(null);
  const retained = useRef(false);

  useEffect(() => {
    const node = dialog.current;
    node.showModal();
    return () => {
      if (pendingReceipt.current && !retained.current) void receiptTools.discard(pendingReceipt.current);
      node.close();
    };
  }, []);
  const product = ledger.products.find(item => item.id === selectedProduct);
  const detail = kind === 'detail';
  const cannotSell = kind === 'sale' && ledger.products.length === 0;
  const missingIngredients = ['purchase', 'product', 'adjustment'].includes(kind) && ledger.ingredients.length === 0;
  const assignScan = output => {
    const form = fieldsRef.current;
    if (output.supplier) form.supplier.value = output.supplier;
    if (/^\d{4}-\d{2}-\d{2}$/.test(output.date)) form.receiptDate.value = output.date;
    if (output.total !== '') form.total.value = output.total;
    form.fees.value = output.fees;
    if (output.lines.length) {
      setLines(output.lines.map(item => {
        const line = purchaseLine(item);
        const description = item.description.toLowerCase();
        const matches = ledger.ingredients.filter(ingredient => description.includes(ingredient.name.toLowerCase()));
        return matches.length === 1 ? { ...line, ingredientId: matches[0].id } : line;
      }));
    }
  };
  const scan = async picked => {
    if (!picked || scanning) return;
    setPhotoError('');
    setScanning(true);
    try {
      if (!['image/png', 'image/jpeg'].includes(picked.type) || picked.size > receiptLimit) throw new Error('Pilih foto JPEG atau PNG hingga 10 MB.');
      if (pendingReceipt.current) {
        await receiptTools.discard(pendingReceipt.current);
        pendingReceipt.current = null;
      }
      setResult(null);
      const uploaded = await receiptTools.upload(picked);
      pendingReceipt.current = uploaded.path;
      setReceipt(uploaded);
      setAttached(picked.name);
      if (uploaded.path) {
        const output = await receiptTools.scan(uploaded.path);
        assignScan(output);
        setResult('Periksa hasil OCR, lalu pilih bahan dan isi ukuran kemasan sebelum konfirmasi.');
      } else {
        setPhotoError('Scan OCR tersedia setelah masuk ke usaha yang terhubung. Isi rincian secara manual untuk melanjutkan simulasi.');
      }
    } catch (scanError) {
      setPhotoError(scanError.message || 'Struk gagal dibaca. Coba lagi atau isi manual.');
    } finally { setScanning(false); }
  };
  const submit = async event => {
    event.preventDefault();
    if (pending || scanning) return;
    setPending(true);
    setError('');
    try {
      const values = Object.fromEntries(new FormData(event.currentTarget));
      const fields = { ...values };
      if (kind === 'product') {
        fields.productId = data?.id;
        fields.recipe = lines.map(({ ingredientId, quantity }) => ({ ingredientId, quantity }));
      }
      if (kind === 'purchase') {
        fields.items = lines.map(({ ingredientId, packs, size, price, discount }) => ({ ingredientId, packs, size, price, discount }));
        fields.receiptPath = receipt?.path;
        fields.receiptHash = receipt?.hash;
        fields.acceptDuplicate = lineage;
      }
      if (kind === 'reversal') {
        fields.entryId = data.id;
        fields.returnStock = values.returnStock === 'on';
      }
      await commit({ id: id.current, kind, fields });
      retained.current = true;
      notify('Perubahan berhasil disimpan.');
      close();
    } catch (submitError) { setError(submitError.message); }
    finally { setPending(false); }
  };
  return <dialog className="dialog" ref={dialog} aria-labelledby="dialog-title" onCancel={event => { event.preventDefault(); if (!pending && !scanning) close(); }} onClick={event => { if (event.target === dialog.current && !pending && !scanning) close(); }}>
    <div className="dialog-content">
      <div className="dialog-header"><h2 id="dialog-title">{detail ? data.label : titles[kind]}</h2><Button className="icon-only" icon={X} aria-label="Tutup dialog" disabled={pending || scanning} onClick={close} /></div>
      {detail ? <>
        <dl className="details">
          <div><dt>Jenis</dt><dd>{types[data.type] || 'Stok awal'}</dd></div>
          <div><dt>Waktu pembukuan</dt><dd>{dateLabel(jakartaDay(new Date(data.at)))} · {clock(data.at)}</dd></div>
          <div><dt>Pergerakan kas</dt><dd>{money(data.cash)}</dd></div>
          {data.type === 'sale' && <><div><dt>Jumlah</dt><dd>{data.count} porsi</dd></div><div><dt>Estimasi HPP historis</dt><dd>{money(data.cogs)}</dd></div></>}
          {data.expenseDate && <div><dt>Tanggal pengeluaran</dt><dd>{data.expenseDate}</dd></div>}
          {data.receiptDate && <div><dt>Tanggal struk</dt><dd>{data.receiptDate}</dd></div>}
          {data.note && <div><dt>Catatan</dt><dd>{data.note}</dd></div>}
          <div><dt>Status</dt><dd>{data.cancelled ? 'Dibatalkan' : 'Tercatat'}</dd></div>
          {data.waste && Number(data.waste) > 0 && <div><dt>Nilai bahan terpakai</dt><dd>{money(data.waste)}</dd></div>}
        </dl>
        {data.movements.length > 0 && <div className="movement-detail"><h3>Pergerakan stok</h3>{data.movements.map((item, index) => {
          const ingredient = ledger.ingredients.find(row => row.id === item.ingredientId);
          return <p key={item.ingredientId + index}>{ingredient?.name}<strong>{Number(item.quantity) > 0 ? '+' : ''}{amount(item.quantity)} {ingredient?.unit}</strong></p>;
        })}</div>}
        {data.receiptPath && <Button icon={FileImage} onClick={async () => {
          try {
            const link = await receiptTools.view(data.receiptPath);
            window.open(link, '_blank', 'noopener,noreferrer');
          } catch (receiptError) { notify(receiptError.message, true); }
        }}>Buka struk</Button>}
        <div className="dialog-footer"><Button onClick={close}>Tutup</Button>
          {!data.cancelled && ['purchase', 'sale', 'expense'].includes(data.type) && <Button variant="danger" onClick={() => open('reversal', data)}>Batalkan transaksi</Button>}</div>
      </> : <>
        {cannotSell || missingIngredients ? <div className="dialog-empty"><p>{cannotSell ? 'Tambahkan produk dan resep sebelum mencatat penjualan.' : 'Tambahkan bahan dasar sebelum melanjutkan.'}</p>
          <Button variant="primary" onClick={() => open(ledger.ingredients.length ? 'product' : 'ingredient')}>{ledger.ingredients.length ? 'Tambah produk' : 'Tambah bahan'}</Button></div> : <form ref={fieldsRef} onSubmit={submit}>
          <div className="form-grid">
            {kind === 'sale' && <>
              <Field label="Produk" wide><select name="productId" value={selectedProduct} required onChange={event => setSelectedProduct(event.target.value)}><option value="">Pilih produk</option>{ledger.products.map(item => <option key={item.id} value={item.id}>{item.name} · {money(item.price)}</option>)}</select></Field>
              <Field label="Jumlah porsi"><input name="count" type="number" min="1" step="1" required value={count} onChange={event => setCount(event.target.value)} /></Field>
              {product && <div className="form-summary wide"><span>Total penjualan<strong>{money(Number(product.price) * Number(count))}</strong></span><span>Estimasi HPP<strong>{money(productCost(ledger, product).mul(count || 0))}</strong></span></div>}
            </>}
            {kind === 'ingredient' && <>
              <Field label="Nama bahan" wide><input name="name" placeholder="Contoh Susu full cream" {...textInput} /></Field>
              <Field label="Satuan dasar"><select name="unit">{units.map(unit => <option key={unit}>{unit}</option>)}</select></Field>
              <Field label="Batas minimum stok"><input name="minimum" defaultValue="0" {...numeric} /></Field>
              <Field label="Jumlah stok awal"><input name="initial" defaultValue="0" {...numeric} /></Field>
              <Field label="Biaya per satuan dasar (Rp)"><input name="cost" defaultValue="0" {...numeric} /></Field>
            </>}
            {kind === 'product' && <>
              <Field label="Nama produk" wide><input name="name" defaultValue={data?.name} {...textInput} /></Field>
              <Field label="Harga jual per porsi (Rp)"><input name="price" defaultValue={data?.price} {...numeric} min="1" step="1" /></Field>
              <Field label="Hasil porsi resep"><input name="yield" defaultValue={data?.yield || '1'} {...numeric} min="1" step="1" /></Field>
              <Field label="Biaya produksi per porsi (Rp)" wide hint="Isi 0 jika belum memasukkan tenaga kerja atau overhead."><input name="production" defaultValue={data?.production || '0'} {...numeric} /></Field>
              <LineEditor kind={kind} lines={lines} setLines={setLines} ingredients={ledger.ingredients} />
            </>}
            {kind === 'purchase' && <>
              <div className="upload wide">
                <label className="upload-control"><ScanLine size={21} /><span><strong>{scanning ? 'Membaca struk…' : attached || 'Pilih foto struk'}</strong><small>JPEG atau PNG, maksimum 10 MB</small></span>
                  <input autoFocus={Boolean(data?.scan)} type="file" accept="image/jpeg,image/png" disabled={scanning || pending} onChange={event => {
                    const file = event.target.files?.[0]; event.target.value = ''; void scan(file);
                  }} />
                </label>
                {photoError && <p className="form-warning"><AlertCircle size={16} />{photoError}</p>}
                {result && <p className="form-warning"><AlertCircle size={16} />{result}</p>}
              </div>
              <Field label="Toko atau pemasok"><input name="supplier" {...textInput} /></Field>
              <Field label="Tanggal struk"><input type="date" name="receiptDate" defaultValue={jakartaDay()} required /></Field>
              <LineEditor kind={kind} lines={lines} setLines={setLines} ingredients={ledger.ingredients} />
              <Field label="Biaya tambahan (Rp)"><input name="fees" defaultValue="0" {...numeric} /></Field>
              <Field label="Penyesuaian pembulatan (Rp)"><input name="rounding" defaultValue="0" {...numeric} min="-1000000" /></Field>
              <Field label="Total dibayar (Rp)" wide><input name="total" {...numeric} /></Field>
              {receipt && <label className="checkbox wide"><input type="checkbox" checked={lineage} onChange={event => setLineage(event.target.checked)} />Struk serupa ini untuk pembelian yang berbeda</label>}
            </>}
            {kind === 'expense' && <>
              <Field label="Kategori"><select name="category">{['Utilitas', 'Sewa', 'Transportasi', 'Pemasaran', 'Perlengkapan', 'Lainnya'].map(option => <option key={option}>{option}</option>)}</select></Field>
              <Field label="Jumlah (Rp)"><input name="amount" {...numeric} min="1" step="1" /></Field>
              <Field label="Tanggal pengeluaran" wide><input type="date" name="expenseDate" defaultValue={jakartaDay()} required /></Field>
              <Field label="Keterangan" wide><textarea name="note" rows="3" {...textInput} /></Field>
            </>}
            {kind === 'adjustment' && <>
              <Field label="Bahan" wide><select name="ingredientId" defaultValue={data?.ingredientId || ''} required><IngredientOptions ingredients={ledger.ingredients} /></select></Field>
              <Field label="Selisih dalam satuan dasar" hint="Gunakan angka negatif jika stok berkurang."><input name="delta" type="number" step=".000001" value={delta} onChange={event => setDelta(event.target.value)} required /></Field>
              {Number(delta) > 0 && <Field label="Biaya per satuan (Rp)"><input name="cost" {...numeric} /></Field>}
              <Field label="Alasan" wide><textarea name="note" rows="3" {...textInput} /></Field>
            </>}
            {kind === 'reversal' && <>
              <p className="wide reversal-copy">MAVIQ akan membuat transaksi pembalik untuk {data.label}. Transaksi asli tetap tampil dalam riwayat.</p>
              <Field label="Alasan pembatalan" wide><textarea name="note" rows="3" {...textInput} /></Field>
              {data.type === 'sale' && <label className="checkbox wide"><input type="checkbox" name="returnStock" />Bahan benar-benar kembali ke persediaan</label>}
            </>}
          </div>
          {error && <p className="form-error" role="alert"><AlertCircle size={16} />{error}</p>}
          <div className="dialog-footer"><Button onClick={close} disabled={pending || scanning}>Kembali</Button>
            <Button type="submit" variant={kind === 'reversal' ? 'danger' : 'primary'} disabled={pending || scanning}>{pending ? 'Menyimpan…' : kind === 'reversal' ? 'Konfirmasi pembatalan' : 'Simpan'}</Button></div>
        </form>}
      </>}
    </div>
  </dialog>;
}
