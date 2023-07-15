import { createNitro } from "nitropack";

export default function (dev: boolean) {
  return createNitro({
    dev,
    rootDir: ".svarta/dev/nitro",
    logLevel: 5,
  });
}
