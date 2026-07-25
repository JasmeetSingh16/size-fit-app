-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SizeChart" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT,
    "fitType" TEXT NOT NULL DEFAULT 'regular',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SizeChart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SizeEntry" (
    "id" TEXT NOT NULL,
    "sizeChartId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "heightMinCm" DOUBLE PRECISION,
    "heightMaxCm" DOUBLE PRECISION,
    "weightMinKg" DOUBLE PRECISION,
    "weightMaxKg" DOUBLE PRECISION,
    "chestMinCm" DOUBLE PRECISION,
    "chestMaxCm" DOUBLE PRECISION,
    "waistMinCm" DOUBLE PRECISION,
    "waistMaxCm" DOUBLE PRECISION,

    CONSTRAINT "SizeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizResponse" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "heightCm" DOUBLE PRECISION,
    "weightKg" DOUBLE PRECISION,
    "fitPreference" TEXT NOT NULL DEFAULT 'regular',
    "referenceBrand" TEXT,
    "referenceSize" TEXT,
    "recommendedSize" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SizeChart_shop_idx" ON "SizeChart"("shop");

-- CreateIndex
CREATE UNIQUE INDEX "SizeChart_shop_productId_key" ON "SizeChart"("shop", "productId");

-- CreateIndex
CREATE INDEX "SizeEntry_sizeChartId_idx" ON "SizeEntry"("sizeChartId");

-- CreateIndex
CREATE INDEX "QuizResponse_shop_productId_idx" ON "QuizResponse"("shop", "productId");

-- AddForeignKey
ALTER TABLE "SizeEntry" ADD CONSTRAINT "SizeEntry_sizeChartId_fkey" FOREIGN KEY ("sizeChartId") REFERENCES "SizeChart"("id") ON DELETE CASCADE ON UPDATE CASCADE;
