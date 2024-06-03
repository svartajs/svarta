import type { Choice } from "prompts";

export async function loadTemplates(): Promise<Choice[]> {
  console.log("Loading template list");
  const response = await fetch(
    "https://raw.githubusercontent.com/svartajs/svarta/main/templates.json",
  );
  if (!response.ok) {
    throw new Error(`Response failed with status ${response.status}`);
  }
  const templates = (await response.json()) as Choice[];
  return templates;
}
