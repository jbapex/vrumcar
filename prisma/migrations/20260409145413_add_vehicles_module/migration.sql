-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'SOLD', 'IN_PREPARATION', 'IN_MAINTENANCE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('GASOLINE', 'ETHANOL', 'FLEX', 'DIESEL', 'ELECTRIC', 'HYBRID', 'CNG');

-- CreateEnum
CREATE TYPE "TransmissionType" AS ENUM ('MANUAL', 'AUTOMATIC', 'CVT', 'SEMI_AUTOMATIC');

-- CreateEnum
CREATE TYPE "BodyType" AS ENUM ('HATCH', 'SEDAN', 'SUV', 'PICKUP', 'MINIVAN', 'COUPE', 'CONVERTIBLE', 'WAGON', 'VAN', 'OTHER');

-- CreateEnum
CREATE TYPE "VehicleCategory" AS ENUM ('POPULAR', 'MEDIUM', 'LUXURY', 'PREMIUM', 'COMMERCIAL');

-- CreateEnum
CREATE TYPE "VehicleCostType" AS ENUM ('PURCHASE', 'TRANSFER', 'MECHANIC', 'BODYWORK', 'DETAILING', 'INSPECTION', 'PHOTOS', 'CLEANING', 'OTHER');

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "sale_price_cents" INTEGER NOT NULL,
    "version" TEXT,
    "year" INTEGER,
    "model_year" INTEGER,
    "exterior_color" TEXT,
    "interior_color" TEXT,
    "mileage_km" INTEGER,
    "fuel_type" "FuelType",
    "transmission" "TransmissionType",
    "body_type" "BodyType",
    "category" "VehicleCategory",
    "engine_size" TEXT,
    "doors" INTEGER,
    "license_plate" TEXT,
    "chassis_number" TEXT,
    "renavam" TEXT,
    "fipe_code" TEXT,
    "description" TEXT,
    "optionals" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "acquisition_cost_cents" INTEGER,
    "min_price_cents" INTEGER,
    "fipe_price_cents" INTEGER,
    "status" "VehicleStatus" NOT NULL DEFAULT 'AVAILABLE',
    "is_complete" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_photos" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_cover" BOOLEAN NOT NULL DEFAULT false,
    "mime_type" TEXT,
    "size_bytes" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_costs" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "type" "VehicleCostType" NOT NULL,
    "description" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_price_history" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "old_price_cents" INTEGER,
    "new_price_cents" INTEGER NOT NULL,
    "reason" TEXT,
    "changed_by" TEXT,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_price_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vehicles_organization_id_status_idx" ON "vehicles"("organization_id", "status");

-- CreateIndex
CREATE INDEX "vehicles_organization_id_brand_model_idx" ON "vehicles"("organization_id", "brand", "model");

-- CreateIndex
CREATE INDEX "vehicles_organization_id_created_at_idx" ON "vehicles"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "vehicles_organization_id_license_plate_idx" ON "vehicles"("organization_id", "license_plate");

-- CreateIndex
CREATE INDEX "vehicle_photos_organization_id_vehicle_id_idx" ON "vehicle_photos"("organization_id", "vehicle_id");

-- CreateIndex
CREATE INDEX "vehicle_photos_vehicle_id_order_idx" ON "vehicle_photos"("vehicle_id", "order");

-- CreateIndex
CREATE INDEX "vehicle_costs_organization_id_vehicle_id_idx" ON "vehicle_costs"("organization_id", "vehicle_id");

-- CreateIndex
CREATE INDEX "vehicle_price_history_organization_id_vehicle_id_idx" ON "vehicle_price_history"("organization_id", "vehicle_id");

-- CreateIndex
CREATE INDEX "vehicle_price_history_vehicle_id_changed_at_idx" ON "vehicle_price_history"("vehicle_id", "changed_at");

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_photos" ADD CONSTRAINT "vehicle_photos_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_photos" ADD CONSTRAINT "vehicle_photos_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_costs" ADD CONSTRAINT "vehicle_costs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_costs" ADD CONSTRAINT "vehicle_costs_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_price_history" ADD CONSTRAINT "vehicle_price_history_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_price_history" ADD CONSTRAINT "vehicle_price_history_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
