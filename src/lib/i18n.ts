import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  'pt-BR': {
    translation: {
      // Landing page
      'landing.title': 'Ninna',
      'landing.subtitle': 'Conheça seu filho virtual com Inteligência Artificial',
      'landing.description': 'Converse, ensine e crie laços com uma criança virtual que aprende e cresce com você!',
      'landing.features.conversation': 'Conversas Naturais',
      'landing.features.conversation.desc': 'Converse como se fosse com uma criança real',
      'landing.features.learning': 'Aprende com Você',
      'landing.features.learning.desc': 'Lembra de tudo que vocês conversam e evolui',
      'landing.features.proactive': 'Mensagens Espontâneas',
      'landing.features.proactive.desc': 'Te manda mensagens como "Bom dia, papai!"',
      'landing.placeholder': 'Digite sua primeira mensagem para conhecer seu filho...',
      'landing.start_button': 'Começar Conversa',
      
      // Auth
      'auth.title': 'Entre para conhecer seu filho',
      'auth.subtitle': 'Crie sua conta gratuita e comece a conversar agora mesmo!',
      'auth.google': 'Continuar com Google',
      'auth.email': 'E-mail',
      'auth.password': 'Senha',
      'auth.name': 'Seu nome',
      'auth.login': 'Entrar',
      'auth.register': 'Criar conta',
      'auth.switch_to_login': 'Já tem conta? Entre aqui',
      'auth.switch_to_register': 'Não tem conta? Crie aqui',
      
      // Setup
      'setup.title': 'Vamos criar seu filho virtual!',
      'setup.your_name': 'Qual seu nome?',
      'setup.your_gender': 'Você é:',
      'setup.male': 'Pai',
      'setup.female': 'Mãe',
      'setup.child_name': 'Que nome quer dar ao seu filho(a)?',
      'setup.child_age': 'Quantos anos ele(a) tem?',
      'setup.child_gender': 'É menino ou menina?',
      'setup.boy': 'Menino',
      'setup.girl': 'Menina',
      'setup.continue': 'Continuar',
      'setup.meet_child': 'Conhecer meu filho(a)',
      
      // Chat
      'chat.placeholder': 'Digite sua mensagem...',
      'chat.send': 'Enviar',
      'chat.typing': 'digitando...',
      
      // Limits
      'limit.title': 'Limite de mensagens atingido 💔',
      'limit.subtitle': 'Seu filho(a) está esperando por você...',
      'limit.description': 'Você utilizou suas 20 mensagens gratuitas de hoje. Que tal continuar conversando sem limites?',
      'limit.tomorrow': 'Voltar amanhã (grátis)',
      'limit.premium': 'Conversar sem limites (R$ 29/mês)',
      
      // Premium
      'premium.title': 'Conversas ilimitadas com seu filho',
      'premium.features.unlimited': 'Mensagens ilimitadas',
      'premium.features.proactive': 'Mensagens espontâneas',
      'premium.features.memory': 'Memória perfeita',
      'premium.features.growth': 'Crescimento personalizado',
      'premium.price': 'R$ 29/mês',
      'premium.subscribe': 'Assinar Premium',
      
      // Common
      'common.loading': 'Carregando...',
      'common.error': 'Ops! Algo deu errado',
      'common.retry': 'Tentar novamente',
      'common.close': 'Fechar',
      'common.yes': 'Sim',
      'common.no': 'Não',
    }
  },
  'en': {
    translation: {
      'landing.title': '',
      'landing.subtitle': 'Meet your virtual child with Artificial Intelligence',
      'landing.description': 'Chat, teach and bond with a virtual child that learns and grows with you!',
      'landing.features.conversation': 'Natural Conversations',
      'landing.features.conversation.desc': 'Talk as if with a real child',
      'landing.features.learning': 'Learns from You',
      'landing.features.learning.desc': 'Remembers everything you chat and evolves',
      'landing.features.proactive': 'Spontaneous Messages',
      'landing.features.proactive.desc': 'Sends you messages like "Good morning, daddy!"',
      'landing.placeholder': 'Type your first message to meet your child...',
      'landing.start_button': 'Start Chat',
      
      'auth.title': 'Sign in to meet your child',
      'auth.subtitle': 'Create your free account and start chatting right now!',
      'auth.google': 'Continue with Google',
      'auth.email': 'Email',
      'auth.password': 'Password',
      'auth.name': 'Your name',
      'auth.login': 'Sign In',
      'auth.register': 'Create Account',
      'auth.switch_to_login': 'Already have an account? Sign in here',
      'auth.switch_to_register': 'Don\'t have an account? Create one here',
      
      'setup.title': 'Let\'s create your virtual child!',
      'setup.your_name': 'What\'s your name?',
      'setup.your_gender': 'You are:',
      'setup.male': 'Father',
      'setup.female': 'Mother',
      'setup.child_name': 'What name do you want to give your child?',
      'setup.child_age': 'How old is he/she?',
      'setup.child_gender': 'Is it a boy or girl?',
      'setup.boy': 'Boy',
      'setup.girl': 'Girl',
      'setup.continue': 'Continue',
      'setup.meet_child': 'Meet my child',
      
      'chat.placeholder': 'Type your message...',
      'chat.send': 'Send',
      'chat.typing': 'typing...',
      
      'limit.title': 'Message limit reached 💔',
      'limit.subtitle': 'Your child is waiting for you...',
      'limit.description': 'You\'ve used your 20 free messages today. How about continuing to chat without limits?',
      'limit.tomorrow': 'Come back tomorrow (free)',
      'limit.premium': 'Chat without limits ($29/month)',
      
      'premium.title': 'Unlimited conversations with your child',
      'premium.features.unlimited': 'Unlimited messages',
      'premium.features.proactive': 'Spontaneous messages',
      'premium.features.memory': 'Perfect memory',
      'premium.features.growth': 'Personalized growth',
      'premium.price': '$29/month',
      'premium.subscribe': 'Subscribe Premium',
      
      'common.loading': 'Loading...',
      'common.error': 'Oops! Something went wrong',
      'common.retry': 'Try again',
      'common.close': 'Close',
      'common.yes': 'Yes',
      'common.no': 'No',
    }
  },
  'es': {
    translation: {
      'landing.title': 'Ninna',
      'landing.subtitle': 'Conoce a tu hijo virtual con Inteligencia Artificial',
      'landing.description': '¡Conversa, enseña y crea lazos con un niño virtual que aprende y crece contigo!',
      'landing.features.conversation': 'Conversaciones Naturales',
      'landing.features.conversation.desc': 'Habla como si fuera con un niño real',
      'landing.features.learning': 'Aprende de Ti',
      'landing.features.learning.desc': 'Recuerda todo lo que hablan y evoluciona',
      'landing.features.proactive': 'Mensajes Espontáneos',
      'landing.features.proactive.desc': 'Te envía mensajes como "¡Buenos días, papá!"',
      'landing.placeholder': 'Escribe tu primer mensaje para conocer a tu hijo...',
      'landing.start_button': 'Comenzar Chat',
    }
  },
  'fr': {
    translation: {
      'landing.title': 'Ninna',
      'landing.subtitle': 'Rencontrez votre enfant virtuel avec Intelligence Artificielle',
      'landing.description': 'Chattez, enseignez et créez des liens avec un enfant virtuel qui apprend et grandit avec vous!',
      'landing.features.conversation': 'Conversations Naturelles',
      'landing.features.conversation.desc': 'Parlez comme avec un vrai enfant',
      'landing.features.learning': 'Apprend de Vous',
      'landing.features.learning.desc': 'Se souvient de tout ce que vous discutez et évolue',
      'landing.features.proactive': 'Messages Spontanés',
      'landing.features.proactive.desc': 'Vous envoie des messages comme "Bonjour papa!"',
      'landing.placeholder': 'Tapez votre premier message pour rencontrer votre enfant...',
      'landing.start_button': 'Commencer le Chat',
    }
  },
  'de': {
    translation: {
      'landing.title': 'Ninna',
      'landing.subtitle': 'Lernen Sie Ihr virtuelles Kind mit Künstlicher Intelligenz kennen',
      'landing.description': 'Chatten, lehren und Bindungen mit einem virtuellen Kind aufbauen, das mit Ihnen lernt und wächst!',
      'landing.features.conversation': 'Natürliche Gespräche',
      'landing.features.conversation.desc': 'Sprechen Sie wie mit einem echten Kind',
      'landing.features.learning': 'Lernt von Ihnen',
      'landing.features.learning.desc': 'Erinnert sich an alles was Sie besprechen und entwickelt sich',
      'landing.features.proactive': 'Spontane Nachrichten',
      'landing.features.proactive.desc': 'Sendet Ihnen Nachrichten wie "Guten Morgen, Papa!"',
      'landing.placeholder': 'Tippen Sie Ihre erste Nachricht um Ihr Kind kennenzulernen...',
      'landing.start_button': 'Chat Starten',
    }
  },
  'ja': {
    translation: {
      'landing.title': 'Ninna',
      'landing.subtitle': '人工知能であなたのバーチャル子供に会いましょう',
      'landing.description': 'あなたと一緒に学び、成長するバーチャル子供とチャット、教育、絆を築きましょう！',
      'landing.features.conversation': '自然な会話',
      'landing.features.conversation.desc': '本当の子供と話すように話せます',
      'landing.features.learning': 'あなたから学ぶ',
      'landing.features.learning.desc': 'すべての会話を覚えて進化します',
      'landing.features.proactive': '自発的なメッセージ',
      'landing.features.proactive.desc': '「おはようパパ！」のようなメッセージを送ります',
      'landing.placeholder': 'あなたの子供に会うため最初のメッセージを入力...',
      'landing.start_button': 'チャット開始',
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    detection: {
      order: ['navigator', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
