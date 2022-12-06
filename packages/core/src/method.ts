export const SUPPORTED_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

export type RouteMethod = typeof SUPPORTED_METHODS[number];
