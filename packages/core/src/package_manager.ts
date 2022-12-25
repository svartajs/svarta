export type Type = "npm" | "yarn" | "pnpm";

const installCommands: Record<Type, string> = {
  npm: `npm install`,
  pnpm: `pnpm install`,
  yarn: `yarn install`,
};

const runCommands: Record<Type, (client: string) => string> = {
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
export function getInstallCommand(client: Type, packages: string[] = []): string {
  return `${installCommands[client]} ${packages.join(" ")}`.trim();
}

/**
 * Gets the run command of the chosen NPM client
 */
export function getRunCommand(client: Type, cmd: string): string {
  return runCommands[client](cmd);
}

/**
 * Gets the create command of the chosen NPM client
 */
export function getCreateCommand(client: Type, cmd: string): string {
  return createCommands[client](cmd);
}

function detect(): Type {
  const str = process.env["npm_config_user_agent"];
  if (str) {
    if (str.includes("pnpm")) {
      return "pnpm";
    }
    if (str.includes("yarn")) {
      return "yarn";
    }
  }
  return "npm";
}

export { detect };
