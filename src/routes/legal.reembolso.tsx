import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/legal-page";

export const Route = createFileRoute("/legal/reembolso")({
  head: () => ({
    meta: [
      { title: "Política de Reembolso — Shop2Shops" },
      { name: "description", content: "Política de reembolso e cancelamento da assinatura Shop2Shops, em conformidade com o CDC." },
      { property: "og:title", content: "Política de Reembolso — Shop2Shops" },
      { property: "og:description", content: "Reembolso, cancelamento e arrependimento (CDC art. 49)." },
      { property: "og:url", content: "/legal/reembolso" },
    ],
    links: [{ rel: "canonical", href: "/legal/reembolso" }],
  }),
  component: ReembolsoPage,
});

function ReembolsoPage() {
  return (
    <LegalPage
      title="Política de Reembolso"
      updatedAt="14 de junho de 2026"
      intro="Esta política descreve como funcionam cancelamento, arrependimento e reembolso na assinatura da Shop2Shops."
    >
      <LegalSection title="1. Direito de arrependimento (CDC art. 49)">
        <p>Por se tratar de contratação online, o cliente pessoa física pode exercer o direito de arrependimento em até 7 (sete) dias corridos contados da primeira cobrança paga, com reembolso integral, desde que solicitado por escrito ao e-mail <a href="mailto:financeiro@shop2shops.com.br" className="text-primary hover:underline">financeiro@shop2shops.com.br</a>.</p>
      </LegalSection>
      <LegalSection title="2. Cancelamento da assinatura">
        <p>O cancelamento pode ser solicitado a qualquer momento no painel ou por e-mail. A assinatura permanece ativa até o fim do ciclo já pago, sem cobranças futuras.</p>
      </LegalSection>
      <LegalSection title="3. Reembolso proporcional">
        <p>Fora do prazo de arrependimento, não há reembolso proporcional de mensalidades já vencidas. Em planos anuais com pagamento à vista, reembolsamos o saldo proporcional aos meses não utilizados, descontados eventuais descontos promocionais e impostos não recuperáveis.</p>
      </LegalSection>
      <LegalSection title="4. Falhas técnicas">
        <p>Em caso de indisponibilidade comprovada superior a 0,5% do mês (uptime &lt; 99,5%), aplicamos crédito proporcional na próxima fatura mediante solicitação.</p>
      </LegalSection>
      <LegalSection title="5. Prazo de processamento">
        <p>Reembolsos são processados em até 7 dias úteis após aprovação e podem levar até 2 ciclos de fatura para aparecer no extrato do cartão.</p>
      </LegalSection>
    </LegalPage>
  );
}