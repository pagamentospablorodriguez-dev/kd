const { createClient } = require('@supabase/supabase-js');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Inicializar Supabase Admin Client
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async function(event, context) {
  const { headers, body } = event;

  try {
    let eventData;
    let provider;

    // Identificar o provedor pelo header ou payload
    if (headers['stripe-signature']) {
      provider = 'stripe';
      const sig = headers['stripe-signature'];
      eventData = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } else if (JSON.parse(body).prod_name) { // Kiwify tem 'prod_name' no payload
      provider = 'kiwify';
      eventData = JSON.parse(body);
    } else {
      throw new Error('Unknown webhook provider');
    }

    console.log(`Processing webhook from ${provider}...`);

    let userId, userEmail, subscriptionStatus, expiresAt;

    if (provider === 'stripe') {
      const session = eventData.data.object;
      if (eventData.type === 'checkout.session.completed') {
        userId = session.client_reference_id;
        userEmail = session.customer_details.email;
        subscriptionStatus = 'active';
        // Lógica para calcular a data de expiração (ex: 1 mês a partir de agora)
        expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      }
    } else if (provider === 'kiwify') {
      // Kiwify envia 'order_status' como 'paid', 'waiting', 'refused', etc.
      if (eventData.order_status === 'paid') {
        userEmail = eventData.customer.email;
        // No Kiwify, o client_reference_id pode não estar disponível diretamente.
        // Precisamos buscar o usuário pelo email.
        const { data: userData, error: userError } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('email', userEmail)
          .single();

        if (userError || !userData) {
          throw new Error(`User not found for email: ${userEmail}`);
        }
        userId = userData.id;
        subscriptionStatus = 'active';
        expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      }
    }

    if (userId && subscriptionStatus === 'active') {
      console.log(`Updating user ${userId} to premium.`);

      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ 
          is_premium: true,
          premium_expires_at: expiresAt.toISOString(),
        })
        .eq('id', userId);

      if (updateError) {
        throw new Error(`Supabase update error: ${updateError.message}`);
      }

      // Opcional: Registrar a assinatura na tabela 'subscriptions'
      await supabaseAdmin.from('subscriptions').insert({
        user_id: userId,
        status: 'active',
        plan_type: 'premium',
        expires_at: expiresAt.toISOString(),
        payment_provider: provider,
        external_subscription_id: provider === 'stripe' ? eventData.data.object.subscription : eventData.order_id,
      });

      console.log(`User ${userId} successfully updated to premium.`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true, provider }),
    };

  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return {
      statusCode: 400,
      body: `Webhook Error: ${err.message}`,
    };
  }
};
