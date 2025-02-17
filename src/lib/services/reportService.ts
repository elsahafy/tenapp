import { supabase } from '@/lib/supabase'
import type { ReportParameters, ReportSchedule, CustomReport } from '@/components/analytics/CustomReporting'

export async function createReport(
  userId: string,
  data: Omit<CustomReport, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<CustomReport> {
  const { data: report, error } = await supabase
    .from('reports')
    .insert([{ ...data, user_id: userId }])
    .select()
    .single()

  if (error) throw error
  return report
}

export async function createSchedule(
  userId: string,
  data: ReportSchedule & { report_id: string }
) {
  const { data: schedule, error } = await supabase
    .from('report_schedules')
    .insert([{ ...data, user_id: userId }])
    .select()
    .single()

  if (error) throw error
  return schedule
}

export async function listReports(userId: string): Promise<CustomReport[]> {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function updateReport(
  userId: string,
  reportId: string,
  updates: Partial<Omit<CustomReport, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
) {
  const { data: report, error } = await supabase
    .from('reports')
    .update(updates)
    .eq('id', reportId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return report
}

export async function deleteReport(userId: string, reportId: string) {
  const { error } = await supabase
    .from('reports')
    .delete()
    .eq('id', reportId)
    .eq('user_id', userId)

  if (error) throw error
}
