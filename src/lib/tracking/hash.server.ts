// Server-only crypto helpers (Web Crypto API — works on Cloudflare Workers)

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input.trim().toLowerCase());
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashEmail(email: string | null | undefined): Promise<string | undefined> {
  if (!email) return undefined;
  return sha256Hex(email);
}

export async function hashPhone(phone: string | null | undefined): Promise<string | undefined> {
  if (!phone) return undefined;
  // E.164-ish: remove non-digits
  const digits = phone.replace(/\D/g, "");
  return sha256Hex(digits);
}

// Verify Shopify HMAC (base64) against raw request body
export async function verifyShopifyHmac(body: string, signatureB64: string, secret: string): Promise<boolean> {
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const sig = Uint8Array.from(atob(signatureB64), (c) => c.charCodeAt(0));
    return await crypto.subtle.verify("HMAC", key, sig, new TextEncoder().encode(body));
  } catch {
    return false;
  }
}

export function randomSecret(bytes = 32): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}