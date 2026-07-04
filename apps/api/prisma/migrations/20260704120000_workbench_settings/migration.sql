CREATE TABLE "WorkbenchSetting" (
  "dashboardId" TEXT NOT NULL PRIMARY KEY,
  "visibleRoles" TEXT NOT NULL,
  "availability" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorkbenchSetting_dashboardId_fkey" FOREIGN KEY ("dashboardId") REFERENCES "Dashboard" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
