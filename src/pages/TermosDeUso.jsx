import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';
import { ThemeToggle } from '../components/ThemeToggle.jsx';

const sections = [
  {
    title: '1. Aceitação dos Termos',
    content: `Ao acessar ou utilizar a plataforma Extrato Co., operada pela Cortez Group (CNPJ 60.994.700/0001-70), você declara ter lido, compreendido e concordado com estes Termos de Uso. Se não concordar com qualquer disposição, não utilize o serviço.

Estes Termos regulam o acesso e uso da plataforma de gestão financeira Extrato Co., incluindo todas as funcionalidades, conteúdos, atualizações e serviços correlatos.`,
  },
  {
    title: '2. Descrição do Serviço',
    content: `O Extrato Co. é uma plataforma SaaS (Software como Serviço) de painel financeiro corporativo que permite a visualização, organização e análise de extratos e transações bancárias. A plataforma é destinada a empresas e profissionais que necessitam de controle financeiro consolidado.

Os serviços incluem: importação e leitura de extratos bancários, categorização de transações, geração de relatórios, compartilhamento de acesso entre membros da equipe e análise de fluxo de caixa.`,
  },
  {
    title: '3. Cadastro e Responsabilidade da Conta',
    content: `Para utilizar a plataforma, é necessário criar uma conta com e-mail e senha válidos. Você é integralmente responsável pela confidencialidade das suas credenciais de acesso e por todas as atividades realizadas em sua conta.

É vedado: compartilhar credenciais com terceiros não autorizados, utilizar dados de terceiros sem consentimento, criar contas com informações falsas ou tentar acessar contas de outros usuários. A Cortez Group reserva-se o direito de suspender ou encerrar contas que violem estas diretrizes.`,
  },
  {
    title: '4. Tratamento de Dados e LGPD',
    content: `A Cortez Group atua como operadora dos dados pessoais inseridos na plataforma, nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD). O usuário, como controlador, é responsável pela legalidade dos dados que insere na plataforma.

Os dados são tratados exclusivamente para as finalidades do serviço contratado. Não compartilhamos dados pessoais com terceiros para fins comerciais. O titular dos dados pode exercer seus direitos (acesso, correção, portabilidade, eliminação) pelo e-mail: atendimento@cortezgroup.com.br.

Os dados são armazenados em servidores seguros com criptografia em trânsito (TLS) e em repouso. O prazo de retenção é de 5 anos após o encerramento da conta, salvo obrigação legal diversa.`,
  },
  {
    title: '5. Propriedade Intelectual',
    content: `Todo o conteúdo da plataforma — incluindo design, código-fonte, logotipos, textos, funcionalidades e interfaces — é de propriedade exclusiva da Cortez Group e está protegido pelas leis de propriedade intelectual brasileiras.

É expressamente proibido copiar, reproduzir, modificar, distribuir ou criar obras derivadas sem autorização prévia e escrita da Cortez Group. O uso indevido sujeitará o infrator às penalidades previstas na Lei nº 9.610/98 e no Código Civil.`,
  },
  {
    title: '6. Limitação de Responsabilidade',
    content: `A plataforma Extrato Co. é fornecida "como está", sem garantias de disponibilidade ininterrupta. A Cortez Group não se responsabiliza por perdas financeiras decorrentes de decisões tomadas com base nas informações exibidas na plataforma, por falhas de conexão à internet, por ataques de terceiros (invasões, vírus) fora do controle razoável da empresa, ou por dados incorretos fornecidos pelo próprio usuário.

A responsabilidade total da Cortez Group, em qualquer circunstância, limita-se ao valor pago pelo usuário nos últimos 3 (três) meses de serviço.`,
  },
  {
    title: '7. Pagamentos e Cancelamento',
    content: `Os planos pagos são cobrados conforme descrito no momento da contratação. O cancelamento pode ser solicitado a qualquer momento, sem multa, com efeito ao final do período vigente. Não há reembolso proporcional de períodos já pagos, salvo disposição legal em contrário.

Em caso de inadimplência, o acesso à plataforma pode ser suspenso após 15 dias de atraso, com encerramento definitivo após 30 dias.`,
  },
  {
    title: '8. Modificações dos Termos',
    content: `A Cortez Group pode atualizar estes Termos a qualquer momento. Alterações substanciais serão comunicadas por e-mail com antecedência mínima de 15 dias. O uso continuado da plataforma após a data de vigência das alterações constitui aceitação dos novos termos.

A versão mais recente sempre estará disponível em extratobancario.cortezgroup.com.br/termos.`,
  },
  {
    title: '9. Legislação Aplicável e Foro',
    content: `Estes Termos são regidos pelas leis da República Federativa do Brasil. Para dirimir quaisquer controvérsias, fica eleito o foro da comarca de Brasília/DF, com renúncia expressa a qualquer outro, por mais privilegiado que seja.

Última atualização: abril de 2026.`,
  },
];

export default function TermosDeUso() {
  useSEO({
    title: 'Termos de Uso',
    description: 'Leia os Termos de Uso da plataforma Extrato Co., operada pela Cortez Group (CNPJ 60.994.700/0001-70).',
  });
  const navigate = useNavigate();

  return (
    <div className="mesh-bg relative min-h-screen p-6 overflow-hidden">
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-tertiary/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8 pt-4"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-on-surface-variant hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="text-sm">Voltar</span>
          </button>
          <ThemeToggle />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="glass-card rounded-[2rem] p-10"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/30">
              <FileText className="text-secondary" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tighter text-white font-['Inter'] text-glow">
                Termos de Uso
              </h1>
              <p className="text-on-surface-variant text-sm">Extrato Co. — Cortez Group</p>
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
