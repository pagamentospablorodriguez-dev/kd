// Webhook para ativar premium quando pagamento é confirmado - VERSÃO CORRIGIDA
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
    const status = webhookData.order_status || webhookData.status;
    const userEmail = webhookData.Customer?.email || webhookData.customer_email;
    const userName = webhookData.Customer?.full_name || webhookData.Customer?.first_name || webhookData.customer_name;
    const userId = webhookData.custom_fields?.user_id || webhookData.metadata?.user_id;
    const subscriptionId = webhookData.subscription_id || webhookData.order_id;

    console.log('Extracted data:', { status, userEmail, userName, userId, subscriptionId });

    // Verificar se o pagamento foi aprovado
    if (status === 'paid' || status === 'completed' || status === 'approved') {
      const { createClient } = require('@supabase/supabase-js');
      
      const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
      
      console.log('Supabase config:', { 
        url: supabaseUrl ? 'SET' : 'MISSING',
        key: supabaseKey ? 'SET' : 'MISSING'
      });

      if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase configuration');
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Supabase configuration missing' })
        };
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      let targetUserId = userId;

      // Se não temos o userId diretamente, tentar encontrar pelo email
      // CORREÇÃO: usar .maybeSingle() ao invés de .single() para evitar erro quando não encontra
      if (!targetUserId && userEmail) {
        console.log('Looking for user by email:', userEmail);
        
        // Primeiro tentar busca exata
        const { data: userByEmail, error: findError } = await supabase
          .from('users')
          .select('id, email, name')
          .eq('email', userEmail)
          .maybeSingle();
        
        if (findError) {
          console.log('Error finding user by email:', findError.message);
        }
        
        if (userByEmail) {
          targetUserId = userByEmail.id;
          console.log('Found user by email:', targetUserId, userByEmail);
        } else {
          // Se não encontrou, tentar busca case-insensitive
          console.log('Trying case-insensitive email search...');
          const { data: allUsers, error: allError } = await supabase
            .from('users')
            .select('id, email, name');
          
          if (!allError && allUsers) {
            const foundUser = allUsers.find(user => 
              user.email.toLowerCase() === userEmail.toLowerCase()
            );
            
            if (foundUser) {
              targetUserId = foundUser.id;
              console.log('Found user by case-insensitive email:', targetUserId, foundUser);
            } else {
              console.log('Available users:', allUsers.map(u => ({ id: u.id, email: u.email, name: u.name })));
            }
          }
        }
        
        // Última tentativa: buscar por nome se o email contém o nome
        if (!targetUserId && userName) {
          console.log('Trying to find user by name:', userName);
          
          const { data: userByName, error: nameError } = await supabase
            .from('users')
            .select('id, email, name')
            .ilike('name', `%${userName.split(' ')[0]}%`)
            .limit(5);
          
          if (!nameError && userByName && userByName.length > 0) {
            console.log('Users found by name similarity:', userByName);
            // Se encontrou apenas um, usar esse
            if (userByName.length === 1) {
              targetUserId = userByName[0].id;
              console.log('Using user found by name similarity:', targetUserId);
            }
          }
        }
      }

      if (!targetUserId) {
        console.error('Could not determine user ID from email:', userEmail, 'or name:', userName);
        console.error('Available search methods exhausted. Please check if user exists in database.');
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: 'User ID not found',
            details: `Could not find user with email: ${userEmail} or name: ${userName}`,
            suggestion: 'Please verify user exists in database before payment'
          })
        };
      }

      // Ativar premium para 30 dias
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      console.log('Activating premium for user:', targetUserId, 'expires:', expiresAt.toISOString());

      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          is_premium: true,
          premium_expires_at: expiresAt.toISOString(),
          daily_message_count: 0, // Reset count
          updated_at: new Date().toISOString()
        })
        .eq('id', targetUserId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating user premium status:', updateError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to update user status' })
        };
      }

      console.log('User updated successfully:', updatedUser);

      // Criar registro de assinatura se a tabela existir
      try {
        const { data: subscriptionResult, error: subscriptionError } = await supabase
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
          })
          .select()
          .single();

        if (subscriptionError) {
          console.error('Error creating subscription record:', subscriptionError);
        } else {
          console.log('Subscription record created:', subscriptionResult);
        }
      } catch (subError) {
        console.log('Subscription table may not exist yet:', subError.message);
      }

      console.log('Premium activated successfully for user:', targetUserId);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          message: 'Premium activated successfully',
          user_id: targetUserId,
          expires_at: expiresAt.toISOString()
        })
      };
    }

    // Handle other status events (cancellation, refund, etc.)
    if (status === 'cancelled' || status === 'refunded' || status === 'chargedback') {
      const { createClient } = require('@supabase/supabase-js');
      
      const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase configuration for cancellation');
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Supabase configuration missing' })
        };
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      let targetUserId = userId;

      if (!targetUserId && userEmail) {
        const { data: userByEmail } = await supabase
          .from('users')
          .select('id')
          .eq('email', userEmail)
          .maybeSingle();
        
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
            premium_expires_at: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', targetUserId);

        // Atualizar status da assinatura se a tabela existir
        try {
          await supabase
            .from('subscriptions')
            .update({
              status: status === 'cancelled' ? 'canceled' : 'expired',
              updated_at: new Date().toISOString()
            })
            .eq('external_subscription_id', subscriptionId);
        } catch (updateError) {
          console.log('Could not update subscription status (table may not exist)');
        }

        console.log('Premium deactivated for user:', targetUserId);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: 'Webhook processed successfully',
        status: status,
        email: userEmail
      })
    };
  } catch (error) {
    console.error('Webhook error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message
      })
    };
  }
};
