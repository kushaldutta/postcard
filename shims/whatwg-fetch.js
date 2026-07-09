// Redirect whatwg-fetch imports to React Native's built-in fetch.
// This prevents @supabase/auth-js from using the XHR-based browser polyfill
// and instead uses the native fetch available in React Native / Expo Go.
exports.fetch = global.fetch;
exports.Headers = global.Headers;
exports.Request = global.Request;
exports.Response = global.Response;
