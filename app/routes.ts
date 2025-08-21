import {
  type RouteConfig,
  route,
  index,
  prefix,
} from "@react-router/dev/routes";

export default [
  index("./routes/index/home.tsx"),
  route("generate-reports", "./routes/generate-reports/generateReports.tsx"),
  route("view-data", "./routes/view-data/viewData.tsx"),
  route("download", "./routes/download.ts"),
  route("logout", "./routes/auth/logout.tsx"),
  route("login", "./routes/auth/login.tsx"),
  ...prefix("transformer-substations", [
    route(
      ":id",
      "./routes/transformer-substations/substation-id/transformer-substation.tsx",
    ),
    route(
      ":id/add-data",
      "./routes/transformer-substations/add-data/add-data.tsx",
    ),
    route(
      ":id/add-billing-meters",
      "./routes/transformer-substations/add-data/billing-meters.action.ts",
    ),
    route(
      ":id/add-technical-meters",
      "./routes/transformer-substations/add-data/technical-meters.action.ts",
    ),
    route(
      ":id/change-data",
      "./routes/transformer-substations/change-data/change-data.tsx",
    ),
    route(
      ":id/change-billing-meters",
      "./routes/transformer-substations/change-data/change-billing-meters.action.ts",
    ),
    route(
      ":id/change-technical-meters",
      "./routes/transformer-substations/change-data/change-technical-meters.action.ts",
    ),
    route(":id/destroy", "./routes/transformer-substations/destroy.tsx"),
    route(":id/edit", "./routes/transformer-substations/edit.tsx"),
    route("new", "./routes/transformer-substations/new.tsx"),
  ]),
  route("/*", "./routes/404.tsx"),
] satisfies RouteConfig;
