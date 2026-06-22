import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/legal-page";

export const Route = createFileRoute("/legal/subprocessadores")({
  head: () => ({
    meta: [
      { title: "Subprocessadores — Shop2Shops" },
      { name: "description", content: "Lista atualizada de subprocessadores utilizados pela Shop2Shops." },
      { property: "og:title", content: "Subprocessadores — Shop2Shops" },
      { property: "og:description", content: "Subprocessadores autorizados, finalidade e jurisdição." },
      { property: "og:url", content: "/legal/subprocessadores" },
    ],
    links: [{ rel: "canonical", href: "/legal/subprocessadores" }],
  }),
  component: SubprocessadoresPage,
});

const SUBS = [
  { name: "Lovable / Cloudflare Workers", purpose: "Hospedagem, edge runtime e CDN", region: "Global (EU/US)" },
  { name: "Supabase", purpose: "Banco de dados, autenticação e armazenamento", region: "EU (Frankfurt)" },
  { name: "Shopify", purpose: "Integração com lojas conectadas pelo cliente", region: "Global" },
  { name: "Resend", purpose: "Envio de e-mails transacionais", region: "EU/US" },
  { name: "Stripe / Paddle", purpose: "Processamento de pagamentos da assinatura", region: "EU/US" },
  { name: "Google Cloud / OpenAI / Anthropic (via Lovable AI Gateway)", purpose: "Modelos de IA para mapeamento de produtos", region: "Global" },
];

function SubprocessadoresPage() {
  return (
    <LegalPage
      title="Subprocessadores"
      updatedAt="14 de junho de 2026"
      intro="Para prestar o serviço, a Shop2Shops contrata os seguintes subprocessadores. Mantemos contratos com cláusulas de proteção de dados (DPA) com cada um deles."
    >
      <LegalSection title="Lista atual">
        <div className="overflow-hidden rounded-xl border border-border/60">
          <table className="w-full text-left text-sm">
            <thead className="bg-card/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Fornecedor</th>
                <th className="px-4 py-3">Finalidade</th>
                <th className="px-4 py-3">Região</th>
              </tr>
            </thead>
            <tbody>
              {SUBS.map((s) => (
                <tr key={s.name} className="border-t border-border/40">
                  <td className="px-4 py-3 font-medium text-foreground">{s.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.purpose}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.region}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </LegalSection>
      <LegalSection title="Notificação de mudanças">
        <p>Alterações materiais (inclusão, remoção ou troca de jurisdição) são comunicadas com antecedência mínima de 30 dias por e-mail ao Controlador, conforme o DPA.</p>
      </LegalSection>
    </LegalPage>
  );
}