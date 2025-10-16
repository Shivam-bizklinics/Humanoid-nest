# Agency Module - Database Migration Guide

## Overview

This guide will help you migrate your database to support the updated Agency Module with user-based business manager isolation and workspace-based asset isolation.

---

## Migration Required

### What Changed

**Before:**
- Business Managers had `workspaceId` for isolation
- One BM per workspace

**After:**
- Business Managers have `userId` for isolation  
- One BM per user (if they have their own BM)
- Assets still have `workspaceId` for workspace-level isolation
- Users without BM link workspaces directly to parent BM

---

## Step 1: Create Migration File

```bash
npm run migration:generate -- src/migrations/UpdateAgencyModuleIsolation
```

---

## Step 2: Add Column Changes

The migration will need to:

1. Add `userId` column to `business_managers` table
2. Optionally remove or keep `workspaceId` for backward compatibility
3. Add index on `userId`
4. Update unique constraints

### Sample Migration

```typescript
import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateAgencyModuleIsolation1728500000000 implements MigrationInterface {
    name = 'UpdateAgencyModuleIsolation1728500000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add userId column to business_managers
        await queryRunner.query(`
            ALTER TABLE "business_managers" 
            ADD COLUMN "user_id" uuid
        `);

        // Add index on userId
        await queryRunner.query(`
            CREATE INDEX "IDX_business_managers_user_id" 
            ON "business_managers"("user_id")
        `);

        // Add foreign key constraint
        await queryRunner.query(`
            ALTER TABLE "business_managers" 
            ADD CONSTRAINT "FK_business_managers_user" 
            FOREIGN KEY ("user_id") 
            REFERENCES "users"("id") 
            ON DELETE SET NULL 
            ON UPDATE NO ACTION
        `);

        // Update existing data: set userId from createdBy for child BMs
        await queryRunner.query(`
            UPDATE "business_managers" 
            SET "user_id" = "created_by" 
            WHERE "type" IN ('client', 'agency')
        `);

        // Ensure parent BM has NULL userId
        await queryRunner.query(`
            UPDATE "business_managers" 
            SET "user_id" = NULL 
            WHERE "type" = 'parent'
        `);

        // Optional: Remove workspaceId if not needed
        // await queryRunner.query(`
        //     ALTER TABLE "business_managers" 
        //     DROP COLUMN "workspace_id"
        // `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert userId changes
        await queryRunner.query(`
            ALTER TABLE "business_managers" 
            DROP CONSTRAINT "FK_business_managers_user"
        `);

        await queryRunner.query(`
            DROP INDEX "IDX_business_managers_user_id"
        `);

        await queryRunner.query(`
            ALTER TABLE "business_managers" 
            DROP COLUMN "user_id"
        `);

        // Optional: Restore workspaceId if removed
        // await queryRunner.query(`
        //     ALTER TABLE "business_managers" 
        //     ADD COLUMN "workspace_id" uuid
        // `);
    }
}
```

---

## Step 3: Run Migration

```bash
# Review the migration file first!
# Check src/migrations/UpdateAgencyModuleIsolation*.ts

# Run the migration
npm run migration:run
```

---

## Step 4: Verify Data

After migration, verify the data:

```sql
-- Check parent BM has no userId
SELECT id, name, type, user_id 
FROM business_managers 
WHERE type = 'parent';
-- Expected: user_id should be NULL

-- Check child BMs have userId
SELECT id, name, type, user_id, created_by 
FROM business_managers 
WHERE type IN ('client', 'agency');
-- Expected: user_id should match created_by

-- Check assets still have workspaceId
SELECT id, asset_type, workspace_id, business_manager_id 
FROM platform_assets 
LIMIT 10;
-- Expected: workspace_id should be populated
```

---

## Step 5: Test Isolation

### Test 1: User with Own BM

```typescript
// User A creates their BM
const userABM = await POST('/agency/business-managers/connect', {
  platformBusinessId: '123456789',
  parentBusinessManagerId: parentBMId,
  type: 'client',
  relationship: 'owned'
}, { userId: 'user-a-id' });

// Verify userId is set
expect(userABM.userId).toBe('user-a-id');

// User B should NOT see User A's BM
const userBBMs = await GET('/agency/business-managers/user/me', {
  userId: 'user-b-id'
});
expect(userBBMs).not.toContainEqual(userABM);
```

### Test 2: User Without BM

```typescript
// User C has no BM, gets parent BM
const userCBM = await GET('/agency/business-managers/user/me/or-parent', {
  userId: 'user-c-id'
});

// Should return parent BM
expect(userCBM.type).toBe('parent');
expect(userCBM.userId).toBeNull();
```

### Test 3: Workspace Asset Isolation

```typescript
// Create workspace with assets
const workspace1 = await POST('/workspaces', {
  name: 'Brand A'
}, { userId: 'user-a-id' });

// Assign asset to workspace
await POST('/agency/assets/assign-workspace', {
  assetId: 'asset-1-id',
  workspaceId: workspace1.id
});

// User A should see asset in workspace 1
const ws1Assets = await GET(`/agency/assets?workspaceId=${workspace1.id}`);
expect(ws1Assets).toContainEqual(expect.objectContaining({ id: 'asset-1-id' }));

// Different workspace should not see the asset
const ws2Assets = await GET(`/agency/assets?workspaceId=${workspace2.id}`);
expect(ws2Assets).not.toContainEqual(expect.objectContaining({ id: 'asset-1-id' }));
```

---

## Step 6: Update Existing Code (If Any)

If you have existing code that references `workspaceId` on Business Managers:

### Before:
```typescript
// Old: Get BM by workspace
const bm = await businessManagerRepository.findOne({
  where: { workspaceId }
});
```

### After:
```typescript
// New: Get BM by user
const bm = await businessManagerRepository.findOne({
  where: { userId }
});

// Or get user's BM or parent
const bm = await businessManagerService.getOrCreateUserBusinessManager(userId);
```

---

## Rollback Plan

If something goes wrong:

```bash
# Revert the migration
npm run migration:revert

# This will:
# - Remove userId column
# - Remove indexes
# - Remove foreign keys
# - Optionally restore workspaceId
```

---

## Data Backup

**IMPORTANT:** Before running migration in production:

```bash
# Backup database
pg_dump -h localhost -U postgres -d humanoid_db > backup_before_agency_migration.sql

# Or use your cloud provider's backup tool
# AWS RDS: Create snapshot
# Google Cloud SQL: Create backup
```

---

## Production Checklist

- [ ] Database backup created
- [ ] Migration reviewed and tested in staging
- [ ] Downtime window scheduled (if needed)
- [ ] Team notified of changes
- [ ] Migration file reviewed by senior developer
- [ ] Rollback plan tested
- [ ] Data verification queries prepared
- [ ] Post-migration tests ready

---

## Common Issues

### Issue: Migration fails with foreign key constraint

**Solution:** 
```sql
-- Check for orphaned records
SELECT * FROM business_managers 
WHERE created_by NOT IN (SELECT id FROM users);

-- Fix orphaned records
UPDATE business_managers 
SET created_by = NULL 
WHERE created_by NOT IN (SELECT id FROM users);
```

### Issue: Existing data has NULL createdBy

**Solution:**
```sql
-- Set a default user for orphaned BMs
UPDATE business_managers 
SET user_id = (SELECT id FROM users WHERE email = 'admin@humanoid.com' LIMIT 1)
WHERE user_id IS NULL AND type IN ('client', 'agency');
```

### Issue: Parent BM has userId set

**Solution:**
```sql
-- Ensure parent BM has no userId
UPDATE business_managers 
SET user_id = NULL 
WHERE type = 'parent';
```

---

## Testing Queries

After migration, run these queries to verify:

```sql
-- 1. Count BMs by type and userId status
SELECT 
  type,
  CASE 
    WHEN user_id IS NULL THEN 'No User'
    ELSE 'Has User'
  END as user_status,
  COUNT(*) as count
FROM business_managers
GROUP BY type, user_status;

-- Expected:
-- parent    | No User   | 1
-- client    | Has User  | N
-- agency    | Has User  | N

-- 2. Check unique constraint is working
SELECT 
  platform, 
  platform_business_id, 
  user_id, 
  COUNT(*) as count
FROM business_managers
WHERE user_id IS NOT NULL
GROUP BY platform, platform_business_id, user_id
HAVING COUNT(*) > 1;

-- Expected: No rows (no duplicates)

-- 3. Verify assets have workspaceId
SELECT 
  CASE 
    WHEN workspace_id IS NULL THEN 'No Workspace'
    ELSE 'Has Workspace'
  END as workspace_status,
  COUNT(*) as count
FROM platform_assets
GROUP BY workspace_status;

-- Expected: Most assets should have workspaceId
```

---

## Support

If you encounter issues:

1. Check logs for migration errors
2. Verify database permissions
3. Review data integrity with verification queries
4. Use rollback if needed
5. Contact development team

---

**Good luck with your migration! 🚀**

