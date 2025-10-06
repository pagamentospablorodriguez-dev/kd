import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { useTranslation } from 'react-i18next';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Crown, 
  Calendar,
  Globe,
  Activity
} from 'lucide-react';

interface AdminAnalyticsProps {
  session: Session;
}

interface AnalyticsData {
  dailyUsers: Array<{ date: string; users: number; messages: number }>;
  userGrowth: Array<{ month: string; total: number; premium: number }>;
  languageDistribution: Array<{ language: string; count: number; percentage: number }>;
  messageStats: {
    totalMessages: number;
    averagePerUser: number;
    peakHour: number;
  };
  conversionRate: number;
  retentionRate: number;
}

const AdminAnalytics = ({ session }: AdminAnalyticsProps) => {
  const { t } = useTranslation();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch daily active users and messages
      const { data: dailyData } = await supabase
        .from('user_analytics')
        .select('date, user_id, messages_in_session')
        .gte('date', getDateRange())
        .order('date', { ascending: true });

      // Fetch user growth data
      const { data: usersData } = await supabase
        .from('users')
        .select('created_at, is_premium, language')
        .gte('created_at', getDateRange());

      // Process daily users and messages
      const dailyUsers = processDailyData(dailyData || []);
      
      // Process user growth
      const userGrowth = processUserGrowth(usersData || []);
      
      // Process language distribution
      const languageDistribution = processLanguageDistribution(usersData || []);

      // Calculate message stats
      const messageStats = await calculateMessageStats();

      // Calculate conversion and retention rates
      const conversionRate = calculateConversionRate(usersData || []);
      const retentionRate = await calculateRetentionRate();

      setAnalytics({
        dailyUsers,
        userGrowth,
        languageDistribution,
        messageStats,
        conversionRate,
        retentionRate
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = () => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString();
  };

  const processDailyData = (data: any[]) => {
    const grouped = data.reduce((acc, item) => {
      const date = item.date;
      if (!acc[date]) {
        acc[date] = { users: new Set(), messages: 0 };
      }
      acc[date].users.add(item.user_id);
      acc[date].messages += item.messages_in_session || 0;
      return acc;
    }, {});

    return Object.entries(grouped).map(([date, stats]: [string, any]) => ({
      date: new Date(date).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
      users: stats.users.size,
      messages: stats.messages
    }));
  };

  const processUserGrowth = (users: any[]) => {
    const monthly = users.reduce((acc, user) => {
      const month = new Date(user.created_at).toLocaleDateString('pt-BR', { 
        year: 'numeric', 
        month: 'short' 
      });
      if (!acc[month]) {
        acc[month] = { total: 0, premium: 0 };
      }
      acc[month].total++;
      if (user.is_premium) acc[month].premium++;
      return acc;
    }, {});

    return Object.entries(monthly).map(([month, stats]: [string, any]) => ({
      month,
      total: stats.total,
      premium: stats.premium
    }));
  };

  const processLanguageDistribution = (users: any[]) => {
    const languages = users.reduce((acc, user) => {
      const lang = user.language || 'pt-BR';
      acc[lang] = (acc[lang] || 0) + 1;
      return acc;
    }, {});

    const total = users.length;
    return Object.entries(languages).map(([language, count]: [string, any]) => ({
      language: getLanguageName(language),
      count,
      percentage: Math.round((count / total) * 100)
    }));
  };

  const getLanguageName = (code: string) => {
    const names: { [key: string]: string } = {
      'pt-BR': 'Português',
      'en': 'English',
      'es': 'Español',
      'fr': 'Français',
      'de': 'Deutsch'
    };
    return names[code] || code;
  };

  const calculateMessageStats = async () => {
    const { data: messages } = await supabase
      .from('messages')
      .select('created_at, user_id')
      .gte('created_at', getDateRange());

    const totalMessages = messages?.length || 0;
    const uniqueUsers = new Set(messages?.map(m => m.user_id)).size;
    const averagePerUser = uniqueUsers > 0 ? Math.round(totalMessages / uniqueUsers) : 0;

    // Calculate peak hour
    const hourCounts = messages?.reduce((acc, msg) => {
      const hour = new Date(msg.created_at).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as { [key: number]: number }) || {};

    const peakHour = Object.entries(hourCounts).reduce((peak, [hour, count]) => 
      count > (hourCounts[peak] || 0) ? parseInt(hour) : peak, 0
    );

    return { totalMessages, averagePerUser, peakHour };
  };

  const calculateConversionRate = (users: any[]) => {
    const total = users.length;
    const premium = users.filter(u => u.is_premium).length;
    return total > 0 ? Math.round((premium / total) * 100) : 0;
  };

  const calculateRetentionRate = async () => {
    // Simplified retention calculation - users active in last 7 days vs last 30 days
    const { data: recent } = await supabase
      .from('user_analytics')
      .select('user_id')
      .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .distinct();

    const { data: older } = await supabase
      .from('user_analytics')
      .select('user_id')
      .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .distinct();

    const recentUsers = recent?.length || 0;
    const olderUsers = older?.length || 0;
    
    return olderUsers > 0 ? Math.round((recentUsers / olderUsers) * 100) : 0;
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Erro ao carregar dados de analytics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h2>
        <div className="flex space-x-2">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {range === '7d' ? '7 dias' : range === '30d' ? '30 dias' : '90 dias'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <MessageSquare className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total de Mensagens</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {analytics.messageStats.totalMessages.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Taxa de Conversão</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {analytics.conversionRate}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Taxa de Retenção</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {analytics.retentionRate}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-orange-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Horário de Pico</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {analytics.messageStats.peakHour}:00
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Activity */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Atividade Diária
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.dailyUsers}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="users" fill="#3b82f6" name="Usuários" />
              <Bar dataKey="messages" fill="#10b981" name="Mensagens" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* User Growth */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Crescimento de Usuários
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.userGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#3b82f6" name="Total" />
              <Line type="monotone" dataKey="premium" stroke="#f59e0b" name="Premium" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Language Distribution */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Distribuição por Idioma
        </h3>
        <div className="flex flex-col lg:flex-row items-center">
          <div className="w-full lg:w-1/2">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.languageDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ language, percentage }) => `${language} (${percentage}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analytics.languageDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full lg:w-1/2 lg:pl-6">
            <div className="space-y-3">
              {analytics.languageDistribution.map((item, index) => (
                <div key={item.language} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded-full mr-3"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {item.language}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {item.count}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                      ({item.percentage}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
