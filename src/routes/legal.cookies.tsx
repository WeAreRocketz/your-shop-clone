import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/legal-page";

export const Route = createFileRoute("/legal/cookies")({
  head: () => ({
    meta: [
      { title: "Política de Cookies — Shop2Shops" },
      { name: "description", content: "Como a Shop2Shops usa cookies e tecnologias similares, e como você pode gerenciá-los." },
      { property: "og:title", content: "Política de Cookies — Shop2Shops" },
      { property: "og:description", content: "Cookies essenciais, analíticos e de marketing — controle e consentimento." },
      { property: "og:url", content: "/legal/cookies" },
    ],
    links: [{ rel: "canonical", href: "/legal/cookies" }],
  }),
  component: CookiesPage,
});

function CookiesPage() {
  return (
    <LegalPage
      title="Política de Cookies"
      updatedAt="14 de junho de 2026"
      intro="Cookies são pequenos arquivos armazenados no seu navegador para garantir funcionamento, segurança e melhoria do serviço."
    >
      <LegalSection title="1. Categorias">
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Estritamente necessários:</strong> sessão, autenticação, balanceamento de carga e segurança. Não podem ser desativados.</li>
          <li><strong>Funcionais:</strong> lembram preferências (idioma, tema).</li>
          <li><strong>Analíticos:</strong> medem uso agregado e ajudam a melhorar o produto. Carregados apenas com consentimento (GDPR/LGPD).</li>
          <li><strong>Marketing:</strong> mensuração de campanhas. Carregados apenas com consentimento.</li>
        </ul>
      </LegalSection>
      <LegalSection title="2. Gerenciamento">
        <p>Você pode aceitar, recusar ou ajustar suas preferências no banner exibido no primeiro acesso e a qualquer momento no rodapé. As preferências são armazenadas por até 12 meses.</p>
      </LegalSection>
      <LegalSection title="3. Como desativar no navegador">
        <p>Você também pode bloquear ou apagar cookies diretamente nas configurações do seu navegador. Note que desativar cookies essenciais pode impedir o funcionamento da plataforma.</p>
      </LegalSection>
      <LegalSection title="4. Base legal">
        <p>Cookies não essenciais são tratados com base no <strong>consentimento</strong> (LGPD art. 7º, I; GDPR art. 6(1)(a)). Cookies estritamente necessários têm base no <strong>legítimo interesse</strong> e/ou <strong>execução de contrato</strong>.</p>
      </LegalSection>
    </LegalPage>
  );
}