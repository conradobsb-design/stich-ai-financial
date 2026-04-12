import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, HelpCircle, ChevronDown } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';

const faqs = [
  {
    category: 'Conta e Acesso',
    items: [
      {
        q: 'Como crio minha conta no Extrato Co.?',
        a: 'Na tela de login, clique em "Novo por aqui? Crie sua conta", preencha seu e-mail e senha e confirme. Você receberá um e-mail de confirmação — clique no link para ativar sua conta.',
      },
      {
        q: 'Esqueci minha senha. O que faço?',
        a: 'Na tela de login, clique em "Esqueceu sua senha? Crie uma nova". Digite seu e-mail cadastrado e enviaremos um link de redefinição para sua caixa de entrada. O link expira em 1 hora.',
      },
      {
        q: 'Posso alterar meu e-mail de acesso?',
        a: 'Sim. Entre em contato pelo e-mail atendimento@cortezgroup.com.br informando o e-mail atual e o novo. Confirmaremos a alteração em até 2 dias úteis após verificação de identidade.',
      },
      {
        q: 'Como encerro minha conta?',
        a: 'Envie uma solicitação para atendimento@cortezgroup.com.br com o assunto "Encerramento de conta". Seus dados serão mantidos por 5 anos conforme exigência legal, mas o acesso será revogado imediatamente.',
      },
    ],
  },
  {
    category: 'Extrato e Transações',
    items: [
      {
        q: 'Como importo meu extrato bancário?',
        a: 'Acesse o Dashboard e utilize o botão de importação. A plataforma aceita arquivos OFX e CSV exportados pela maioria dos bancos brasileiros. Certifique-se de que o arquivo está no formato correto antes de importar.',
      },
      {
        q: 'As transações são atualizadas automaticamente?',
        a: 'A atualização automática depende da integração com seu banco. Para bancos sem integração direta, você pode importar manualmente o extrato atualizado a qualquer momento, sem limite de importações.',
      },
      {
        q: 'Posso categorizar minhas transações?',
        a: 'Sim. Cada transação pode ser editada para adicionar categorias personalizadas (ex.: Fornecedores, Impostos, Folha de Pagamento). As categorias se aplicam automaticamente a transações futuras com descrição semelhante.',
      },
      {
        q: 'Há limite de transações que posso cadastrar?',
        a: 'No plano gratuito, o limite é de 500 transações por mês. Nos planos pagos, o limite é ampliado conforme o plano contratado. Para volumes corporativos, entre em contato para condições personalizadas.',
      },
    ],
  },
  {
    category: 'Membros e Compartilhamento',
    items: [
      {
        q: 'Como convido um membro da minha equipe?',
        a: 'No Dashboard, clique no ícone de usuários no canto superior direito. Digite o e-mail do colaborador e clique em "Convidar". O convidado receberá um e-mail com o link de acesso. O convite expira em 7 dias.',
      },
      {
        q: 'O membro convidado vê todos os meus dados?',
        a: 'Sim. Ao aceitar o convite, o membro terá acesso de leitura ao painel financeiro da conta que o convidou. Permissões granulares (somente leitura, edição, administrador) estarão disponíveis em breve.',
      },
      {
        q: 'Posso revogar o acesso de um membro?',
        a: 'Sim. No modal de membros, localize o colaborador e clique em "Remover acesso". O efeito é imediato e o usuário não poderá mais visualizar seus dados.',
      },
      {
        q: 'Quantos membros posso convidar?',
        a: 'No plano gratuito, até 2 membros. Planos pagos permitem membros ilimitados. Consulte a tabela de planos para detalhes.',
      },
    ],
  },
  {
    category: 'Segurança e Privacidade',
    items: [
      {
        q: 'Meus dados financeiros estão seguros?',
        a: 'Sim. Utilizamos criptografia TLS 1.3 em trânsito e AES-256 em repouso. O banco de dados conta com Row Level Security (RLS), garantindo que cada usuário acesse apenas seus próprios dados. Realizamos auditorias periódicas de segurança.',
      },
      {
        q: 'O Extrato Co. acessa minha conta bancária?',
        a: 'Não. A plataforma não armazena nem acessa credenciais bancárias. Você importa apenas os arquivos de extrato (OFX/CSV) exportados por você mesmo do seu banco.',
      },
      {
        q: 'Como a plataforma está em conformidade com a LGPD?',
        a: 'Tratamos apenas os dados necessários para o serviço, com base legal definida (execução de contrato e legítimo interesse). Você pode solicitar acesso, correção, portabilidade ou exclusão dos seus dados a qualquer momento pelo e-mail atendimento@cortezgroup.com.br.',
      },
      {
        q: 'O que acontece com meus dados se eu cancelar?',
        a: 'Seu acesso é encerrado imediatamente. Os dados são mantidos por 5 anos conforme obrigação legal e, após esse prazo, são permanentemente excluídos. Você pode solicitar exportação dos dados antes do cancelamento.',
      },
    ],
  },
  {
    category: 'Planos e Cobrança',
    items: [
      {
        q: 'Existe plano gratuito?',
        a: 'Sim. O plano gratuito inclui até 500 transações/mês, 2 membros convidados e funcionalidades essenciais do dashboard. Para funcionalidades avançadas e volumes maiores, consulte nossos planos pagos.',
      },
      {
        q: 'Como cancelo minha assinatura?',
        a: 'O cancelamento pode ser solicitado a qualquer momento pelo e-mail atendimento@cortezgroup.com.br, sem multa. O acesso permanece ativo até o final do período já pago.',
      },
      {
        q: 'Posso obter nota fiscal pelos serviços?',
        a: 'Sim. Emitimos NF-e para todos os planos pagos. Solicite pelo e-mail atendimento@cortezgroup.com.br informando seus dados fiscais (CPF/CNPJ e endereço).',
      },
    ],
  },
];

function FAQItem({ item }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-outline-variant rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
      >
        <span className="text-white font-medium text-sm pr-4">{item.q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={18} className="text-on-surface-variant flex-shrink-0" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 text-on-surface-variant text-sm leading-relaxed border-t border-outline-variant/50 pt-4">
              {item.a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQ() {
  useSEO({
    title: 'FAQ',
    description: 'Perguntas frequentes sobre a plataforma Extrato Co. — conta, extratos, segurança e privacidade.',
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
        >
          <div className="glass-card rounded-[2rem] p-10 mb-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/30">
                <HelpCircle className="text-secondary" size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tighter text-white font-['Inter'] text-glow">
                  Perguntas Frequentes
                </h1>
                <p className="text-on-surface-variant text-sm">Tudo o que você precisa saber sobre o Extrato Co.</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {faqs.map((category, ci) => (
              <motion.div
                key={ci}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: ci * 0.08 }}
                className="glass-card rounded-[2rem] p-8"
              >
                <h2 className="text-secondary font-bold text-sm uppercase tracking-widest mb-5">
                  {category.category}
                </h2>
                <div className="space-y-3">
                  {category.items.map((item, ii) => (
                    <FAQItem key={ii} item={item} />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="glass-card rounded-[2rem] p-8 mt-6 text-center">
            <p className="text-white font-semibold mb-2">Não encontrou o que procurava?</p>
            <p className="text-on-surface-variant text-sm mb-4">
              Nossa equipe está pronta para ajudar.
            </p>
            <a
              href="mailto:atendimento@cortezgroup.com.br"
              className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 text-secondary px-6 py-3 rounded-2xl text-sm font-medium hover:bg-primary/30 transition-colors"
            >
              atendimento@cortezgroup.com.br
            </a>
          </div>

          <div className="mt-8 pb-8 text-center">
            <p className="text-on-surface-variant/50 text-xs">
              Cortez Group — CNPJ 60.994.700/0001-70 · atendimento@cortezgroup.com.br
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
