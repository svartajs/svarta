import { createNitro } from "nitropack";

function nitro(dev: boolean) {
  return createNitro({
    dev,
    rootDir: ".svarta/dev/nitro",
    logLevel: 5,
  });
}

export default nitro;
