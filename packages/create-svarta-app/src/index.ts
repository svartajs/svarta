import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { packageManager } from "@svarta/core";
import chalk from "chalk";
import { downloadTemplate } from "giget";
import prompts from "prompts";

import { loadTemplates } from "./templates";

type Template = "starter-http";

function isDirEmpty(path: string): boolean {
  const files = readdirSync(path);
  return files.length === 0;
}

async function cloneTemplate(
  appDir: string,
  template: Template,
  npmClient: packageManager.Type,
): Promise<void> {
  console.log("");
  console.log(`Cloning ${chalk.blueBright(template)} into ${chalk.blueBright(appDir)}...`);

  await downloadTemplate(`gh:svartajs/svarta/templates/${template}`, {
    dir: appDir,
    preferOffline: false,
  });

  console.log("");
  console.log(chalk.greenBright(`Template setup successful!`));

  // TODO: test
  const configFile = resolve(appDir, "svarta.config.mjs");
  const content = readFileSync(configFile, "utf-8");
  writeFileSync(configFile, content.replace(`packageManager: "${npmClient}"`, ""), "utf-8");

  console.log("");
  console.log(`Next steps:`);
  console.log(`  ${chalk.grey("1:")} ${chalk.blueBright(`cd ${appDir}`)}`);
  console.log(
    `  ${chalk.grey("2:")} ${chalk.blueBright(packageManager.getInstallCommand(npmClient))}`,
  );
  console.log(
    `  ${chalk.grey("3:")} ${chalk.blueBright(packageManager.getRunCommand(npmClient, "dev"))}`,
  );
  console.log("");
}

const managers = [
  {
    value: "npm",
    title: "npm",
    color: chalk.red,
  },
  {
    value: "pnpm",
    title: "pnpm",
    color: chalk.yellowBright,
  },
  {
    value: "yarn",
    title: "yarn",
    color: chalk.blueBright,
  },
];

(async () => {
  console.log(chalk.grey("create-svarta-app 0.0.5"));

  let manager: packageManager.Type;
  const fromCmd = process.argv[0];
  if (["npm", "yarn", "pnpm"].includes(fromCmd)) {
    manager = fromCmd as packageManager.Type;
  } else {
    manager = packageManager.detect();
  }

  const managerIndex = managers.findIndex(({ value }) => value === manager);
  const managerObject = managers.find(({ value }) => value === manager) ?? managers[0];

  console.log(`Detected package manager: ${managerObject?.color(manager)}`);
  console.log("");

  const templates = await loadTemplates();

  const { appDir, template, chosenManager, setupGitRepo } = await prompts([
    {
      name: "appDir",
      type: "text",
      message: "Enter project folder",
      hint: "my-app",
      initial: "my-app",
      validate: (appDir: string) => {
        if (!existsSync(appDir)) {
          return true;
        }
        if (!isDirEmpty(appDir)) {
          console.error(chalk.red(`\n\nFolder ${appDir} is not empty! Cancelling...`));
          process.exit(1);
        }
        return true;
      },
    },
    {
      name: "template",
      type: "select",
      message: "Choose template",
      choices: templates,
    },
    {
      name: "chosenManager",
      type: "select",
      message: "Choose package manager",
      choices: managers,
      initial: Math.max(managerIndex, 0),
    },
    {
      name: "setupGitRepo",
      type: "confirm",
      message: "Do you want to setup a git repository?",
    },
  ]);

  if (!appDir || !template) {
    console.log("Cancelled.");
    process.exit(1);
  }

  await cloneTemplate(appDir, template, chosenManager);
  if (setupGitRepo) {
    execSync("git init", {
      cwd: appDir,
      stdio: "ignore",
    });
  }

  process.exit(0);
})();
