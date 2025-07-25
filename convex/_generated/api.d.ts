/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as accountLinks from "../accountLinks.js";
import type * as auth from "../auth.js";
import type * as boatSessions from "../boatSessions.js";
import type * as contacts from "../contacts.js";
import type * as http from "../http.js";
import type * as router from "../router.js";
import type * as weather from "../weather.js";
import type * as weather_old from "../weather_old.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  accountLinks: typeof accountLinks;
  auth: typeof auth;
  boatSessions: typeof boatSessions;
  contacts: typeof contacts;
  http: typeof http;
  router: typeof router;
  weather: typeof weather;
  weather_old: typeof weather_old;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
