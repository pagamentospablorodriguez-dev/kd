// Webhook para ativar premium quando pagamento é confirmado
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
    // Parse webhook data (format will depend on payment provider)
    const webhookData = JSON.parse(event.body);
    
    // Extract user information (this will depend on your payment setup)
    const userId = webhookData.custom_fields?.user_id || webhookData.metadata?.user_id;
    const status = webhookData.status || webhookData.payment_status;
    
    if (!userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'User ID not found in webhook' })
      };
    }

    if (status === 'completed' || status === 'paid') {
      // Activate premium for user
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
      );

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now

      const { error } = await supabase
        .from('users')
        .update({
          is_premium: true,
          premium_expires_at: expiresAt.toISOString(),
          daily_message_count: 0 // Reset count
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user premium status:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to update user status' })
        };
      }

      // Create subscription record
      await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          status: 'active',
          plan_type: 'premium',
          amount: 29.00,
          currency: 'BRL',
          started_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          external_subscription_id: webhookData.id || webhookData.payment_id
        });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Premium activated successfully' })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Webhook received but no action taken' })
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
