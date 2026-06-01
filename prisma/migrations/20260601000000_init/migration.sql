-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('supplier', 'buyer', 'service_provider', 'admin');

-- CreateEnum
CREATE TYPE "VerifyStatus" AS ENUM ('unverified', 'pending', 'verified', 'rejected', 'needs_more_info');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('supplier', 'buyer', 'qualification', 'channel');

-- CreateEnum
CREATE TYPE "ResourceStatus" AS ENUM ('pending', 'approved', 'rejected', 'needs_more_info', 'featured', 'high_risk');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('pending', 'approved', 'rejected', 'needs_more_info');

-- CreateEnum
CREATE TYPE "MatchRequestStatus" AS ENUM ('pending', 'approved', 'rejected', 'contact_unlocked');

-- CreateEnum
CREATE TYPE "LicenseApplicationStatus" AS ENUM ('pending', 'contacted', 'approved', 'rejected', 'needs_more_info');

-- CreateEnum
CREATE TYPE "VerificationType" AS ENUM ('personal', 'company', 'license');

-- CreateEnum
CREATE TYPE "AuditTargetType" AS ENUM ('resource', 'demand', 'match_request', 'license_application', 'verification', 'user');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "phone" TEXT,
    "telegram" TEXT,
    "whatsapp" TEXT,
    "wechat" TEXT,
    "country" TEXT,
    "city" TEXT,
    "companyName" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'buyer',
    "verifyStatus" "VerifyStatus" NOT NULL DEFAULT 'unverified',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resource" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ResourceType" NOT NULL DEFAULT 'supplier',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "city" TEXT,
    "category" TEXT NOT NULL,
    "cooperationMode" TEXT,
    "budgetRange" TEXT,
    "longTerm" BOOLEAN NOT NULL DEFAULT false,
    "hasBusinessLicense" BOOLEAN NOT NULL DEFAULT false,
    "hasQualification" BOOLEAN NOT NULL DEFAULT false,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "contactTelegram" TEXT,
    "contactWhatsapp" TEXT,
    "contactWechat" TEXT,
    "status" "ResourceStatus" NOT NULL DEFAULT 'pending',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "matchCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Demand" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "city" TEXT,
    "category" TEXT NOT NULL,
    "budgetRange" TEXT,
    "cooperationMode" TEXT,
    "urgency" TEXT,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "contactTelegram" TEXT,
    "contactWhatsapp" TEXT,
    "contactWechat" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Demand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchRequest" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "MatchRequestStatus" NOT NULL DEFAULT 'pending',
    "adminNote" TEXT,
    "contactUnlockedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MatchRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LicenseApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "city" TEXT,
    "companyName" TEXT,
    "channelInfo" TEXT,
    "capitalAbility" TEXT,
    "cooperationType" TEXT NOT NULL,
    "hasWarehouse" BOOLEAN NOT NULL DEFAULT false,
    "hasStore" BOOLEAN NOT NULL DEFAULT false,
    "hasTeam" BOOLEAN NOT NULL DEFAULT false,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "contactTelegram" TEXT,
    "contactWhatsapp" TEXT,
    "contactWechat" TEXT,
    "note" TEXT,
    "status" "LicenseApplicationStatus" NOT NULL DEFAULT 'pending',
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LicenseApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "VerificationType" NOT NULL,
    "documentUrl" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'pending',
    "adminNote" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "targetType" "AuditTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UploadFile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT,
    "size" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UploadFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_verifyStatus_idx" ON "User"("verifyStatus");

-- CreateIndex
CREATE INDEX "Resource_userId_idx" ON "Resource"("userId");

-- CreateIndex
CREATE INDEX "Resource_status_isFeatured_idx" ON "Resource"("status", "isFeatured");

-- CreateIndex
CREATE INDEX "Resource_type_idx" ON "Resource"("type");

-- CreateIndex
CREATE INDEX "Resource_country_city_idx" ON "Resource"("country", "city");

-- CreateIndex
CREATE INDEX "Resource_category_idx" ON "Resource"("category");

-- CreateIndex
CREATE INDEX "Resource_createdAt_idx" ON "Resource"("createdAt");

-- CreateIndex
CREATE INDEX "Demand_userId_idx" ON "Demand"("userId");

-- CreateIndex
CREATE INDEX "Demand_status_idx" ON "Demand"("status");

-- CreateIndex
CREATE INDEX "Demand_country_city_idx" ON "Demand"("country", "city");

-- CreateIndex
CREATE INDEX "Demand_category_idx" ON "Demand"("category");

-- CreateIndex
CREATE INDEX "Demand_createdAt_idx" ON "Demand"("createdAt");

-- CreateIndex
CREATE INDEX "MatchRequest_status_idx" ON "MatchRequest"("status");

-- CreateIndex
CREATE INDEX "MatchRequest_resourceId_idx" ON "MatchRequest"("resourceId");

-- CreateIndex
CREATE INDEX "MatchRequest_requesterId_idx" ON "MatchRequest"("requesterId");

-- CreateIndex
CREATE INDEX "MatchRequest_reviewedBy_idx" ON "MatchRequest"("reviewedBy");

-- CreateIndex
CREATE INDEX "MatchRequest_createdAt_idx" ON "MatchRequest"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MatchRequest_resourceId_requesterId_key" ON "MatchRequest"("resourceId", "requesterId");

-- CreateIndex
CREATE INDEX "LicenseApplication_userId_idx" ON "LicenseApplication"("userId");

-- CreateIndex
CREATE INDEX "LicenseApplication_status_idx" ON "LicenseApplication"("status");

-- CreateIndex
CREATE INDEX "LicenseApplication_country_city_idx" ON "LicenseApplication"("country", "city");

-- CreateIndex
CREATE INDEX "LicenseApplication_createdAt_idx" ON "LicenseApplication"("createdAt");

-- CreateIndex
CREATE INDEX "Verification_userId_type_idx" ON "Verification"("userId", "type");

-- CreateIndex
CREATE INDEX "Verification_status_idx" ON "Verification"("status");

-- CreateIndex
CREATE INDEX "Verification_reviewedBy_idx" ON "Verification"("reviewedBy");

-- CreateIndex
CREATE INDEX "AdminAuditLog_adminId_idx" ON "AdminAuditLog"("adminId");

-- CreateIndex
CREATE INDEX "AdminAuditLog_targetType_targetId_idx" ON "AdminAuditLog"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "UploadFile_userId_idx" ON "UploadFile"("userId");

-- CreateIndex
CREATE INDEX "UploadFile_targetType_targetId_idx" ON "UploadFile"("targetType", "targetId");

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Demand" ADD CONSTRAINT "Demand_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchRequest" ADD CONSTRAINT "MatchRequest_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchRequest" ADD CONSTRAINT "MatchRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchRequest" ADD CONSTRAINT "MatchRequest_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LicenseApplication" ADD CONSTRAINT "LicenseApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Verification" ADD CONSTRAINT "Verification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Verification" ADD CONSTRAINT "Verification_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadFile" ADD CONSTRAINT "UploadFile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
