/**
 * Quick Card Parser & External AI Prompt Generator
 *
 * Memungkinkan pemrosesan flashcard instan 100% di sisi klien (tanpa biaya API, tanpa kuota, tanpa latensi),
 * serta menyediakan template prompt siap pakai untuk dieksekusi di ChatGPT / Claude / Gemini / DeepSeek eksternal.
 */

export interface ParsedCard {
  question: string;
  answer: string;
}

export interface ParsedChapter {
  title: string;
  description?: string;
  cards: ParsedCard[];
}

export interface ParsedBook {
  title: string;
  description: string;
  chapters: ParsedChapter[];
}

/**
 * Membersihkan spasi berlebih pada awal/akhir baris namun mempertahankan enter dwibahasa
 */
function cleanText(text: string): string {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line, i, arr) => {
      // Hapus baris kosong di paling awal atau paling akhir
      if (line === "" && (i === 0 || i === arr.length - 1)) return false;
      return true;
    })
    .join("\n")
    .trim();
}

/**
 * Mem-parsing string Q&A menjadi array kartu { question, answer }
 * Mendukung berbagai format populer:
 * 1. Tag T: / J: (Tanya / Jawab, Q: / A:, P: / J:, Soal: / Jawab:)
 * 2. Delimiter baris tunggal (pipa |, tab \t, ::, ///, strip ganda --)
 * 3. JSON Array format [{question, answer}]
 */
export function parseCardsFromText(rawText: string): ParsedCard[] {
  if (!rawText || !rawText.trim()) return [];
  const text = rawText.trim();

  // 1. Coba JSON parser jika formatnya berupa JSON array
  if (
    (text.startsWith("[") && text.endsWith("]")) ||
    (text.startsWith("{") && text.endsWith("}"))
  ) {
    try {
      const parsed = JSON.parse(text);
      const list = Array.isArray(parsed)
        ? parsed
        : parsed.cards || parsed.items || [];
      if (Array.isArray(list) && list.length > 0) {
        const validCards = list
          .map((item: any) => {
            const q =
              item.question ||
              item.q ||
              item.tanya ||
              item.t ||
              item.front ||
              item.soal ||
              "";
            const a =
              item.answer ||
              item.a ||
              item.jawab ||
              item.j ||
              item.back ||
              item.jawaban ||
              "";
            if (q.trim() && a.trim()) {
              return { question: cleanText(q), answer: cleanText(a) };
            }
            return null;
          })
          .filter(Boolean) as ParsedCard[];

        if (validCards.length > 0) return validCards;
      }
    } catch {
      // bukan JSON murni, lanjut ke text parsing
    }
  }

  // Regex pola penanda Pertanyaan
  // Mendukung: T:, Q:, P:, Tanya:, Pertanyaan:, Soal:, 1. T:, 1) Q:, dsb.
  const questionPattern =
    /^(?:(?:\d+[\.\)]|\-|\*)\s*)?(?:[TtQqPp]|Tanya|Pertanyaan|Question|Soal)\s*[:：]\s*(.*)$/i;
  // Regex pola penanda Jawaban
  // Mendukung: J:, A:, Ans:, Jawab:, Jawaban:, Answer:, 1. J:, 1) A:, dsb.
  const answerPattern =
    /^(?:(?:\d+[\.\)]|\-|\*)\s*)?(?:[JjAa]|Ans|Jawab|Jawaban|Answer)\s*[:：]\s*(.*)$/i;

  const lines = text.split("\n");
  const cards: ParsedCard[] = [];

  let currentQuestionLines: string[] = [];
  let currentAnswerLines: string[] = [];
  let state: "idle" | "in_question" | "in_answer" = "idle";

  const flushCard = () => {
    const q = cleanText(currentQuestionLines.join("\n"));
    const a = cleanText(currentAnswerLines.join("\n"));
    if (q && a) {
      cards.push({ question: q, answer: a });
    }
    currentQuestionLines = [];
    currentAnswerLines = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Lewati baris divider markdown atau header bab
    if (
      trimmedLine.startsWith("---") ||
      trimmedLine.startsWith("===") ||
      trimmedLine.startsWith("#")
    ) {
      if (state === "in_answer") {
        flushCard();
        state = "idle";
      }
      continue;
    }

    const qMatch = trimmedLine.match(questionPattern);
    const aMatch = trimmedLine.match(answerPattern);

    if (qMatch) {
      // Jika sebelumnya sudah ada tanya dan jawab, simpan kartu lama
      if (state === "in_answer" || state === "in_question") {
        flushCard();
      }
      state = "in_question";
      currentQuestionLines = [qMatch[1]];
    } else if (aMatch && state === "in_question") {
      state = "in_answer";
      currentAnswerLines = [aMatch[1]];
    } else if (state === "in_question") {
      // Baris lanjutan dari pertanyaan (misal teks Arab atau baris kedua)
      currentQuestionLines.push(line);
    } else if (state === "in_answer") {
      // Baris lanjutan dari jawaban
      currentAnswerLines.push(line);
    }
  }

  // Flush kartu terakhir jika ada
  flushCard();

  if (cards.length > 0) {
    return cards;
  }

  // 2. Fallback: Cek Delimiter berbasis baris (Tab, Pipe |, ::, ///)
  for (const line of lines) {
    const tr = line.trim();
    if (!tr || tr.startsWith("#") || tr.startsWith("---")) continue;

    // Cek tab (TSV export dari Spreadsheet / Anki)
    if (tr.includes("\t")) {
      const parts = tr.split("\t");
      if (parts.length >= 2 && parts[0].trim() && parts[1].trim()) {
        cards.push({
          question: cleanText(parts[0]),
          answer: cleanText(parts.slice(1).join(" ")),
        });
        continue;
      }
    }

    // Cek Pipe delimiter (|) misal tabel markdown atau flashcard sederhana
    if (tr.includes("|")) {
      // Abaikan baris format header tabel seperti |---|---|
      if (/^\|?[\s\-:]+\|[\s\-:]+\|?$/.test(tr)) continue;
      const parts = tr
        .split("|")
        .map((p) => p.trim())
        .filter(Boolean);
      if (parts.length >= 2) {
        cards.push({
          question: cleanText(parts[0]),
          answer: cleanText(parts.slice(1).join(" | ")),
        });
        continue;
      }
    }

    // Cek delimiter :: atau ///
    if (tr.includes("::")) {
      const parts = tr.split("::");
      if (parts.length >= 2 && parts[0].trim() && parts[1].trim()) {
        cards.push({
          question: cleanText(parts[0]),
          answer: cleanText(parts.slice(1).join("::")),
        });
        continue;
      }
    }

    if (tr.includes("///")) {
      const parts = tr.split("///");
      if (parts.length >= 2 && parts[0].trim() && parts[1].trim()) {
        cards.push({
          question: cleanText(parts[0]),
          answer: cleanText(parts.slice(1).join("///")),
        });
        continue;
      }
    }
  }

  return cards;
}

/**
 * Mem-parsing teks struktur buku yang berisi beberapa Bab dan Q&A di bawah tiap bab
 */
export function parseBookFromText(
  rawText: string,
  fallbackTitle = "Buku Baru",
): ParsedBook {
  if (!rawText || !rawText.trim()) {
    return {
      title: fallbackTitle,
      description: "",
      chapters: [{ title: "Bab 1: Materi Utama", cards: [] }],
    };
  }

  const lines = rawText.split("\n");
  let title = "";
  let description = "";

  const chapterBlocks: { title: string; lines: string[] }[] = [];
  let currentChapterTitle = "";
  let currentChapterLines: string[] = [];

  // Regex mendeteksi header bab
  const chapterHeaderRegex =
    /^(?:#{1,3}\s*|Bab\s+\d+\s*[:：\-]|BAB\s+[IVXLCDM]+\s*[:：\-]|Chapter\s+\d+\s*[:：\-]|Bagian\s+\d+\s*[:：\-])\s*(.*)$/i;
  const titleRegex = /^(?:Judul|Title|Nama Buku)\s*[:：]\s*(.*)$/i;
  const descRegex = /^(?:Deskripsi|Description|Keterangan)\s*[:：]\s*(.*)$/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Deteksi judul buku di awal dokumen
    if (!title && trimmed) {
      const tMatch = trimmed.match(titleRegex);
      if (tMatch && tMatch[1].trim()) {
        title = tMatch[1].trim();
        continue;
      }
      if (trimmed.startsWith("# ") && !trimmed.toLowerCase().includes("bab")) {
        title = trimmed.replace(/^#\s+/, "").trim();
        continue;
      }
    }

    // Deteksi deskripsi
    if (!description && trimmed) {
      const dMatch = trimmed.match(descRegex);
      if (dMatch && dMatch[1].trim()) {
        description = dMatch[1].trim();
        continue;
      }
    }

    // Deteksi Bab
    const isChapHeader =
      chapterHeaderRegex.test(trimmed) &&
      !trimmed.toLowerCase().startsWith("t:") &&
      !trimmed.toLowerCase().startsWith("j:");
    if (isChapHeader) {
      // Simpan bab sebelumnya jika ada
      if (currentChapterLines.length > 0 || currentChapterTitle) {
        chapterBlocks.push({
          title: currentChapterTitle || "Bab 1: Materi Utama",
          lines: currentChapterLines,
        });
      }
      // Mulai bab baru
      const rawTitle = trimmed.replace(/^#{1,3}\s*/, "").trim();
      currentChapterTitle = rawTitle || `Bab ${chapterBlocks.length + 1}`;
      currentChapterLines = [];
      continue;
    }

    currentChapterLines.push(line);
  }

  // Simpan bab terakhir
  if (currentChapterLines.length > 0 || currentChapterTitle) {
    chapterBlocks.push({
      title:
        currentChapterTitle ||
        (chapterBlocks.length === 0
          ? "Bab 1: Materi Utama"
          : `Bab ${chapterBlocks.length + 1}`),
      lines: currentChapterLines,
    });
  }

  // Jika tidak ada bab yang terdeteksi, jadikan seluruh teks sebagai Bab 1
  if (chapterBlocks.length === 0) {
    chapterBlocks.push({
      title: "Bab 1: Materi Utama",
      lines: lines,
    });
  }

  // Parse kartu pada tiap bab
  const chapters: ParsedChapter[] = chapterBlocks
    .map((block, idx) => {
      const blockText = block.lines.join("\n");
      const cards = parseCardsFromText(blockText);
      return {
        title: block.title || `Bab ${idx + 1}`,
        cards,
      };
    })
    .filter((ch) => ch.cards.length > 0 || chapterBlocks.length === 1);

  // Jika semua bab kosong tapi ada teks global
  if (chapters.length === 0 || chapters.every((c) => c.cards.length === 0)) {
    const allCards = parseCardsFromText(rawText);
    return {
      title: title || fallbackTitle,
      description: description || "",
      chapters: [
        {
          title: "Bab 1: Materi Utama",
          cards: allCards,
        },
      ],
    };
  }

  return {
    title: title || fallbackTitle,
    description: description || "",
    chapters,
  };
}

import { Language } from "../types";

/**
 * Template Prompt Siap Pakai untuk AI Eksternal (ChatGPT, Claude, Gemini, DeepSeek)
 * Didesain berdasarkan sains kognitif, prinsip spaced repetition (Dr. Piotr Wozniak - SuperMemo 20 Rules),
 * active recall, dan cognitive load theory.
 */
export const EXTERNAL_AI_CARD_PROMPT_TEMPLATE = (
  topic?: string,
  material?: string,
  language: Language = "id",
): string => {
  if (language === "en") {
    const subject = topic
      ? `on the topic of "${topic}"`
      : material
        ? `based on the attached material below`
        : `based on the following material`;
    return `You are a Senior Cognitive Scientist and Master Spaced Repetition Flashcard Architect, an expert in Dr. Piotr Wozniak's Twenty Rules of Formulating Knowledge, Active Recall, and the Testing Effect.

Your task is to craft high-yield flashcard Q&A items ${subject} adhering strictly to the highest standards of cognitive neuroscience and long-term memory encoding.

### CORE NEUROSCIENCE & FLASHCARD FORMULATION PRINCIPLES:
1. THE RETRIEVAL TRIGGER PRINCIPLE (Short & Razor-Sharp Questions):
   - The question is NOT a place to dump explanations or summarize background context.
   - The question functions 100% as a pure "retrieval cue" (a memory trigger). Keep questions brief, direct, and laser-focused so that the learner's working memory is wholly dedicated to retrieving the answer from long-term memory, rather than being drained by reading wordy prompts.
2. THE NON-DEDUCTIBLE & HIGH-YIELD FILTER (Strictly No Intuitive Fluff):
   - NEVER create cards for answers that can be reasoned out or guessed using common sense without dedicated study. Doing so pollutes repetition schedules and wastes cognitive capacity.
   - Reserve flashcards STRICTLY for exact, non-deducible, verbatim knowledge: Quranic verses, Hadith texts and narrators, scholarly terminology, exact definitions, legal rulings (ahkam), indispensable pillars/conditions, and precise dates/numbers.
3. MINIMUM INFORMATION PRINCIPLE (Atomic Cards):
   - 1 card = 1 atomic unit of memory.
   - Do NOT ask for long multi-item lists in a single card (e.g. "List the 10 pillars of X"). If one point is forgotten, the entire card fails. Instead, test each specific atomic element on its own dedicated card.
4. BILINGUAL & ARABIC SCRIPT TYPOGRAPHY (Clean Newline Rule):
   - For Quranic verses, Hadith, prayers (du'a), and Arabic terms: put the vocalized Arabic text (with proper harakat) on its own line, followed by a newline (Enter) for the translation/meaning. This enables clean visual processing without interference.
5. PRECISE & DIRECT ANSWERS:
   - Answers must be concise, accurate, and deliver the exact memory target without conversational fluff.

### STRICT OUTPUT FORMAT:
T: [Brief, laser-focused question acting as a pure retrieval trigger]
J: [Precise, high-yield target answer]

Example:
T: سُوْرَةُ النَّبَإِ مِنْ أَيِّ السُّوَرِ؟
Surah An-Naba' belongs to which classification?
J: مَكِّيَّةٌ
Makkiyyah (Revealed in Makkah).

### ZERO CHIT-CHAT POLICY:
Output ONLY the raw "T:" and "J:" cards. Do NOT include any introductory or concluding remarks, explanations, or code fences.${material ? `\n\nSOURCE MATERIAL:\n${material}` : ""}`;
  }

  // Bahasa Indonesia (Masterpiece Default)
  const subject = topic
    ? `tentang "${topic}"`
    : material
      ? `berdasarkan materi terlampir di bawah`
      : `berdasarkan materi berikut`;
  return `Anda adalah seorang Senior Cognitive Scientist dan Master Spaced Repetition Flashcard Architect, pakar dalam sains memori jangka panjang, prinsip SuperMemo (20 Rules of Formulating Knowledge oleh Dr. Piotr Wozniak), Active Recall, dan Cognitive Load Theory.

Tugas Anda adalah merancang kartu hafalan (flashcard) tanya-jawab ${subject} dengan mutu tertinggi (Masterpiece) yang dirancang khusus untuk efisiensi otak manusia dalam mengingat secara permanen.

### PRINSIP EMAS NEUROSAINS PEMBUATAN FLASHCARD:
1. PRINSIP PEMANTIK RETRIEVAL (Pertanyaan Singkat, Padat, Menusuk ke Inti):
   - Pertanyaan BUKAN tempat menumpahkan penjelasan, rangkuman, atau mukadimah.
   - Fungsi pertanyaan adalah 100% sebagai "retrieval trigger" (pemantik ingatan). Buat pertanyaan sesingkat, sepadat, dan sejelas mungkin agar kapasitas working memory otak terfokus penuh untuk mengingat jawaban di ingatan jangka panjang, bukan lelah membaca soal yang berbelit-belit.
2. PRINSIP HIGH-YIELD & FILTER ANTI-NALAR (Hanya Hal yang Tidak Bisa Dinalar Bebas):
   - JANGAN membuat kartu untuk hal-hal yang bisa dijawab hanya dengan akal sehat atau nalar umum tanpa menghafal! Memasukkan jawaban intuitif ke sistem flashcard adalah pemborosan waktu dan energi repetisi.
   - Flashcard DIKHUSUSKAN untuk pengetahuan eksak, identik, dan mutlak yang wajib diingat: lafadz ayat Al-Qur'an, matan & perawi hadits, istilah syar'i/ilmiah, definisi presisi, rukun/syarat tertentu, kaidah ushul/nahwu, nomor urut, atau fakta yang tidak bisa ditebak tanpa hafalan.
3. MINIMUM INFORMATION PRINCIPLE (Satu Kartu = Satu Atom Memori):
   - Satu kartu hanya menguji SATU butir pengetahuan tunggal.
   - DILARANG menuntut jawaban berupa daftar panjang majemuk (contoh buruk: "Sebutkan 10 rukun shalat!"). Jika ada daftar, pecah menjadi beberapa kartu atomik yang spesifik (contoh: "Rukun pertama shalat?", "Hukum membaca Al-Fatihah bagi makmum?"). Dengan begitu, lupa satu hal tidak menggagalkan seluruh kartu.
4. ESTETIKA TEKS ARAB & TERJEMAHAN (Wajib Pemisahan Baris):
   - Untuk ayat, hadits, doa, matan, atau kosakata Arab: teks Arab berharakat WAJIB diletakkan di baris sendiri, lalu beri ENTER (baris baru) untuk terjemahan/penjelasannya. Hal ini penting agar visual skrip Arab tertanam terpisah di memori visual tanpa terdistraksi teks Latin.
5. JAWABAN KUNCI YANG DEFINITIF:
   - Jawaban harus padat, akurat, langsung pada intinya, tidak bertele-tele.

### FORMAT BAKU EKSEKUSI:
T: [Pertanyaan singkat, padat, langsung men-trigger jawaban kunci]
J: [Jawaban kunci yang presisi, akurat, tanpa filler]

Contoh:
T: سُوْرَةُ النَّبَإِ مِنْ أَيِّ السُّوَرِ؟
Surah An-Naba' termasuk surah apa?
J: مَكِّيَّةٌ
Surah An-Naba' termasuk surah Makkiyah.

### ATURAN OUTPUT (ZERO CHIT-CHAT):
Langsung keluarkan daftar kartu dalam format "T:" dan "J:". DILARANG MENAMBAHKAN kata pembuka ("Tentu, ini kartu untuk Anda..."), pengantar, penutup, atau tanda kurung blok markdown.${material ? `\n\nMATERI RUJUKAN:\n${material}` : ""}`;
};

/**
 * Prompt untuk Mengubah Tanya-Jawab yang Sudah Ada di AI Eksternal ke Format Baku Masterpiece Unlupa
 */
export const EXTERNAL_AI_CARD_REFORMAT_PROMPT = (
  language: Language = "id",
): string => {
  if (language === "en") {
    return `You are a Master Spaced Repetition Flashcard Editor and Cognitive Science Specialist.

Your task is to audit, optimize, and reformat the existing Q&A material above into Masterpiece Flashcards adhering to strict cognitive science principles:

### REFORMATTING RULES:
1. SHARPEN THE QUESTIONS (Pure Retrieval Triggers):
   - Trim wordy, rambling questions into brief, punchy prompts that act strictly as retrieval triggers. Do not reveal the answer within the question.
2. FILTER OUT THE DEDUCIBLE (High-Yield Focus):
   - Prune and eliminate questions whose answers can easily be deduced with common sense without deliberate memorization.
   - Retain only high-yield, non-deducible facts: exact terminology, scripture, hadith texts/narrators, precise definitions, core rulings, and discrete data.
3. SPLIT COMPOUND ANSWERS (Atomic Information Principle):
   - If an existing answer contains multiple concepts or a list, decompose it into individual atomic cards. One card must test only one distinct fact.
4. ARABIC SCRIPT ON A SEPARATE LINE:
   - For Arabic text and translations, strictly place the Arabic on its own line and the translation on the next line (separated by a newline).
5. FORMAT COMPLIANCE:
   T: [Brief Question]
   J: [Target Answer]

### STRICT ZERO CHIT-CHAT POLICY:
Output ONLY the resulting "T:" and "J:" cards immediately. No pleasantries, no commentary, no markdown wrappers.`;
  }

  // Bahasa Indonesia (Masterpiece Default)
  return `Anda adalah seorang Master Spaced Repetition Flashcard Editor dan Kurator Sains Kognitif.

Tugas Anda adalah mengaudit, memperbaiki, memoles, dan mengubah seluruh materi tanya-jawab di atas menjadi Kartu Hafalan Masterpiece berstandar neurosains untuk aplikasi Unlupa:

### PANDUAN KURASI DAN RESTUKTURISASI:
1. PANGKAS PERTANYAAN (Jadikan Pemantik Retrieval Murni):
   - Ubah pertanyaan yang panjang, bertele-tele, atau mengandung petunjuk jawaban menjadi pertanyaan yang ringkas, tajam, padat, dan langsung menusuk ke inti persoalan. Pertanyaan HANYA bertugas sebagai pemantik ingatan, bukan bahan bacaan panjang.
2. ELIMINASI JAWABAN YANG BISA DINALAR (Filter Anti-Nalar):
   - Buang pertanyaan yang jawabannya cukup ditebak dengan logika umum tanpa perlu dihafal.
   - Pertahankan HANYA materi berkekuatan tinggi (high-yield): ayat Al-Qur'an, hadits, nama rawi, istilah syar'i/teknis, definisi presisi, rukun/syarat, kaidah, dan fakta identik yang wajib tertanam di memori permanen.
3. PECAH JAWABAN MAJEMUK (Prinsip Atomik):
   - Jika suatu jawaban memuat daftar panjang atau beberapa konsep sekaligus, pecah menjadi beberapa kartu terpisah. 1 kartu = 1 atom pengetahuan.
4. TEKS ARAB & TERJEMAHAN WAJIB PISAH BARIS:
   - Pisahkan teks Arab (berharakat rapi) dan terjemahan/penjelasannya dengan baris baru (ENTER).
5. FORMAT BAKU EKSEKUSI:
   T: [Pertanyaan singkat, padat, trigger murni]
   J: [Jawaban kunci yang presisi dan definitif]

### ATURAN OUTPUT (ZERO CHIT-CHAT):
Langsung keluarkan daftar kartu dalam format "T:" dan "J:". DILARANG menyertakan kata pembuka, penjelasan proses, salam, atau kalimat penutup.`;
};

/**
 * Prompt untuk Membuat Kitab / Buku Digital Lengkap Berbab-bab dari Topik / Materi
 */
export const EXTERNAL_AI_BOOK_PROMPT_TEMPLATE = (
  topic?: string,
  material?: string,
  language: Language = "id",
): string => {
  if (language === "en") {
    const subject = topic
      ? `on the topic of "${topic}"`
      : material
        ? `based on the attached material below`
        : `based on the following material`;
    return `You are a Senior Curriculum Architect and Master Spaced Repetition Book Builder, an expert in structured learning, cognitive neuroscience, and Dr. Piotr Wozniak's Twenty Rules of Formulating Knowledge.

Your task is to organize and generate a complete, chaptered digital study book ${subject} formatted specifically for instant import into the Unlupa Spaced Repetition app.

### COGNITIVE DESIGN ARCHITECTURE:
1. CHAPTER ORGANIZATION:
   - Divide the book into logical, sequential chapters (# Bab [Chapter Name]) that scaffold learning from fundamental definitions to advanced nuances.
2. THE RETRIEVAL TRIGGER PRINCIPLE:
   - Questions under each chapter must be brief, crisp, and direct. The question serves purely as a retrieval cue for memory, not an exposition.
3. HIGH-YIELD & NON-DEDUCIBLE CRITERIA:
   - Exclude trivial, intuitive facts that require no memory effort.
   - Focus on essential verbatim knowledge: exact definitions, sacred texts, authentic narrators, classical rulings, and key technical terms.
4. MINIMUM INFORMATION PRINCIPLE (Atomic Q&A):
   - Each card under every chapter must focus on a single memory target. Never create a card requiring a 5-item enumerated list; break it down into atomic cards.
5. ARABIC SCRIPT & TRANSLATIONS:
   - Put Arabic script with proper vowels on its own line, followed by a newline for its translation.

### STRICT OUTPUT FORMAT:
Judul: [Complete Book Title]
Deskripsi: [1-2 concise sentences summarizing the book]

# Bab 1: [Chapter 1 Name]
T: [Short question acting as a retrieval trigger]
J: [Precise target answer]

# Bab 2: [Chapter 2 Name]
T: [Short question acting as a retrieval trigger]
J: [Precise target answer]

### ZERO CHIT-CHAT POLICY:
Output ONLY the formatted text starting directly with "Judul:". Do NOT provide introductory polite remarks or concluding summaries.${material ? `\n\nSOURCE MATERIAL:\n${material}` : ""}`;
  }

  // Bahasa Indonesia (Masterpiece Default)
  const subject = topic
    ? `tentang "${topic}"`
    : material
      ? `berdasarkan materi terlampir di bawah`
      : `berdasarkan materi berikut`;
  return `Anda adalah seorang Senior Curriculum Architect dan Master Spaced Repetition Book Builder, pakar dalam taksonomi kurikulum, sains memori kognitif, dan prinsip formulasi pengetahuan (SuperMemo 20 Rules of Knowledge oleh Dr. Piotr Wozniak).

Tugas Anda adalah merancang dan menyusun sebuah Kitab / Buku Hafalan Berbab ${subject} yang terstruktur rapi dan berstandar ilmiah tinggi untuk aplikasi hafalan Unlupa.

### PRINSIP ARSITEKTUR KITAB BERBASIS SAINS KOGNITIF:
1. STRUKTUR BAB SISTEMATIS (Scaffolded Learning):
   - Bagi kitab menjadi bab-bab tematik yang logis (# Bab [Nama Bab]), bergerak bertahap dari bab dasar (pengenalan, definisi, rukun) menuju bab lanjutan/cabang.
2. PERTANYAAN SEBAGAI PEMANTIK RETRIEVAL (Singkat, Padat, Tajam):
   - Pertanyaan di setiap kartu BUKAN tempat meringkas materi. Pertanyaan wajib singkat, padat, dan berfungsi 100% sebagai trigger pemicu ingatan (*retrieval cue*). Hindari soal panjang yang menghabiskan fokus kognitif siswa hanya untuk membaca soal.
3. FILTER ANTI-NALAR & HIGH-YIELD:
   - Jangan buat kartu untuk fakta yang bisa ditebak dengan akal sehat / nalar bebas tanpa menghafal.
   - Fokuskan kartu pada fakta keras yang bernilai tinggi (*high-yield & identical*): ayat Al-Qur'an, lafadz hadits, nama rawi/tokoh, istilah ilmu syar'i/akademik, definisi presisi, rukun/syarat mutlak, atau kaidah baku.
4. MINIMUM INFORMATION PRINCIPLE (Kartu Atomik):
   - 1 kartu = 1 atom memori. Hindari menanyakan daftar panjang sekaligus dalam satu kartu. Pecah menjadi kartu-kartu atomik yang berdiri sendiri.
5. TIPOGRAFI TEKS ARAB & TERJEMAHAN:
   - Teks Arab berharakat wajib diletakkan di baris sendiri, lalu beri ENTER (baris baru) untuk terjemahan/penjelasannya.

### FORMAT BAKU EKSEKUSI:
Judul: [Judul Kitab Lengkap]
Deskripsi: [1-2 kalimat ringkasan inti kitab]

# Bab 1: [Nama Bab 1]
T: [Pertanyaan singkat, padat, pemantik retrieval]
J: [Jawaban kunci yang presisi dan definitif]

# Bab 2: [Nama Bab 2]
T: [Pertanyaan singkat, padat, pemantik retrieval]
J: [Jawaban kunci yang presisi dan definitif]

### ATURAN OUTPUT (ZERO CHIT-CHAT):
Langsung keluarkan teks berformat yang diawali dengan "Judul:". DILARANG menyertakan kata pembuka, basa-basi, atau penutup.${material ? `\n\nMATERI RUJUKAN:\n${material}` : ""}`;
};

/**
 * Prompt untuk Mengubah Materi / Percakapan Tanya-Jawab Menjadi Struktur Buku Berbab di Unlupa
 */
export const EXTERNAL_AI_BOOK_REFORMAT_PROMPT = (
  language: Language = "id",
): string => {
  if (language === "en") {
    return `You are a Master Curriculum Editor and Spaced Repetition Specialist.

Your task is to transform, curate, and organize the raw text / conversation / notes above into a Masterpiece Chaptered Digital Book for the Unlupa app:

### CURATION & STRUCTURAL PRINCIPLES:
1. THEMATIC CHAPTER CATEGORIZATION:
   - Cluster the unstructured information into clean, logical chapters prefixed with "# Bab [Chapter Name]".
2. AGGRESSIVE PRUNING OF TRIVIA (High-Yield Filter):
   - Ruthlessly discard filler text, rhetorical chatter, and information easily deduced with common sense.
   - Retain only high-yield, exact knowledge: scripture, hadith texts, technical terms, essential criteria, and non-deducible facts.
3. RETRIEVAL TRIGGER TRANSFORMATION:
   - Rewrite rambling questions into crisp, punchy cues. Keep them short and laser-focused on evoking the target answer.
4. DECOMPOSE INTO ATOMIC CARDS:
   - Break down complex, multi-layered answers into single-target atomic cards.
5. ARABIC SCRIPT NEWLINE RULE:
   - Strictly place vocalized Arabic script on its own line and the translation on the following line.
6. FORMAT SPECIFICATION:
   Judul: [Book Title]
   Deskripsi: [Short 1-2 sentence description]

   # Bab 1: [Chapter Name]
   T: [Brief Question]
   J: [Target Answer]

### STRICT ZERO CHIT-CHAT POLICY:
Output ONLY the formatted book starting directly with "Judul:". No greetings, no preamble, and no concluding commentary.`;
  }

  // Bahasa Indonesia (Masterpiece Default)
  return `Anda adalah seorang Master Curriculum Editor dan Kurator Spaced Repetition Berstandar Sains Kognitif.

Tugas Anda adalah membedah, menyortir, dan mentransformasikan seluruh materi kasar / catatan / percakapan di atas menjadi sebuah Kitab / Buku Hafalan Berbab Masterpiece untuk aplikasi Unlupa:

### PANDUAN KURASI DAN STRUKTURISASI:
1. PENGELOMPOKKAN BAB TEMATIK:
   - Kelompokkan materi yang berserakan ke dalam bab-bab yang rapi, runtut, dan tematik dengan penanda "# Bab [Nama Bab]".
2. KURASI KETAT & FILTER ANTI-NALAR:
   - Buang penjelasan bertele-tele dan informasi yang bisa ditebak dengan akal sehat tanpa perlu dihafal.
   - Ambil HANYA substansi inti yang bernilai tinggi (*high-yield*): ayat Al-Qur'an, hadits, nama rawi, istilah kunci syar'i/ilmiah, definisi presisi, rukun/syarat, dan fakta identik yang wajib menancap di memori permanen.
3. REFORMULASI PERTANYAAN (Trigger Retrieval Murni):
   - Tulis ulang pertanyaan menjadi ringkas, padat, dan langsung men-trigger jawaban kunci tanpa membocorkan jawaban atau berbelit-belit.
4. PECAH MENJADI KARTU ATOMIK (Minimum Information Principle):
   - Jika ada jawaban yang memuat daftar beberapa poin, pecah menjadi kartu-kartu tersendiri yang masing-masing menguji satu poin spesifik.
5. TEKS ARAB & TERJEMAHAN WAJIB PISAH BARIS:
   - Tempatkan teks Arab berharakat di baris tersendiri, lalu baris baru di bawahnya untuk terjemahan/penjelasan.
6. FORMAT BAKU EKSEKUSI:
   Judul: [Judul Kitab]
   Deskripsi: [Ringkasan 1-2 kalimat]

   # Bab 1: [Nama Bab 1]
   T: [Pertanyaan singkat, padat, pemicu retrieval]
   J: [Jawaban kunci yang presisi]

   # Bab 2: [Nama Bab 2]
   T: [Pertanyaan singkat, padat, pemicu retrieval]
   J: [Jawaban kunci yang presisi]

### ATURAN OUTPUT (ZERO CHIT-CHAT):
Langsung keluarkan teks berformat yang diawali dengan "Judul:". DILARANG menyertakan kata pembuka, salam, atau kata penutup.`;
};
