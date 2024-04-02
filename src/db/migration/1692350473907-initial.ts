import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1692350473907 implements MigrationInterface {
  name = "Initial1692350473907";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "drip" ("id" STRING NOT NULL, "timestamp" INTEGER NOT NULL, "usernameSha256" character varying, "addressSha256" character varying NOT NULL, CONSTRAINT "PK_869cd028514a4d3cd3e359d3844" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_94572562aeb9809c368c2a5db1" ON "drip" ("usernameSha256") `);
    await queryRunner.query(`CREATE INDEX "IDX_7d20734bce30abacefeed7dd4d" ON "drip" ("addressSha256") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_7d20734bce30abacefeed7dd4d"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_94572562aeb9809c368c2a5db1"`);
    await queryRunner.query(`DROP TABLE "drip"`);
  }
}
