import { createClient } from '@supabase/supabase-js'
import { format } from 'date-fns'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

interface EmailTemplate {
  subject: string
  body: string
}

interface DebtPayment {
  name: string
  amount: number
  due_date: Date
}

interface Recommendation {
  title: string
  description: string
  potential_savings: number
}

interface DebtBalance {
  name: string
  previous_balance: number
  current_balance: number
  change: number
}

interface WeeklySummary {
  total_debt: number
  total_paid: number
  upcoming_payments: DebtPayment[]
  new_recommendations: Recommendation[]
}

export async function sendEmail(
  to: string,
  template: EmailTemplate
): Promise<{ success: boolean; error?: string }> {
  try {
    // Using Supabase Edge Functions for email sending
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        to,
        subject: template.subject,
        html: template.body,
      },
    })

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Error sending email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    }
  }
}

export function generatePaymentReminderTemplate(
  payment: DebtPayment
): EmailTemplate {
  return {
    subject: `Payment Reminder: ${payment.name} Due Soon`,
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a56db;">Payment Reminder</h2>
        <p>This is a reminder that your payment for <strong>${
          payment.name
        }</strong> is due on ${format(payment.due_date, 'MMMM d, yyyy')}.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0; color: #374151;">Payment Details</h3>
          <p style="margin: 10px 0;">Amount Due: $${payment.amount.toLocaleString()}</p>
          <p style="margin: 10px 0;">Due Date: ${format(
            payment.due_date,
            'MMMM d, yyyy'
          )}</p>
        </div>
        
        <p>Please ensure you have sufficient funds available for this payment.</p>
        
        <a href="${
          process.env.NEXT_PUBLIC_APP_URL
        }/dashboard/debts" style="display: inline-block; background-color: #1a56db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
          View Payment Details
        </a>
      </div>
    `,
  }
}

export function generateHighPriorityRecommendationTemplate(
  recommendation: Recommendation
): EmailTemplate {
  return {
    subject: 'Important Debt Reduction Opportunity',
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a56db;">New High-Priority Recommendation</h2>
        
        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0; color: #991b1b;">${recommendation.title}</h3>
          <p style="margin: 10px 0;">${recommendation.description}</p>
          <p style="margin: 10px 0; font-weight: bold;">
            Potential Savings: $${recommendation.potential_savings.toLocaleString()}
          </p>
        </div>
        
        <p>Taking action on this recommendation could help you save money and reduce your debt faster.</p>
        
        <a href="${
          process.env.NEXT_PUBLIC_APP_URL
        }/dashboard/debts/recommendations" style="display: inline-block; background-color: #1a56db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
          View Recommendation
        </a>
      </div>
    `,
  }
}

export function generateBalanceAlertTemplate(
  balance: DebtBalance
): EmailTemplate {
  const isIncrease = balance.change > 0
  return {
    subject: `Balance Alert: ${balance.name}`,
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a56db;">Balance Change Alert</h2>
        
        <div style="background-color: ${
          isIncrease ? '#fef2f2' : '#f0fdf4'
        }; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0; color: ${isIncrease ? '#991b1b' : '#166534'};">
            ${balance.name}
          </h3>
          <div style="margin: 15px 0;">
            <p style="margin: 5px 0;">Previous Balance: $${balance.previous_balance.toLocaleString()}</p>
            <p style="margin: 5px 0;">Current Balance: $${balance.current_balance.toLocaleString()}</p>
            <p style="margin: 5px 0; font-weight: bold; color: ${
              isIncrease ? '#991b1b' : '#166534'
            };">
              ${isIncrease ? 'Increase' : 'Decrease'}: $${Math.abs(
      balance.change
    ).toLocaleString()}
            </p>
          </div>
        </div>
        
        <a href="${
          process.env.NEXT_PUBLIC_APP_URL
        }/dashboard/debts" style="display: inline-block; background-color: #1a56db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
          View Account Details
        </a>
      </div>
    `,
  }
}

export function generateWeeklySummaryTemplate(
  summary: WeeklySummary
): EmailTemplate {
  return {
    subject: 'Your Weekly Debt Management Summary',
    body: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a56db;">Weekly Debt Management Summary</h2>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0; color: #374151;">Overview</h3>
          <p style="margin: 10px 0;">Total Debt: $${summary.total_debt.toLocaleString()}</p>
          <p style="margin: 10px 0;">Total Paid This Week: $${summary.total_paid.toLocaleString()}</p>
        </div>
        
        ${
          summary.upcoming_payments.length > 0
            ? `
          <div style="margin: 20px 0;">
            <h3 style="color: #374151;">Upcoming Payments</h3>
            ${summary.upcoming_payments
              .map(
                (payment) => `
              <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 10px 0;">
                <p style="margin: 5px 0;"><strong>${payment.name}</strong></p>
                <p style="margin: 5px 0;">Amount: $${payment.amount.toLocaleString()}</p>
                <p style="margin: 5px 0;">Due: ${format(
                  payment.due_date,
                  'MMMM d, yyyy'
                )}</p>
              </div>
            `
              )
              .join('')}
          </div>
        `
            : ''
        }
        
        ${
          summary.new_recommendations.length > 0
            ? `
          <div style="margin: 20px 0;">
            <h3 style="color: #374151;">New Recommendations</h3>
            ${summary.new_recommendations
              .map(
                (rec) => `
              <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 10px 0;">
                <p style="margin: 5px 0;"><strong>${rec.title}</strong></p>
                <p style="margin: 5px 0;">${rec.description}</p>
                <p style="margin: 5px 0;">Potential Savings: $${rec.potential_savings.toLocaleString()}</p>
              </div>
            `
              )
              .join('')}
          </div>
        `
            : ''
        }
        
        <a href="${
          process.env.NEXT_PUBLIC_APP_URL
        }/dashboard/debts" style="display: inline-block; background-color: #1a56db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
          View Full Details
        </a>
      </div>
    `,
  }
}
