export type RouteSegment =
  | {
      type: "sep";
    }
  | {
      type: "static";
      value: string;
    }
  | {
      type: "param";
      name: string;
    }
  | {
      type: "catchAll";
      name: string;
    };
