import { serve } from 'std/http/server.ts'
import { SmtpClient } from 'smtp/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string
  subject: string
  html: string
}

interface RateLimitEntry {
  timestamp: number
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const client = new SmtpClient()

    // Configure SMTP connection
    await client.connectTLS({
      hostname: Deno.env.get('SMTP_HOSTNAME') || '',
      port: parseInt(Deno.env.get('SMTP_PORT') || '587'),
      username: Deno.env.get('SMTP_USERNAME') || '',
      password: Deno.env.get('SMTP_PASSWORD') || '',
    })

    const { to, subject, html }: EmailRequest = await req.json()

    // Rate limiting check using KV store
    const kvStore = await Deno.openKv()
    const key = ['email-rate-limit', to]
    const now = Date.now()
    const oneHourAgo = now - 3600000 // 1 hour in milliseconds

    // Get recent email count
    const entries = await kvStore.list<RateLimitEntry>({ prefix: key })
    let recentEmails = 0
    
    for await (const entry of entries) {
      if (entry.value.timestamp > oneHourAgo) {
        recentEmails++
      }
    }

    if (recentEmails >= 10) {
      await client.close()
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded. Try again later.',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 429,
        }
      )
    }

    // Record this email send
    await kvStore.set([...key, now], { timestamp: now })

    // Send the email
    await client.send({
      from: Deno.env.get('SMTP_FROM_EMAIL') || '',
      to,
      subject,
      content: html,
      html,
    })

    await client.close()

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email sent successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error sending email:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to send email',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
