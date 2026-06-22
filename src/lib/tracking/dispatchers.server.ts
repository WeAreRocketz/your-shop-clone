// Server-only event dispatchers — one per platform. Failures are isolated.
import { hashEmail, hashPhone, sha256Hex } from "./hash.server";

export type S2SEventName =
  | "PageView"
  | "ViewContent"
  | "AddToCart"
  | "InitiateCheckout"
  | "Purchase";

export type S2SContent = {
  id: string;
  quantity: number;
  item_price: number;
};

export type S2SEvent = {
  event_name: S2SEventName;
  event_id: string;
  event_time: number; // unix seconds
  event_source_url?: string;
  user: {
    ip?: string;
    user_agent?: string;
    fbp?: string;
    fbc?: string;
    fbclid?: string;
    gclid?: string;
    ttclid?: string;
    ttp?: string;
    email?: string;
    phone?: string;
    external_id?: string;
  };
  custom: {
    currency?: string;
    value?: number;
    contents?: S2SContent[];
    content_ids?: string[];
    num_items?: number;
    order_id?: string;
  };
};

export type PixelRow = {
  id: string;
  platform: "meta" | "tiktok" | "google_ads" | "ga4";
  pixel_id: string;
  access_token: string | null;
  test_event_code: string | null;
  extra: Record<string, unknown>;
  enabled: boolean;
};

export type DispatchResult = {
  platform: PixelRow["platform"];
  pixel_id: string;
  status: "success" | "error" | "skipped";
  http_status?: number;
  latency_ms: number;
  request_payload?: unknown;
  response_body?: unknown;
  error_message?: string;
};

// Build fbc from fbclid if not present
function buildFbc(fbc: string | undefined, fbclid: string | undefined, ts: number): string | undefined {
  if (fbc) return fbc;
  if (fbclid) return `fb.1.${ts * 1000}.${fbclid}`;
  return undefined;
}

// ============================================================
// Meta Conversions API
// ============================================================
async function dispatchMeta(pixel: PixelRow, evt: S2SEvent): Promise<DispatchResult> {
  const start = Date.now();
  if (!pixel.access_token) {
    return { platform: "meta", pixel_id: pixel.pixel_id, status: "skipped", latency_ms: 0, error_message: "Missing access_token" };
  }
  const fbc = buildFbc(evt.user.fbc, evt.user.fbclid, evt.event_time);
  const userData: Record<string, unknown> = {
    client_ip_address: evt.user.ip,
    client_user_agent: evt.user.user_agent,
    fbp: evt.user.fbp,
    fbc,
  };
  const em = await hashEmail(evt.user.email);
  const ph = await hashPhone(evt.user.phone);
  if (em) userData.em = [em];
  if (ph) userData.ph = [ph];
  if (evt.user.external_id) userData.external_id = [await sha256Hex(evt.user.external_id)];

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: evt.event_name,
        event_time: evt.event_time,
        event_id: evt.event_id,
        action_source: "website",
        event_source_url: evt.event_source_url,
        user_data: userData,
        custom_data: {
          currency: evt.custom.currency,
          value: evt.custom.value,
          contents: evt.custom.contents,
          content_ids: evt.custom.content_ids,
          content_type: "product",
          num_items: evt.custom.num_items,
          order_id: evt.custom.order_id,
        },
      },
    ],
  };
  if (pixel.test_event_code) payload.test_event_code = pixel.test_event_code;

  try {
    const url = `https://graph.facebook.com/v18.0/${pixel.pixel_id}/events?access_token=${encodeURIComponent(pixel.access_token)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({}));
    return {
      platform: "meta",
      pixel_id: pixel.pixel_id,
      status: res.ok ? "success" : "error",
      http_status: res.status,
      latency_ms: Date.now() - start,
      request_payload: payload,
      response_body: body,
      error_message: res.ok ? undefined : `Meta CAPI ${res.status}`,
    };
  } catch (e) {
    return {
      platform: "meta", pixel_id: pixel.pixel_id, status: "error",
      latency_ms: Date.now() - start,
      error_message: e instanceof Error ? e.message : String(e),
      request_payload: payload,
    };
  }
}

// ============================================================
// TikTok Events API v1.3
// ============================================================
async function dispatchTikTok(pixel: PixelRow, evt: S2SEvent): Promise<DispatchResult> {
  const start = Date.now();
  if (!pixel.access_token) {
    return { platform: "tiktok", pixel_id: pixel.pixel_id, status: "skipped", latency_ms: 0, error_message: "Missing access_token" };
  }
  // TikTok event mapping
  const evMap: Record<S2SEventName, string> = {
    PageView: "Pageview",
    ViewContent: "ViewContent",
    AddToCart: "AddToCart",
    InitiateCheckout: "InitiateCheckout",
    Purchase: "CompletePayment",
  };
  const user: Record<string, unknown> = { ttp: evt.user.ttp };
  const em = await hashEmail(evt.user.email);
  const ph = await hashPhone(evt.user.phone);
  if (em) user.email = em;
  if (ph) user.phone = ph;
  if (evt.user.external_id) user.external_id = await sha256Hex(evt.user.external_id);

  const payload: Record<string, unknown> = {
    event_source: "web",
    event_source_id: pixel.pixel_id,
    data: [
      {
        event: evMap[evt.event_name],
        event_time: evt.event_time,
        event_id: evt.event_id,
        user,
        properties: {
          currency: evt.custom.currency,
          value: evt.custom.value,
          contents: evt.custom.contents?.map((c) => ({
            content_id: c.id,
            quantity: c.quantity,
            price: c.item_price,
            content_type: "product",
          })),
          content_type: "product",
          order_id: evt.custom.order_id,
        },
        page: { url: evt.event_source_url },
        ad: { callback: evt.user.ttclid },
        context: {
          ip: evt.user.ip,
          user_agent: evt.user.user_agent,
          ad: { callback: evt.user.ttclid },
        },
      },
    ],
  };
  if (pixel.test_event_code) payload.test_event_code = pixel.test_event_code;

  try {
    const res = await fetch("https://business-api.tiktok.com/open_api/v1.3/event/track/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Token": pixel.access_token,
      },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({}));
    const ok = res.ok && ((body as { code?: number }).code === 0 || (body as { code?: number }).code === undefined);
    return {
      platform: "tiktok", pixel_id: pixel.pixel_id,
      status: ok ? "success" : "error",
      http_status: res.status,
      latency_ms: Date.now() - start,
      request_payload: payload,
      response_body: body,
      error_message: ok ? undefined : `TikTok ${res.status} code=${(body as { code?: number }).code}`,
    };
  } catch (e) {
    return {
      platform: "tiktok", pixel_id: pixel.pixel_id, status: "error",
      latency_ms: Date.now() - start,
      error_message: e instanceof Error ? e.message : String(e),
      request_payload: payload,
    };
  }
}

// ============================================================
// GA4 Measurement Protocol
// extra.api_secret holds the API Secret
// pixel_id is the Measurement ID (G-XXXX)
// ============================================================
async function dispatchGA4(pixel: PixelRow, evt: S2SEvent): Promise<DispatchResult> {
  const start = Date.now();
  const apiSecret = (pixel.extra?.api_secret as string | undefined) ?? pixel.access_token ?? undefined;
  if (!apiSecret) {
    return { platform: "ga4", pixel_id: pixel.pixel_id, status: "skipped", latency_ms: 0, error_message: "Missing api_secret" };
  }
  const evMap: Record<S2SEventName, string> = {
    PageView: "page_view",
    ViewContent: "view_item",
    AddToCart: "add_to_cart",
    InitiateCheckout: "begin_checkout",
    Purchase: "purchase",
  };
  // GA4 client_id required. Use external_id, fbp, or event_id as fallback.
  const clientId = evt.user.external_id ?? evt.user.fbp ?? evt.event_id;
  const params: Record<string, unknown> = {
    currency: evt.custom.currency,
    value: evt.custom.value,
    transaction_id: evt.custom.order_id,
    items: evt.custom.contents?.map((c) => ({
      item_id: c.id,
      quantity: c.quantity,
      price: c.item_price,
    })),
    page_location: evt.event_source_url,
  };
  const payload = {
    client_id: clientId,
    events: [{ name: evMap[evt.event_name], params }],
  };
  const debug = pixel.test_event_code === "debug";
  try {
    const url = `https://www.google-analytics.com/${debug ? "debug/" : ""}mp/collect?measurement_id=${encodeURIComponent(pixel.pixel_id)}&api_secret=${encodeURIComponent(apiSecret)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = debug ? await res.json().catch(() => ({})) : null;
    return {
      platform: "ga4", pixel_id: pixel.pixel_id,
      status: res.ok ? "success" : "error",
      http_status: res.status,
      latency_ms: Date.now() - start,
      request_payload: payload,
      response_body: body,
      error_message: res.ok ? undefined : `GA4 ${res.status}`,
    };
  } catch (e) {
    return {
      platform: "ga4", pixel_id: pixel.pixel_id, status: "error",
      latency_ms: Date.now() - start,
      error_message: e instanceof Error ? e.message : String(e),
      request_payload: payload,
    };
  }
}

// ============================================================
// Google Ads Enhanced Conversions
// MVP via Measurement Protocol with gclid forwarding to a linked GA4 property
// Real Google Ads API requires OAuth2; we accept conversion_id+label and gclid and
// log payload — full upload requires the user's Google Ads OAuth (future task).
// extra: { conversion_id, conversion_label, ga4_measurement_id, ga4_api_secret }
// ============================================================
async function dispatchGoogleAds(pixel: PixelRow, evt: S2SEvent): Promise<DispatchResult> {
  const start = Date.now();
  // If GA4 bridge configured, forward through GA4 with gclid in user_properties (auto-import to Ads when linked)
  const ga4MeasurementId = pixel.extra?.ga4_measurement_id as string | undefined;
  const ga4ApiSecret = pixel.extra?.ga4_api_secret as string | undefined;
  if (ga4MeasurementId && ga4ApiSecret && evt.event_name === "Purchase") {
    const payload = {
      client_id: evt.user.external_id ?? evt.user.fbp ?? evt.event_id,
      user_properties: evt.user.gclid ? { gclid: { value: evt.user.gclid } } : undefined,
      events: [
        {
          name: "purchase",
          params: {
            currency: evt.custom.currency,
            value: evt.custom.value,
            transaction_id: evt.custom.order_id,
            items: evt.custom.contents?.map((c) => ({
              item_id: c.id, quantity: c.quantity, price: c.item_price,
            })),
          },
        },
      ],
    };
    try {
      const url = `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(ga4MeasurementId)}&api_secret=${encodeURIComponent(ga4ApiSecret)}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return {
        platform: "google_ads", pixel_id: pixel.pixel_id,
        status: res.ok ? "success" : "error",
        http_status: res.status,
        latency_ms: Date.now() - start,
        request_payload: payload,
        error_message: res.ok ? undefined : `Google Ads (via GA4) ${res.status}`,
      };
    } catch (e) {
      return {
        platform: "google_ads", pixel_id: pixel.pixel_id, status: "error",
        latency_ms: Date.now() - start,
        error_message: e instanceof Error ? e.message : String(e),
        request_payload: payload,
      };
    }
  }
  // No bridge configured — log and skip
  return {
    platform: "google_ads", pixel_id: pixel.pixel_id, status: "skipped",
    latency_ms: 0,
    error_message: "Google Ads requer GA4 bridge (ga4_measurement_id + ga4_api_secret) ou OAuth (em breve).",
  };
}

// ============================================================
// Public entry: dispatch event to all enabled pixels of a store
// Each platform is isolated — one failure doesn't affect others.
// ============================================================
export async function dispatchToStore(
  pixels: PixelRow[],
  evt: S2SEvent,
): Promise<DispatchResult[]> {
  const enabled = pixels.filter((p) => p.enabled);
  const promises = enabled.map(async (p) => {
    try {
      switch (p.platform) {
        case "meta": return await dispatchMeta(p, evt);
        case "tiktok": return await dispatchTikTok(p, evt);
        case "ga4": return await dispatchGA4(p, evt);
        case "google_ads": return await dispatchGoogleAds(p, evt);
      }
    } catch (e) {
      return {
        platform: p.platform,
        pixel_id: p.pixel_id,
        status: "error" as const,
        latency_ms: 0,
        error_message: e instanceof Error ? e.message : String(e),
      };
    }
  });
  return Promise.all(promises);
}