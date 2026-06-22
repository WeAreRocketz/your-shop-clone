import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const generateAnalyticsInsights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      periodDays: z.number().int().positive(),
      kpis: z.object({
        total: z.number(),
        revenue: z.number(),
        topStore: z.string(),
        conv: z.number(),
      }),
      perStore: z.array(z.object({ name: z.string(), orders: z.number() })),
      timeline: z.array(z.record(z.string(), z.union([z.string(), z.number()]))),
      funnel: z.array(z.object({ label: z.string(), value: z.number(), pct: z.number() })),
    }),
  )
  .handler(async ({ data }): Promise<{ insights: string }> => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY não configurado");

    const prompt = `Você é um analista de e-commerce sênior. Analise os dados abaixo dos últimos ${data.periodDays} dias e gere insights ACIONÁVEIS em português brasileiro.

KPIs:
${JSON.stringify(data.kpis)}

Pedidos por loja destino:
${JSON.stringify(data.perStore)}

Volume diário por loja:
${JSON.stringify(data.timeline)}

Funil:
${JSON.stringify(data.funnel)}

Responda em markdown com no MÁXIMO 6 bullets curtos, agrupados em 3 seções:
### 📈 O que está funcionando
### ⚠️ Pontos de atenção
### 🎯 Ações recomendadas

Seja direto, cite números reais, e foque em o que o usuário deve FAZER. Nada de introdução ou conclusão.`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        }),
      },
    );

    if (res.status === 429) throw new Error("Limite de requisições do Gemini atingido. Tente novamente em instantes.");
    if (!res.ok) throw new Error(`Falha na IA: ${res.status}`);

    const json = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const insights = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "Sem insights disponíveis.";
    return { insights };
  });
