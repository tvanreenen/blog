import { Generator, getConfig } from "@tanstack/router-generator";
await new Generator({
  config: getConfig({ target: "react" }, process.cwd()),
  root: process.cwd(),
}).run();
