import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/legal-page";

export const Route = createFileRoute("/legal/ccpa")({
  head: () => ({
    meta: [
      { title: "Do Not Sell or Share My Info (CCPA) — Shop2Shops" },
      { name: "description", content: "Direitos dos residentes da Califórnia sob a CCPA/CPRA — incluindo o direito de não venda/compartilhamento." },
      { property: "og:title", content: "Do Not Sell or Share My Info — Shop2Shops" },
      { property: "og:description", content: "Direitos CCPA/CPRA: acesso, exclusão, correção, opt-out de venda e compartilhamento." },
      { property: "og:url", content: "/legal/ccpa" },
    ],
    links: [{ rel: "canonical", href: "/legal/ccpa" }],
  }),
  component: CcpaPage,
});

function CcpaPage() {
  return (
    <LegalPage
      title="Do Not Sell or Share My Info (CCPA / CPRA)"
      updatedAt="14 de junho de 2026"
      intro="Esta seção é dirigida a residentes do estado da Califórnia (EUA) com base na California Consumer Privacy Act (CCPA), conforme alterada pela California Privacy Rights Act (CPRA)."
    >
      <LegalSection title="1. Resumo">
        <p>A Shop2Shops <strong>não vende</strong> dados pessoais por contrapartida monetária. Compartilhamos dados com subprocessadores estritamente para prestar o serviço contratado.</p>
      </LegalSection>
      <LegalSection title="2. Seus direitos">
        <ul className="list-disc space-y-1 pl-5">
          <li>Direito de saber quais categorias de dados pessoais coletamos;</li>
          <li>Direito de acesso, correção e exclusão;</li>
          <li>Direito de optar por não participar (opt-out) da venda ou compartilhamento;</li>
          <li>Direito de limitar o uso de informações pessoais sensíveis;</li>
          <li>Direito à não discriminação pelo exercício dos seus direitos.</li>
        </ul>
      </LegalSection>
      <LegalSection title="3. Como exercer">
        <p>Envie sua solicitação para <a href="mailto:privacy@shop2shops.com.br" className="text-primary hover:underline">privacy@shop2shops.com.br</a> com o assunto <em>"CCPA Request"</em>. Verificaremos sua identidade e responderemos em até 45 dias, prorrogáveis por mais 45 mediante aviso.</p>
      </LegalSection>
      <LegalSection title="4. Agente autorizado">
        <p>Você pode designar um agente autorizado para fazer a solicitação em seu nome, mediante procuração assinada.</p>
      </LegalSection>
    </LegalPage>
  );
}