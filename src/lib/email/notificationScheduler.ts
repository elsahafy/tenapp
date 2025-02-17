import { createClient } from '@supabase/supabase-js'
import {
  sendEmail,
  generatePaymentReminderTemplate,
  generateHighPriorityRecommendationTemplate,
  generateBalanceAlertTemplate,
  generateWeeklySummaryTemplate,
} from './emailService'
import { addDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

interface NotificationJob {
  userId: string
  email: string
  type: 'payment' | 'recommendation' | 'balance' | 'summary'
  frequency: 'instant' | 'daily' | 'weekly'
  data: any
}

interface UserSettings {
  user_id: string
  payment_reminders: boolean
  high_priority_recommendations: boolean
  balance_alerts: boolean
  weekly_summary: boolean
  email_frequency: 'instant' | 'daily' | 'weekly'
  user: {
    email: string
  }
}

export async function scheduleNotifications() {
  try {
    // Get all users with their notification preferences
    const { data: rawUsers, error: usersError } = await supabase
      .from('user_notification_settings')
      .select(
        `
        user_id,
        payment_reminders,
        high_priority_recommendations,
        balance_alerts,
        weekly_summary,
        email_frequency,
        user:users (
          email
        )
      `
      )
      .eq('enabled', true)

    if (usersError) throw usersError
    if (!rawUsers) return

    // Transform raw data into UserSettings
    const users: UserSettings[] = rawUsers.map((raw: any) => ({
      user_id: raw.user_id,
      payment_reminders: raw.payment_reminders,
      high_priority_recommendations: raw.high_priority_recommendations,
      balance_alerts: raw.balance_alerts,
      weekly_summary: raw.weekly_summary,
      email_frequency: raw.email_frequency,
      user: {
        email: raw.user?.email
      }
    }))

    const jobs: NotificationJob[] = []

    // Process each user's notifications
    for (const user of users) {
      const userEmail = user.user.email

      // Payment Reminders
      if (user.payment_reminders) {
        const { data: payments, error: paymentsError } = await supabase
          .from('debt_reminders')
          .select(
            `
            id,
            debt:debts(name),
            amount,
            due_date
          `
          )
          .eq('user_id', user.user_id)
          .gte('due_date', new Date().toISOString())
          .lte('due_date', addDays(new Date(), 7).toISOString())
          .eq('notified', false)

        if (paymentsError) throw paymentsError

        payments?.forEach((payment) => {
          jobs.push({
            userId: user.user_id,
            email: userEmail,
            type: 'payment',
            frequency: user.email_frequency,
            data: payment,
          })
        })
      }

      // High Priority Recommendations
      if (user.high_priority_recommendations) {
        const { data: recommendations, error: recommendationsError } =
          await supabase
            .from('debt_recommendations')
            .select('*')
            .eq('user_id', user.user_id)
            .eq('priority', 1)
            .eq('notified', false)

        if (recommendationsError) throw recommendationsError

        recommendations?.forEach((recommendation) => {
          jobs.push({
            userId: user.user_id,
            email: userEmail,
            type: 'recommendation',
            frequency: user.email_frequency,
            data: recommendation,
          })
        })
      }

      // Balance Alerts
      if (user.balance_alerts) {
        const { data: balanceChanges, error: balanceError } = await supabase
          .from('debt_balance_changes')
          .select('*')
          .eq('user_id', user.user_id)
          .eq('notified', false)
          .gt('change_amount', 100) // Only notify for significant changes

        if (balanceError) throw balanceError

        balanceChanges?.forEach((change) => {
          jobs.push({
            userId: user.user_id,
            email: userEmail,
            type: 'balance',
            frequency: user.email_frequency,
            data: change,
          })
        })
      }

      // Weekly Summary
      if (
        user.weekly_summary &&
        user.email_frequency === 'weekly' &&
        new Date().getDay() === 0 // Send on Sundays
      ) {
        const summaryData = await generateWeeklySummaryData(user.user_id)
        jobs.push({
          userId: user.user_id,
          email: userEmail,
          type: 'summary',
          frequency: 'weekly',
          data: summaryData,
        })
      }
    }

    // Process jobs based on frequency
    await processNotificationJobs(jobs)
  } catch (error) {
    console.error('Error scheduling notifications:', error)
  }
}

async function processNotificationJobs(jobs: NotificationJob[]) {
  const now = new Date()
  const today = startOfDay(now)
  const todayEnd = endOfDay(now)

  for (const job of jobs) {
    try {
      let shouldSend = false
      let template

      switch (job.frequency) {
        case 'instant':
          shouldSend = true
          break
        case 'daily':
          // Check if no notification was sent today
          const { data: dailyCheck } = await supabase
            .from('notification_logs')
            .select('id')
            .eq('user_id', job.userId)
            .eq('type', job.type)
            .gte('created_at', today.toISOString())
            .lte('created_at', todayEnd.toISOString())
            .single()

          shouldSend = !dailyCheck
          break
        case 'weekly':
          shouldSend = now.getDay() === 0 // Send on Sundays
          break
      }

      if (shouldSend) {
        switch (job.type) {
          case 'payment':
            template = generatePaymentReminderTemplate(job.data)
            break
          case 'recommendation':
            template = generateHighPriorityRecommendationTemplate(job.data)
            break
          case 'balance':
            template = generateBalanceAlertTemplate(job.data)
            break
          case 'summary':
            template = generateWeeklySummaryTemplate(job.data)
            break
        }

        if (template) {
          const { success } = await sendEmail(job.email, template)

          if (success) {
            // Log the notification
            await supabase.from('notification_logs').insert([
              {
                user_id: job.userId,
                type: job.type,
                email: job.email,
                data: job.data,
              },
            ])

            // Mark the item as notified
            switch (job.type) {
              case 'payment':
                await supabase
                  .from('debt_reminders')
                  .update({ notified: true })
                  .eq('id', job.data.id)
                break
              case 'recommendation':
                await supabase
                  .from('debt_recommendations')
                  .update({ notified: true })
                  .eq('id', job.data.id)
                break
              case 'balance':
                await supabase
                  .from('debt_balance_changes')
                  .update({ notified: true })
                  .eq('id', job.data.id)
                break
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error processing notification job:`, error)
    }
  }
}

async function generateWeeklySummaryData(userId: string) {
  const weekStart = startOfDay(addDays(new Date(), -7))
  const weekEnd = endOfDay(new Date())

  // Get total debt
  const { data: debts } = await supabase
    .from('debts')
    .select('current_balance')
    .eq('user_id', userId)
    .eq('active', true)

  const totalDebt = debts?.reduce(
    (sum, debt) => sum + (debt.current_balance || 0),
    0
  )

  // Get total paid this week
  const { data: payments } = await supabase
    .from('debt_payments')
    .select('amount')
    .eq('user_id', userId)
    .gte('paid_date', weekStart.toISOString())
    .lte('paid_date', weekEnd.toISOString())

  const totalPaid = payments?.reduce(
    (sum, payment) => sum + (payment.amount || 0),
    0
  )

  // Get upcoming payments
  const { data: upcomingPayments } = await supabase
    .from('debt_reminders')
    .select(
      `
      id,
      debt:debts(name),
      amount,
      due_date
    `
    )
    .eq('user_id', userId)
    .gte('due_date', new Date().toISOString())
    .lte('due_date', addDays(new Date(), 14).toISOString())
    .order('due_date', { ascending: true })
    .limit(5)

  // Get new recommendations
  const { data: newRecommendations } = await supabase
    .from('debt_recommendations')
    .select('*')
    .eq('user_id', userId)
    .eq('implemented', false)
    .gte('created_at', weekStart.toISOString())
    .order('priority', { ascending: true })
    .limit(3)

  return {
    total_debt: totalDebt || 0,
    total_paid: totalPaid || 0,
    upcoming_payments: upcomingPayments || [],
    new_recommendations: newRecommendations || [],
  }
}
