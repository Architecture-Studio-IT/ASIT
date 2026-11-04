import fs from "node:fs";
import path from "node:path";

const standalone = path.resolve(".next/standalone");

const copy = (source, destination) => {
  if (fs.existsSync(source)) {
    fs.cpSync(source, destination, {
      recursive: true,
      force: true,
    });
  }
};

fs.mkdirSync(standalone, { recursive: true });

copy("public", path.join(standalone, "public"));

copy(
  ".next/static",
  path.join(standalone, ".next/static")
);

console.log("Standalone ASIT prepared.");