import { route } from "@svarta/core";

export const name = "ServerError";

export default route.handle(async () => {
  throw new Error("What happened");
});
