export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/**
 * Open the in-app DigiSakhi authentication modal.
 * Completely self-hosted: No external Manus OAuth redirects.
 */
export const startLogin = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("open-login-modal"));
  }
};

