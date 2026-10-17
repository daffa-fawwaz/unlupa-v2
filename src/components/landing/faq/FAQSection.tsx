import React, { useState } from 'react';
import { ArrowRight, CircleHelp, Plus, X } from 'lucide-react';
import './faq.css';

interface FAQSectionProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

const FAQ_ITEMS = [
  {
    question: 'Bagaimana Unlupa menentukan hafalan yang perlu diulang?',
    answer: 'Unlupa membaca riwayat review, tingkat kesulitan, dan stabilitas memori setiap materi. Data tersebut digunakan untuk menyusun Daily Review berdasarkan hafalan yang paling membutuhkan perhatian.',
  },
  {
    question: 'Bagaimana Unlupa menyusun jadwal murajaah?',
    answer: 'Unlupa memadukan riwayat review, tingkat kesulitan, dan kekuatan daya ingat untuk menentukan kapan sebuah materi sebaiknya diulang. Jadwalnya menyesuaikan diri, bukan sekadar kalender tetap.',
  },
  {
    question: 'Apakah Unlupa hanya dapat digunakan untuk hafalan Al-Qur’an?',
    answer: 'Tidak. Selain Mushaf Madinah 604 halaman, Anda dapat membuat ruang buku, kitab, matan, dan flashcard untuk berbagai materi keilmuan.',
  },
  {
    question: 'Bisakah guru memantau perkembangan hafalan santri?',
    answer: 'Bisa. Melalui ruang halaqah, guru dapat menyimak, memberikan penilaian, mengaktifkan materi, serta melihat laporan perkembangan santri.',
  },
  {
    question: 'Apakah progres hafalan tersimpan dan tersinkronisasi?',
    answer: 'Ya. Setelah masuk ke akun, progres review dan materi Anda disimpan agar dapat dilanjutkan kembali. Unlupa juga menyediakan dukungan penggunaan saat koneksi tidak stabil.',
  },
];

export const FAQSection: React.FC<FAQSectionProps> = ({ onGetStarted, onLogin }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="landing-faq" id="faq" aria-labelledby="faq-title">
      <div className="landing-faq__heading">
        <span><CircleHelp aria-hidden="true" /> FAQ</span>
        <h2 id="faq-title">Masih ada pertanyaan?<strong>Kami sudah siapkan jawabannya.</strong></h2>
        <p>Temukan jawaban singkat sebelum memulai perjalanan murajaah bersama Unlupa.</p>
      </div>

      <div className="landing-faq__list">
        {FAQ_ITEMS.map((item, index) => {
          const isOpen = openIndex === index;
          const answerId = `faq-answer-${index}`;
          return (
            <article className={`faq-item${isOpen ? ' is-open' : ''}`} key={item.question}>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={answerId}
                onClick={() => setOpenIndex(isOpen ? null : index)}
              >
                <span className="faq-item__number">{String(index + 1).padStart(2, '0')}</span>
                <span className="faq-item__question">{item.question}</span>
                <span className="faq-item__toggle" aria-hidden="true">
                  {isOpen ? <X /> : <Plus />}
                </span>
              </button>
              <div className="faq-item__answer" id={answerId}>
                <div><p>{item.answer}</p></div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="landing-faq-cta" id="tentang">
        <div className="landing-faq-cta__glow" aria-hidden="true" />
        <div className="landing-faq-cta__content">
          <span>Mulai dari review hari ini</span>
          <h2>Jaga hafalan dengan arah yang lebih jelas.</h2>
          <p>Bangun ritme murajaah yang konsisten tanpa menebak materi mana yang harus diulang berikutnya.</p>
          <div>
            <button type="button" onClick={onGetStarted}>Mulai gratis <ArrowRight aria-hidden="true" /></button>
            <button type="button" onClick={onLogin}>Saya sudah punya akun <ArrowRight aria-hidden="true" /></button>
          </div>
        </div>
      </div>
    </section>
  );
};
