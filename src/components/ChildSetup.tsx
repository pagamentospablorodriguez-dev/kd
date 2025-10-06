import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Baby, User, Calendar, Smile, Heart, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface ChildSetupProps {
  session: Session;
}

const ChildSetup = ({ session }: ChildSetupProps) => {
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [personalityTraits, setPersonalityTraits] = useState<string[]>([]);
  const [favoriteThings, setFavoriteThings] = useState<string[]>([]);
  const [birthday, setBirthday] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    window.scrollTo(0, 0); // Garante que a página inicie no topo
  }, []);

  const handleAddTrait = (trait: string) => {
    if (!personalityTraits.includes(trait)) {
      setPersonalityTraits([...personalityTraits, trait]);
    } else {
      setPersonalityTraits(personalityTraits.filter((t) => t !== trait));
    }
  };

  const handleAddFavoriteThing = (thing: string) => {
    if (!favoriteThings.includes(thing)) {
      setFavoriteThings([...favoriteThings, thing]);
    } else {
      setFavoriteThings(favoriteThings.filter((t) => t !== thing));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!name || !gender || !age) {
      toast.error(t('childSetup.validationError'));
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('children')
        .insert({
          user_id: session.user.id,
          name,
          gender,
          age,
          personality_traits: personalityTraits,
          favorite_things: favoriteThings,
          birthday: birthday || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(t('childSetup.success'));
      navigate(`/chat/${data.id}`); // Redireciona para o chat com o novo filho
    } catch (error: any) {
      console.error('Error creating child:', error);
      toast.error(error.message || t('childSetup.error'));
    } finally {
      setLoading(false);
    }
  };

  const commonPersonalityTraits = [
    t('childSetup.traitCurious'),
    t('childSetup.traitCreative'),
    t('childSetup.traitShy'),
    t('childSetup.traitEnergetic'),
    t('childSetup.traitCalm'),
    t('childSetup.traitAdventurous'),
    t('childSetup.traitKind'),
    t('childSetup.traitPlayful'),
  ];

  const commonFavoriteThings = [
    t('childSetup.thingDrawing'),
    t('childSetup.thingReading'),
    t('childSetup.thingSports'),
    t('childSetup.thingMusic'),
    t('childSetup.thingGames'),
    t('childSetup.thingAnimals'),
    t('childSetup.thingNature'),
    t('childSetup.thingCooking'),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-8 flex flex-col items-center">
      <div className="w-full max-w-3xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 sm:p-10 relative">
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
        >
          <ArrowLeft size={28} />
        </button>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-center text-gray-900 dark:text-white mb-8 sm:mb-12">
          {t('childSetup.title')}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-gray-50 dark:bg-gray-700 p-5 rounded-lg shadow-inner">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center">
              <Baby className="mr-2 text-primary-600" /> {t('childSetup.basicInfo')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('childSetup.nameLabel')}
                </label>
                <input
                  type="text"
                  id="name"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-900 dark:text-white"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('childSetup.namePlaceholder')}
                  required
                />
              </div>
              <div>
                <label htmlFor="age" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('childSetup.ageLabel')}
                </label>
                <input
                  type="number"
                  id="age"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-900 dark:text-white"
                  value={age}
                  onChange={(e) => setAge(parseInt(e.target.value) || '')}
                  placeholder={t('childSetup.agePlaceholder')}
                  min="3"
                  max="16"
                  required
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('childSetup.genderLabel')}
              </label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={gender === 'male'}
                    onChange={(e) => setGender(e.target.value)}
                    className="form-radio h-4 w-4 text-primary-600"
                    required
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">{t('childSetup.genderMale')}</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={gender === 'female'}
                    onChange={(e) => setGender(e.target.value)}
                    className="form-radio h-4 w-4 text-primary-600"
                    required
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">{t('childSetup.genderFemale')}</span>
                </label>
              </div>
            </div>
            <div className="mt-4">
              <label htmlFor="birthday" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('childSetup.birthdayLabel')}
              </label>
              <input
                type="date"
                id="birthday"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-900 dark:text-white"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
              />
            </div>
          </div>

          {/* Personality Traits */}
          <div className="bg-gray-50 dark:bg-gray-700 p-5 rounded-lg shadow-inner">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center">
              <Smile className="mr-2 text-primary-600" /> {t('childSetup.personalityTraits')}
            </h2>
            <div className="flex flex-wrap gap-2">
              {commonPersonalityTraits.map((trait) => (
                <button
                  key={trait}
                  type="button"
                  onClick={() => handleAddTrait(trait)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${personalityTraits.includes(trait)
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500'
                    }`}
                >
                  {trait}
                </button>
              ))}
            </div>
          </div>

          {/* Favorite Things */}
          <div className="bg-gray-50 dark:bg-gray-700 p-5 rounded-lg shadow-inner">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center">
              <Heart className="mr-2 text-primary-600" /> {t('childSetup.favoriteThings')}
            </h2>
            <div className="flex flex-wrap gap-2">
              {commonFavoriteThings.map((thing) => (
                <button
                  key={thing}
                  type="button"
                  onClick={() => handleAddFavoriteThing(thing)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${favoriteThings.includes(thing)
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500'
                    }`}
                >
                  {thing}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300 transform hover:scale-105"
            disabled={loading}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            ) : (
              <><Star className="mr-3" size={24} /> {t('childSetup.createChildButton')}</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChildSetup;
