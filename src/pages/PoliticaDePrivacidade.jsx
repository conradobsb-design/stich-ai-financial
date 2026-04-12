import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

const sections = [
  {
    title: '1. Quem Somos',
    content: `A Cortez Group (CNPJ 60.994.700/0001-70), responsável pela plataforma Extrato Co., é a operadora dos dados pessoais tratados neste serviço. Temos compromisso com a transparência e a segurança no tratamento de informações, em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).

Contato do Encarregado de Dados (DPO): atendimento@cortezgroup.com.br`,
  },
  {
    title: '2. Dados que Coletamos',
    content: `Coletamos apenas os dados necessários para a prestação do serviço:

• Dados de identificação: nome, e-mail, empresa e senha (armazenada com hash seguro).
• Dados financeiros: extratos e transações inseridos manualmente ou importados pelo usuário.
• Dados de uso: logs de acesso, endereço IP, tipo de dispositivo e navegador, para segurança e melhoria do serviço.
• Dados de convite: e-mails de terceiros inseridos pelo usuário ao convidar membros da equipe.

Não coletamos dados sensíveis (biometria, saúde, origem racial) nem dados de menores de 18 anos.`,
  },
  {
    title: '3. Como e Por Que Usamos seus Dados',
    content: `Seus dados são tratados exclusivamente para:

• Autenticação e controle de acesso à plataforma.
• Exibição e análise das transações financeiras cadastradas.
• Envio de notificações transacionais (convites, redefinição de senha, confirmações).
• Segurança: detecção de acessos suspeitos e prevenção de fraudes.
• Cumprimento de obrigações legais e regulatórias.

Base legal: execução de contrato (art. 7º, V, LGPD), legítimo interesse (art. 7º, IX, LGPD) e cumprimento de obrigação legal (art. 7º, II, LGPD).`,
  },
  {
    title: '4. Compartilhamento de Dados',
    content: `Não vendemos nem alugamos seus dados. Compartilhamos apenas quando necessário para operar o serviço:

• Supabase (infraestrutura de banco de dados e autenticação) — sob contrato de processamento de dados.
• Resend (envio de e-mails transacionais) — apenas endereço de e-mail de destino.
• n8n (automações de fluxo de trabalho) — exclusivamente para processamento interno.

Todos os subprocessadores estão sujeitos a contratos que garantem proteção equivalente à LGPD. Nenhum dado é compartilhado com anunciantes ou terceiros comerciais.`,
  },
  {
    title: '5. Armazenamento e Segurança',
    content: `Os dados são armazenados em servidores seguros com:

• Criptografia em trânsito via TLS 1.3.
• Criptografia em repouso nos bancos de dados.
• Controle de acesso por Row Level Security (RLS) no banco de dados.
• Senhas armazenadas exclusivamente como hash bcrypt.
• Backups automáticos com retenção de 30 dias.

O prazo de retenção dos dados é de 5 anos após o encerramento da conta, salvo obrigação legal que exija prazo maior (ex.: registros fiscais — 10 anos, conforme legislação tributária brasileira).`,
  },
  {
    title: '6. Seus Direitos como Titular',
    content: `Conforme a LGPD, você tem direito a:

• Confirmação: saber se tratamos seus dados.
• Acesso: obter cópia dos dados que temos sobre você.
• Correção: solicitar a atualização de dados incompletos ou incorretos.
• Anonimização ou eliminação: solicitar a exclusão de dados desnecessários.
• Portabilidade: receber seus dados em formato estruturado (CSV/JSON).
• Revogação do consentimento: a qualquer momento, sem prejudicar tratamentos anteriores.
• Oposição: contestar tratamentos que considere irregulares.

Para exercer qualquer direito, envie solicitação para atendimento@cortezgroup.com.br. Responderemos em até 15 dias úteis.`,
  },
  {
    title: '7. Cookies e Tecnologias de Rastreamento',
    content: `Utilizamos apenas cookies estritamente necessários para:

• Manter sua sessão autenticada.
• Garantir a segurança do acesso.

Não utilizamos cookies de rastreamento comportamental, publicidade ou ferramentas de analytics de terceiros sem sua ciência. Você pode gerenciar cookies nas configurações do seu navegador, mas isso pode afetar o funcionamento da plataforma.`,
  },
  {
    title: '8. Transferência Internacional de Dados',
    content: `Alguns de nossos provedores de infraestrutura (Supabase, Resend) podem processar dados em servidores fora do Brasil. Em todos os casos, exigimos que os provedores adotem medidas de proteção equivalentes às exigidas pela LGPD, incluindo cláusulas contratuais padrão ou certificações de conformidade reconhecidas.`,
  },
  {
    title: '9. Alterações nesta Política',
    content: `Esta Política pode ser atualizada periodicamente. Alterações relevantes serão comunicadas por e-mail com antecedência de 15 dias. A data da última atualização é sempre exibida no rodapé desta página.

Última atualização: abril de 2026.`,
  },
];

export default function PoliticaDePrivacidade() {
  const navigate = useNavigate();

  return (
    <div className="mesh-bg relative min-h-screen p-6 overflow-hidden">
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-tertiary/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8 pt-4"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-on-surface-variant hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="text-sm">Voltar</span>
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass-card rounded-[2rem] p-10"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/30">
              <ShieldCheck className="text-secondary" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tighter text-white font-['Inter'] text-glow">
                Política de Privacidade
              </h1>
              <p className="text-on-surface-variant text-sm">Extrato Co. — Cortez Group · LGPD Compliant</p>
            </div>
          </div>

          <div className="space-y-8">
            {sections.map((section, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <h2 className="text-white font-bold text-lg mb-3 border-l-2 border-secondary pl-3">
                  {section.title}
                </h2>
                <p className="text-on-surface-variant text-sm leading-relaxed whitespace-pre-line">
                  {section.content}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 pt-6 border-t border-outline-variant text-center">
            <p className="text-on-surface-variant/50 text-xs">
              Cortez Group — CNPJ 60.994.700/0001-70 · atendimento@cortezgroup.com.br
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
