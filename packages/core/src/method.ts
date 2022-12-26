export const SUPPORTED_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"] as const;

export type RouteMethod = typeof SUPPORTED_METHODS[number];
