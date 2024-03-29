import crypto from "crypto";

import { AppDataSource } from "src/db/dataSource";
import { Drip } from "src/db/entity/Drip";

const HOURS_SPAN = 20;

const sha256 = (x: string) => crypto.createHash("sha256").update(x, "utf8").digest("hex");

const dripRepository = AppDataSource.getRepository(Drip);

export async function saveDrip(opts: { username?: string; addr: string }) {
  const freshDrip = new Drip();
  freshDrip.addressSha256 = sha256(opts.addr);
  if (opts.username) freshDrip.usernameSha256 = sha256(opts.username);
  await dripRepository.insert(freshDrip);
}

export async function hasDrippedToday(opts: { username?: string; addr: string }): Promise<boolean> {
  let qb = dripRepository.createQueryBuilder("drip");
  if (opts.username) {
    qb = qb.where("(drip.usernameSha256 = :usernameSha256 or drip.addressSha256 = :addressSha256)", {
      usernameSha256: sha256(opts.username),
      addressSha256: sha256(opts.addr),
    });
  } else {
    qb = qb.where("drip.addressSha256 = :addressSha256", { addressSha256: sha256(opts.addr) });
  }
  const res = await qb
    .andWhere("drip.timestamp > :minAllowedTs", {
      minAllowedTs: new Date(Date.now() - HOURS_SPAN * 60 * 60 * 1000).toISOString(),
    })
    .getOne();

  return res !== null;
}
