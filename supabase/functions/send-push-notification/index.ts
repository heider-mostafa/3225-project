import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PushNotificationRequest {
  userIds?: string[];
  title: string;
  body: string;
  data?: Record<string, any>;
  notificationType: string;
  priority?: number;
}

interface ExpoMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  priority?: 'default' | 'normal' | 'high';
  sound?: 'default';
  badge?: number;
}

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request body
    const requestData: PushNotificationRequest = await req.json()
    const { userIds, title, body, data = {}, notificationType, priority = 2 } = requestData

    console.log('📤 Processing push notification request:', {
      userIds: userIds?.length || 'all users',
      notificationType,
      priority
    })

    // Get active push tokens for specified users or all users
    let tokensQuery = supabase
      .from('push_tokens')
      .select('expo_push_token, user_id')
      .eq('is_active', true)

    if (userIds && userIds.length > 0) {
      tokensQuery = tokensQuery.in('user_id', userIds)
    }

    const { data: tokens, error: tokensError } = await tokensQuery

    if (tokensError) {
      throw new Error(`Failed to fetch push tokens: ${tokensError.message}`)
    }

    if (!tokens || tokens.length === 0) {
      console.log('⚠️ No active push tokens found')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No active push tokens found',
          sent: 0 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check user preferences and quiet hours for each user
    const filteredTokens = []
    
    for (const token of tokens) {
      // Check if user should receive this notification type
      const { data: preferences } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', token.user_id)
        .single()

      if (!preferences) {
        console.log(`⚠️ No preferences found for user ${token.user_id}`)
        continue
      }

      // Check notification type preference
      const typeMapping: Record<string, keyof typeof preferences> = {
        'new_property': 'new_properties',
        'price_change': 'price_changes',
        'inquiry_response': 'inquiry_responses',
        'viewing_reminder': 'viewing_reminders',
        'ai_recommendation': 'ai_recommendations',
        'market_update': 'market_updates',
        'system_notification': 'system_notifications'
      }

      const preferenceKey = typeMapping[notificationType]
      if (preferenceKey && !preferences[preferenceKey]) {
        console.log(`⚠️ User ${token.user_id} has disabled ${notificationType} notifications`)
        continue
      }

      // Check quiet hours
      const { data: inQuietHours } = await supabase
        .rpc('is_user_in_quiet_hours', { user_uuid: token.user_id })

      if (inQuietHours) {
        console.log(`⚠️ User ${token.user_id} is in quiet hours`)
        continue
      }

      // Check daily limit
      const { data: reachedLimit } = await supabase
        .rpc('has_reached_daily_limit', { user_uuid: token.user_id })

      if (reachedLimit) {
        console.log(`⚠️ User ${token.user_id} has reached daily notification limit`)
        continue
      }

      filteredTokens.push(token)
    }

    if (filteredTokens.length === 0) {
      console.log('⚠️ No tokens passed preference/quiet hours/limit checks')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No users eligible for notifications',
          sent: 0 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Build Expo push messages
    const messages: ExpoMessage[] = filteredTokens.map(token => ({
      to: token.expo_push_token,
      title,
      body,
      data: {
        ...data,
        notificationType,
        userId: token.user_id
      },
      priority: priority >= 3 ? 'high' : 'normal',
      sound: 'default',
      badge: 1
    }))

    console.log(`📤 Sending ${messages.length} push notifications to Expo`)

    // Send to Expo Push API
    const expoResponse = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    })

    if (!expoResponse.ok) {
      throw new Error(`Expo API error: ${expoResponse.status} ${expoResponse.statusText}`)
    }

    const expoData = await expoResponse.json()
    console.log('📨 Expo response:', expoData)

    // Store notification history
    const historyRecords = filteredTokens.map((token, index) => {
      const ticket = expoData.data?.[index]
      return {
        recipient_user_id: token.user_id,
        expo_ticket_id: ticket?.id || null,
        title,
        body,
        data: JSON.stringify({
          ...data,
          notificationType,
          userId: token.user_id
        }),
        notification_type: notificationType,
        status: ticket?.status === 'ok' ? 'sent' : 'failed',
        error_message: ticket?.message || null
      }
    })

    const { error: historyError } = await supabase
      .from('notification_history')
      .insert(historyRecords)

    if (historyError) {
      console.error('❌ Failed to store notification history:', historyError)
      // Don't fail the entire request for this
    }

    // Count successful sends
    const successCount = expoData.data?.filter((ticket: any) => ticket.status === 'ok')?.length || 0

    console.log(`✅ Successfully sent ${successCount}/${messages.length} notifications`)

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        total: messages.length,
        details: expoData.data
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Error sending push notifications:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 