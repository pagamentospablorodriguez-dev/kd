// Webhook para ativar premium quando pagamento é confirmado - VERSÃO CORRIGIDA FINAL
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
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      console.log('Supabase config:', { 
        url: supabaseUrl ? 'SET' : 'MISSING',
        serviceKey: supabaseServiceKey ? 'SET' : 'MISSING'
      });

      if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Missing Supabase SERVICE_ROLE_KEY configuration');
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Supabase service role key missing - cannot update premium status' })
        };
      }

      // CRÍTICO: Usar APENAS service role key para bypass completo do RLS
      const supabase = createClient(supabaseUrl, supabaseServiceKey, {
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

      // CORREÇÃO CRÍTICA: Usar service role e verificar o resultado
      try {
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

        console.log('User update result:', updatedUser);

        // Verificar se realmente atualizou
        if (!updatedUser || updatedUser.length === 0) {
          console.error('CRITICAL: No user was updated despite using service role');
          
          // Tentar abordagem alternativa: verificar se o usuário existe
          const { data: userCheck, error: checkError } = await supabase
            .from('users')
            .select('id, email, name, is_premium, premium_expires_at')
            .eq('id', targetUserId)
            .single();

          console.log('User existence check:', { data: userCheck, error: checkError });

          if (userCheck) {
            // Usuário existe, mas update não funcionou - possível problema de RLS
            console.error('User exists but update failed - RLS may still be blocking service role');
            return {
              statusCode: 500,
              headers,
              body: JSON.stringify({ 
                error: 'User exists but premium activation failed',
                details: 'RLS policy may be blocking service role access',
                user_found: userCheck
              })
            };
          } else {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ error: 'User not found in database' })
            };
          }
        }

        console.log('✅ Premium activated successfully for user:', targetUserId);
        console.log('Updated user data:', updatedUser[0]);

      } catch (updateException) {
        console.error('Exception during user update:', updateException);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ 
            error: 'Exception during premium activation',
            details: updateException.message
          })
        };
      }

      // Criar registro de assinatura (opcional, não deve falhar o webhook)
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
          });

        if (subscriptionError) {
          console.log('Note: Could not create subscription record:', subscriptionError.message);
          // Não falhar o webhook por causa disso
        } else {
          console.log('Subscription record created successfully');
        }
      } catch (subError) {
        console.log('Subscription table operation failed:', subError.message);
      }

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
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!supabaseUrl || !supabaseServiceKey) {
        console.error('Missing Supabase configuration for cancellation');
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Supabase configuration missing' })
        };
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
