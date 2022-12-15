import { createNitro } from "nitropack";

const nitro = (dev: boolean) =>
  createNitro({
    dev,
    rootDir: ".svarta/dev/nitro",
    logLevel: 3,
  });

export default nitro;
