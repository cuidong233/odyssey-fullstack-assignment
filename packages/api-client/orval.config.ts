import { defineConfig } from "orval";

export default defineConfig({
  restaurantOps: {
    input: {
      target: "../../services/backend/openapi.json"
    },
    output: {
      target: "src/generated/client.ts",
      schemas: "src/generated/model",
      client: "react-query",
      httpClient: "fetch",
      clean: true,
      override: {
        fetch: {
          includeHttpResponseReturnType: false
        },
        mutator: {
          path: "src/runtime/fetcher.ts",
          name: "apiFetch"
        }
      }
    }
  }
});
