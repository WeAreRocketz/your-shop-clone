import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/legal-page";

export const Route = createFileRoute("/legal/termos")({
  head: () => ({
    meta: [
      { title: "Termos de Uso — Shop2Shops" },
      { name: "description", content: "Termos e Condições de Uso da plataforma Shop2Shops." },
      { property: "og:title", content: "Termos de Uso — Shop2Shops" },
      { property: "og:description", content: "Termos e Condições de Uso da plataforma Shop2Shops." },
      { property: "og:url", content: "/legal/termos" },
    ],
    links: [{ rel: "canonical", href: "/legal/termos" }],
  }),
  component: TermosPage,
});

function TermosPage() {
  return (
    <LegalPage
      title="Termos de Uso"
      updatedAt="14 de junho de 2026"
      intro="Ao criar uma conta ou usar a Shop2Shops, você concorda com estes Termos. Leia com atenção; em caso de discordância, não utilize o serviço."
    >
      <LegalSection title="1. Objeto">
        <p>A Shop2Shops fornece infraestrutura SaaS para distribuição de checkout, sincronização de produtos, gestão de operação e camuflagem de domínio entre lojas Shopify conectadas pelo lojista.</p>
      </LegalSection>
      <LegalSection title="2. Cadastro e conta">
        <p>O usuário declara ter capacidade civil e fornece informações verídicas. É responsável por manter a confidencialidade das credenciais e por todas as ações realizadas em sua conta.</p>
      </LegalSection>
      <LegalSection title="3. Planos, cobrança e período grátis">
        <p>O acesso é por assinatura recorrente. Novos workspaces possuem 3 (três) dias de teste gratuito; após esse período, a continuidade depende da escolha de um plano pago. Valores e limites estão descritos na página de Planos e podem variar com aviso prévio de 30 dias para usuários ativos.</p>
      </LegalSection>
      <LegalSection title="4. Uso permitido e proibido">
        <ul className="list-disc space-y-1 pl-5">
          <li>É proibido utilizar a plataforma para fins ilícitos, fraudulentos, lavagem de dinheiro, evasão fiscal ou venda de produtos proibidos pela legislação brasileira ou da jurisdição do comprador final.</li>
          <li>É proibido tentar contornar limites técnicos, realizar engenharia reversa ou interferir na infraestrutura.</li>
          <li>O lojista é integralmente responsável pelas obrigações fiscais, sanitárias, regulatórias e contratuais perante seus clientes finais.</li>
        </ul>
      </LegalSection>
      <LegalSection title="5. Propriedade intelectual">
        <p>Marca, software, design e documentação da Shop2Shops são protegidos pela legislação aplicável e permanecem de propriedade da Shop2Shops. É concedida licença limitada, não exclusiva e revogável para uso conforme o plano contratado.</p>
      </LegalSection>
      <LegalSection title="6. Limitação de responsabilidade">
        <p>A Shop2Shops não se responsabiliza por indisponibilidades de terceiros (Shopify, gateways, provedores de pagamento, ANATEL/Telecom), lucros cessantes ou danos indiretos. A responsabilidade total agregada está limitada ao valor pago pelo cliente nos 12 meses anteriores ao evento.</p>
      </LegalSection>
      <LegalSection title="7. Suspensão e encerramento">
        <p>Podemos suspender ou encerrar a conta em caso de violação destes Termos, inadimplência superior a 15 dias, ordem judicial ou risco à segurança da plataforma.</p>
      </LegalSection>
      <LegalSection title="8. Foro e lei aplicável">
        <p>Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro da Comarca de São Paulo/SP, com renúncia a qualquer outro, por mais privilegiado que seja.</p>
      </LegalSection>
    </LegalPage>
  );
}