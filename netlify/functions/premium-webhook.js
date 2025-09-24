// Webhook para ativar premium quando pagamento é confirmado - VERSÃO TOTALMENTE CORRIGIDA
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

      // CORREÇÃO PRINCIPAL: Usar service role key adequadamente
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
        
        // CORREÇÃO: Usar rpc() para busca sem problemas de RLS
        try {
          console.log('Trying RPC search first...');
          
          // Primeiro tentar busca direta
          const { data: directSearch, error: directError } = await supabase
            .from('users')
            .select('id, email, name')
            .eq('email', userEmail);
          
          console.log('Direct search result:', { 
            data: directSearch, 
            error: directError,
            count: directSearch?.length || 0 
          });
          
          if (directSearch && directSearch.length > 0) {
            targetUserId = directSearch[0].id;
            console.log('Found user by direct search:', targetUserId, directSearch[0]);
          } else {
            // Tentar busca case-insensitive usando SQL raw
            console.log('Trying case-insensitive search with SQL...');
            
            const { data: sqlSearch, error: sqlError } = await supabase
              .rpc('find_user_by_email', { email_param: userEmail });
            
            console.log('SQL search result:', { data: sqlSearch, error: sqlError });
            
            if (sqlSearch && sqlSearch.length > 0) {
              targetUserId = sqlSearch[0].id;
              console.log('Found user by SQL search:', targetUserId, sqlSearch[0]);
            }
          }
        } catch (searchError) {
          console.error('Error in search methods:', searchError);
          
          // Fallback: tentar sem RLS temporariamente usando service role
          console.log('Fallback: trying admin search...');
          
          try {
            // Desabilitar RLS temporariamente para esta operação
            const { data: adminSearch, error: adminError } = await supabase
              .from('users')
              .select('id, email, name');
            
            console.log('Admin search result:', { 
              data: adminSearch?.length || 0, 
              error: adminError 
            });
            
            if (adminSearch && adminSearch.length > 0) {
              console.log('Users found in admin search:', adminSearch.map(u => ({ email: u.email, name: u.name })));
              
              // Buscar por email exato
              const exactMatch = adminSearch.find(u => u.email === userEmail);
              if (exactMatch) {
                targetUserId = exactMatch.id;
                console.log('Found exact match:', exactMatch);
              } else {
                // Buscar case-insensitive
                const caseInsensitiveMatch = adminSearch.find(u => 
                  u.email.toLowerCase() === userEmail.toLowerCase()
                );
                if (caseInsensitiveMatch) {
                  targetUserId = caseInsensitiveMatch.id;
                  console.log('Found case-insensitive match:', caseInsensitiveMatch);
                }
              }
            }
          } catch (adminError) {
            console.error('Admin search also failed:', adminError);
          }
        }
      }

      if (!targetUserId) {
        console.error('FINAL ERROR: Could not find user with email:', userEmail);
        
        // Tentar criar o usuário como último recurso
        if (userEmail && userName) {
          console.log('LAST RESORT: Creating user since not found');
          
          try {
            // Gerar um ID único para o usuário
            const { data: insertResult, error: insertError } = await supabase.auth.admin.createUser({
              email: userEmail,
              password: 'temp123456', // Password temporária
              email_confirm: true,
              user_metadata: {
                name: userName,
                full_name: userName
              }
            });

            if (insertError) {
              console.error('Error creating auth user:', insertError);
            } else {
              targetUserId = insertResult.user.id;
              console.log('Created new auth user:', targetUserId);
              
              // Criar na tabela users também
              const { error: tableError } = await supabase
                .from('users')
                .insert({
                  id: targetUserId,
                  email: userEmail,
                  name: userName,
                  language: 'pt-BR',
                  timezone: 'America/Sao_Paulo',
                  is_premium: true,
                  premium_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                });
              
              if (tableError) {
                console.error('Error creating user record:', tableError);
              } else {
                console.log('User record created successfully');
              }
            }
          } catch (createError) {
            console.error('Failed to create user as last resort:', createError);
          }
        }
        
        if (!targetUserId) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ 
              error: 'User not found and could not be created',
              details: `Email: ${userEmail}, Name: ${userName}`,
              suggestion: 'User must exist in database before payment'
            })
          };
        }
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
        .select();

      if (updateError) {
        console.error('Error updating user premium status:', updateError);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to update user status: ' + updateError.message })
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
