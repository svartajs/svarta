import nodeFetch from "node-fetch";
import type { Choice } from "prompts";

export async function loadTemplates(): Promise<Choice[]> {
  console.log("Loading template list");
  const response = await nodeFetch(
    "https://raw.githubusercontent.com/svartajs/svarta/main/templates.json",
  );
  if (!response.ok) {
    throw new Error(`Response failed with status ${response.status}`);
  }
  const templates = (await response.json()) as Choice[];
  return templates;
}
