// Webhook para ativar premium quando pagamento é confirmado - VERSÃO FINAL CORRIGIDA
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
    
    // NOVO: Tentar extrair userId dos parâmetros de tracking
    let userId = webhookData.custom_fields?.user_id || webhookData.metadata?.user_id;
    
    // Verificar nos TrackingParameters também
    if (!userId && webhookData.TrackingParameters) {
      userId = webhookData.TrackingParameters.s1 || 
               webhookData.TrackingParameters.s2 || 
               webhookData.TrackingParameters.s3 ||
               webhookData.TrackingParameters.utm_content;
    }
    
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

      // Usar service role key para bypass RLS
      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });

      let targetUserId = userId;

      // Se não temos o userId diretamente, tentar encontrar pelo email
      if (!targetUserId && userEmail) {
        console.log('Looking for user by email:', userEmail);
        
        try {
          console.log('Using RPC function to find user...');
          const { data: rpcResult, error: rpcError } = await supabase
            .rpc('find_user_by_email_for_webhook', { email_param: userEmail });
          
          console.log('RPC search result:', { 
            data: rpcResult, 
            error: rpcError,
            count: rpcResult?.length || 0 
          });
          
          if (rpcResult && rpcResult.length > 0) {
            targetUserId = rpcResult[0].id;
            console.log('Found user via RPC:', targetUserId, rpcResult[0]);
          }
        } catch (searchError) {
          console.error('Error in user search:', searchError);
        }
      }

      if (!targetUserId) {
        console.error('FINAL ERROR: Could not find user with email:', userEmail);
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: 'User not found',
            details: `Email: ${userEmail}, Name: ${userName}`,
            suggestion: 'User must exist in database before payment. Please check if the user is registered.'
          })
        };
      }

      // Ativar premium para 30 dias
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      console.log('Activating premium for user:', targetUserId, 'expires:', expiresAt.toISOString());

      // CORREÇÃO PRINCIPAL: Usar service role adequadamente e verificar se update funcionou
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          is_premium: true,
          premium_expires_at: expiresAt.toISOString(),
          daily_message_count: 0, // Reset count
          updated_at: new Date().toISOString()
        })
        .eq('id', targetUserId)
        .select('id, email, name, is_premium, premium_expires_at');

      if (updateError) {
        console.error('Error updating user premium status:', updateError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to update user status: ' + updateError.message })
        };
      }

      console.log('User updated successfully:', updatedUser);

      // Verificar se realmente atualizou
      if (!updatedUser || updatedUser.length === 0) {
        console.error('No user was updated - possible RLS issue');
        
        // Tentar novamente com uma abordagem diferente
        try {
          const { data: directUpdate, error: directError } = await supabase
            .from('users')
            .update({
              is_premium: true,
              premium_expires_at: expiresAt.toISOString(),
              daily_message_count: 0,
              updated_at: new Date().toISOString()
            })
            .eq('id', targetUserId);

          console.log('Direct update attempt:', { data: directUpdate, error: directError });
        } catch (retryError) {
          console.error('Retry update failed:', retryError);
        }
      }

      // Criar registro de assinatura - CORRIGIR RLS
      try {
        // Primeiro, tentar inserir com service role
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
          });

        if (subscriptionError) {
          console.error('Error creating subscription record:', subscriptionError);
          // Não falhar o webhook por causa disso
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
          expires_at: expiresAt.toISOString(),
          updated_user: updatedUser
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
        // Usar a função RPC para encontrar usuário
        const { data: rpcResult } = await supabase
          .rpc('find_user_by_email_for_webhook', { email_param: userEmail });
        
        if (rpcResult && rpcResult.length > 0) {
          targetUserId = rpcResult[0].id;
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
