/**
 * Generates a WhatsApp deep link.
 * Automatically cleans the phone number and formats it for Indian phone numbers (prepending 91 if not present).
 * If the phone number is missing, returns an empty string or null.
 *
 * @param {string} phone - The raw phone number.
 * @param {string} message - Pre-filled message text.
 * @returns {string} WhatsApp link URL.
 */
export function buildWhatsAppLink(phone, message = "") {
  if (!phone) return "";
  
  // Clean all non-digits
  let cleaned = phone.replace(/\D/g, "");
  if (!cleaned) return "";

  // If the number doesn't start with 91 and is 10 digits, prepend 91 (for India country code)
  if (cleaned.length === 10) {
    cleaned = "91" + cleaned;
  }

  const encodedMsg = encodeURIComponent(message);
  return `https://wa.me/${cleaned}${encodedMsg ? `?text=${encodedMsg}` : ""}`;
}
