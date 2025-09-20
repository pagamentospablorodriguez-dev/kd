import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  'pt-BR': {
    translation: {
      // Landing page
      'landing.title': 'Kid AI',
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
      'landing.title': 'Kid AI',
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
      'limit.description': 'You\'ve used your 20'
