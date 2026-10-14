import { prisma } from './src/server/db';

const BASE_URL = 'http://localhost:3000/api/v1';

interface TestStepResult {
  step: string;
  passed: boolean;
  details: string;
}

const testResults: TestStepResult[] = [];

function record(step: string, passed: boolean, details: string) {
  testResults.push({ step, passed, details });
  const icon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${icon} [${step}]: ${details}`);
}

async function runRegression() {
  console.log('\n================================================================');
  console.log('🧪 UNLUPA V2 — QURAN ACTIVATION & REVIEW PERSISTENCE TEST SUITE');
  console.log('================================================================\n');

  const timestamp = Date.now();
  const userAEmail = `quran_user_a_${timestamp}@unlupa.test`;
  const userBEmail = `quran_user_b_${timestamp}@unlupa.test`;
  const password = 'PasswordKuat123!';
  const targetPageNumber = 2; // Halaman 2: Al-Baqarah 1-5

  let userAId = '';
  let userBId = '';
  let tokenA = '';
  let tokenB = '';

  try {
    // --------------------------------------------------------------------------
    // Setup: Register User A and User B
    // --------------------------------------------------------------------------
    console.log('--- SETUP: Registrasi Akun Uji ---');
    const regResA = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User A Penghafal', email: userAEmail, password }),
    });
    const regDataA = await regResA.json();
    userAId = regDataA.data?.user?.id;
    tokenA = regDataA.data?.token;

    const regResB = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'User B Santri', email: userBEmail, password }),
    });
    const regDataB = await regResB.json();
    userBId = regDataB.data?.user?.id;
    tokenB = regDataB.data?.token;

    record('Setup Akun', regResA.status === 201 && regResB.status === 201, `User A: ${userAId}, User B: ${userBId}`);

    // --------------------------------------------------------------------------
    // Skenario A — Persistensi User yang Sama
    // --------------------------------------------------------------------------
    console.log('\n--- SKENARIO A: Persistensi User yang Sama ---');

    // 1. User A aktifkan Halaman 2
    const actResA = await fetch(`${BASE_URL}/quran/pages/${targetPageNumber}/activate`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenA}` },
    });
    const actDataA = await actResA.json();
    const actSuccess = actResA.status === 200 && actDataA.data?.isActive === true && actDataA.data?.pageNumber === targetPageNumber;
    record('A1. Aktivasi Halaman', actSuccess, `HTTP ${actResA.status}, isActive: ${actDataA.data?.isActive}, status: ${actDataA.data?.status}`);

    // Verifikasi di PostgreSQL langsung
    const dbPageAfterAct = await prisma.userQuranPage.findUnique({
      where: { userId_pageNumber: { userId: userAId, pageNumber: targetPageNumber } },
    });
    record('A2. Verifikasi DB PostgreSQL', dbPageAfterAct?.isActive === true, `DB Record id: ${dbPageAfterAct?.id}, status: ${dbPageAfterAct?.status}`);

    // 2. User A review Halaman 2 dengan rating 2 (Lancar)
    const revResA = await fetch(`${BASE_URL}/quran/pages/${targetPageNumber}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        rating: 2,
        notes: 'Review pertama lancar tapi perlu teliti ayat 4',
        issueTypes: ['tajwid'],
        problemAyahs: '4',
      }),
    });
    const revDataA = await revResA.json();
    const revSuccess = revResA.status === 200 && revDataA.data?.page?.reps === 1 && revDataA.data?.reviewLog?.rating === 2;
    record('A3. Review Halaman Disimpan', revSuccess, `Reps: ${revDataA.data?.page?.reps}, Stability: ${revDataA.data?.page?.stability}, Log ID: ${revDataA.data?.reviewLog?.id}`);

    // 3. Ambil ulang data halaman User A melalui API
    const getPageRes = await fetch(`${BASE_URL}/quran/pages/${targetPageNumber}`, {
      headers: { 'Authorization': `Bearer ${tokenA}` },
    });
    const getPageData = await getPageRes.json();
    const getSuccess = getPageRes.status === 200 && getPageData.data?.isActive === true && getPageData.data?.reviewLogs?.length === 1;
    record('A4. Re-fetch via API', getSuccess, `isActive: ${getPageData.data?.isActive}, reviewLogs count: ${getPageData.data?.reviewLogs?.length}`);

    // 4. Logout User A
    const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenA}` },
    });
    record('A5. Logout User A', logoutRes.status === 200, `HTTP ${logoutRes.status}`);

    // 5. Login ulang sebagai User A
    const reloginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userAEmail, password }),
    });
    const reloginData = await reloginRes.json();
    const newTokenA = reloginData.data?.token;
    record('A6. Login Ulang User A', reloginRes.status === 200 && Boolean(newTokenA), `HTTP ${reloginRes.status}, Token baru diterbitkan`);

    // 6. Fetch ulang seluruh halaman User A setelah login ulang
    const pagesAfterLoginRes = await fetch(`${BASE_URL}/quran/pages`, {
      headers: { 'Authorization': `Bearer ${newTokenA}` },
    });
    const pagesAfterLoginData = await pagesAfterLoginRes.json();
    const page2AfterLogin = (pagesAfterLoginData.data || []).find((p: any) => p.pageNumber === targetPageNumber);
    const persistAfterLogin = page2AfterLogin && page2AfterLogin.isActive === true && page2AfterLogin.reps === 1 && page2AfterLogin.reviewLogs?.length === 1;
    record('A7. Status Tetap Aktif Pasca Login Ulang', Boolean(persistAfterLogin), `Page 2 isActive: ${page2AfterLogin?.isActive}, reps: ${page2AfterLogin?.reps}, logs: ${page2AfterLogin?.reviewLogs?.length}`);

    // --------------------------------------------------------------------------
    // Skenario B — Isolasi Antar-User
    // --------------------------------------------------------------------------
    console.log('\n--- SKENARIO B: Isolasi Antar-User ---');

    // 1. Fetch data Quran User B (belum pernah aktivasi halaman 2)
    const pagesBRes = await fetch(`${BASE_URL}/quran/pages`, {
      headers: { 'Authorization': `Bearer ${tokenB}` },
    });
    const pagesBData = await pagesBRes.json();
    const page2ForUserB = (pagesBData.data || []).find((p: any) => p.pageNumber === targetPageNumber);
    const userBIsClean = !page2ForUserB || page2ForUserB.isActive === false;
    record('B1. User B Halaman Bersih/Nonaktif', Boolean(userBIsClean), `User B Page 2: ${page2ForUserB ? (page2ForUserB.isActive ? 'AKTIF (SALAH)' : 'NONAKTIF') : 'TIDAK ADA RECORD (BERSIH)'}`);

    // 2. User B mengaktifkan Halaman 3 (bukan halaman 2)
    const actBRes = await fetch(`${BASE_URL}/quran/pages/3/activate`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenB}` },
    });
    record('B2. User B Aktivasi Halaman 3', actBRes.status === 200, `HTTP ${actBRes.status}`);

    // 3. Pastikan User A Halaman 2 tetap utuh dan tidak terpengaruh User B
    const verifyPageARes = await fetch(`${BASE_URL}/quran/pages/${targetPageNumber}`, {
      headers: { 'Authorization': `Bearer ${newTokenA}` },
    });
    const verifyPageAData = await verifyPageARes.json();
    const userAIntact = verifyPageAData.data?.isActive === true && verifyPageAData.data?.reps === 1;
    record('B3. Data User A Tetap Utuh & Terisolasi', Boolean(userAIntact), `User A Page 2 isActive: ${verifyPageAData.data?.isActive}, reps: ${verifyPageAData.data?.reps}`);

    // --------------------------------------------------------------------------
    // Skenario C — Konsistensi Data & Deaktivasi
    // --------------------------------------------------------------------------
    console.log('\n--- SKENARIO C: Konsistensi Data & Deaktivasi ---');

    // 1. Deaktivasi Halaman 2 oleh User A
    const deactRes = await fetch(`${BASE_URL}/quran/pages/${targetPageNumber}/deactivate`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${newTokenA}` },
    });
    const deactData = await deactRes.json();
    const deactSuccess = deactRes.status === 200 && deactData.data?.isActive === false;
    record('C1. Deaktivasi Halaman', deactSuccess, `isActive: ${deactData.data?.isActive}`);

    // 2. Verifikasi FSRS history tidak terhapus saat deaktivasi
    const verifyFSRSAfterDeact = await prisma.userQuranPage.findUnique({
      where: { userId_pageNumber: { userId: userAId, pageNumber: targetPageNumber } },
      include: { reviewLogs: true },
    });
    const historyPreserved = verifyFSRSAfterDeact?.isActive === false && (verifyFSRSAfterDeact?.reps || 0) >= 1 && (verifyFSRSAfterDeact?.reviewLogs.length || 0) >= 1;
    record('C2. Histori FSRS & Review Log Dipertahankan Saat Nonaktif', Boolean(historyPreserved), `isActive: ${verifyFSRSAfterDeact?.isActive}, reps: ${verifyFSRSAfterDeact?.reps}, logs: ${verifyFSRSAfterDeact?.reviewLogs.length}`);

    // 3. Aktivasi kembali Halaman 2 -> Status kembali aktif dan histori lama tetap ada
    const reactivateRes = await fetch(`${BASE_URL}/quran/pages/${targetPageNumber}/activate`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${newTokenA}` },
    });
    const reactivateData = await reactivateRes.json();
    const reactivateSuccess = reactivateRes.status === 200 && reactivateData.data?.isActive === true && reactivateData.data?.reps === 1;
    record('C3. Reaktivasi Mempertahankan Progres', reactivateSuccess, `isActive: ${reactivateData.data?.isActive}, reps: ${reactivateData.data?.reps}`);

  } finally {
    // --------------------------------------------------------------------------
    // Cleanup Akun Uji
    // --------------------------------------------------------------------------
    console.log('\n--- CLEANUP: Membersihkan Akun Pengujian ---');
    if (userAId) {
      await prisma.userQuranPage.deleteMany({ where: { userId: userAId } }).catch(() => {});
      await prisma.user.deleteMany({ where: { id: userAId } }).catch(() => {});
    }
    if (userBId) {
      await prisma.userQuranPage.deleteMany({ where: { userId: userBId } }).catch(() => {});
      await prisma.user.deleteMany({ where: { id: userBId } }).catch(() => {});
    }
    await prisma.$disconnect();
    console.log('✨ Pembersihan selesai.');
  }

  // Summary
  console.log('\n================================================================');
  console.log('📊 RINGKASAN HASIL REGRESI');
  console.log('================================================================');
  const allPassed = testResults.every(r => r.passed);
  console.log(`Total Pengujian: ${testResults.length}`);
  console.log(`Lolos (PASS): ${testResults.filter(r => r.passed).length}`);
  console.log(`Gagal (FAIL): ${testResults.filter(r => !r.passed).length}`);
  console.log(`Status Akhir: ${allPassed ? '✅ SEMUA SKENARIO TERPENUHI (100% PASS)' : '❌ TERDAPAT KEGAGALAN'}`);
  console.log('================================================================\n');

  if (!allPassed) {
    process.exit(1);
  }
}

runRegression().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
