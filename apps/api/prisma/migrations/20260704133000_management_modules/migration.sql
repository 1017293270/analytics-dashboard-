CREATE TABLE "ApplicationCategory" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "ManagedApplication" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "categoryName" TEXT NOT NULL,
  "platform" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "packageId" TEXT NOT NULL,
  "icon" TEXT NOT NULL,
  "visibleRoleCodes" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "DataDashboard" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "embedUrl" TEXT NOT NULL,
  "isDefault" BOOLEAN NOT NULL,
  "visibleRoleCodes" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "metrics" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Alarm" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "deviceIdentifier" TEXT NOT NULL,
  "deviceName" TEXT NOT NULL,
  "location" TEXT NOT NULL,
  "responsibleName" TEXT NOT NULL,
  "responsiblePhone" TEXT NOT NULL,
  "triggerMethod" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "reportedAt" DATETIME NOT NULL,
  "recording" TEXT NOT NULL,
  "disposalRecords" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "ManagedApplication_categoryId_idx" ON "ManagedApplication"("categoryId");
CREATE INDEX "ManagedApplication_platform_idx" ON "ManagedApplication"("platform");
CREATE INDEX "ManagedApplication_status_idx" ON "ManagedApplication"("status");
CREATE INDEX "ManagedApplication_sortOrder_idx" ON "ManagedApplication"("sortOrder");

CREATE INDEX "DataDashboard_type_idx" ON "DataDashboard"("type");
CREATE INDEX "DataDashboard_source_idx" ON "DataDashboard"("source");
CREATE INDEX "DataDashboard_status_idx" ON "DataDashboard"("status");
CREATE INDEX "DataDashboard_sortOrder_idx" ON "DataDashboard"("sortOrder");

CREATE INDEX "Alarm_deviceIdentifier_idx" ON "Alarm"("deviceIdentifier");
CREATE INDEX "Alarm_triggerMethod_idx" ON "Alarm"("triggerMethod");
CREATE INDEX "Alarm_status_idx" ON "Alarm"("status");
CREATE INDEX "Alarm_reportedAt_idx" ON "Alarm"("reportedAt");
