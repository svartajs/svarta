// TODO: core/common

import type { PM } from "detect-package-manager";

const installCommands: Record<PM, string> = {
  npm: `npm install`,
  pnpm: `pnpm install`,
  yarn: `yarn install`,
};

const runCommands: Record<PM, (client: string) => string> = {
  npm: (cmd) => `npm run ${cmd}`,
  yarn: (cmd) => `yarn ${cmd}`,
  pnpm: (cmd) => `pnpm run ${cmd}`,
};

/**
 * Gets the install command of the chosen NPM client
 */
export function getInstallCommand(client: PM): string {
  return installCommands[client];
}

/**
 * Gets the run command of the chosen NPM client
 */
export function getRunCommand(client: PM, cmd: string): string {
  return runCommands[client](cmd);
}
