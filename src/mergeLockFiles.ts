import path from "path";
import fs from "fs";
import lockfile from "@yarnpkg/lockfile";
import { fixDuplicates } from "yarn-deduplicate";
import { tmpdir } from "os";
import { v4 as uuid } from "uuid";

module.exports = function mergeLockFiles(lockFile1Path, lockFile2Path) {
  const tmp = path.join(tmpdir(), "workspace-webpack-plugin", `${uuid()}.lock`);
  fs.mkdirSync(path.dirname(tmp), { recursive: true });

  let lockFile1 = fs.readFileSync(lockFile1Path, "utf-8");
  let lockFile2 = fs.readFileSync(lockFile2Path, "utf-8");

  let lock1 = lockfile.parse(lockFile1).object;
  let lock2 = lockfile.parse(lockFile2).object;
  let newLock = { ...lock2 };
  for (const [key, spec] of Object.entries(lock1)) {
    newLock[key] = spec;
  }

  fs.writeFileSync(tmp, fixDuplicates(lockfile.stringify(newLock)));
  const parsed = lockfile.parse(fs.readFileSync(tmp, "utf-8")).object;
  fs.unlinkSync(tmp);

  return parsed;
};
