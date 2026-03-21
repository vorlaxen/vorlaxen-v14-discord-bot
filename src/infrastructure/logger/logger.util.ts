import { format } from "winston";

export const safeStringifyConsole = (obj: any) => {
  const seen = new WeakSet();

  return JSON.stringify(obj, (_key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) return "[Circular]";
      seen.add(value);
    }

    if (
      value?.req ||
      value?.res ||
      value?.socket ||
      value?.config
    ) {
      return "[Filtered]";
    }

    return value;
  });
};

export const consoleFormat = format.printf(({ timestamp, level, message, stack, ...meta }) => {
  const metaString =
    meta && Object.keys(meta).length
      ? ` ${safeStringifyConsole(meta)}`
      : '';

  return stack
    ? `[${timestamp}] ${level}: ${stack}${metaString}`
    : `[${timestamp}] ${level}: ${message}${metaString}`;
});