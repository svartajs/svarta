import chalk from "chalk";
import { downloadTemplate } from "giget";
import prompts from "prompts";

type Template = "starter-http";

async function cloneTemplate(appDir: string, template: Template): Promise<void> {
  console.log(`Cloning ${chalk.blueBright(template)} into ${chalk.blueBright(appDir)}...`);
  await downloadTemplate(`github:marvin-j97/svarta/templates/${template}`, {
    dir: appDir,
  });

  console.log(`\nNext, run: `);
  console.log(chalk.blueBright(`  cd ${appDir}\n`));

  console.log(chalk.blueBright(`  npm i`));
  console.log(chalk.blueBright(`  yarn`));
  console.log(chalk.blueBright(`  pnpm i`));

  console.log(`\nTo start the development server, run:`);
  console.log(chalk.blueBright(`  npm run dev`));
  console.log(chalk.blueBright(`  yarn dev`));
  console.log(chalk.blueBright(`  pnpm dev`));
}

(async () => {
  const { appDir, template } = await prompts([
    {
      name: "appDir",
      type: "text",
      message: "Enter project folder",
      hint: "my-app",
      initial: "my-app",
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
  ]);

  if (!appDir || !template) {
    console.error("Aborting...");
    process.exit(0);
  }

  await cloneTemplate(appDir, template);

  process.exit(0);
})();
