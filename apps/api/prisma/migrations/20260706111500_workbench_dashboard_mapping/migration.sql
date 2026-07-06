ALTER TABLE "WorkbenchSetting" ADD COLUMN "mappedDashboardId" TEXT;

UPDATE "WorkbenchSetting" SET "mappedDashboardId" = "dashboardId" WHERE "mappedDashboardId" IS NULL;