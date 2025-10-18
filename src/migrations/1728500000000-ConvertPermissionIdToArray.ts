import { MigrationInterface, QueryRunner } from "typeorm";

export class ConvertPermissionIdToArray1728500000000 implements MigrationInterface {
    name = 'ConvertPermissionIdToArray1728500000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // First, let's check what columns exist in the table
        const tableInfo = await queryRunner.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'user_workspace_permissions' 
            AND table_schema = 'public'
        `);
        
        console.log('Existing columns:', tableInfo.map((col: any) => col.column_name));

        // Check if permissionId column exists
        const hasPermissionId = tableInfo.some((col: any) => col.column_name === 'permissionId');
        const hasPermissionIds = tableInfo.some((col: any) => col.column_name === 'permission_ids');

        if (hasPermissionIds) {
            console.log('permission_ids column already exists, skipping migration');
            return;
        }

        if (!hasPermissionId) {
            console.log('permissionId column does not exist, creating empty permission_ids array');
            // Just add the new column with empty arrays
            await queryRunner.query(`
                ALTER TABLE "user_workspace_permissions" 
                ADD COLUMN "permission_ids" uuid[] DEFAULT '{}'
            `);
        } else {
            // Step 1: Add new permission_ids column
            await queryRunner.query(`
                ALTER TABLE "user_workspace_permissions" 
                ADD COLUMN "permission_ids" uuid[] DEFAULT '{}'
            `);

            // Step 2: Migrate data - aggregate permission IDs by user and workspace
            await queryRunner.query(`
                UPDATE "user_workspace_permissions" uwp1
                SET "permission_ids" = (
                    SELECT array_agg(DISTINCT "permissionId")
                    FROM "user_workspace_permissions" uwp2
                    WHERE uwp2."userId" = uwp1."userId" 
                      AND uwp2."workspaceId" = uwp1."workspaceId"
                      AND uwp2."isActive" = true
                )
                WHERE uwp1."isActive" = true
            `);

            // Step 3: Keep only the first row per user-workspace pair, delete duplicates
            await queryRunner.query(`
                DELETE FROM "user_workspace_permissions"
                WHERE "id" NOT IN (
                    SELECT DISTINCT ON ("userId", "workspaceId") "id"
                    FROM "user_workspace_permissions"
                    WHERE "isActive" = true
                    ORDER BY "userId", "workspaceId", "createdAt" ASC
                )
            `);

            // Step 4: Drop the old permissionId column
            await queryRunner.query(`
                ALTER TABLE "user_workspace_permissions" 
                DROP COLUMN "permissionId"
            `);
        }

        // Step 5: Add unique constraint on (userId, workspaceId)
        await queryRunner.query(`
            ALTER TABLE "user_workspace_permissions" 
            ADD CONSTRAINT "unique_user_workspace" UNIQUE ("userId", "workspaceId")
        `);

        // Step 6: Add index on permission_ids for better query performance
        await queryRunner.query(`
            CREATE INDEX "IDX_user_workspace_permissions_permission_ids" 
            ON "user_workspace_permissions" USING GIN ("permission_ids")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Step 1: Drop the unique constraint
        await queryRunner.query(`
            ALTER TABLE "user_workspace_permissions" 
            DROP CONSTRAINT "unique_user_workspace"
        `);

        // Step 2: Drop the GIN index
        await queryRunner.query(`
            DROP INDEX "IDX_user_workspace_permissions_permission_ids"
        `);

        // Step 3: Add back the permission_id column
        await queryRunner.query(`
            ALTER TABLE "user_workspace_permissions" 
            ADD COLUMN "permission_id" uuid
        `);

        // Step 4: Expand permission_ids array back to individual rows
        await queryRunner.query(`
            INSERT INTO "user_workspace_permissions" (
                "id", "user_id", "workspace_id", "permission_id", 
                "is_active", "created_at", "updated_at", "deleted_at", 
                "created_by", "updated_by"
            )
            SELECT 
                gen_random_uuid() as "id",
                "user_id",
                "workspace_id",
                unnest("permission_ids") as "permission_id",
                "is_active",
                "created_at",
                "updated_at",
                "deleted_at",
                "created_by",
                "updated_by"
            FROM "user_workspace_permissions"
            WHERE "permission_ids" IS NOT NULL 
              AND array_length("permission_ids", 1) > 0
        `);

        // Step 5: Drop the permission_ids column
        await queryRunner.query(`
            ALTER TABLE "user_workspace_permissions" 
            DROP COLUMN "permission_ids"
        `);

        // Step 6: Add foreign key constraint back
        await queryRunner.query(`
            ALTER TABLE "user_workspace_permissions" 
            ADD CONSTRAINT "FK_user_workspace_permissions_permission" 
            FOREIGN KEY ("permission_id") 
            REFERENCES "permissions"("id") 
            ON DELETE CASCADE 
            ON UPDATE NO ACTION
        `);
    }
}
