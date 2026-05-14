/** Footer & WhatsApp — single source of truth */
export const SITE_PHONE_TEL = "+8801311340039";
export const SITE_PHONE_DISPLAY = "01311340039";

/** https://wa.me/ — digits only, country code included */
export function getWhatsAppChatUrl() {
  const digits = SITE_PHONE_TEL.replace(/\D/g, "");
  return `https://wa.me/${digits}`;
}
