const path = require("path");
const fs = require("fs");
const lockfile = require("@yarnpkg/lockfile");
const { fixDuplicates } = require("yarn-deduplicate");
const { tmpdir } = require("os");

module.exports = function mergeLockFiles(lockFile1Path, lockFile2Path) {
  const tmp = path.join(tmpdir(), "workspace-webpack-plugin", "sometest.lock");
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
