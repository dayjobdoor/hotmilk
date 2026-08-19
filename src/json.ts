/** JSON value produced at an I/O boundary. */
export type JsonPrimitive = string | number | boolean | null;
export type JsonObject = { readonly [key: string]: JsonValue };
export type JsonValue = JsonPrimitive | readonly JsonValue[] | JsonObject;

/** Parse a JSON document into {@link JsonValue}. */
export function parseJsonValue(text: string): JsonValue {
  // SAFETY: JSON.parse returns a JSON value; this is the I/O boundary.
  return JSON.parse(text) as JsonValue;
}

/** True when `value` is a JSON object (not an array or primitive). */
export function isJsonObject(value: JsonValue): value is JsonObject {
  return (
    value !== null &&
    !Array.isArray(value) &&
    Object.prototype.toString.call(value) === "[object Object]"
  );
}

/** True when `value` is a JSON string. */
export function isJsonString(value: JsonValue): value is string {
  return Object.prototype.toString.call(value) === "[object String]";
}

/** True when `value` is a JSON boolean. */
export function isJsonBoolean(value: JsonValue): value is boolean {
  return value === true || value === false;
}

/** Format a caught exception from a `catch` binding. */
export function formatCaughtError(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}
