import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/types/database'

type Tables = Database['public']['Tables']
type Report = Tables['reports']['Row']
type ReportSchedule = Tables['report_schedules']['Row']
type ReportTemplate = Tables['report_templates']['Row']
type CustomReport = Tables['custom_reports']['Row']

export class ReportingService {
  async generateReport(
    userId: string,
    template: ReportTemplate,
    parameters: any
  ): Promise<Report> {
    const { data: report, error } = await supabase.rpc('generate_report', {
      p_user_id: userId,
      p_template: template,
      p_parameters: parameters
    })

    if (error) throw error
    return report
  }

  async getReportTemplates(): Promise<ReportTemplate[]> {
    const { data: templates, error } = await supabase
      .from('report_templates')
      .select('*')

    if (error) throw error
    return templates || []
  }

  async createReportSchedule(
    userId: string,
    reportId: string,
    schedule: Omit<ReportSchedule, 'id' | 'report_id' | 'last_run' | 'next_run'>
  ): Promise<ReportSchedule> {
    const { data: reportSchedule, error } = await supabase
      .from('report_schedules')
      .insert({
        report_id: reportId,
        user_id: userId,
        ...schedule
      })
      .select()
      .single()

    if (error) throw error
    if (!reportSchedule) throw new Error('Failed to create report schedule')
  
    return reportSchedule
  }

  async updateReportSchedule(
    scheduleId: string,
    updates: Partial<ReportSchedule>
  ): Promise<void> {
    const { error } = await supabase
      .from('report_schedules')
      .update(updates)
      .eq('id', scheduleId)

    if (error) throw error
  }

  async deleteReportSchedule(scheduleId: string): Promise<void> {
    const { error } = await supabase
      .from('report_schedules')
      .delete()
      .eq('id', scheduleId)

    if (error) throw error
  }

  async getReportHistory(userId: string): Promise<Report[]> {
    const { data: reports, error } = await supabase
      .from('reports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return reports || []
  }

  async createCustomReport(
    userId: string,
    report: Omit<CustomReport, 'id' | 'created_at' | 'updated_at'>
  ): Promise<CustomReport> {
    const { data: customReport, error } = await supabase
      .from('custom_reports')
      .insert({
        user_id: userId,
        ...report
      })
      .select()
      .single()

    if (error) throw error
    if (!customReport) throw new Error('Failed to create custom report')
  
    return customReport
  }

  async updateCustomReport(
    reportId: string,
    updates: Partial<CustomReport>
  ): Promise<void> {
    const { error } = await supabase
      .from('custom_reports')
      .update(updates)
      .eq('id', reportId)

    if (error) throw error
  }

  async deleteCustomReport(reportId: string): Promise<void> {
    const { error } = await supabase
      .from('custom_reports')
      .delete()
      .eq('id', reportId)

    if (error) throw error
  }
}
