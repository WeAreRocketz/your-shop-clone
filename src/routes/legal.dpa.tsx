import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/legal-page";

export const Route = createFileRoute("/legal/dpa")({
  head: () => ({
    meta: [
      { title: "Acordo de Processamento de Dados (DPA) — Shop2Shops" },
      { name: "description", content: "Data Processing Agreement (DPA) entre Shop2Shops e o Cliente, em conformidade com LGPD e GDPR." },
      { property: "og:title", content: "DPA — Shop2Shops" },
      { property: "og:description", content: "Acordo de Processamento de Dados em conformidade com LGPD e GDPR." },
      { property: "og:url", content: "/legal/dpa" },
    ],
    links: [{ rel: "canonical", href: "/legal/dpa" }],
  }),
  component: DpaPage,
});

function DpaPage() {
  return (
    <LegalPage
      title="Acordo de Processamento de Dados (DPA)"
      updatedAt="14 de junho de 2026"
      intro="Este Acordo (Data Processing Agreement) integra os Termos de Uso e disciplina o tratamento de dados pessoais quando a Shop2Shops atua como Operador (LGPD) ou Processor (GDPR) por conta do Cliente, que atua como Controlador."
    >
      <LegalSection title="1. Papéis das partes">
        <p>O Cliente é o Controlador dos dados pessoais de seus clientes finais. A Shop2Shops atua como Operador/Processor, tratando dados somente conforme as instruções documentadas do Cliente e este DPA.</p>
      </LegalSection>
      <LegalSection title="2. Escopo e duração">
        <p>O tratamento abrange dados cadastrais, transacionais e de uso necessários à prestação do serviço, durante a vigência do contrato e pelos prazos legais de retenção.</p>
      </LegalSection>
      <LegalSection title="3. Obrigações do Operador">
        <ul className="list-disc space-y-1 pl-5">
          <li>Tratar dados apenas conforme instruções do Controlador;</li>
          <li>Garantir confidencialidade e capacitação de pessoal autorizado;</li>
          <li>Implementar medidas técnicas e organizacionais adequadas;</li>
          <li>Auxiliar o Controlador no atendimento a titulares e a autoridades;</li>
          <li>Notificar incidentes de segurança em até 48 horas após conhecimento;</li>
          <li>Eliminar ou devolver os dados ao fim do contrato.</li>
        </ul>
      </LegalSection>
      <LegalSection title="4. Subprocessadores">
        <p>O Controlador autoriza o uso dos subprocessadores listados em <a href="/legal/subprocessadores" className="text-primary hover:underline">/legal/subprocessadores</a>. Mudanças materiais são comunicadas com 30 dias de antecedência.</p>
      </LegalSection>
      <LegalSection title="5. Transferências internacionais">
        <p>São amparadas por Cláusulas Contratuais Padrão (SCCs) da Comissão Europeia, complementadas por avaliações de impacto quando aplicável (TIA).</p>
      </LegalSection>
      <LegalSection title="6. Auditoria">
        <p>O Controlador pode solicitar, uma vez por ano, relatórios técnicos e certificações disponíveis. Auditorias presenciais podem ser realizadas mediante aviso prévio e custos do solicitante.</p>
      </LegalSection>
      <LegalSection title="7. Vigência e foro">
        <p>Este DPA permanece em vigor enquanto a Shop2Shops tratar dados em nome do Cliente. Fica eleito o foro da Comarca de São Paulo/SP.</p>
      </LegalSection>
    </LegalPage>
  );
}