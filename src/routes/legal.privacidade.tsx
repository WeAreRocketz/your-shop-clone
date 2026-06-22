import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/legal-page";

export const Route = createFileRoute("/legal/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade — Shop2Shops" },
      { name: "description", content: "Como a Shop2Shops coleta, usa, compartilha e protege dados pessoais em conformidade com LGPD, GDPR, UK GDPR e CCPA." },
      { property: "og:title", content: "Política de Privacidade — Shop2Shops" },
      { property: "og:description", content: "Política de Privacidade da Shop2Shops em conformidade com LGPD, GDPR e CCPA." },
      { property: "og:url", content: "/legal/privacidade" },
    ],
    links: [{ rel: "canonical", href: "/legal/privacidade" }],
  }),
  component: PrivacidadePage,
});

function PrivacidadePage() {
  return (
    <LegalPage
      title="Política de Privacidade"
      updatedAt="14 de junho de 2026"
      intro="Esta Política descreve como a Shop2Shops Tecnologia Ltda. (‘Shop2Shops’, ‘nós’) trata dados pessoais de visitantes, lojistas e clientes finais de lojas conectadas, em conformidade com a LGPD (Lei nº 13.709/2018), o GDPR (Regulamento UE 2016/679), o UK GDPR &amp; Data Protection Act 2018 e o CCPA/CPRA da Califórnia."
    >
      <LegalSection title="1. Controlador e Encarregado (DPO)">
        <p>Controlador: <strong>Shop2Shops Tecnologia Ltda.</strong>, inscrita sob o CNPJ a ser informado mediante solicitação.</p>
        <p>Encarregado pelo Tratamento de Dados (DPO): contato pelo e-mail <a href="mailto:privacidade@shop2shops.com.br" className="text-primary hover:underline">privacidade@shop2shops.com.br</a>.</p>
      </LegalSection>

      <LegalSection title="2. Dados que tratamos">
        <p>Tratamos as seguintes categorias de dados pessoais:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Dados cadastrais (nome, e-mail, telefone, CPF/CNPJ quando aplicável);</li>
          <li>Dados de autenticação (credenciais cifradas, tokens de sessão);</li>
          <li>Dados de uso e telemetria (logs, IP, user-agent, eventos de produto);</li>
          <li>Dados de cobrança (histórico de plano, comprovantes de pagamento — pagamento processado por terceiros);</li>
          <li>Dados de lojas conectadas (chaves de API, configurações, pedidos, produtos, clientes finais).</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Finalidades e bases legais (LGPD art. 7º / GDPR art. 6º)">
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Execução de contrato:</strong> prestar o serviço, autenticar acessos, sincronizar lojas e processar checkout.</li>
          <li><strong>Cumprimento de obrigação legal:</strong> emissão fiscal, atendimento a autoridades, retenção contábil.</li>
          <li><strong>Legítimo interesse:</strong> prevenção a fraudes, segurança da informação, melhoria do produto.</li>
          <li><strong>Consentimento:</strong> comunicações de marketing e cookies não essenciais (revogável a qualquer momento).</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Compartilhamento de dados">
        <p>Compartilhamos dados estritamente necessários com: provedores de infraestrutura (Lovable Cloud, Supabase, Cloudflare), processadores de pagamento, ferramentas de analytics e atendimento, e autoridades quando exigido por lei. A lista de subprocessadores está disponível em <a href="/legal/subprocessadores" className="text-primary hover:underline">/legal/subprocessadores</a>.</p>
      </LegalSection>

      <LegalSection title="5. Transferência internacional">
        <p>Quando dados são transferidos para fora do Brasil, EEE ou Reino Unido, utilizamos Cláusulas Contratuais Padrão (SCCs) aprovadas pela Comissão Europeia e os mecanismos previstos no art. 33 da LGPD.</p>
      </LegalSection>

      <LegalSection title="6. Retenção">
        <p>Os dados são mantidos pelo tempo necessário às finalidades descritas e aos prazos legais (ex.: 5 anos para registros fiscais, conforme legislação brasileira aplicável). Após esse período, são anonimizados ou eliminados de forma segura.</p>
      </LegalSection>

      <LegalSection title="7. Segurança">
        <p>Adotamos medidas técnicas e organizacionais apropriadas: criptografia em trânsito (TLS 1.2+) e em repouso, controle de acesso por função, registros de auditoria, isolamento por tenant e testes periódicos de vulnerabilidade.</p>
      </LegalSection>

      <LegalSection title="8. Seus direitos como titular">
        <p>Você pode, a qualquer momento, solicitar: acesso, retificação, exclusão ou anonimização, portabilidade, revogação do consentimento, oposição ao tratamento, informações sobre compartilhamento e não discriminação pelo exercício dos seus direitos. Para exercer, envie e-mail para <a href="mailto:privacidade@shop2shops.com.br" className="text-primary hover:underline">privacidade@shop2shops.com.br</a>.</p>
      </LegalSection>

      <LegalSection title="9. Autoridade competente">
        <p>Você pode apresentar reclamação à ANPD (Brasil), ao EDPB e autoridades nacionais europeias, ao ICO (Reino Unido) ou à CPPA e California Attorney General (Califórnia).</p>
      </LegalSection>

      <LegalSection title="10. Alterações">
        <p>Esta Política pode ser atualizada para refletir mudanças legais ou no serviço. Avisaremos por e-mail e/ou no painel quando houver alterações materiais.</p>
      </LegalSection>
    </LegalPage>
  );
}