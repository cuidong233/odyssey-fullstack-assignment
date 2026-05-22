const DEFAULT_API_BASE_URL = "http://localhost:8787";

let runtimeApiBaseUrl: string | undefined;

export type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
  };
};

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export type ErrorType<ErrorBody = ApiErrorBody> = ApiClientError & {
  body: ErrorBody;
};

export type BodyType<BodyData> = BodyData;

export function setApiBaseUrl(baseUrl: string) {
  runtimeApiBaseUrl = baseUrl.replace(/\/$/, "");
}

export function getApiBaseUrl() {
  if (runtimeApiBaseUrl) {
    return runtimeApiBaseUrl;
  }

  const expoPublicUrl = getProcessEnvValue("EXPO_PUBLIC_API_URL");
  if (expoPublicUrl) {
    return expoPublicUrl.replace(/\/$/, "");
  }

  return DEFAULT_API_BASE_URL;
}

export async function apiFetch<T>(url: string, options: RequestInit): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${url}`, {
    ...options,
    headers: withJsonContentType(options.headers)
  });

  const body = await readResponseBody(response);
  if (!response.ok) {
    throw new ApiClientError(getErrorMessage(body), response.status, body);
  }

  return body as T;
}

function withJsonContentType(headers: HeadersInit | undefined): Headers {
  const nextHeaders = new Headers(headers);
  if (!nextHeaders.has("content-type")) {
    nextHeaders.set("content-type", "application/json");
  }
  return nextHeaders;
}

async function readResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204 || response.status === 205) {
    return undefined;
  }

  const text = await response.text();
  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function getErrorMessage(body: unknown): string {
  if (
    typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof body.error === "object" &&
    body.error !== null &&
    "message" in body.error &&
    typeof body.error.message === "string"
  ) {
    return body.error.message;
  }

  return "API request failed.";
}

function getProcessEnvValue(key: string): string | undefined {
  const maybeProcess = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  if (!maybeProcess) {
    return undefined;
  }

  return maybeProcess.env?.[key];
}
