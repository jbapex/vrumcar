-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'DEBIT_CARD', 'CREDIT_CARD', 'FINANCING', 'CONSORTIUM', 'TRADE_IN_ONLY', 'MIXED');

-- CreateTable
CREATE TABLE "sales" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "lead_id" TEXT,
    "sales_person_id" TEXT NOT NULL,
    "list_price_cents" INTEGER NOT NULL,
    "final_price_cents" INTEGER NOT NULL,
    "discount_cents" INTEGER NOT NULL DEFAULT 0,
    "payment_method" "PaymentMethod" NOT NULL,
    "payment_notes" TEXT,
    "has_trade_in" BOOLEAN NOT NULL DEFAULT false,
    "trade_in_brand" TEXT,
    "trade_in_model" TEXT,
    "trade_in_year" INTEGER,
    "trade_in_mileage_km" INTEGER,
    "trade_in_plate" TEXT,
    "trade_in_value_cents" INTEGER,
    "trade_in_notes" TEXT,
    "contract_number" TEXT,
    "notes" TEXT,
    "status" "SaleStatus" NOT NULL DEFAULT 'COMPLETED',
    "sold_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelled_at" TIMESTAMP(3),
    "cancelled_reason" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sales_lead_id_key" ON "sales"("lead_id");

-- CreateIndex
CREATE INDEX "sales_organization_id_status_sold_at_idx" ON "sales"("organization_id", "status", "sold_at");

-- CreateIndex
CREATE INDEX "sales_organization_id_sales_person_id_sold_at_idx" ON "sales"("organization_id", "sales_person_id", "sold_at");

-- CreateIndex
CREATE INDEX "sales_organization_id_customer_id_idx" ON "sales"("organization_id", "customer_id");

-- CreateIndex
CREATE INDEX "sales_vehicle_id_idx" ON "sales"("vehicle_id");

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_sales_person_id_fkey" FOREIGN KEY ("sales_person_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
