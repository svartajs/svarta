import type { PM } from "detect-package-manager";
import { detect } from "detect-package-manager";

const installCommands: Record<PM, string> = {
  npm: `npm install`,
  pnpm: `pnpm install`,
  yarn: `yarn install`,
};

const runCommands: Record<PM, (client: string) => string> = {
  npm: (cmd) => `npm run ${cmd}`,
  yarn: (cmd) => `yarn ${cmd}`,
  pnpm: (cmd) => `pnpm ${cmd}`,
};

const createCommands: Record<string, (client: string) => string> = {
  npm: (cmd) => `npm create ${cmd}`,
  yarn: (cmd) => `yarn create ${cmd}`,
  pnpm: (cmd) => `pnpm create ${cmd}`,
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

/**
 * Gets the create command of the chosen NPM client
 */
export function getCreateCommand(client: PM, cmd: string): string {
  return createCommands[client](cmd);
}

export type Type = PM;
export { detect };
