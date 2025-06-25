import { appConfig } from ".";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debugLog(message: string, ...args: any[]) {
  if (appConfig.debug) {
    console.log(`[DEBUG] ${message}`, ...args);
  }
}