import { MigrationInterface, QueryRunner } from "typeorm";

export class DropDuplicatePasswordResetIndex1760697600000 implements MigrationInterface {
    name = 'DropDuplicatePasswordResetIndex1760697600000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop the duplicate index if it exists
        try {
            await queryRunner.query(`DROP INDEX IF EXISTS "IDX_e7a6043ff92629b85b5da2e543"`);
        } catch (error) {
            console.log('Index IDX_e7a6043ff92629b85b5da2e543 may not exist, continuing...');
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Recreate the index if needed (though it should already exist from class-level decorator)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_e7a6043ff92629b85b5da2e543" ON "password_resets" ("expiresAt")`);
    }
}
