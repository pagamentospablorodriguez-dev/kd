// Webhook para ativar premium quando pagamento é confirmado - CONFIGURAÇÃO PARA KIWIFY
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    console.log('Webhook received:', event.body);
    
    // Parse webhook data from Kiwify
    const webhookData = JSON.parse(event.body);
    
    console.log('Webhook data parsed:', webhookData);

    // Extract information from Kiwify webhook
    // Adapte esses campos conforme a estrutura do webhook da Kiwify
    const status = webhookData.order_status || webhookData.status;
    const userEmail = webhookData.Customer?.email || webhookData.customer_email;
    const userId = webhookData.custom_fields?.user_id || webhookData.metadata?.user_id;
    const subscriptionId = webhookData.subscription_id || webhookData.order_id;
    
    console.log('Extracted data:', { status, userEmail, userId, subscriptionId });

    // Verificar se o pagamento foi aprovado
    if (status === 'paid' || status === 'completed' || status === 'approved') {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
      );

      let targetUserId = userId;

      // Se não temos o userId diretamente, tentar encontrar pelo email
      if (!targetUserId && userEmail) {
        console.log('Looking for user by email:', userEmail);
        const { data: userByEmail } = await supabase
          .from('users')
          .select('id')
          .eq('email', userEmail)
          .single();
        
        if (userByEmail) {
          targetUserId = userByEmail.id;
          console.log('Found user by email:', targetUserId);
        }
      }

      if (!targetUserId) {
        console.error('Could not determine user ID');
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'User ID not found' })
        };
      }

      // Ativar premium para 30 dias
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      console.log('Activating premium for user:', targetUserId);

      const { error: updateError } = await supabase
        .from('users')
        .update({
          is_premium: true,
          premium_expires_at: expiresAt.toISOString(),
          daily_message_count: 0 // Reset count
        })
        .eq('id', targetUserId);

      if (updateError) {
        console.error('Error updating user premium status:', updateError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to update user status' })
        };
      }

      // Criar registro de assinatura
      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: targetUserId,
          status: 'active',
          plan_type: 'premium',
          amount: 29.00,
          currency: 'BRL',
          started_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          payment_provider: 'kiwify',
          external_subscription_id: subscriptionId
        });

      if (subscriptionError) {
        console.error('Error creating subscription record:', subscriptionError);
      }

      console.log('Premium activated successfully for user:', targetUserId);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Premium activated successfully' })
      };
    }

    // Handle other status events (cancellation, refund, etc.)
    if (status === 'cancelled' || status === 'refunded' || status === 'chargeback') {
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
      );

      let targetUserId = userId;

      if (!targetUserId && userEmail) {
        const { data: userByEmail } = await supabase
          .from('users')
          .select('id')
          .eq('email', userEmail)
          .single();
        
        if (userByEmail) {
          targetUserId = userByEmail.id;
        }
      }

      if (targetUserId) {
        console.log('Deactivating premium for user:', targetUserId);

        // Desativar premium
        await supabase
          .from('users')
          .update({
            is_premium: false,
            premium_expires_at: null
          })
          .eq('id', targetUserId);

        // Atualizar status da assinatura
        await supabase
          .from('subscriptions')
          .update({
            status: status === 'cancelled' ? 'canceled' : 'expired'
          })
          .eq('external_subscription_id', subscriptionId);

        console.log('Premium deactivated for user:', targetUserId);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Webhook processed successfully' })
    };

  } catch (error) {
    console.error('Webhook error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
