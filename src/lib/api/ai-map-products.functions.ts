import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Suggestion = {
  source_product_id: string;
  target_product_id: string;
  confidence: number;
  reason: string;
};

export const aiSuggestMappings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      sourceStoreId: z.string().uuid(),
      targetStoreId: z.string().uuid(),
    }),
  )
  .handler(async ({ data, context }): Promise<{ suggestions: Suggestion[] }> => {
    const { supabase } = context;
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Lovable AI Gateway não configurado");

    const [{ data: source, error: sErr }, { data: target, error: tErr }] = await Promise.all([
      supabase
        .from("products")
        .select("id, title, description, handle, vendor, product_type")
        .eq("store_id", data.sourceStoreId)
        .limit(200),
      supabase
        .from("products")
        .select("id, title, description, handle, vendor, product_type")
        .eq("store_id", data.targetStoreId)
        .limit(200),
    ]);
    if (sErr || tErr) throw new Error(sErr?.message ?? tErr?.message ?? "Erro ao carregar produtos");
    if (!source?.length || !target?.length) return { suggestions: [] };

    const compact = (p: { id: string; title: string; handle: string | null; vendor: string | null; product_type: string | null }) =>
      ({ id: p.id, t: p.title, h: p.handle, v: p.vendor, pt: p.product_type });

    const prompt = `Você é um especialista em catálogos de e-commerce. Compare os produtos da Loja Vitrine com os da Loja de Checkout e sugira correspondências.

Loja Vitrine (source):
${JSON.stringify(source.map(compact))}

Loja Checkout (target):
${JSON.stringify(target.map(compact))}

Retorne APENAS um JSON válido no formato:
{"suggestions":[{"source_product_id":"<id>","target_product_id":"<id>","confidence":<0-100>,"reason":"<curta>"}]}

Inclua apenas pares com confiança >= 50. Não invente IDs — use somente os fornecidos.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Responda apenas com JSON válido conforme o schema solicitado." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (res.status === 429) throw new Error("Limite de requisições atingido. Tente novamente em instantes.");
    if (res.status === 402) throw new Error("Créditos de IA esgotados. Adicione créditos em Settings → Workspace → Usage.");
    if (!res.ok) throw new Error(`Falha na IA: ${res.status}`);

    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = json.choices?.[0]?.message?.content ?? "";
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return { suggestions: [] };

    try {
      const parsed = JSON.parse(match[0]) as { suggestions?: Suggestion[] };
      const sourceIds = new Set(source.map((p) => p.id));
      const targetIds = new Set(target.map((p) => p.id));
      const suggestions = (parsed.suggestions ?? []).filter(
        (s) =>
          sourceIds.has(s.source_product_id) &&
          targetIds.has(s.target_product_id) &&
          typeof s.confidence === "number",
      );
      return { suggestions };
    } catch {
      return { suggestions: [] };
    }
  });