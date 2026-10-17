import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';
import { soundEffects } from '../../lib/soundFeedback';
import { ClassStudent, ClassGroup, Book } from '../../types';
import { StudentQuranView } from './StudentQuranView';
import { StudentBookView } from './StudentBookView';
import { StudentBookProgressView } from './StudentBookProgressView';
import { StudentProgressReportModal } from './StudentProgressReportModal';
import { StudentDetailModal } from './StudentDetailModal';
import { JuzRangeSelector } from './JuzRangeSelector';
import { PersonalSpace } from '../personal/PersonalSpace';
import { ClassSearchModal } from './ClassSearchModal';
import { isDue } from '../../lib/fsrs';
import { isPageInJuzList } from '../../data/quranData';
import { uploadOrCompressImage } from '../../lib/imageUtils';
import {
  BookOpen,
  Users,
  Clock,
  Plus,
  Copy,
  Check,
  ArrowLeft,
  ArrowRight,
  BookMarked,
  Search,
  Trash2,
  Upload,
  X,
  Loader2,
  AlertCircle,
  MessageCircle,
  CheckCircle2,
  ChevronRight,
  Share2,
  Edit3,
  Award,
  List,
  UserMinus,
  ShieldCheck,
  LogOut,
  Archive,
  RotateCcw,
  Lock,
  GraduationCap,
  TrendingUp,
  Brain,
} from 'lucide-react';

// Preset cover images as aesthetic alternatives
const COVER_PRESETS = {
  quran: [
    {
      id: 'q1',
      title: 'Mushaf Klasik',
      url: 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 'q2',
      title: 'Mushaf Madinah',
      url: 'https://images.unsplash.com/photo-1585036156171-384164a8c675?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 'q3',
      title: 'Halaqah Masjid',
      url: 'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?w=600&auto=format&fit=crop&q=80',
    },
  ],
  nonQuran: [
    {
      id: 'b1',
      title: 'Kitab Kuning',
      url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 'b2',
      title: 'Kaidah Nahwu',
      url: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=600&auto=format&fit=crop&q=80',
    },
    {
      id: 'b3',
      title: 'Manuskrip',
      url: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&auto=format&fit=crop&q=80',
    },
  ],
};

const generateRandomCode = (type: 'quran' | 'non-quran') => {
  const prefix = type === 'quran' ? 'QRN' : 'CLS';
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${num}`;
};

// Canvas-based image compression: scales down to max 640px and converts to 82% JPEG
const compressAndResizeImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Format file bukan gambar yang valid.'));
      img.onload = () => {
        try {
          const maxDim = 640;
          let { width, height } = img;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(reader.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.82);
          resolve(compressed);
        } catch {
          resolve(reader.result as string);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export const TeachingSpace: React.FC = () => {
  const { 
    teachingClasses, 
    createTeachingClass, 
    deleteTeachingClass, 
    closeTeachingClass,
    reopenTeachingClass,
    updateTeachingClass,
    removeStudentFromClass,
    books, 
    items,
    language,
    setActiveSpace,
    setEditingClassBookId,
    quranSpaceCode,
    quranStats,
    quranPages,
    isFeatureAllowed,
    openUpgradeModal,
    tierConfig,
    userProfile,
    getLiveStudentQuranData,
    getLiveStudentBookItems,
    selectedTeachingClassId,
    setSelectedTeachingClassId,
    selectedPersonalBookId,
    setSelectedPersonalBookId,
    refreshClassesFromBackend
  } = useApp();

  // Active Category: 'all' | 'quran' | 'non-quran'
  const [activeCategory, setActiveCategory] = useState<'all' | 'quran' | 'non-quran'>('all');
  const [bookPickerTab, setBookPickerTab] = useState<'personal' | 'imported'>('personal');
  const [searchQuery, setSearchQuery] = useState('');
  const [isClassSearchOpen, setIsClassSearchOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(selectedTeachingClassId || null);

  useEffect(() => {
    refreshClassesFromBackend();
  }, [refreshClassesFromBackend]);

  useEffect(() => {
    if (selectedTeachingClassId) {
      setSelectedClassId(selectedTeachingClassId);
    }
  }, [selectedTeachingClassId]);
  const [isManagingBook, setIsManagingBook] = useState(false);
  const [classToEditId, setClassToEditId] = useState<string | null>(null);
  const [inspectingStudentId, setInspectingStudentId] = useState<string | null>(null);
  const [selectedModalStudent, setSelectedModalStudent] = useState<{ student: ClassStudent; initialTab?: 'due' | 'all_pages' | 'feedback' | 'retention' } | null>(null);
  const [studentFilter, setStudentFilter] = useState<'all' | 'due' | 'fluent'>('all');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [analyticsTab, setAnalyticsTab] = useState<'intervals' | 'backlog' | 'champions'>('intervals');
  const [reportStudent, setReportStudent] = useState<ClassStudent | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createdClassSuccess, setCreatedClassSuccess] = useState<ClassGroup | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [studentToRemove, setStudentToRemove] = useState<{ id: string; name: string } | null>(null);
  const [classToDelete, setClassToDelete] = useState<{ id: string; name: string } | null>(null);
  const [classToClose, setClassToClose] = useState<{ id: string; name: string } | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditClassOpen, setIsEditClassOpen] = useState(false);
  const [formState, setFormState] = useState<{
    type: 'quran' | 'non-quran';
    name: string;
    description: string;
    coverUrl: string;
    targetJuz: string;
    assignedBookId: string;
  }>({
    type: 'quran',
    name: '',
    description: '',
    coverUrl: '',
    targetJuz: '1-5',
    assignedBookId: books[0]?.id || '',
  });

  const selectedClass = teachingClasses.find(c => c.id === selectedClassId) || null;
  const isQuran = selectedClass?.type === 'quran';

  const allStudents = useMemo(() => {
    if (!selectedClass) return [];
    const assignedIds = selectedClass.assignedBookIds || [];
    const assignedId = assignedIds[0];
    const assignedClassBookId = assignedId ? `class-book-${selectedClass.id}-${assignedId}` : undefined;

    return (selectedClass.students || []).map(std => {
      const isCurrentUser = std.id === userProfile.id;
      if (isCurrentUser) return std;

      if (isQuran) {
        const liveQuranData = getLiveStudentQuranData(std.id);
        if (liveQuranData.length > 0) {
          return { ...std, quranData: liveQuranData };
        }
      } else {
        const rawLiveItems = getLiveStudentBookItems(std.id);
        if (rawLiveItems.length > 0) {
          const liveItems = rawLiveItems.filter(i => 
            i.bookId?.startsWith(`class-book-${selectedClass.id}-`) ||
            (assignedClassBookId && i.bookId === assignedClassBookId) ||
            (assignedId && i.bookId === assignedId) ||
            assignedIds.includes(i.bookId)
          );
          if (liveItems.length > 0) {
            return { ...std, bookItemsData: liveItems };
          }
        }
      }
      return std;
    });
  }, [selectedClass, isQuran, userProfile.id, getLiveStudentQuranData, getLiveStudentBookItems]);

  const analyticsData = useMemo(() => {
    let tierMapanCount = 0;
    let tierKokohCount = 0;
    let tierKonsolidasiCount = 0;
    let tierKritisCount = 0;
    let totalActiveItemsAll = 0;

    const studentStats = allStudents.map(student => {
      let activeCount = 0;
      let overdueCount = 0;
      let studentMapanCount = 0;
      let studentKokohCount = 0;
      let studentKonsolidasiCount = 0;
      let studentKritisCount = 0;

      const getTier = (stab: number) => {
        if (isQuran) {
          if (stab >= 30) return 'mapan';
          if (stab >= 15) return 'kokoh';
          if (stab >= 7) return 'konsolidasi';
          return 'kritis';
        } else {
          if (stab >= 336) return 'mapan';
          if (stab >= 100) return 'kokoh';
          if (stab >= 30) return 'konsolidasi';
          return 'kritis';
        }
      };

      if (isQuran) {
        (student.quranData || (student as any).pages)?.forEach(p => {
          if (p.isActive) {
            activeCount++;
            totalActiveItemsAll++;
            if (isDue(p.fsrsData.nextReview, p.isActive, p.fsrsData.lastReview)) overdueCount++;
            const stab = p.fsrsData.stability || 0;
            const tier = getTier(stab);
            if (tier === 'mapan') {
              studentMapanCount++;
              tierMapanCount++;
            } else if (tier === 'kokoh') {
              studentKokohCount++;
              tierKokohCount++;
            } else if (tier === 'konsolidasi') {
              studentKonsolidasiCount++;
              tierKonsolidasiCount++;
            } else {
              studentKritisCount++;
              tierKritisCount++;
            }
          }
        });
      } else {
        (student.bookItemsData || (student as any).itemsProgress)?.forEach((prog) => {
          if (prog.isActive) {
            activeCount++;
            totalActiveItemsAll++;
            if (isDue(prog.fsrsData.nextReview, prog.isActive, prog.fsrsData.lastReview)) overdueCount++;
            const stab = prog.fsrsData.stability || 0;
            const tier = getTier(stab);
            if (tier === 'mapan') {
              studentMapanCount++;
              tierMapanCount++;
            } else if (tier === 'kokoh') {
              studentKokohCount++;
              tierKokohCount++;
            } else if (tier === 'konsolidasi') {
              studentKonsolidasiCount++;
              tierKonsolidasiCount++;
            } else {
              studentKritisCount++;
              tierKritisCount++;
            }
          }
        });
      }

      // Weighted score factoring in all 4 pyramid levels
      const compositeScore = activeCount > 0 
        ? Math.round(((studentMapanCount * 1.0 + studentKokohCount * 0.75 + studentKonsolidasiCount * 0.5 + studentKritisCount * 0.25) / activeCount) * 100) 
        : 0;

      return {
        student,
        activeCount,
        overdueCount,
        studentMapanCount,
        studentKokohCount,
        studentKonsolidasiCount,
        studentKritisCount,
        compositeScore
      };
    });

    const studentsByBacklog = [...studentStats].sort((a, b) => b.overdueCount - a.overdueCount);
    const studentsByRanking = [...studentStats].sort((a, b) => b.compositeScore - a.compositeScore);

    return {
      totalActiveItemsAll,
      tierMapanCount,
      tierKokohCount,
      tierKonsolidasiCount,
      tierKritisCount,
      studentsByBacklog,
      studentsByRanking
    };
  }, [allStudents, isQuran]);

  // Filter classes by category & search query
  const quranClasses = teachingClasses.filter(c => c.type === 'quran');
  const nonQuranClasses = teachingClasses.filter(c => c.type === 'non-quran');

  // Swipe gesture: direct horizontal & vertical navigation across Teaching Space layers
  useSwipeGesture(null, {
    disabled: Boolean(typeof document !== 'undefined' && document.body.getAttribute('data-annotation-open') === 'true'),
    onSwipeRight: () => {
      // 1. Tutup modal/dialog jika terbuka
      if (isCreateOpen) {
        setIsCreateOpen(false);
        return;
      }
      if (isEditClassOpen) {
        setIsEditClassOpen(false);
        return;
      }
      if (studentToRemove) {
        setStudentToRemove(null);
        return;
      }
      if (classToDelete) {
        setClassToDelete(null);
        return;
      }
      if (createdClassSuccess) {
        setCreatedClassSuccess(null);
        return;
      }

      // 2. Jika sedang memeriksa santri/siswa tertentu -> kembali ke detail kelas
      if (inspectingStudentId) {
        soundEffects.playCardFlip('backward');
        setInspectingStudentId(null);
        return;
      }

      // 3. Jika sedang membuka suatu kelas -> kembali ke daftar kelas
      if (selectedClassId) {
        soundEffects.playCardFlip('backward');
        setSelectedClassId(null);
        setIsManagingBook(false);
        return;
      }

      // 4. Jika di halaman utama ruang Kelas/Mengajar -> usap kanan ke Ruang Buku
      soundEffects.playCardFlip('backward');
      setActiveSpace('personal');
    },
    onSwipeDown: () => {
      if (isCreateOpen) setIsCreateOpen(false);
      else if (isEditClassOpen) setIsEditClassOpen(false);
      else if (studentToRemove) setStudentToRemove(null);
      else if (classToDelete) setClassToDelete(null);
      else if (createdClassSuccess) setCreatedClassSuccess(null);
    },
    onSwipeLeft: () => {
      // Hanya berpindah ruang jika di halaman utama ruang kelas tanpa modal terbuka
      if (isCreateOpen || isEditClassOpen || studentToRemove || classToDelete || createdClassSuccess) return;

      if (inspectingStudentId) {
        // Santri berikutnya
        const currentStudents = selectedClass?.students || [];
        const sIdx = currentStudents.findIndex(s => s.id === inspectingStudentId);
        if (sIdx >= 0 && sIdx < currentStudents.length - 1) {
          soundEffects.playCardFlip('forward');
          setInspectingStudentId(currentStudents[sIdx + 1].id);
        }
        return;
      }

      if (selectedClassId) {
        // Kelas berikutnya dalam daftar
        const currentList = activeCategory === 'quran' ? quranClasses : nonQuranClasses;
        const cIdx = currentList.findIndex(c => c.id === selectedClassId);
        if (cIdx >= 0 && cIdx < currentList.length - 1) {
          soundEffects.playCardFlip('forward');
          setSelectedClassId(currentList[cIdx + 1].id);
        }
        return;
      }

      // Halaman utama ruang kelas -> usap kiri ke Ruang Peringkat (leaderboard)
      soundEffects.playCardFlip('forward');
      setActiveSpace('leaderboard');
    },
    threshold: 40,
    minRatio: 1.15,
  });
  
  const currentCategoryClasses = (
    activeCategory === 'all'
      ? teachingClasses
      : activeCategory === 'quran'
      ? quranClasses
      : nonQuranClasses
  ).filter(c => 
    (c.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
    (c.code || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
    (c.description ? c.description.toLowerCase().includes((searchQuery || '').toLowerCase()) : false)
  );

  const inspectingStudent = allStudents.find(s => s.id === inspectingStudentId) || selectedClass?.students.find(s => s.id === inspectingStudentId) || null;

  // High-level aggregate metrics for the 2-in-1 Stats Banner
  const quranClassesCount = quranClasses.length;
  const quranStudentsCount = quranClasses.reduce((acc, c) => acc + c.students.length, 0);

  const nonQuranClassesCount = nonQuranClasses.length;
  const nonQuranStudentsCount = nonQuranClasses.reduce((acc, c) => acc + c.students.length, 0);

  const isPro = userProfile.plan === 'premium' || userProfile.plan === 'institutional' || userProfile.role === 'admin' || userProfile.role === 'superadmin';
  const maxQuran = tierConfig.freeTier.maxQuranClasses ?? 1;
  const maxNonQuran = tierConfig.freeTier.maxNonQuranClasses ?? 1;
  const isQuranLimitReached = !isPro && quranClassesCount >= maxQuran;
  const isNonQuranLimitReached = !isPro && nonQuranClassesCount >= maxNonQuran;

  const handleCopyCode = (code: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2200);
  };

  const handleShareWhatsApp = (code: string, className: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const text = `Assalamu'alaikum Warahmatullahi Wabarakatuh.\n\nUndangan bergabung ke kelas *${className}*:\n🔑 *Kode Kelas:* ${code}\n\nSilakan masukkan kode di atas pada aplikasi untuk bergabung ke halaqah bimbingan. Terima kasih!`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleOpenCreateModal = (typeToCreate?: 'all' | 'quran' | 'non-quran') => {
    const t = (!typeToCreate || typeToCreate === 'all')
      ? (activeCategory === 'non-quran' ? 'non-quran' : 'quran')
      : typeToCreate;

    const check = isFeatureAllowed('create_class', undefined, t);
    if (!check.allowed) {
      openUpgradeModal(
        check.reason,
        language === 'en'
          ? 'Free accounts can create up to 1 Al-Qur\'an class and 1 Kitab class. Upgrade to Unlupa Pro to manage unlimited classes & students.'
          : 'Batas akun Free adalah maksimal 1 kelas Al-Qur\'an dan 1 kelas Kitab. Upgrade ke Unlupa Pro untuk membuat kelas & membina santri tanpa batas.'
      );
      return;
    }
    setUploadError(null);
    setIsUploadingImage(false);
    // Prefer personal (editable) book as initial default
    const initialBook = books.find(b => !b.masterBookId && b.category !== 'imported') || books[0];
    setFormState({
      type: t,
      name: '',
      description: '',
      coverUrl: '',
      targetJuz: '1-5',
      assignedBookId: initialBook?.id || '',
    });
    setBookPickerTab(initialBook?.isReadonly ? 'imported' : 'personal');
    setIsCreateOpen(true);
  };

  // Process file upload safely from device storage
  const processUploadedFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Harap pilih file gambar (JPG, PNG, atau WebP).');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setUploadError('Ukuran file gambar maksimal 3MB.');
      return;
    }

    try {
      setIsUploadingImage(true);
      setUploadError(null);
      const url = await uploadOrCompressImage(file, 'classes');
      setFormState(prev => ({ ...prev, coverUrl: url }));
    } catch (err: any) {
      setUploadError(err.message || 'Gagal memproses gambar. Coba gunakan foto lain.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  const handleDropImage = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  const handleOpenEditClass = (cls: ClassGroup, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setClassToEditId(cls.id);
    setFormState({
      type: cls.type,
      name: cls.name,
      description: cls.description || '',
      coverUrl: cls.coverUrl || '',
      targetJuz: cls.requiredJuzList && cls.requiredJuzList.length > 0
        ? (cls.requiredJuzList.length === 30
            ? 'all'
            : cls.requiredJuzList.length === 1
            ? String(cls.requiredJuzList[0])
            : `${Math.min(...cls.requiredJuzList)}-${Math.max(...cls.requiredJuzList)}`)
        : '1-5',
      assignedBookId: cls.assignedBookIds?.[0] || books[0]?.id || ''
    });
    const currentBook = books.find(b => b.id === (cls.assignedBookIds?.[0] || books[0]?.id));
    setBookPickerTab(currentBook?.isReadonly ? 'imported' : 'personal');
    setIsEditClassOpen(true);
  };

  const parseTargetJuzToNumbers = (val: string): number[] => {
    if (!val || val === 'all' || val === '1-30') {
      return Array.from({ length: 30 }, (_, i) => i + 1);
    }
    if (val.includes('-')) {
      const parts = val.split('-').map(Number);
      const min = Math.max(1, Math.min(parts[0] || 1, parts[1] || 1));
      const max = Math.min(30, Math.max(parts[0] || 1, parts[1] || 1));
      const list: number[] = [];
      for (let i = min; i <= max; i++) {
        list.push(i);
      }
      return list;
    }
    const num = Number(val);
    if (!isNaN(num) && num >= 1 && num <= 30) {
      return [num];
    }
    return [1, 2, 3, 4, 5];
  };

  const handleEditClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = classToEditId || selectedClassId;
    if (!targetId || !formState.name.trim()) return;
    
    updateTeachingClass(targetId, {
      name: formState.name.trim(),
      description: formState.description.trim(),
      coverUrl: formState.coverUrl,
      requiredJuzList: formState.type === 'quran' 
        ? parseTargetJuzToNumbers(formState.targetJuz)
        : undefined,
      assignedBookIds: formState.type === 'non-quran' && formState.assignedBookId ? [formState.assignedBookId] : undefined
    });
    setIsEditClassOpen(false);
    setClassToEditId(null);
  };

  const handleDeleteStudent = (studentId: string, studentName: string) => {
    setStudentToRemove({ id: studentId, name: studentName });
  };

  const handleConfirmRemoveStudent = () => {
    if (!selectedClass || !studentToRemove) return;
    removeStudentFromClass(selectedClass.id, studentToRemove.id);
    setStudentToRemove(null);
  };

  const handleConfirmCloseClass = () => {
    if (!classToClose) return;
    closeTeachingClass(classToClose.id);
    setClassToClose(null);
  };

  const handleConfirmDeleteClass = () => {
    if (!classToDelete) return;
    deleteTeachingClass(classToDelete.id);
    setClassToDelete(null);
    setSelectedClassId(null); setIsManagingBook(false);
  };

  // Helper to find the associated master book (in Pribadi or Pustaka) for a class
  const getClassAssociatedBook = (cls: ClassGroup | null): Book | null => {
    if (!cls || cls.type === 'quran') return null;

    const isEnrolledBook = (b: Book) => b.category === 'class' || Boolean(b.classId) || b.id.startsWith('class-book-');
    const masterBooks = books.filter(b => !isEnrolledBook(b));

    // 0. Use the authoritative classroom book snapshot in assignedBooksData first
    if (cls.assignedBooksData && cls.assignedBooksData.length > 0 && cls.assignedBooksData[0]?.book) {
      return cls.assignedBooksData[0].book;
    }

    // 1. Direct assignment in assignedBookIds (search masterBooks first)
    if (cls.assignedBookIds && cls.assignedBookIds.length > 0) {
      for (const bId of cls.assignedBookIds) {
        const found = masterBooks.find(b => b.id === bId || b.masterBookId === bId);
        if (found) return found;
      }
    }

    // 2. Direct assignment in assignedBooksData (search masterBooks first)
    if (cls.assignedBooksData && cls.assignedBooksData.length > 0) {
      for (const data of cls.assignedBooksData) {
        const targetId = data?.book?.id;
        const targetTitle = data?.book?.title;
        const found = masterBooks.find(b => 
          (targetId && (b.id === targetId || b.masterBookId === targetId)) ||
          (targetTitle && b.title.trim().toLowerCase() === targetTitle.trim().toLowerCase())
        );
        if (found) return found;
      }
    }

    // 3. Title match in teacher's master books (Pribadi / Pustaka)
    const byTitle = masterBooks.find(b => 
      b.title.trim().toLowerCase() === cls.name.trim().toLowerCase() ||
      cls.name.toLowerCase().includes(b.title.toLowerCase()) ||
      b.title.toLowerCase().includes(cls.name.toLowerCase())
    );
    if (byTitle) return byTitle;

    // 4. Fallback in assignedBookIds
    if (cls.assignedBookIds?.[0]) {
      const fallbackBook = masterBooks.find(b => b.id === cls.assignedBookIds![0]) || books.find(b => b.id === cls.assignedBookIds![0]);
      if (fallbackBook) return fallbackBook;
    }

    return masterBooks[0] || books[0] || null;
  };

  const handleDirectEditBook = (bookId?: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isEnrolledBook = (b: Book) => b.category === 'class' || Boolean(b.classId) || b.id.startsWith('class-book-');
    const masterBooks = books.filter(b => !isEnrolledBook(b));

    let targetBook: Book | null = null;
    if (selectedClass) {
      targetBook = getClassAssociatedBook(selectedClass);
    }
    if (!targetBook && bookId) {
      targetBook = masterBooks.find(b => b.id === bookId || b.masterBookId === bookId) || 
                   books.find(b => b.id === bookId || b.masterBookId === bookId) || null;
    }
    const finalBook = targetBook || masterBooks[0] || books[0];
    const finalBookId = finalBook?.id || '';

    if (finalBookId) {
      setSelectedPersonalBookId(finalBookId);
      setEditingClassBookId(finalBookId);
    }
    setActiveSpace('personal');
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name.trim()) return;

    if (formState.type === 'non-quran') {
      if (books.length === 0) {
        alert(language === 'en' 
          ? 'You must create or import at least one book in Books Space first.' 
          : 'Anda wajib memiliki minimal satu kitab di Ruang Buku terlebih dahulu sebelum membuat kelas kitab.');
        return;
      }
      if (!formState.assignedBookId) {
        alert(language === 'en' ? 'Please select a book for this class.' : 'Silakan pilih satu kitab untuk kelas ini.');
        return;
      }
    }

    const autoCode = generateRandomCode(formState.type);

    let finalCover = formState.coverUrl;
    if (!finalCover) {
      const presets = formState.type === 'quran' ? COVER_PRESETS.quran : COVER_PRESETS.nonQuran;
      finalCover = presets[Math.floor(Math.random() * presets.length)].url;
    }

    const requiredJuzList = formState.type === 'quran' ? parseTargetJuzToNumbers(formState.targetJuz) : undefined;

    try {
      const created = await createTeachingClass({
        name: formState.name.trim(),
        type: formState.type,
        code: autoCode,
        description: formState.description.trim(),
        coverUrl: finalCover,
        requiredJuzList,
        assignedBookIds: formState.type === 'non-quran' ? [formState.assignedBookId].filter(Boolean) : undefined,
      });

      setIsCreateOpen(false);
      setActiveCategory(created.type);
      setCreatedClassSuccess(created);
    } catch (err: any) {
      openUpgradeModal(
        err.message,
        language === 'en'
          ? 'Free accounts can create up to 1 Al-Qur\'an class and 1 Kitab class. Upgrade to Unlupa Pro to manage unlimited classes & students.'
          : 'Batas akun Free adalah maksimal 1 kelas Al-Qur\'an dan 1 kelas Kitab. Upgrade ke Unlupa Pro untuk membuat kelas & membina santri tanpa batas.'
      );
    }
  };

  const getItemTargetInfo = (cls: ClassGroup) => {
    if (cls.type === 'quran') {
      const juz = cls.requiredJuzList;
      if (!juz || juz.length === 0 || juz.length === 30) {
        return '30 Juz (604 Halaman)';
      }
      if (juz.length === 1) {
        return `Juz ${juz[0]} (${juz[0] === 30 ? '23' : '20'} Halaman)`;
      }
      const min = Math.min(...juz);
      const max = Math.max(...juz);
      const pages = max === 30 ? (juz.length - 1) * 20 + 23 : juz.length * 20;
      return `Juz ${min} - ${max} (~${pages} Halaman)`;
    } else {
      const assignedId = cls.assignedBookIds?.[0];
      const book = books.find(b => b.id === assignedId);
      if (!book) return 'Belum ada kitab';
      const bookItems = items.filter(i => i.bookId === book.id);
      const count = bookItems.length;
      return `${book.title} (${count} Materi)`;
    }
  };

  const getStudentDueInfo = (student: ClassStudent, cls: ClassGroup) => {
    const isQuran = cls.type === 'quran';

    if (isQuran) {
      const isCurrentUser = student.quranSpaceCode === quranSpaceCode;

      // 1. If current user, use live quranStats filtered strictly by class requiredJuzList
      if (isCurrentUser) {
        const liveDuePages = (quranStats?.dueList || [])
          .filter(p => isPageInJuzList(p.pageNumber, cls.requiredJuzList))
          .map(p => p.pageNumber)
          .sort((a, b) => a - b);
        const count = liveDuePages.length;
        if (count > 0) {
          const specific = liveDuePages.length <= 4 
            ? `Hal. ${liveDuePages.join(', ')}` 
            : `Hal. ${liveDuePages.slice(0, 3).join(', ')} (+${liveDuePages.length - 3} hal lagi)`;
          return { count, specific, isDue: true };
        }
        return { count: 0, specific: null, isDue: false };
      }

      // 2. If student has stored quranData, filter strictly by class requiredJuzList
      if (student.quranData && student.quranData.length > 0) {
        const classQuranPages = student.quranData.filter(p => isPageInJuzList(p.pageNumber, cls.requiredJuzList));
        const duePages = classQuranPages.filter(p => p.isActive && isDue(p.fsrsData?.nextReview, p.isActive, p.fsrsData?.lastReview));
        const count = duePages.length;
        if (count > 0) {
          const pageNums = duePages.map(p => p.pageNumber).sort((a, b) => a - b);
          const specific = pageNums.length <= 4 
            ? `Hal. ${pageNums.join(', ')}` 
            : `Hal. ${pageNums.slice(0, 3).join(', ')} (+${pageNums.length - 3} hal lagi)`;
          return { count, specific, isDue: true };
        }
        if (classQuranPages.some(p => p.isActive)) {
          return { count: 0, specific: null, isDue: false };
        }
      }

      // 3. Fallback for pure sample data (only if frequent struggles are explicitly Quran pages)
      if (student.frequentStruggles && student.frequentStruggles.length > 0 && student.frequentStruggles[0].startsWith('Hal.')) {
        return { 
          count: student.dueTodayCount || student.frequentStruggles.length, 
          specific: student.frequentStruggles.join(', '), 
          isDue: true 
        };
      }

      return { count: 0, specific: null, isDue: false };
    } else {
      // Non-Quran (Kitab / Materi Flashcard)
      const assignedIds = cls.assignedBookIds || [];
      const assignedId = assignedIds[0];
      const assignedClassBookId = assignedId ? `class-book-${cls.id}-${assignedId}` : undefined;
      const isCurrentUser = student.email === userProfile.email || student.id === `std-user-${userProfile.id}` || student.id === userProfile.id;
      
      // 1. Strictly check student's actual bookItemsData for items belonging to THIS class
      if (student.bookItemsData && student.bookItemsData.length > 0) {
        const studentItems = student.bookItemsData.filter(i => 
          i.bookId?.startsWith(`class-book-${cls.id}-`) ||
          (assignedClassBookId && i.bookId === assignedClassBookId) || 
          (assignedId && i.bookId === assignedId) ||
          assignedIds.includes(i.bookId)
        );

        if (studentItems.length > 0) {
          const dueItems = studentItems.filter(it => it.isActive && isDue(it.fsrsData?.nextReview, it.isActive, it.fsrsData?.lastReview));
          const count = dueItems.length;
          if (count > 0) {
            const titles = dueItems.map(i => i.question).filter(Boolean);
            const specific = titles.length > 0
              ? (titles.length <= 2 ? titles.join(', ') : `${titles.slice(0, 2).join(', ')} (+${titles.length - 2} lagi)`)
              : `${count} materi`;
            return { count, specific, isDue: true };
          }
          return { count: 0, specific: null, isDue: false };
        }
      }

      // 2. If student is current teacher/user viewing self
      if (isCurrentUser) {
        const classItems = items.filter(i => 
          i.bookId?.startsWith(`class-book-${cls.id}-`) ||
          (assignedClassBookId && i.bookId === assignedClassBookId) || 
          (assignedId && i.bookId === assignedId) ||
          assignedIds.includes(i.bookId)
        );
        const dueItems = classItems.filter(i => i.isActive && isDue(i.fsrsData?.nextReview, i.isActive, i.fsrsData?.lastReview));
        const count = dueItems.length;
        if (count > 0) {
          const titles = dueItems.map(i => i.question).filter(Boolean);
          const specific = titles.length > 0
            ? (titles.length <= 2 ? titles.join(', ') : `${titles.slice(0, 2).join(', ')} (+${titles.length - 2} lagi)`)
            : `${count} materi`;
          return { count, specific, isDue: true };
        }
        return { count: 0, specific: null, isDue: false };
      }

      // 3. Fallback: If frequent struggles or dueTodayCount specifically belong to this non-quran class
      // Ensure Quran reviews ('Hal. X') NEVER leak into Kitab class!
      const hasQuranStruggles = student.frequentStruggles && student.frequentStruggles.length > 0 && student.frequentStruggles[0].startsWith('Hal.');
      if (!hasQuranStruggles && (student.dueTodayCount || 0) > 0) {
        const specific = (student.frequentStruggles && student.frequentStruggles.length > 0)
          ? (student.frequentStruggles.length <= 2 
              ? student.frequentStruggles.join(', ') 
              : `${student.frequentStruggles.slice(0, 2).join(', ')} (+${student.frequentStruggles.length - 2} lagi)`)
          : `${student.dueTodayCount} materi`;
        return { 
          count: student.dueTodayCount, 
          specific, 
          isDue: true 
        };
      }

      // 4. In Kitab class, never leak outside reviews into this class!
      return { count: 0, specific: null, isDue: false };
    }
  };

  const getStudentMasteryInfo = (student: ClassStudent, cls: ClassGroup) => {
    const dueInfo = getStudentDueInfo(student, cls);
    const isQuran = cls.type === 'quran';
    let activeItems = 0;
    let masteredItems = 0;
    
    let totalReps = 0;
    let totalLapses = 0;

    if (isQuran) {
      const isCurrentUser = student.quranSpaceCode === quranSpaceCode;
      
      const rawDataset = student.quranData || (isCurrentUser && typeof quranPages !== 'undefined' ? quranPages : []);
      // Filter strictly by class requiredJuzList!
      const dataset = rawDataset.filter(p => isPageInJuzList(p.pageNumber, cls.requiredJuzList));
      
      if (isCurrentUser) {
        const liveClassPages = (quranPages || []).filter(p => isPageInJuzList(p.pageNumber, cls.requiredJuzList));
        activeItems = liveClassPages.filter(p => p.isActive).length;
        masteredItems = liveClassPages.filter(p => p.isActive && ((p.fsrsData?.stability || 0) >= 30 || (p.fsrsData?.reps || 0) >= 4)).length;
      } else if (dataset.length > 0) {
        activeItems = dataset.filter(p => p.isActive).length;
        masteredItems = dataset.filter(p => p.isActive && ((p.fsrsData?.stability || 0) >= 30 || (p.fsrsData?.reps || 0) >= 4)).length;
      } else {
        activeItems = 0;
        masteredItems = 0;
      }
      
      dataset.forEach(p => {
        if (p.isActive && p.fsrsData) {
          totalReps += (p.fsrsData.reps || 0);
          totalLapses += (p.fsrsData.lapses || 0);
        }
      });
      
    } else {
      const assignedIds = cls.assignedBookIds || [];
      const assignedId = assignedIds[0];
      const assignedClassBookId = assignedId ? `class-book-${cls.id}-${assignedId}` : undefined;
      const isCurrentUser = student.email === userProfile.email || student.id === `std-user-${userProfile.id}` || student.id === userProfile.id;
      const classItems = isCurrentUser 
        ? items.filter(i => i.bookId?.startsWith(`class-book-${cls.id}-`) || (assignedClassBookId && i.bookId === assignedClassBookId) || (assignedId && i.bookId === assignedId) || assignedIds.includes(i.bookId))
        : (student.bookItemsData && student.bookItemsData.length > 0 
            ? student.bookItemsData.filter(i => i.bookId?.startsWith(`class-book-${cls.id}-`) || (assignedClassBookId && i.bookId === assignedClassBookId) || (assignedId && i.bookId === assignedId) || assignedIds.includes(i.bookId))
            : []);
      
      activeItems = classItems.length > 0 ? classItems.filter(i => i.isActive).length : (student.activeItemsCount || 0);
      masteredItems = classItems.filter(i => i.isActive && (i.status === 'mastered' || (i.fsrsData?.stability || 0) >= 336)).length;
      
      classItems.forEach(i => {
        if (i.isActive && i.fsrsData) {
          totalReps += (i.fsrsData.reps || 0);
          totalLapses += (i.fsrsData.lapses || 0);
        }
      });
    }

    const isReadyToAdvance = dueInfo.count === 0 && activeItems > 0 && (masteredItems / Math.max(1, activeItems) >= 0.6 || masteredItems >= 3);
    const isHeavyLoad = dueInfo.count >= 10;
    
    let calcRetentionRate = student.retentionRate || 90;
    if (totalReps > 0) {
      calcRetentionRate = Math.max(0, Math.round(((totalReps - totalLapses) / totalReps) * 100));
    } else if (activeItems > 0) {
      calcRetentionRate = 100;
    }

    return {
      dueInfo,
      activeItems,
      masteredItems,
      isReadyToAdvance,
      isHeavyLoad,
      retentionRate: calcRetentionRate
    };
  };

  const renderBookPicker = () => {
    const isEnrolledBook = (b: Book) => b.category === 'class' || Boolean(b.classId) || b.id.startsWith('class-book-');
    const isImportedItem = (b: Book) => Boolean(b.masterBookId || b.isImported || b.libraryEntryId || b.category === 'imported');
    const personalBooks = books.filter(b => !isEnrolledBook(b) && !isImportedItem(b));
    const importedBooks = books.filter(b => !isEnrolledBook(b) && isImportedItem(b));
    const currentSelectedBook = books.find(b => b.id === formState.assignedBookId);

    return (
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-[#1E293B] dark:text-[#F8FAFC] uppercase tracking-wider">
            {language === 'en' ? 'Select Kitab for Class' : 'Pilih Kitab untuk Kelas'}
          </label>
          <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-medium">
            {personalBooks.length} {language === 'en' ? 'Personal' : 'Karya Pribadi'} · {importedBooks.length} {language === 'en' ? 'Imported' : 'Impor'}
          </span>
        </div>

        {/* 2-Category Tabs: Karya Pribadi vs Kitab Impor */}
        <div className="flex clay-inset p-1.5 rounded-2xl gap-1.5">
          <button
            type="button"
            onClick={() => setBookPickerTab('personal')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              bookPickerTab === 'personal'
                ? 'clay-pill text-[#FF6E65]'
                : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#1E293B]'
            }`}
          >
            <span>{language === 'en' ? 'Personal Works' : 'Karya Pribadi'}</span>
            <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
              bookPickerTab === 'personal' ? 'bg-[#FF6E65] text-white' : 'clay-pill text-[#64748B]'
            }`}>
              {personalBooks.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setBookPickerTab('imported')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              bookPickerTab === 'imported'
                ? 'clay-pill text-[#FF6E65]'
                : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#1E293B]'
            }`}
          >
            <span>{language === 'en' ? 'Imported Works' : 'Kitab Impor'}</span>
            <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
              bookPickerTab === 'imported' ? 'bg-[#FF6E65] text-white' : 'clay-pill text-[#64748B]'
            }`}>
              {importedBooks.length}
            </span>
          </button>
        </div>

        {/* Category Description Banner */}
        <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] px-1">
          {bookPickerTab === 'personal' ? (
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              {language === 'en'
                ? 'Personal works: fully editable, can add cards, and organize materials freely.'
                : 'Karya pribadi: dapat diedit, ditambah kartu materi/hafalan, dan dikelola penuh untuk santri.'}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[#64748B] dark:text-[#94A3B8] font-medium">
              <BookOpen className="w-3.5 h-3.5 shrink-0 text-amber-500" />
              {language === 'en'
                ? 'Imported works: classified with edit/read-only permission status.'
                : 'Kitab impor: terklasifikasi jelas mana yang bisa diedit dan mana yang hanya dibaca.'}
            </span>
          )}
        </div>

        {/* List of books in the active tab */}
        <div className="max-h-56 overflow-y-auto space-y-2.5 pr-1 p-1">
          {(bookPickerTab === 'personal' ? personalBooks : importedBooks).length === 0 ? (
            <div className="p-4 rounded-2xl clay-inset text-center text-xs text-[#64748B]">
              {bookPickerTab === 'personal'
                ? (language === 'en' ? 'No personal books yet. Create one in Personal Space.' : 'Belum ada karya pribadi. Buat kitab baru di Ruang Pribadi.')
                : (language === 'en' ? 'No imported books yet. Import from Library in Personal Space.' : 'Belum ada kitab impor. Impor kitab dari Pustaka di Ruang Pribadi.')}
            </div>
          ) : (
            (bookPickerTab === 'personal' ? personalBooks : importedBooks).map(b => {
              const isSelected = formState.assignedBookId === b.id;
              const bItemsCount = items.filter(i => i.bookId === b.id).length;
              const isReadonly = b.isReadonly;

              return (
                <div
                  key={b.id}
                  onClick={() => setFormState(prev => ({ ...prev, assignedBookId: b.id }))}
                  className={`p-3 rounded-2xl transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'clay-card-select-active'
                      : 'clay-card-select hover:scale-[1.01]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 aspect-[1/1.4] rounded-r-[2px] rounded-l-none overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 shadow-sm border-l-[3px] border-l-slate-900/50 relative">
                      {b.coverUrl ? (
                        <img src={b.coverUrl} alt={b.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-[#FF6E65] flex items-center justify-center text-white text-[10px] font-serif font-bold shadow-xs">
                          {b.title.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#1E293B] dark:text-[#F8FAFC] truncate">
                        {b.title}
                      </div>
                      <div className="text-[10px] text-[#64748B] dark:text-[#94A3B8] truncate flex items-center gap-1.5 mt-0.5">
                        <span>{b.authorName || (language === 'en' ? 'Personal' : 'Pribadi')}</span>
                        <span>·</span>
                        <span>{bItemsCount} {language === 'en' ? 'cards' : 'kartu'}</span>
                      </div>

                      {/* Status Classification Badge */}
                      <div className="mt-1 flex items-center gap-1.5">
                        {bookPickerTab === 'personal' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold clay-badge-emerald">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            {language === 'en' ? 'Fully Editable' : 'Bisa Diedit & Dikelola'}
                          </span>
                        ) : (
                          isReadonly ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold clay-badge-gold">
                              <BookOpen className="w-2.5 h-2.5" />
                              {language === 'en' ? 'Read-Only' : 'Hanya Dibaca'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold clay-badge-emerald">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              {language === 'en' ? 'Editable & Readable' : 'Bisa Diedit & Dibaca'}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 pr-1">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                      isSelected
                        ? 'clay-icon-pod-orange text-white scale-110'
                        : 'clay-inset'
                    }`}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white shadow-xs" />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Kitab Notice & Action */}
        {currentSelectedBook && (
          <div className="pt-1">
            {currentSelectedBook.isReadonly ? (
              <div className="p-3 rounded-2xl clay-inset text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-[#1E293B] dark:text-[#F8FAFC]">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-[#FF6E65]" />
                  <span>{language === 'en' ? 'Authentic Curated Kitab (Read-Only)' : 'Kitab Otentik Pustaka (Hanya Baca)'}</span>
                </div>
                <p className="text-[11px] leading-relaxed text-[#64748B] dark:text-[#94A3B8]">
                  {language === 'en'
                    ? 'This book was imported as authentic read-only. You and students can study and review all cards, but cannot add new cards or modify the author’s original work.'
                    : 'Kitab ini berasal dari impor pustaka yang dilindungi untuk menjaga keotentikan ilmu penulis. Pengajar dan santri dapat mempelajari serta me-review seluruh kartu di dalamnya secara penuh.'}
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-2xl clay-inset text-[11px] flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  {language === 'en'
                    ? `Selected: "${currentSelectedBook.title}" (Editable: you can freely add chapters & cards).`
                    : `Terpilih: "${currentSelectedBook.title}" (Bisa diedit: Anda leluasa menambah bab & kartu hafalan).`}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderSharedModals = () => (
    <>
      {/* --------------------------------------------------------------------- */}
      {/* MODAL: PENCARIAN KELAS (INTERAKTIF & LIVE SEARCH) */}
      {/* --------------------------------------------------------------------- */}
      <ClassSearchModal
        isOpen={isClassSearchOpen}
        onClose={() => setIsClassSearchOpen(false)}
        language={language}
        classes={teachingClasses}
        onSelectClass={(c) => {
          setSelectedClassId(c.id);
          setInspectingStudentId(null);
        }}
      />

      {/* --------------------------------------------------------------------- */}
      {/* MODAL: BUAT KELAS BARU (CLAYMORPHISM) */}
      {/* --------------------------------------------------------------------- */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="clay-modal p-5 sm:p-7 max-w-lg w-full space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.04] dark:border-white/[0.04]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl clay-icon-pod-orange flex items-center justify-center shrink-0 shadow-xs">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-[#1E293B] dark:text-[#F8FAFC]">
                  Buat Kelas Baru
                </h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="w-8 h-8 rounded-xl clay-icon-pod-neutral flex items-center justify-center text-[#64748B] hover:text-[#1E293B] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Segmented Type Toggle */}
              <div>
                <label className="block text-xs font-bold text-[#1E293B] dark:text-[#F8FAFC] uppercase tracking-wider mb-2">
                  Jenis Kelas
                </label>
                <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl clay-inset">
                  <button
                    type="button"
                    onClick={() => setFormState(prev => ({ ...prev, type: 'quran' }))}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      formState.type === 'quran'
                        ? 'clay-pill text-[#FF6E65]'
                        : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#1E293B]'
                    }`}
                  >
                    <BookOpen className="w-4 h-4 shrink-0" />
                    <span>Al-Qur'an</span>
                    {!isPro && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isQuranLimitReached
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                          : 'bg-black/5 dark:bg-white/10 text-slate-500'
                      }`}>
                        {quranClassesCount}/{maxQuran}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormState(prev => ({ ...prev, type: 'non-quran' }))}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      formState.type === 'non-quran'
                        ? 'clay-pill text-[#FF6E65]'
                        : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#1E293B]'
                    }`}
                  >
                    <BookMarked className="w-4 h-4 shrink-0" />
                    <span>Kitab</span>
                    {!isPro && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isNonQuranLimitReached
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                          : 'bg-black/5 dark:bg-white/10 text-slate-500'
                      }`}>
                        {nonQuranClassesCount}/{maxNonQuran}
                      </span>
                    )}
                  </button>
                </div>

                {formState.type === 'quran' && isQuranLimitReached && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-center justify-between gap-2">
                    <span className="font-medium">Kuota kelas Al-Qur'an Free telah mencapai batas (1/1).</span>
                    <button
                      type="button"
                      onClick={() => openUpgradeModal('Batas Kelas Al-Qur\'an', 'Upgrade ke Unlupa Pro untuk membuat kelas Al-Qur\'an tanpa batas.')}
                      className="px-2.5 py-1 rounded-lg bg-[#FF6E65] text-white font-bold text-[11px] hover:brightness-105 shrink-0 cursor-pointer shadow-xs"
                    >
                      Upgrade Pro
                    </button>
                  </div>
                )}

                {formState.type === 'non-quran' && isNonQuranLimitReached && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-center justify-between gap-2">
                    <span className="font-medium">Kuota kelas Kitab Free telah mencapai batas (1/1).</span>
                    <button
                      type="button"
                      onClick={() => openUpgradeModal('Batas Kelas Kitab', 'Upgrade ke Unlupa Pro untuk membuat kelas Kitab tanpa batas.')}
                      className="px-2.5 py-1 rounded-lg bg-[#FF6E65] text-white font-bold text-[11px] hover:brightness-105 shrink-0 cursor-pointer shadow-xs"
                    >
                      Upgrade Pro
                    </button>
                  </div>
                )}
              </div>

              {/* Class Name */}
              <div>
                <label className="block text-xs font-bold text-[#1E293B] dark:text-[#F8FAFC] uppercase tracking-wider mb-2">
                  Nama Kelas / Halaqah <span className="text-[#FF6E65]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={formState.type === 'quran' ? 'Misal: Halaqah Tahfidz Al-Jazari' : 'Misal: Matan Al-Ajurrumiyyah'}
                  value={formState.name}
                  onChange={e => setFormState(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-2xl clay-inset text-sm text-[#1E293B] dark:text-[#F8FAFC] placeholder:text-[#94A3B8] focus:outline-none"
                />
              </div>

              {/* Quran Specific: Target Juz */}
              {formState.type === 'quran' ? (
                <div>
                  <label className="block text-xs font-bold text-[#1E293B] dark:text-[#F8FAFC] uppercase tracking-wider mb-2">
                    Target Hafalan Juz
                  </label>
                  <JuzRangeSelector
                    value={formState.targetJuz}
                    onChange={val => setFormState(prev => ({ ...prev, targetJuz: val }))}
                  />
                </div>
              ) : (
                renderBookPicker()
              )}

              {/* Cover Image */}
              <div>
                <label className="block text-xs font-bold text-[#1E293B] dark:text-[#F8FAFC] uppercase tracking-wider mb-2">
                  Gambar Sampul Kelas (Opsional)
                </label>

                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDropImage}
                  className="rounded-2xl clay-inset p-4"
                >
                  <input
                    id="class-cover-input"
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileInputChange}
                    className="sr-only"
                  />

                  {isUploadingImage ? (
                    <div className="flex flex-col items-center justify-center py-4 space-y-2 text-[#FF6E65]">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span className="text-xs font-medium text-[#64748B]">
                        Memproses gambar...
                      </span>
                    </div>
                  ) : formState.coverUrl ? (
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 shadow-xs relative bg-black/10">
                        <img
                          src={formState.coverUrl}
                          alt="Cover Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-[#1E293B] dark:text-[#F8FAFC] block truncate">
                          Gambar Sampul Terpasang
                        </span>
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5 font-medium">
                          <Check className="w-3.5 h-3.5" /> Siap digunakan
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <label
                          htmlFor="class-cover-input"
                          className="px-3 py-1.5 rounded-xl clay-pill text-[11px] font-bold text-[#1E293B] cursor-pointer"
                        >
                          Ganti
                        </label>
                        <button
                          type="button"
                          onClick={() => setFormState(prev => ({ ...prev, coverUrl: '' }))}
                          className="w-8 h-8 rounded-xl clay-icon-pod-neutral text-rose-500 cursor-pointer"
                          title="Hapus gambar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label
                      htmlFor="class-cover-input"
                      className="flex flex-col items-center justify-center py-3 cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-2xl clay-icon-pod-orange flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <Upload className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-xs font-bold text-[#FF6E65]">
                        Pilih foto dari penyimpanan perangkat
                      </span>
                      <span className="text-[10px] text-[#64748B] mt-0.5">
                        Mendukung JPG, PNG, WebP
                      </span>
                    </label>
                  )}

                  {uploadError && (
                    <div className="mt-2 text-[11px] text-rose-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{uploadError}</span>
                    </div>
                  )}
                </div>

                {/* Preset Options as alternative */}
                <div className="mt-3">
                  <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mb-1.5">
                    Atau gunakan pilihan sampul estetik:
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {(formState.type === 'quran' ? COVER_PRESETS.quran : COVER_PRESETS.nonQuran).map(preset => (
                      <div
                        key={preset.id}
                        onClick={() => setFormState(prev => ({ ...prev, coverUrl: preset.url }))}
                        className={`relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer transition-all ${
                          formState.coverUrl === preset.url
                            ? 'ring-3 ring-[#FF6E65] scale-105 shadow-md'
                            : 'opacity-70 hover:opacity-100 hover:scale-[1.02]'
                        }`}
                      >
                        <img src={preset.url} alt={preset.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1 text-[9px] text-white text-center truncate font-medium">
                          {preset.title}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Description (Optional) */}
              <div>
                <label className="block text-xs font-bold text-[#1E293B] dark:text-[#F8FAFC] uppercase tracking-wider mb-1.5">
                  Deskripsi / Jadwal (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Misal: Pertemuan Ahad ba'da Subuh dan setoran rutin..."
                  value={formState.description}
                  onChange={e => setFormState(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-2xl clay-inset text-[#1E293B] dark:text-[#F8FAFC] text-xs placeholder:text-[#94A3B8] focus:outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-black/[0.04] dark:border-white/[0.04]">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2.5 rounded-xl clay-pill text-xs font-bold text-[#64748B] dark:text-[#94A3B8] hover:text-[#1E293B] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl clay-btn-primary text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Share2 className="w-4 h-4 text-white" />
                  <span>Terbitkan Kelas</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL: SUKSES TERBIT KELAS & KODE AKSES */}
      {/* --------------------------------------------------------------------- */}
      {createdClassSuccess && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="clay-modal p-6 sm:p-7 max-w-md w-full space-y-4 animate-in zoom-in-95 text-center">
            <div className="w-12 h-12 rounded-2xl clay-icon-pod-emerald text-white flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <span className="text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider clay-badge-orange">
                {createdClassSuccess.type === 'quran' ? "Kelas Al-Qur'an Terbit" : 'Kelas Kitab & Materi Terbit'}
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                Kelas Berhasil Diterbitkan!
              </h3>
            </div>

            {/* Code Box */}
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                KODE AKSES KELAS
              </span>
              <div className="font-mono text-2xl sm:text-3xl font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">
                {createdClassSuccess.code}
              </div>

              <div className="mt-2 pt-2 border-t border-slate-200/80 dark:border-slate-800 text-left">
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Berikan kode ini kepada santri untuk bergabung ke kelas ini melalui akun mereka.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={() => handleCopyCode(createdClassSuccess.code)}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {copiedCode === createdClassSuccess.code ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Kode Berhasil Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Salin Kode Kelas ({createdClassSuccess.code})</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleShareWhatsApp(createdClassSuccess.code, createdClassSuccess.name)}
                className="w-full py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Bagikan Kode ke WhatsApp</span>
              </button>

              <button
                onClick={() => {
                  const targetId = createdClassSuccess.id;
                  setCreatedClassSuccess(null);
                  setSelectedClassId(targetId);
                }}
                className="w-full py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Buka Halaman Kelas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL: EDIT KELAS */}
      {/* --------------------------------------------------------------------- */}
      {isEditClassOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-600" />
                <span>Edit Info Kelas</span>
              </h3>
              <button
                onClick={() => setIsEditClassOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditClassSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Nama Kelas / Halaqah <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formState.name}
                  onChange={e => setFormState(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {formState.type === 'quran' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Target Hafalan Juz
                  </label>
                  <JuzRangeSelector
                    value={formState.targetJuz}
                    onChange={val => setFormState(prev => ({ ...prev, targetJuz: val }))}
                  />
                </div>
              ) : (
                renderBookPicker()
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Deskripsi / Jadwal (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={formState.description}
                  onChange={e => setFormState(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditClassOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-colors cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL: KONFIRMASI KELUARKAN SANTRI */}
      {/* --------------------------------------------------------------------- */}
      {studentToRemove && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 max-w-sm w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Keluarkan Santri?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin mengeluarkan <strong>{studentToRemove.name}</strong> dari daftar santri kelas ini?
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStudentToRemove(null)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmRemoveStudent}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer shadow-xs"
              >
                Keluarkan Santri
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL: KONFIRMASI TUTUP KELAS */}
      {/* --------------------------------------------------------------------- */}
      {classToClose && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 max-w-sm w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <Archive className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Tutup Kelas?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin menutup kelas <strong>{classToClose.name}</strong>? Buku kelas ini otomatis terhapus dari kategori buku kelas di semua santri. Catatan pengawasan dan riwayat tetap tersimpan di ruang guru.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setClassToClose(null)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmCloseClass}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-colors cursor-pointer shadow-xs"
              >
                Tutup Kelas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL: KONFIRMASI HAPUS KELAS */}
      {/* --------------------------------------------------------------------- */}
      {classToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 max-w-sm w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Hapus Kelas?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin menghapus kelas <strong>{classToDelete.name}</strong>? Data pengawasan kelas ini akan dihapus.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setClassToDelete(null)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteClass}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer shadow-xs"
              >
                Hapus Kelas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL: LAPORAN PERKEMBANGAN & EVALUASI SANTRI */}
      {/* --------------------------------------------------------------------- */}
      {reportStudent && (
        <StudentProgressReportModal
          isOpen={Boolean(reportStudent)}
          onClose={() => setReportStudent(null)}
          student={reportStudent}
          classGroup={selectedClass || teachingClasses.find(c => (c.students || []).some(s => s.id === reportStudent.id)) || teachingClasses[0]}
          language={language}
          currentUserQuranPages={quranPages}
          currentQuranSpaceCode={quranSpaceCode}
        />
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL: DETAIL DATA SANTRI & KURVA DAYA INGAT */}
      {/* --------------------------------------------------------------------- */}
      {selectedModalStudent && selectedClass && (
        <StudentDetailModal
          isOpen={Boolean(selectedModalStudent)}
          onClose={() => setSelectedModalStudent(null)}
          student={allStudents.find(s => s.id === selectedModalStudent.student.id) || selectedModalStudent.student}
          classGroup={selectedClass}
          initialTab={selectedModalStudent.initialTab || 'due'}
          onOpenQuranSpace={() => {
            const sid = selectedModalStudent.student.id;
            setSelectedModalStudent(null);
            setInspectingStudentId(sid);
          }}
          onOpenBookSpace={() => {
            const sid = selectedModalStudent.student.id;
            setSelectedModalStudent(null);
            setInspectingStudentId(sid);
          }}
        />
      )}
    </>
  );

  // ---------------------------------------------------------------------------
  // LEVEL 3: INSPECTING STUDENT PROGRESS VIEW (PURE MUSHAF / BOOK WORKSPACE)
  // ---------------------------------------------------------------------------
  if (inspectingStudent && selectedClass) {
    if (selectedClass.type === 'quran') {
      return (
        <StudentQuranView
          student={inspectingStudent}
          classGroup={selectedClass}
          onClose={() => {
            setInspectingStudentId(null);
            refreshClassesFromBackend();
          }}
        />
      );
    } else {
      return (
        <StudentBookView
          student={inspectingStudent}
          classGroup={selectedClass}
          onClose={() => {
            setInspectingStudentId(null);
            refreshClassesFromBackend();
          }}
        />
      );
    }
  }

  // ---------------------------------------------------------------------------
  // LEVEL 2: CLASS DETAIL VIEW (EXACT TWIN OF SCREENSHOT 1: BOOK DETAIL)
  // ---------------------------------------------------------------------------
  if (selectedClass) {
    const assignedBook = !isQuran ? getClassAssociatedBook(selectedClass) : null;
    const assignedId = assignedBook?.id || selectedClass.assignedBookIds?.[0];
    const assignedClassBookId = assignedId ? `class-book-${selectedClass.id}-${assignedId}` : undefined;

    const studentAnalysisMap = new Map<string, ReturnType<typeof getStudentMasteryInfo>>();
    allStudents.forEach(s => {
      studentAnalysisMap.set(s.id, getStudentMasteryInfo(s, selectedClass));
    });

    const dueStudents = allStudents.filter(s => studentAnalysisMap.get(s.id)?.dueInfo.isDue);
    const fluentStudents = allStudents.filter(s => !studentAnalysisMap.get(s.id)?.dueInfo.isDue);
    const readyStudents = allStudents.filter(s => studentAnalysisMap.get(s.id)?.isReadyToAdvance);

    let displayedStudents = allStudents;
    if (studentFilter === 'due') {
      displayedStudents = dueStudents;
    } else if (studentFilter === 'fluent') {
      displayedStudents = fluentStudents;
    }

    if (studentSearchQuery.trim()) {
      const q = studentSearchQuery.toLowerCase().trim();
      displayedStudents = displayedStudents.filter(s =>
        (s.name || '').toLowerCase().includes(q) ||
        (s.quranSpaceCode ? s.quranSpaceCode.toLowerCase().includes(q) : false)
      );
    }

    const classRetentionPct = allStudents.length > 0 
      ? Math.round((fluentStudents.length / allStudents.length) * 100) 
      : 100;

    if (isManagingBook && assignedBook) {
      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 h-[calc(100vh-64px)]">
          <PersonalSpace 
            initialBookId={assignedBook.id} 
            isEmbeddedTeacherView={true} 
            onExitEmbedded={() => setIsManagingBook(false)} 
          />
        </div>
      );
    }

    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-6 animate-in fade-in duration-200">
        {/* 1. Top Navigation Bar */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => {
              setSelectedClassId(null); setIsManagingBook(false);
              setStudentFilter('all');
              setStudentSearchQuery('');
            }}
            className="inline-flex items-center gap-1.5 px-3 h-8.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{language === 'en' ? 'Back' : 'Kembali'}</span>
          </button>

          {/* Action Icons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleOpenEditClass(selectedClass)}
              className="w-8.5 h-8.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer shadow-2xs active:scale-95"
              title="Edit Info Kelas"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleShareWhatsApp(selectedClass.code, selectedClass.name)}
              className="w-8.5 h-8.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center justify-center transition-colors cursor-pointer shadow-2xs active:scale-95"
              title="Bagikan ke WhatsApp"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {selectedClass.status === 'closed' ? (
              <button
                type="button"
                onClick={() => reopenTeachingClass?.(selectedClass.id)}
                className="w-8.5 h-8.5 rounded-xl border border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 flex items-center justify-center transition-colors cursor-pointer shadow-2xs active:scale-95"
                title="Buka Kembali Kelas"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setClassToClose({ id: selectedClass.id, name: selectedClass.name })}
                className="w-8.5 h-8.5 rounded-xl border border-amber-200 dark:border-amber-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 flex items-center justify-center transition-colors cursor-pointer shadow-2xs active:scale-95"
                title="Tutup Kelas (Selesaikan & Bersihkan Buku Santri)"
              >
                <Archive className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => setClassToDelete({ id: selectedClass.id, name: selectedClass.name })}
              className="w-8.5 h-8.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 flex items-center justify-center transition-colors cursor-pointer shadow-2xs active:scale-95"
              title="Hapus Kelas"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Master Presentation Hero Card (Identical structure to Screenshot 1) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col gap-4 sm:gap-6">
          <div className="flex flex-row gap-4 sm:gap-6 items-start">
            {/* 3D Realistic Book / Mushaf Cover Object */}
            <div className={`shrink-0 relative group ${assignedBook ? 'cursor-pointer' : ''}`} onClick={() => { if (assignedBook) { handleDirectEditBook(assignedBook.id); } }}>
              <div className="w-24 sm:w-32 md:w-36 aspect-[1/1.45] rounded-r-[3px] rounded-l-[1px] overflow-hidden shadow-xl shadow-slate-900/25 dark:shadow-black/70 border-l-[6px] border-l-slate-900/50 relative flex flex-col justify-between transition-transform duration-200 group-hover:-translate-y-1">
                {/* Lighting reflection & spine ridge overlay */}
                <div className="absolute inset-y-0 left-0 w-3.5 bg-gradient-to-r from-black/35 via-white/25 to-transparent pointer-events-none z-20" />
                <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-l from-black/20 to-transparent pointer-events-none z-20" />
                <div className="absolute inset-0 bg-gradient-to-tr from-black/15 via-transparent to-white/10 pointer-events-none z-20" />

                {assignedBook?.coverUrl || selectedClass.coverUrl ? (
                  <img
                    src={(assignedBook?.coverUrl || selectedClass.coverUrl) as string}
                    alt={assignedBook?.title || selectedClass.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-900 via-teal-950 to-slate-950 p-2.5 flex flex-col justify-between text-amber-100 border border-emerald-700/60 select-none">
                    <div className="relative z-10 pt-1 text-center">
                      <span className="text-[8px] font-mono tracking-widest text-amber-300 uppercase">
                        {isQuran ? 'Mushaf Halaqah' : 'Kitab Bimbingan'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Class Meta Details */}
            <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
              <div>
                <div className="mb-1.5 flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-700">
                    {isQuran ? "Halaqah Al-Qur'an" : 'Kelas Kitab'}
                  </span>
                  {selectedClass.status === 'closed' && (
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/70 px-2 py-0.5 rounded-md border border-amber-200/80 dark:border-amber-800/80 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>{language === 'en' ? 'Closed (Archived)' : 'Kelas Ditutup / Selesai'}</span>
                    </span>
                  )}
                  {!isQuran && (assignedBook || assignedId) && (
                    <button
                      type="button"
                      onClick={() => handleDirectEditBook(assignedBook?.id || (assignedId as string))}
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-orange-50 dark:bg-orange-950/50 hover:bg-orange-100 dark:hover:bg-orange-900 text-orange-700 dark:text-orange-300 text-[10px] font-bold rounded-md transition-colors cursor-pointer border border-orange-200 dark:border-orange-800/60 shadow-2xs hover:scale-105 active:scale-95"
                      title={language === 'en' ? 'Edit book flashcards and chapters' : 'Edit materi dan bab kitab'}
                    >
                      <Edit3 className="w-3 h-3 text-orange-500" />
                      {language === 'en' ? 'Edit Book' : 'Edit Kitab'}
                    </button>
                  )}
                </div>
                <h1 className="text-xl sm:text-2xl font-bold font-serif text-slate-900 dark:text-white leading-tight">
                  {assignedBook?.title || selectedClass.name}
                </h1>
                {(assignedBook?.description || selectedClass.description) && (
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {assignedBook?.description || selectedClass.description}
                  </p>
                )}
              </div>

              {/* Class Code Pill Box & Direct Edit Action */}
              <div className="flex items-center justify-between gap-3 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Kode Akses:</span>
                  <span className="font-mono font-bold text-xs sm:text-sm text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 px-2 py-0.5 rounded-md">
                    {selectedClass.code}
                  </span>
                  <button
                    onClick={() => handleCopyCode(selectedClass.code)}
                    className="p-1 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                    title="Salin Kode Kelas"
                  >
                    {copiedCode === selectedClass.code ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {!isQuran && (assignedBook || assignedId) && (
                  <button
                    type="button"
                    onClick={() => handleDirectEditBook(assignedBook?.id || (assignedId as string))}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-[#FF6F3D] to-[#E65320] hover:from-[#E65320] hover:to-[#C43E0F] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95 shrink-0"
                    title={language === 'en' ? 'Open and edit flashcards, subchapters, and book content' : 'Buka dan kelola isi kitab, bab, subbab, serta flashcard'}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{language === 'en' ? 'Edit Kitab Content' : 'Buka & Edit Kitab'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Embedded Progress Card */}
          <div className="flex items-center gap-4 p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
            {/* Left Side: Circular Progress */}
            <div className="relative w-16 h-16 shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 drop-shadow-sm">
                <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-200 dark:text-slate-700" />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray="263.89"
                  strokeDashoffset={allStudents.length === 0 ? 263.89 : 263.89 - (263.89 * (classRetentionPct / 100))}
                  strokeLinecap="round"
                  className={`${allStudents.length === 0 ? 'text-slate-300 dark:text-slate-600' : 'text-emerald-500'} transition-all duration-1000`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-none">
                  {allStudents.length === 0 ? '0%' : `${classRetentionPct}%`}
                </span>
                {allStudents.length > 0 && (
                  <span className="text-[8px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
                    Tuntas
                  </span>
                )}
              </div>
            </div>

            {/* Right Side: Progress Legend */}
            <div className="flex-1 space-y-2 min-w-0">
              {allStudents.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Belum ada santri terdaftar di kelas ini. Bagikan kode akses kelas kepada santri Anda.
                </p>
              ) : (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500 shrink-0" />
                      <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">Santri Tuntas</span>
                    </div>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 shrink-0 ml-2">
                      {fluentStudents.length} santri
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-sm bg-amber-500 shrink-0" />
                      <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">Perlu Review</span>
                    </div>
                    <span className="font-bold text-amber-600 dark:text-amber-400 shrink-0 ml-2">
                      {dueStudents.length} santri
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Interactive Class Intelligence Hub */}
        {allStudents.length > 0 && (
          <div className="clay-card-subtle p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/[0.04] dark:border-white/[0.04] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl clay-icon-pod-gold flex items-center justify-center shrink-0 shadow-xs">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-[#451E08] dark:text-[#FDE68A] clay-title">
                    {language === 'en' ? 'Class Intelligence & Memory Analytics' : 'Pusat Analisis & Statistik Ingatan Kelas'}
                  </h3>
                  <p className="text-[11px] text-[#8C5E3C] dark:text-[#E2D2C3] font-medium">
                    {language === 'en' ? 'Interactive macro insights across all enrolled students' : 'Wawasan kolektif interaktif seluruh santri terdaftar'}
                  </p>
                </div>
              </div>

              {/* Interactive Tabs */}
              <div className="flex items-center gap-1 p-1 rounded-full clay-inset shrink-0">
                <button
                  type="button"
                  onClick={() => setAnalyticsTab('intervals')}
                  className={`px-3 py-1 rounded-full text-[11px] font-black transition-all cursor-pointer ${
                    analyticsTab === 'intervals' ? 'clay-pill text-[#B45309] dark:text-amber-300 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Distribusi Interval
                </button>
                <button
                  type="button"
                  onClick={() => setAnalyticsTab('backlog')}
                  className={`px-3 py-1 rounded-full text-[11px] font-black transition-all cursor-pointer ${
                    analyticsTab === 'backlog' ? 'clay-pill text-[#EA580C] dark:text-[#FB923C] shadow-xs' : 'text-slate-500 hover:text-amber-600'
                  }`}
                >
                  Tunggakan ({analyticsData.studentsByBacklog.filter(s => s.overdueCount > 0).length})
                </button>
                <button
                  type="button"
                  onClick={() => setAnalyticsTab('champions')}
                  className={`px-3 py-1 rounded-full text-[11px] font-black transition-all cursor-pointer ${
                    analyticsTab === 'champions' ? 'clay-pill text-emerald-700 dark:text-emerald-400 shadow-xs' : 'text-slate-500 hover:text-emerald-600'
                  }`}
                >
                  Peringkat Ingatan
                </button>
              </div>
            </div>

            {/* Tab 1: Memory Stability Pyramid Distribution */}
            {analyticsTab === 'intervals' && (
              <div className="space-y-3 animate-in fade-in duration-300">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-2xl clay-inset flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">Mapan & Mutqin</span>
                    <div className="flex items-baseline justify-between mt-2">
                      <span className="text-base sm:text-lg font-black text-[#451E08] dark:text-[#FDE68A]">{analyticsData.tierMapanCount}</span>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Puncak</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl clay-inset flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase">Kokoh & Bertumbuh</span>
                    <div className="flex items-baseline justify-between mt-2">
                      <span className="text-base sm:text-lg font-black text-[#451E08] dark:text-[#FDE68A]">{analyticsData.tierKokohCount}</span>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">Stabil</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl clay-inset flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase">Konsolidasi Memori</span>
                    <div className="flex items-baseline justify-between mt-2">
                      <span className="text-base sm:text-lg font-black text-[#451E08] dark:text-[#FDE68A]">{analyticsData.tierKonsolidasiCount}</span>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Proses</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl clay-inset flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase">Hafalan Baru & Kritis</span>
                    <div className="flex items-baseline justify-between mt-2">
                      <span className="text-base sm:text-lg font-black text-[#451E08] dark:text-[#FDE68A]">{analyticsData.tierKritisCount}</span>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">Fase Awal</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Backlog / Tunggakan */}
            {analyticsTab === 'backlog' && (
              <div className="space-y-2 animate-in fade-in duration-300">
                <p className="text-xs text-[#8C5E3C] dark:text-[#E2D2C3] font-medium">
                  Santri dengan tunggakan review terbanyak yang memerlukan perhatian dan bimbingan khusus:
                </p>
                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  {analyticsData.studentsByBacklog.map((stat, idx) => (
                    <div 
                      key={stat.student.id}
                      onClick={() => setSelectedModalStudent({ student: stat.student, initialTab: 'retention' })}
                      className="p-2.5 rounded-2xl neumorph-card flex items-center justify-between cursor-pointer hover:scale-[1.01] transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 text-xs font-black flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <div>
                          <h4 className="font-bold text-xs text-[#18234A] dark:text-white">{stat.student.name}</h4>
                          <span className="text-[10px] text-slate-500">Aktif: {stat.activeCount} item</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-black px-2.5 py-1 rounded-full ${stat.overdueCount > 0 ? 'bg-rose-500 text-white animate-pulse' : 'bg-emerald-500 text-white'}`}>
                          {stat.overdueCount} perlu review
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 3: Champions / Comprehensive 4-Tier Memory Ranking */}
            {analyticsTab === 'champions' && (
              <div className="space-y-2 animate-in fade-in duration-300">
                <p className="text-xs text-[#8C5E3C] dark:text-[#E2D2C3] font-medium">
                  Peringkat santri berdasarkan skor komprehensif dari seluruh 4 level piramida stabilitas memori:
                </p>
                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  {analyticsData.studentsByRanking.map((stat, idx) => (
                    <div 
                      key={stat.student.id}
                      onClick={() => setSelectedModalStudent({ student: stat.student, initialTab: 'retention' })}
                      className="p-2.5 rounded-2xl neumorph-card flex items-center justify-between cursor-pointer hover:scale-[1.01] transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center ${idx === 0 ? 'bg-amber-400 text-white shadow-xs' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                          #{idx + 1}
                        </span>
                        <div>
                          <h4 className="font-bold text-xs text-[#18234A] dark:text-white">{stat.student.name}</h4>
                          <span className="text-[10px] text-[#687086] dark:text-[#94A3B8] font-medium">
                            Mapan: {stat.studentMapanCount} | Kokoh: {stat.studentKokohCount} | Konsol: {stat.studentKonsolidasiCount} | Kritis: {stat.studentKritisCount}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono">
                          {stat.compositeScore}% Skor Memori
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. Section Below: Daftar Santri (Identical to Screenshot 1 "Daftar Isi Kitab") */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl clay-icon-pod-gold flex items-center justify-center shrink-0 shadow-xs">
                <List className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-black text-base text-[#451E08] dark:text-[#FDE68A] clay-title">
                  Daftar Santri ({allStudents.length})
                </h3>
              </div>
            </div>
          </div>

          {/* Search bar & quick filter tabs matching Screenshot 1 & 4 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C5E3C] pointer-events-none" />
              <input
                type="text"
                placeholder="Cari santri..."
                value={studentSearchQuery}
                onChange={e => setStudentSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-full clay-inset text-xs font-medium text-[#451E08] dark:text-[#FDE68A] placeholder-[#8C5E3C]/60 focus:outline-none shadow-xs"
              />
            </div>

            {/* Segmented control tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-full clay-inset shrink-0 flex-wrap sm:flex-nowrap">
              <button
                onClick={() => setStudentFilter('all')}
                className={`px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer ${
                  studentFilter === 'all'
                    ? 'clay-pill text-[#B45309] dark:text-amber-300 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Semua {allStudents.length}
              </button>
              <button
                onClick={() => setStudentFilter('due')}
                className={`px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer ${
                  studentFilter === 'due'
                    ? 'clay-pill text-[#EA580C] dark:text-[#FB923C] shadow-xs'
                    : 'text-slate-500 hover:text-amber-600'
                }`}
              >
                Belum Review {dueStudents.length}
              </button>
              <button
                onClick={() => setStudentFilter('fluent')}
                className={`px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer ${
                  studentFilter === 'fluent'
                    ? 'clay-pill text-emerald-700 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-500 hover:text-emerald-600'
                }`}
              >
                Tuntas {fluentStudents.length}
              </button>
            </div>
          </div>

          {/* Student Items List (Matching Screenshot 1 & 4 clean layout) */}
          <div className="space-y-2 pt-2">
            {displayedStudents.map((student) => {
              const analysis = studentAnalysisMap.get(student.id) || {
                dueInfo: { count: 0, specific: null, isDue: false },
                activeItems: 0,
                masteredItems: 0,
                isReadyToAdvance: false,
                isHeavyLoad: false,
                retentionRate: 100
              };
              const { dueInfo } = analysis;

              return (
                <div
                  key={student.id}
                  onClick={() => setSelectedModalStudent({ student, initialTab: 'due' })}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-3.5 sm:p-4 hover:border-indigo-400 dark:hover:border-indigo-500/60 shadow-2xs hover:shadow-xs transition-all flex items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {student.name}
                      </h4>
                      {analysis.isReadyToAdvance && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800">
                          <TrendingUp className="w-3 h-3 text-indigo-500" />
                          <span>Siap Tambah</span>
                        </span>
                      )}
                      {analysis.isHeavyLoad && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800">
                          <span>Beban Tinggi</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1 flex-wrap text-xs">
                      {dueInfo.isDue ? (
                        <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 min-w-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 animate-pulse" />
                          <span className="truncate">
                            Belum review: <strong className="font-semibold text-amber-800 dark:text-amber-300">{dueInfo.specific}</strong>
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                          <span>Tuntas review harian</span>
                        </div>
                      )}
                      <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
                        {analysis.masteredItems} materi mapan ({analysis.retentionRate}% retensi)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    {dueInfo.isDue ? (
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/50 flex items-center gap-1 shadow-2xs">
                        <span>{dueInfo.count} Review</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/50">
                        Lancar
                      </span>
                    )}

                    {/* Quick Action 1: Kurva Daya Ingat */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedModalStudent({ student, initialTab: 'retention' });
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:text-indigo-400 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer shrink-0"
                      title={`Kurva Daya Ingat & Retensi Hafalan ${student.name}`}
                    >
                      <Brain className="w-4 h-4" />
                    </button>

                    {/* Quick Action 2: Buka Ruang Belajar (Mushaf/Kitab) Langsung */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInspectingStudentId(student.id);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:text-emerald-400 dark:hover:bg-emerald-950/50 transition-colors cursor-pointer shrink-0"
                      title={isQuran ? `Buka Mushaf Santri (Halaqah Mode)` : `Buka Halaman Kitab Santri`}
                    >
                      <BookOpen className="w-4 h-4" />
                    </button>

                    {/* Quick Action 3: Rapor Evaluasi */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setReportStudent(student);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-950/50 transition-colors cursor-pointer shrink-0"
                      title={`Laporan & Raport Evaluasi ${student.name}`}
                    >
                      <Share2 className="w-4 h-4" />
                    </button>

                    {/* Quick Action 4: Keluarkan Santri */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteStudent(student.id, student.name);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-950/50 transition-colors cursor-pointer shrink-0"
                      title={`Keluarkan ${student.name} dari daftar santri kelas`}
                    >
                      <LogOut className="w-4 h-4" />
                    </button>

                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              );
            })}

            {displayedStudents.length === 0 && (
              <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
                <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {allStudents.length === 0 ? 'Belum Ada Santri yang Bergabung' : 'Tidak Ada Santri yang Cocok'}
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {allStudents.length === 0
                    ? `Bagikan kode kelas ${selectedClass.code} kepada santri agar mereka dapat bergabung melalui akun mereka.`
                    : 'Coba sesuaikan kata kunci pencarian atau filter di atas.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Shared In-App Modals for Level 2 */}
        {renderSharedModals()}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // LEVEL 1: CLASS LIST VIEW (CLAYMORPHISM 3D & WARM GOLD IDENTITY)
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-3.5 pb-20 md:pb-8">
      {/* 1. Header Row 1: Title, Total Badge, and Top-Right Search Trigger Bar */}
      <div className="flex items-center justify-between w-full mb-2 gap-2 flex-nowrap">
        {/* Left: Title & Total Classes Count Badge */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink min-w-0 whitespace-nowrap">
          <h1 className="text-xl sm:text-2xl font-black text-[#18234A] dark:text-[#F8FAFC] tracking-tight clay-title">
            {language === 'en' ? 'Teaching Space' : 'Ruang Guru'}
          </h1>
          <span
            className="flex items-center justify-center px-3 h-9 clay-pill text-[#FF6F3D] text-xs font-black shrink-0 shadow-2xs"
            title={`${teachingClasses.length} ${language === 'en' ? 'Classes' : 'Kelas'}`}
          >
            {teachingClasses.length}
          </span>
        </div>

        {/* Right: Unified Search Trigger Bar at Top Rightmost Corner */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <button
            type="button"
            onClick={() => setIsClassSearchOpen(true)}
            className="flex items-center gap-2 pl-3 pr-3.5 h-9 rounded-2xl clay-inset text-xs font-semibold text-[#8E9BAE] hover:text-[#18234A] dark:hover:text-[#F8FAFC] transition-all cursor-pointer group shadow-2xs shrink-0"
            title={language === 'en' ? 'Search classes...' : 'Cari kelas...'}
          >
            <Search className="w-3.5 h-3.5 text-[#FF6F3D] group-hover:scale-110 transition-transform shrink-0" />
            <span className="truncate">{language === 'en' ? 'Search classes...' : 'Cari kelas...'}</span>
            <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-white/70 dark:bg-black/20 rounded shadow-2xs border border-black/5 dark:border-white/5">
              ⌘K
            </kbd>
          </button>
        </div>
      </div>

      {/* 2. Ribbon Bar: 3-Item Category Segmented Container + Right Plus Button (Identical to Ruang Buku) */}
      <div className="flex items-center gap-2 mt-1 mb-3 w-full">
        {/* Left: 3-Item Segmented Clay Inset Container */}
        <div className="flex-1 p-1.5 clay-inset rounded-2xl grid grid-cols-3 gap-1.5">
          <button
            onClick={() => setActiveCategory('all')}
            className={`h-8 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer select-none min-w-0 ${
              activeCategory === 'all'
                ? 'clay-btn-primary text-white'
                : 'text-[#707E94] dark:text-[#94A3B8] hover:text-[#18234A] dark:hover:text-white'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{language === 'en' ? 'All' : 'Semua'}</span>
            <span className={`-mt-2.5 -mr-0.5 px-1 py-0.2 text-[9px] font-black rounded-full leading-none shrink-0 ${
              activeCategory === 'all' ? 'bg-white/30 text-white' : 'bg-black/5 dark:bg-white/10 text-[#707E94] dark:text-[#94A3B8]'
            }`}>
              {teachingClasses.length}
            </span>
          </button>

          <button
            onClick={() => setActiveCategory('quran')}
            className={`h-8 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer select-none min-w-0 ${
              activeCategory === 'quran'
                ? 'clay-btn-primary text-white'
                : 'text-[#707E94] dark:text-[#94A3B8] hover:text-[#18234A] dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{language === 'en' ? "Quran" : "Al-Qur'an"}</span>
            <span className={`-mt-2.5 -mr-0.5 px-1 py-0.2 text-[9px] font-black rounded-full leading-none shrink-0 ${
              activeCategory === 'quran' ? 'bg-white/30 text-white' : 'bg-black/5 dark:bg-white/10 text-[#707E94] dark:text-[#94A3B8]'
            }`}>
              {quranClassesCount}
            </span>
          </button>

          <button
            onClick={() => setActiveCategory('non-quran')}
            className={`h-8 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer select-none min-w-0 ${
              activeCategory === 'non-quran'
                ? 'clay-btn-primary text-white'
                : 'text-[#707E94] dark:text-[#94A3B8] hover:text-[#18234A] dark:hover:text-white'
            }`}
          >
            <BookMarked className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{language === 'en' ? "Kitab" : "Kitab"}</span>
            <span className={`-mt-2.5 -mr-0.5 px-1 py-0.2 text-[9px] font-black rounded-full leading-none shrink-0 ${
              activeCategory === 'non-quran' ? 'bg-white/30 text-white' : 'bg-black/5 dark:bg-white/10 text-[#707E94] dark:text-[#94A3B8]'
            }`}>
              {nonQuranClassesCount}
            </span>
          </button>
        </div>

        {/* Right: Plus Button to Create Class (w-9 h-9 matching Ruang Buku) */}
        <button
          type="button"
          onClick={() => handleOpenCreateModal(activeCategory === 'all' ? 'quran' : activeCategory)}
          title={language === 'en' ? 'Create new class' : 'Buat Kelas Baru'}
          className="w-9 h-9 rounded-2xl clay-btn-primary text-white flex items-center justify-center shrink-0 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4 text-white stroke-[3] shrink-0" />
        </button>
      </div>

      {/* 3. Classes Grid (Realistic 3D Standing Hardcover Books) */}
      {currentCategoryClasses.length === 0 ? (
        <div className="text-center py-12 px-4 clay-card-subtle mt-2 space-y-3">
          <div className="w-12 h-12 rounded-2xl clay-icon-pod-orange flex items-center justify-center mx-auto text-white">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-[#18234A] dark:text-[#F8FAFC]">
            {language === 'en' ? 'No Classes Found' : 'Belum Ada Kelas'}
          </h3>
          <p className="text-xs text-[#687086] dark:text-[#94A3B8] max-w-sm mx-auto leading-relaxed font-medium">
            {activeCategory === 'quran'
              ? 'Buat halaqah Al-Qur\'an untuk membagikan kode kelas dan memantau setoran santri.'
              : 'Buat kelas kitab/materi untuk memantau pemahaman dan penguasaan kartu santri.'}
          </p>
          <button
            onClick={() => handleOpenCreateModal(activeCategory === 'all' ? 'quran' : activeCategory)}
            className="px-5 py-2.5 clay-btn-primary text-xs font-bold inline-flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{language === 'en' ? 'Create New Class' : 'Buat Kelas Sekarang'}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3 mt-2">
          {currentCategoryClasses.map(cls => {
            const isQuran = cls.type === 'quran';
            const studentCount = cls.students.length;
            const dueInClass = cls.students.filter(s => getStudentDueInfo(s, cls).isDue).length;

            // For non-quran: calculate total items in the assigned book
            const assignedBook = !isQuran ? getClassAssociatedBook(cls) : null;
            const assignedId = assignedBook?.id || cls.assignedBookIds?.[0];
            const bookItems = assignedId ? items.filter(i => i.bookId === assignedId) : [];
            const totalItemsCount = bookItems.length;

            // Target info / Total item info
            const bottomInfoText = isQuran 
              ? getItemTargetInfo(cls) 
              : `${totalItemsCount} Materi`;

            return (
              <div
                key={cls.id}
                onClick={() => setSelectedClassId(cls.id)}
                className="clay-card-subtle p-2 sm:p-2.5 flex flex-col items-center justify-between hover:-translate-y-1.5 active:scale-[0.98] transition-all cursor-pointer group relative select-none"
                title={`Buka ${cls.name}`}
              >
                {/* Top Action Bar: Code (Left) | Students Badge (Right) */}
                <div className="w-full flex items-center justify-between gap-0.5 mb-1 z-20">
                  <span 
                    onClick={(e) => handleCopyCode(cls.code, e)}
                    className="clay-pill text-[#707E94] dark:text-[#94A3B8] hover:text-[#18234A] dark:hover:text-white text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 font-mono shadow-2xs cursor-pointer flex items-center gap-0.5 truncate"
                    title="Klik untuk salin kode kelas"
                  >
                    {copiedCode === cls.code ? <Check className="w-2 h-2 text-emerald-500" /> : null}
                    <span className="truncate">{cls.code}</span>
                  </span>

                  <div className="flex items-center gap-1 shrink-0">
                    {cls.status === 'closed' && (
                      <span className="bg-rose-500 text-white text-[7px] font-bold px-1 py-0.5 rounded flex items-center">
                        <Lock className="w-2 h-2" />
                      </span>
                    )}

                    <span className="clay-badge-gold text-white text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 shadow-xs flex items-center gap-0.5 rounded-full shrink-0">
                      <Users className="w-2.5 h-2.5" />
                      <span>{studentCount}</span>
                    </span>
                  </div>
                </div>

                {/* Large 3D Standing Hardcover Book Cover with Status Badge Overlaid on Top of Cover */}
                <div className="w-full flex justify-center py-0.5 relative">
                  <div className="w-18 sm:w-24 md:w-28 aspect-[1/1.42] rounded-r-[3px] rounded-l-[1px] overflow-hidden shadow-[4px_10px_22px_rgba(0,0,0,0.22)] dark:shadow-[4px_10px_26px_rgba(0,0,0,0.6)] border-l-[4px] sm:border-l-[5px] border-l-slate-900/60 relative flex flex-col justify-between transition-transform duration-300 group-hover:scale-[1.03] group-hover:-translate-y-1">
                    {/* Lighting reflection & spine ridge overlay */}
                    <div className="absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-black/40 via-white/25 to-transparent pointer-events-none z-20" />
                    <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-l from-black/20 to-transparent pointer-events-none z-20" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/10 via-transparent to-white/10 pointer-events-none z-20" />

                    {cls.coverUrl ? (
                      <img
                        src={cls.coverUrl}
                        alt={cls.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      /* Handcrafted Hardcover Cloth/Leather Kitab / Mushaf */
                      <div className={`w-full h-full p-1.5 sm:p-2 flex flex-col justify-between text-amber-100 border relative overflow-hidden select-none ${
                        isQuran
                          ? 'bg-gradient-to-br from-[#8C3A00] via-[#5A2000] to-[#2B1000] border-amber-600/60'
                          : 'bg-gradient-to-br from-emerald-900 via-teal-950 to-slate-950 border-emerald-700/60'
                      }`}>
                        <div className="absolute -right-6 -bottom-6 w-16 h-16 rounded-full border-4 border-amber-400/10 pointer-events-none" />
                        <div className="absolute inset-1 border border-amber-400/30 rounded-none pointer-events-none" />

                        {/* Top ornament */}
                        <div className="relative z-10 pt-0.5 text-center">
                          <div className="inline-flex items-center gap-0.5 px-1 py-0.2 bg-black/40 border border-amber-400/30 text-[6px] font-extrabold uppercase tracking-widest text-amber-300">
                            {isQuran ? <BookOpen className="w-2 h-2 text-amber-400" /> : <BookMarked className="w-2 h-2 text-amber-400" />}
                            <span className="truncate max-w-[45px]">{isQuran ? "Qur'an" : "Kitab"}</span>
                          </div>
                        </div>

                        {/* Center Title */}
                        <div className="relative z-10 my-auto text-center px-0.5">
                          <h3 
                            title={cls.name}
                            className="font-serif font-bold text-[9px] sm:text-[10px] text-amber-50 leading-snug drop-shadow-md line-clamp-2 text-ellipsis tracking-wide"
                          >
                            {cls.name}
                          </h3>
                        </div>

                        {/* Bottom */}
                        <div className="relative z-10 pb-0.5 text-center">
                          <span className="text-[5px] font-semibold text-amber-300/80 tracking-widest uppercase block">
                            {isQuran ? "Halaqah" : "Kelas"}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Bookmark ribbon */}
                    <div className="absolute top-0 right-2 w-1.5 h-3.5 bg-[#FF6F3D] shadow-xs z-20 clip-ribbon pointer-events-none opacity-90 group-hover:opacity-100" />
                  </div>

                  {/* Status Badge Overlaid Directly on Top of the Cover Image (di depan cover-nya) */}
                  {studentCount > 0 && (
                    <div className="absolute bottom-2 inset-x-0 z-30 flex justify-center pointer-events-none px-1">
                      <span className={`text-[8px] sm:text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg backdrop-blur-md inline-flex items-center gap-0.5 border truncate ${
                        dueInClass > 0
                          ? 'bg-amber-500/95 text-white border-amber-400/80'
                          : 'bg-emerald-600/95 text-white border-emerald-400/80'
                      }`}>
                        {dueInClass > 0 ? (
                          <>
                            <span className="w-1 h-1 rounded-full bg-white animate-pulse shrink-0" />
                            <span className="truncate">{dueInClass} review</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-2.5 h-2.5 text-white shrink-0" />
                            <span className="truncate">Tuntas</span>
                          </>
                        )}
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom Space: Book Title & Quick Action */}
                <div className="w-full pt-1.5 flex flex-col items-center justify-center min-w-0">
                  <h4 
                    title={cls.name}
                    className="font-extrabold text-xs text-[#18234A] dark:text-[#F8FAFC] truncate whitespace-nowrap overflow-hidden text-ellipsis block text-center w-full group-hover:text-[#FF6F3D] transition-colors"
                  >
                    {cls.name}
                  </h4>
                  {!isQuran && assignedId && (
                    <button
                      type="button"
                      onClick={(e) => handleDirectEditBook(assignedId, e)}
                      className="mt-1 w-full py-0.5 px-1.5 rounded-lg bg-orange-500/10 hover:bg-[#FF6F3D] text-[#FF6F3D] hover:text-white text-[8px] sm:text-[8.5px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs hover:scale-102 active:scale-98"
                      title={language === 'en' ? 'Open & Edit this Kitab' : 'Buka & Edit Kitab ini'}
                    >
                      <BookOpen className="w-2.5 h-2.5" />
                      <span>{language === 'en' ? 'Edit Kitab' : 'Edit Kitab'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Shared Modals for Level 1 */}
      {renderSharedModals()}
    </div>
  );
};
