import { route } from "@svarta/core";

export const name = "ServerError";

export default route.handle(async () => {
  throw new Error(
    "What happened?!\n(don't get confused by this error message, it's supposed to happen)",
  );
});
