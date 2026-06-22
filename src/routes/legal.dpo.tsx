import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/legal-page";

export const Route = createFileRoute("/legal/dpo")({
  head: () => ({
    meta: [
      { title: "Encarregado de Dados (DPO) — Shop2Shops" },
      { name: "description", content: "Como contatar o Encarregado pelo Tratamento de Dados Pessoais (DPO) da Shop2Shops." },
      { property: "og:title", content: "Encarregado de Dados (DPO) — Shop2Shops" },
      { property: "og:description", content: "Canal oficial de contato com o DPO da Shop2Shops." },
      { property: "og:url", content: "/legal/dpo" },
    ],
    links: [{ rel: "canonical", href: "/legal/dpo" }],
  }),
  component: DpoPage,
});

function DpoPage() {
  return (
    <LegalPage
      title="Encarregado pelo Tratamento de Dados (DPO)"
      updatedAt="14 de junho de 2026"
      intro="Em cumprimento ao art. 41 da LGPD e art. 37 do GDPR, a Shop2Shops mantém um Encarregado responsável por receber comunicações de titulares e da autoridade nacional."
    >
      <LegalSection title="Canal oficial">
        <p>E-mail: <a href="mailto:privacidade@shop2shops.com.br" className="text-primary hover:underline">privacidade@shop2shops.com.br</a></p>
        <p>Assunto sugerido: <em>"Solicitação de Titular — [seu nome]"</em>.</p>
        <p>Endereço para correspondência: Shop2Shops Tecnologia Ltda. — Aos cuidados do DPO. (endereço completo fornecido mediante solicitação verificada).</p>
      </LegalSection>
      <LegalSection title="Atribuições do DPO">
        <ul className="list-disc space-y-1 pl-5">
          <li>Aceitar reclamações e comunicações de titulares;</li>
          <li>Receber comunicações da ANPD/autoridades equivalentes;</li>
          <li>Orientar funcionários e contratados sobre boas práticas;</li>
          <li>Executar demais atribuições determinadas pelo Controlador.</li>
        </ul>
      </LegalSection>
      <LegalSection title="Prazos de resposta">
        <p>LGPD: até 15 dias. GDPR/UK GDPR: até 30 dias (prorrogáveis por mais 60 em casos complexos). CCPA: até 45 dias (prorrogáveis por mais 45).</p>
      </LegalSection>
    </LegalPage>
  );
}