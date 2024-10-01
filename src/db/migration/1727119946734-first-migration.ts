import { MigrationInterface, QueryRunner } from "typeorm";

export class FirstMigration1727119946734 implements MigrationInterface {
  name = "FirstMigration1727119946734";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_7d20734bce30abacefeed7dd4d"`);
    await queryRunner.query(`DROP INDEX "IDX_94572562aeb9809c368c2a5db1"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_drip" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "timestamp" integer NOT NULL, "usernameSha256" varchar, "addressSha256" varchar NOT NULL)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_drip"("id", "timestamp", "usernameSha256", "addressSha256") SELECT "id", "timestamp", "usernameSha256", "addressSha256" FROM "drip"`,
    );
    await queryRunner.query(`DROP TABLE "drip"`);
    await queryRunner.query(`ALTER TABLE "temporary_drip" RENAME TO "drip"`);
    await queryRunner.query(`CREATE INDEX "IDX_7d20734bce30abacefeed7dd4d" ON "drip" ("addressSha256") `);
    await queryRunner.query(`CREATE INDEX "IDX_94572562aeb9809c368c2a5db1" ON "drip" ("usernameSha256") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_94572562aeb9809c368c2a5db1"`);
    await queryRunner.query(`DROP INDEX "IDX_7d20734bce30abacefeed7dd4d"`);
    await queryRunner.query(`ALTER TABLE "drip" RENAME TO "temporary_drip"`);
    await queryRunner.query(
      `CREATE TABLE "drip" ("id" string PRIMARY KEY NOT NULL, "timestamp" integer NOT NULL, "usernameSha256" character varying, "addressSha256" character varying NOT NULL)`,
    );
    await queryRunner.query(
      `INSERT INTO "drip"("id", "timestamp", "usernameSha256", "addressSha256") SELECT "id", "timestamp", "usernameSha256", "addressSha256" FROM "temporary_drip"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_drip"`);
    await queryRunner.query(`CREATE INDEX "IDX_94572562aeb9809c368c2a5db1" ON "drip" ("usernameSha256") `);
    await queryRunner.query(`CREATE INDEX "IDX_7d20734bce30abacefeed7dd4d" ON "drip" ("addressSha256") `);
  }
}
