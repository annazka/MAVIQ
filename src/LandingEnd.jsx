import { Plus } from 'lucide-react';

const content = {
  en: {
    title: 'Frequently asked questions',
    intro: 'What to know about MAVIQ and getting started.',
    questions: [
      [
        'What is MAVIQ?',
        'MAVIQ is an AI-powered workspace for Indonesian MSMEs. It brings together daily records, stock, market prices, production costs, and financial analysis, with an initial focus on food businesses.',
      ],
      [
        'Which businesses can use MAVIQ?',
        'MAVIQ starts with Indonesian food businesses, including food stalls, coffee shops, caterers, bakeries, and home food businesses.',
      ],
      [
        'Can I try the demo without an account?',
        'Yes. Choose a business type and follow a fictional purchase through inventory and cash. Sign in to save your own records.',
      ],
      [
        'Can I correct a scanned receipt?',
        'Yes. Review and edit the draft before confirming the purchase. You can also record purchases manually.',
      ],
      [
        'Can the assistant change my records?',
        'The assistant helps you read your business figures. You confirm or cancel transactions in your dashboard.',
      ],
      [
        'How do I set up my business?',
        'Sign up with Google or email, then enter your business name and opening balance.',
      ],
    ],
    groups: [
      [
        'Product',
        [
          ['Features', '#kapabilitas'],
          ['Interactive demo', '#demo-ruang-kerja'],
          ['Market prices', '#harga-pasar'],
        ],
      ],
      [
        'Explore MAVIQ',
        [
          ['How it works', '#fitur'],
          ['Business types', '#jenis-usaha'],
          ['FAQ', '#faq'],
        ],
      ],
    ],
    account: 'Account',
    note: 'Small Business, Smarter Decisions.',
    body: 'An AI-powered business workspace for Indonesian MSMEs, starting with the food sector.',
  },
  id: {
    title: 'Pertanyaan yang sering diajukan',
    intro: 'Kenali MAVIQ dan lihat cara memulai.',
    questions: [
      [
        'Apa itu MAVIQ?',
        'MAVIQ adalah ruang kerja berbasis AI untuk UMKM Indonesia. MAVIQ menyatukan catatan harian, stok, harga pasar, HPP, dan analisis keuangan, dengan fokus awal pada usaha kuliner.',
      ],
      [
        'Usaha apa yang bisa memakai MAVIQ?',
        'Fokus awal MAVIQ adalah usaha kuliner Indonesia, termasuk warung makan, kedai kopi, katering, toko roti, dan usaha makanan rumahan.',
      ],
      [
        'Bisa coba demo tanpa akun?',
        'Bisa. Pilih jenis usaha dan ikuti alur pembelian fiktif sampai stok dan kas berubah. Masuk untuk menyimpan catatan usahamu sendiri.',
      ],
      [
        'Bisa koreksi hasil scan struk?',
        'Bisa. Periksa dan ubah draf sebelum konfirmasi pembelian. Pembelian juga bisa dicatat manual.',
      ],
      [
        'Apakah asisten bisa mengubah catatan saya?',
        'Asisten membantu membaca angka usahamu. Kamu yang mengonfirmasi atau membatalkan transaksi lewat dashboard.',
      ],
      [
        'Bagaimana cara menyiapkan usaha?',
        'Daftar dengan Google atau email, lalu masukkan nama usaha dan saldo awal.',
      ],
    ],
    groups: [
      [
        'Produk',
        [
          ['Fitur', '#kapabilitas'],
          ['Demo interaktif', '#demo-ruang-kerja'],
          ['Harga pasar', '#harga-pasar'],
        ],
      ],
      [
        'Jelajahi MAVIQ',
        [
          ['Cara kerja', '#fitur'],
          ['Jenis usaha', '#jenis-usaha'],
          ['FAQ', '#faq'],
        ],
      ],
    ],
    account: 'Akun',
    note: 'Usaha Kecil, Keputusan Lebih Cerdas.',
    body: 'Ruang kerja berbasis AI untuk UMKM Indonesia, dengan fokus awal sektor kuliner.',
  },
};

export function LandingFaq({ lang }) {
  const t = content[lang];
  return (
    <section id="faq" className="desktop-faq" aria-labelledby="faq-title">
      <h2 id="faq-title" tabIndex={-1}>
        {t.title}
      </h2>
      <p>{t.intro}</p>
      <div className="desktop-faq-list">
        {t.questions.map(([question, answer], index) => (
          <details name="maviq-faq" key={index} open={index === 0}>
            <summary>
              {question}
              <Plus size={19} aria-hidden="true" />
            </summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function LandingFooter({ lang, signIn, signUp, login, signup }) {
  const t = content[lang];
  return (
    <footer className="desktop-footer">
      <div className="footer-columns">
        {t.groups.map(([name, links]) => (
          <nav key={name} aria-label={name}>
            <h2>{name}</h2>
            <ul>
              {links.map(([label, href]) => (
                <li key={href}>
                  <a href={href}>{label}</a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
        <nav id="daftar" aria-label={t.account}>
          <h2 tabIndex={-1}>{t.account}</h2>
          <ul>
            <li>
              <a href={signUp}>{signup}</a>
            </li>
            <li>
              <a href={signIn}>{login}</a>
            </li>
          </ul>
        </nav>
        <div className="footer-note">
          <h2>MAVIQ</h2>
          <p>
            <strong>{t.note}</strong>
          </p>
          <p>{t.body}</p>
        </div>
      </div>
      <a className="footer-mark" href="#beranda">
        <img src="/maviq.svg" alt="" width="27" height="27" />
        MAVIQ
      </a>
    </footer>
  );
}
