import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import chalk from "chalk";
import { detect as detectManager, PM } from "detect-package-manager";
import { downloadTemplate } from "giget";
import prompts from "prompts";

import { getInstallCommand, getRunCommand } from "./npm_client";

type Template = "starter-http";

async function cloneTemplate(appDir: string, template: Template, npmClient: PM): Promise<void> {
  console.log("");
  console.log(`Cloning ${chalk.blueBright(template)} into ${chalk.blueBright(appDir)}...`);

  await downloadTemplate(`gh:marvin-j97/svarta/templates/${template}`, {
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
  console.log(`  ${chalk.grey("2:")} ${chalk.blueBright(getInstallCommand(npmClient))}`);
  console.log(`  ${chalk.grey("3:")} ${chalk.blueBright(getRunCommand(npmClient, "dev"))}`);
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
  console.log(chalk.grey("create-svarta-app 0.0.0"));

  const manager = await detectManager();
  const managerIndex = managers.findIndex(({ value }) => value === manager);
  const managerObject = managers.find(({ value }) => value === manager) ?? managers[0];

  console.log(`Detected package manager: ${managerObject?.color(manager)}`);
  console.log("");

  const { appDir, template, chosenManager, setupGitRepo } = await prompts([
    {
      name: "appDir",
      type: "text",
      message: "Enter project folder",
      hint: "my-app",
      initial: "my-app",
      validate: (appDir: string) => {
        if (existsSync(appDir)) {
          console.error(chalk.red(`\n\nFolder ${appDir} already exists! Aborting...`));
          process.exit(1);
        }
        return true;
      },
    },
    {
      name: "template",
      type: "select",
      message: "Choose template",
      choices: [
        {
          value: "starter-http",
          title: "HTTP starter",
          description: "Minimal standalone HTTP server",
        },
      ],
      initial: 0,
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
      message: "Do you want me to setup a git repository?",
    },
  ]);

  if (!appDir || !template) {
    console.log("Aborting...");
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
