-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'SUPERADMIN');

-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'PREMIUM', 'INSTITUTIONAL');

-- CreateEnum
CREATE TYPE "FSRSStateEnum" AS ENUM ('NEW', 'LEARNING', 'REVIEW', 'MASTERED');

-- CreateEnum
CREATE TYPE "QuranPageStatus" AS ENUM ('INACTIVE', 'ACTIVE', 'MASTERED_FOR_NOW');

-- CreateEnum
CREATE TYPE "MapanScheduleMode" AS ENUM ('FSRS', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "ClassType" AS ENUM ('QURAN', 'NON_QURAN');

-- CreateEnum
CREATE TYPE "ClassStatus" AS ENUM ('ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('HADIR', 'IZIN', 'SAKIT', 'ALFA');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('BOOK_PURCHASE', 'SUBSCRIPTION_PRO_MONTHLY', 'SUBSCRIPTION_PRO_YEARLY');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('QRIS', 'BCA_VA', 'MANDIRI_VA', 'BRI_VA', 'GOPAY', 'SHOPEEPAY', 'CREDIT_CARD');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "firebaseUid" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "quranSpaceCode" TEXT NOT NULL,
    "plan" "Plan" NOT NULL DEFAULT 'FREE',
    "role" "Role" NOT NULL DEFAULT 'USER',
    "onboardingPreferences" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "books" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "masterBookId" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "coverUrl" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isReadonly" BOOLEAN NOT NULL DEFAULT false,
    "authorName" TEXT,
    "category" TEXT NOT NULL DEFAULT 'Umum',
    "price" INTEGER NOT NULL DEFAULT 0,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chapters" (
    "id" UUID NOT NULL,
    "bookId" UUID NOT NULL,
    "parentId" UUID,
    "masterChapterId" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "material" TEXT,
    "order" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_items" (
    "id" UUID NOT NULL,
    "bookId" UUID NOT NULL,
    "chapterId" UUID,
    "masterItemId" UUID,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "explanation" TEXT,
    "imageQ" TEXT,
    "imageA" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "order" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "book_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_book_item_progresses" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "bookItemId" UUID NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'inactive',
    "stability" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "difficulty" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "reps" INTEGER NOT NULL DEFAULT 0,
    "lapses" INTEGER NOT NULL DEFAULT 0,
    "lastReview" TIMESTAMP(3),
    "nextReview" TIMESTAMP(3),
    "state" "FSRSStateEnum" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_book_item_progresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_item_review_logs" (
    "id" UUID NOT NULL,
    "userBookItemProgressId" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rating" INTEGER NOT NULL,
    "previousInterval" DOUBLE PRECISION,
    "newInterval" DOUBLE PRECISION,
    "wasDue" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "book_item_review_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_quran_pages" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "pageNumber" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "activatedAt" TIMESTAMP(3),
    "status" "QuranPageStatus" NOT NULL DEFAULT 'INACTIVE',
    "mapanCelebrated" BOOLEAN NOT NULL DEFAULT false,
    "stability" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "difficulty" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    "reps" INTEGER NOT NULL DEFAULT 0,
    "lapses" INTEGER NOT NULL DEFAULT 0,
    "lastReview" TIMESTAMP(3),
    "nextReview" TIMESTAMP(3),
    "state" "FSRSStateEnum" NOT NULL DEFAULT 'NEW',
    "mapanScheduleMode" "MapanScheduleMode",
    "mapanWeeklyDay" INTEGER,
    "mapanMonthlyDate" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_quran_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quran_page_review_logs" (
    "id" UUID NOT NULL,
    "userQuranPageId" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rating" INTEGER NOT NULL,
    "previousInterval" DOUBLE PRECISION,
    "newInterval" DOUBLE PRECISION,
    "wasDue" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "issueTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "problemAyahs" TEXT,
    "reviewerName" TEXT,

    CONSTRAINT "quran_page_review_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_quran_issues" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "pageNumber" INTEGER NOT NULL,
    "ayah" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "detail" TEXT,
    "note" TEXT,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "user_quran_issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" UUID NOT NULL,
    "teacherId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "ClassType" NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "coverUrl" TEXT,
    "requiredJuzList" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "status" "ClassStatus" NOT NULL DEFAULT 'ACTIVE',
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_members" (
    "id" UUID NOT NULL,
    "classId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "class_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_book_assignments" (
    "id" UUID NOT NULL,
    "classId" UUID NOT NULL,
    "bookId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "class_book_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_records" (
    "id" UUID NOT NULL,
    "classMemberId" UUID NOT NULL,
    "date" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_feedbacks" (
    "id" UUID NOT NULL,
    "classId" UUID,
    "teacherId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "pageNumber" INTEGER,
    "rating" INTEGER,
    "note" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teacher_feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_documents" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "bookId" UUID NOT NULL,
    "chapterId" UUID,
    "title" TEXT NOT NULL,
    "blocks" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "page_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_tier_configs" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "config" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "system_tier_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "type" "TransactionType" NOT NULL,
    "bookId" UUID,
    "bookTitle" TEXT NOT NULL,
    "bookCoverUrl" TEXT,
    "authorName" TEXT NOT NULL,
    "authorId" UUID,
    "amount" INTEGER NOT NULL,
    "platformFee" INTEGER NOT NULL,
    "authorRoyalty" INTEGER NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_firebaseUid_key" ON "users"("firebaseUid");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_quranSpaceCode_key" ON "users"("quranSpaceCode");

-- CreateIndex
CREATE INDEX "books_userId_idx" ON "books"("userId");

-- CreateIndex
CREATE INDEX "books_isPublic_idx" ON "books"("isPublic");

-- CreateIndex
CREATE INDEX "chapters_bookId_idx" ON "chapters"("bookId");

-- CreateIndex
CREATE INDEX "chapters_parentId_idx" ON "chapters"("parentId");

-- CreateIndex
CREATE INDEX "book_items_bookId_idx" ON "book_items"("bookId");

-- CreateIndex
CREATE INDEX "book_items_chapterId_idx" ON "book_items"("chapterId");

-- CreateIndex
CREATE INDEX "user_book_item_progresses_userId_isActive_idx" ON "user_book_item_progresses"("userId", "isActive");

-- CreateIndex
CREATE INDEX "user_book_item_progresses_userId_nextReview_idx" ON "user_book_item_progresses"("userId", "nextReview");

-- CreateIndex
CREATE UNIQUE INDEX "user_book_item_progresses_userId_bookItemId_key" ON "user_book_item_progresses"("userId", "bookItemId");

-- CreateIndex
CREATE INDEX "book_item_review_logs_userBookItemProgressId_idx" ON "book_item_review_logs"("userBookItemProgressId");

-- CreateIndex
CREATE INDEX "user_quran_pages_userId_isActive_idx" ON "user_quran_pages"("userId", "isActive");

-- CreateIndex
CREATE INDEX "user_quran_pages_userId_nextReview_idx" ON "user_quran_pages"("userId", "nextReview");

-- CreateIndex
CREATE UNIQUE INDEX "user_quran_pages_userId_pageNumber_key" ON "user_quran_pages"("userId", "pageNumber");

-- CreateIndex
CREATE INDEX "quran_page_review_logs_userQuranPageId_idx" ON "quran_page_review_logs"("userQuranPageId");

-- CreateIndex
CREATE INDEX "user_quran_issues_userId_pageNumber_idx" ON "user_quran_issues"("userId", "pageNumber");

-- CreateIndex
CREATE UNIQUE INDEX "classes_code_key" ON "classes"("code");

-- CreateIndex
CREATE INDEX "classes_teacherId_idx" ON "classes"("teacherId");

-- CreateIndex
CREATE INDEX "classes_code_idx" ON "classes"("code");

-- CreateIndex
CREATE INDEX "class_members_classId_idx" ON "class_members"("classId");

-- CreateIndex
CREATE INDEX "class_members_studentId_idx" ON "class_members"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "class_members_classId_studentId_key" ON "class_members"("classId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "class_book_assignments_classId_bookId_key" ON "class_book_assignments"("classId", "bookId");

-- CreateIndex
CREATE INDEX "attendance_records_date_idx" ON "attendance_records"("date");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_classMemberId_date_key" ON "attendance_records"("classMemberId", "date");

-- CreateIndex
CREATE INDEX "teacher_feedbacks_studentId_idx" ON "teacher_feedbacks"("studentId");

-- CreateIndex
CREATE INDEX "teacher_feedbacks_classId_idx" ON "teacher_feedbacks"("classId");

-- CreateIndex
CREATE INDEX "page_documents_bookId_idx" ON "page_documents"("bookId");

-- CreateIndex
CREATE INDEX "page_documents_chapterId_idx" ON "page_documents"("chapterId");

-- CreateIndex
CREATE INDEX "transactions_userId_idx" ON "transactions"("userId");

-- CreateIndex
CREATE INDEX "transactions_status_idx" ON "transactions"("status");

-- AddForeignKey
ALTER TABLE "books" ADD CONSTRAINT "books_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "books" ADD CONSTRAINT "books_masterBookId_fkey" FOREIGN KEY ("masterBookId") REFERENCES "books"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_items" ADD CONSTRAINT "book_items_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_items" ADD CONSTRAINT "book_items_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "chapters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_book_item_progresses" ADD CONSTRAINT "user_book_item_progresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_book_item_progresses" ADD CONSTRAINT "user_book_item_progresses_bookItemId_fkey" FOREIGN KEY ("bookItemId") REFERENCES "book_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_item_review_logs" ADD CONSTRAINT "book_item_review_logs_userBookItemProgressId_fkey" FOREIGN KEY ("userBookItemProgressId") REFERENCES "user_book_item_progresses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_quran_pages" ADD CONSTRAINT "user_quran_pages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quran_page_review_logs" ADD CONSTRAINT "quran_page_review_logs_userQuranPageId_fkey" FOREIGN KEY ("userQuranPageId") REFERENCES "user_quran_pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_quran_issues" ADD CONSTRAINT "user_quran_issues_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_members" ADD CONSTRAINT "class_members_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_members" ADD CONSTRAINT "class_members_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_book_assignments" ADD CONSTRAINT "class_book_assignments_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_book_assignments" ADD CONSTRAINT "class_book_assignments_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_classMemberId_fkey" FOREIGN KEY ("classMemberId") REFERENCES "class_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_feedbacks" ADD CONSTRAINT "teacher_feedbacks_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_feedbacks" ADD CONSTRAINT "teacher_feedbacks_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_feedbacks" ADD CONSTRAINT "teacher_feedbacks_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_documents" ADD CONSTRAINT "page_documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_documents" ADD CONSTRAINT "page_documents_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_documents" ADD CONSTRAINT "page_documents_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "chapters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE SET NULL ON UPDATE CASCADE;
