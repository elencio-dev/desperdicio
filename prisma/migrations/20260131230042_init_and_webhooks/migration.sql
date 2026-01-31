-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'SOLD_OUT', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING_PAYMENT', 'CONFIRMED', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PIX', 'CREDIT_CARD');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'APPROVED', 'REFUSED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ORDER_CONFIRMED', 'PICKUP_REMINDER', 'ORDER_CANCELLED', 'REVIEW_REQUEST', 'NEW_ORDER');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "role" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verifications" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurants" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalRatings" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_hours" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "openTime" TEXT NOT NULL,
    "closeTime" TEXT NOT NULL,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "business_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consumers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "failedPickups" INTEGER NOT NULL DEFAULT 0,
    "blockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consumers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offers" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "packageType" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL,
    "availableQuantity" INTEGER NOT NULL,
    "originalPrice" DOUBLE PRECISION NOT NULL,
    "promotionalPrice" DOUBLE PRECISION NOT NULL,
    "discountPercent" DOUBLE PRECISION NOT NULL,
    "pickupStartTime" TIMESTAMP(3) NOT NULL,
    "pickupEndTime" TIMESTAMP(3) NOT NULL,
    "status" "OfferStatus" NOT NULL DEFAULT 'ACTIVE',
    "isVegetarian" BOOLEAN NOT NULL DEFAULT false,
    "isVegan" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "consumerId" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "originalPrice" DOUBLE PRECISION NOT NULL,
    "promotionalPrice" DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "platformFee" DOUBLE PRECISION NOT NULL,
    "restaurantAmount" DOUBLE PRECISION NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentId" TEXT,
    "pickupCode" TEXT NOT NULL,
    "qrCodeUrl" TEXT,
    "pickupTime" TIMESTAMP(3),
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "consumerId" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userType" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "relatedId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "platformFee" DOUBLE PRECISION NOT NULL,
    "restaurantAmount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "restaurants_userId_key" ON "restaurants"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "restaurants_cnpj_key" ON "restaurants"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "restaurants_email_key" ON "restaurants"("email");

-- CreateIndex
CREATE UNIQUE INDEX "business_hours_restaurantId_dayOfWeek_key" ON "business_hours"("restaurantId", "dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "consumers_userId_key" ON "consumers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "consumers_email_key" ON "consumers"("email");

-- CreateIndex
CREATE INDEX "offers_status_pickupEndTime_idx" ON "offers"("status", "pickupEndTime");

-- CreateIndex
CREATE INDEX "offers_restaurantId_idx" ON "offers"("restaurantId");

-- CreateIndex
CREATE UNIQUE INDEX "orders_pickupCode_key" ON "orders"("pickupCode");

-- CreateIndex
CREATE INDEX "orders_consumerId_idx" ON "orders"("consumerId");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_pickupCode_idx" ON "orders"("pickupCode");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_orderId_key" ON "reviews"("orderId");

-- CreateIndex
CREATE INDEX "reviews_restaurantId_idx" ON "reviews"("restaurantId");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- CreateIndex
CREATE INDEX "transactions_restaurantId_status_idx" ON "transactions"("restaurantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_externalId_key" ON "webhook_events"("externalId");

-- CreateIndex
CREATE INDEX "webhook_events_externalId_idx" ON "webhook_events"("externalId");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_hours" ADD CONSTRAINT "business_hours_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consumers" ADD CONSTRAINT "consumers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_consumerId_fkey" FOREIGN KEY ("consumerId") REFERENCES "consumers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_consumerId_fkey" FOREIGN KEY ("consumerId") REFERENCES "consumers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
