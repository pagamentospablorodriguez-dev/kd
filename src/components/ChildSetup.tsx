import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Heart, User, Baby } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { ChildSetupData } from '../types';

interface ChildSetupProps {
  onComplete?: (data: ChildSetupData, newChildId: string) => void;
  onBack?: () => void;
  showBackButton?: boolean;
}

const ChildSetup: React.FC<ChildSetupProps> = ({ onComplete, onBack, showBackButton = false }) => {
  const { t } = useTranslation();
  
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Partial<ChildSetupData>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [step]);

  const steps = [
    { id: 'parent_name', title: t('setup.your_name'), icon: User, field: 'parentName', type: 'text', placeholder: t('setup.name_placeholder') },
    { id: 'parent_gender', title: t('setup.your_gender'), icon: Heart, field: 'parentGender', type: 'select', options: [
        { value: 'male', label: t('setup.male') },
        { value: 'female', label: t('setup.female') }
      ]
    },
    { id: 'child_name', title: t('setup.child_name'), icon: Baby, field: 'childName', type: 'text', placeholder: t('setup.child_name_placeholder') },
    { id: 'child_age', title: t('setup.child_age'), icon: Baby, field: 'childAge', type: 'select', options: Array.from({ length: 14 }, (_, i) => ({
        value: i + 3,
        label: `${i + 3} ${t('setup.age_years')}`
      }))
    },
    { id: 'child_gender', title: t('setup.child_gender'), icon: Heart, field: 'childGender', type: 'select', options: [
        { value: 'male', label: t('setup.boy') },
        { value: 'female', label: t('setup.girl') }
      ]
    }
  ];

  const currentStep = steps[step];

  const handleNext = async () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      setLoading(true);
      setError(null);

      const timeoutId = setTimeout(() => {
        setLoading(false);
        setError('Tempo esgotado. Por favor, tente novamente.');
      }, 15000);

      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          clearTimeout(timeoutId);
          throw new Error('Usuário não encontrado');
        }

        console.log('Creating child for user:', userData.user.id);

        const { data: userResult, error: userError } = await supabase
          .from('users')
          .upsert({
            id: userData.user.id,
            email: userData.user.email!,
            name: data.parentName,
            gender: data.parentGender,
            language: 'pt-BR'
          }, {
            onConflict: 'id'
          })
          .select()
          .single();

        if (userError) {
          clearTimeout(timeoutId);
          throw userError;
        }

        console.log('User upserted:', userResult);

        const { data: childResult, error: childError } = await supabase
          .from('children')
          .insert({
            user_id: userData.user.id,
            name: data.childName,
            age: data.childAge,
            gender: data.childGender
          })
          .select()
          .single();

        clearTimeout(timeoutId);

        if (childError) {
          throw childError;
        }

        console.log('Child created successfully:', childResult);

        if (onComplete) {
          onComplete(data as ChildSetupData, childResult.id);
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        console.error('Error creating child:', err);
        setError(err.message || 'Erro ao criar o filho');
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    } else if (onBack) {
      onBack();
    }
  };

  const handleSelectOption = (value: any) => setData({ ...data, [currentStep.field]: value });
  const handleInputChange = (value: string) => setData({ ...data, [currentStep.field]: value });
  const isStepComplete = () => data[currentStep.field as keyof ChildSetupData] !== undefined;
  const getCurrentValue = () => data[currentStep.field as keyof ChildSetupData];

  const colorScheme = data.childGender === 'female' ? 'pink' : data.childGender === 'male' ? 'blue' : 'purple';
  const getGradientClass = () =>
    colorScheme === 'pink' ? 'from-pink-500 to-rose-500' :
    colorScheme === 'blue' ? 'from-blue-500 to-cyan-500' :
    'from-purple-500 to-pink-500';

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/30 to-gray-100/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
        {(showBackButton || step > 0) && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={handleBack}
            disabled={loading}
            className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{t('setup.back')}</span>
          </motion.button>
        )}

        <div className="mb-8">
          <div className="flex items-center justify-center mb-4">
            <span className="text-sm text-gray-500">{step + 1} de {steps.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div 
              className={`h-2 rounded-full bg-gradient-to-r ${getGradientClass()}`} 
              initial={{ width: 0 }} 
              animate={{ width: `${((step + 1) / steps.length) * 100}%` }} 
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>

        <motion.div 
          key={step} 
          initial={{ opacity: 0, x: 20 }} 
          animate={{ opacity: 1, x: 0 }} 
          exit={{ opacity: 0, x: -20 }} 
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200/50 dark:border-gray-700/50"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <img src="/ninna.png" alt="Ninna" className="w-full h-full object-contain" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{currentStep.title}</h2>
          </div>

          {currentStep.type === 'text' && (
            <div className="mb-6">
              <input
                type="text"
                placeholder={currentStep.placeholder}
                value={getCurrentValue() as string || ''}
                onChange={(e) => handleInputChange(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-4 text-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors text-center disabled:opacity-50"
                autoFocus
              />
            </div>
          )}

          {currentStep.type === 'select' && (
            <div className="grid gap-3 mb-6">
              {currentStep.options?.map(option => (
                <motion.button
                  key={option.value}
                  onClick={() => handleSelectOption(option.value)}
                  disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  className={`p-4 border-2 rounded-xl text-lg font-semibold transition-all disabled:opacity-50 ${
                    getCurrentValue() === option.value
                      ? `bg-gradient-to-r ${getGradientClass()} text-white border-transparent shadow-lg`
                      : `border-gray-200 hover:border-gray-300 text-gray-700 dark:text-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700`
                  }`}
                >
                  {option.label}
                </motion.button>
              ))}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <motion.button
            onClick={handleNext}
            disabled={!isStepComplete() || loading}
            whileHover={{ scale: isStepComplete() && !loading ? 1.02 : 1 }}
            whileTap={{ scale: isStepComplete() && !loading ? 0.98 : 1 }}
            className={`w-full py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 ${
              isStepComplete() && !loading
                ? `bg-gradient-to-r ${getGradientClass()} text-white shadow-lg hover:shadow-xl`
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {step === steps.length - 1
              ? loading
                ? (
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                    <span>{t('setup.creating')}</span>
                  </div>
                )
                : t('setup.meet_child')
              : t('setup.continue')}
            {!loading && <ArrowRight className="w-5 h-5" />}
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ChildSetup;
