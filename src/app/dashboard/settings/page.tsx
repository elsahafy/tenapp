'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useUser } from '@/lib/hooks/useUser'
import { supabase } from '@/lib/supabase'
import { currencies } from '@/lib/constants/currencies'
import type { Database } from '@/types/supabase'
import Image from 'next/image'

type Profile = Database['public']['Tables']['profiles']['Row']

export default function SettingsPage() {
  const { user } = useUser()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [uploading, setUploading] = useState(false)

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    avatar_url: '',
    preferred_currency: 'USD' as const,
  })

  useEffect(() => {
    if (user) {
      loadProfile()
    }
  }, [user])

  const loadProfile = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error

      if (data) {
        setProfile(data)
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: data.email,
          avatar_url: data.avatar_url || '',
          preferred_currency: data.preferred_currency || 'USD',
        })
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      setMessage({ type: 'error', text: 'Failed to load profile. Please try again.' })
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      setMessage(null)

      if (!e.target.files || e.target.files.length === 0) {
        throw new Error('You must select an image to upload.')
      }

      const file = e.target.files[0]
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        throw new Error('File size must be less than 10MB')
      }

      const fileExt = file.name.split('.').pop()?.toLowerCase()
      if (!fileExt || !['jpg', 'jpeg', 'png', 'gif'].includes(fileExt)) {
        throw new Error('File must be an image (JPG, PNG, or GIF)')
      }

      const fileName = `avatar-${Date.now()}.${fileExt}`
      const filePath = `${user?.id}/${fileName}`

      // Upload the file to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { 
          upsert: true,
          contentType: `image/${fileExt}`
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw new Error('Error uploading image. Please try again.')
      }

      if (!uploadData?.path) {
        throw new Error('Upload failed. No path returned.')
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(uploadData.path)

      if (!urlData?.publicUrl) {
        throw new Error('Could not get public URL for uploaded image.')
      }

      // Update the profile with the new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: urlData.publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id)

      if (updateError) {
        console.error('Profile update error:', updateError)
        throw new Error('Error updating profile. Please try again.')
      }

      setFormData(prev => ({ ...prev, avatar_url: urlData.publicUrl }))
      setMessage({ type: 'success', text: 'Avatar updated successfully!' })
    } catch (error) {
      console.error('Error uploading avatar:', error)
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Error uploading avatar. Please try again.' 
      })
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          avatar_url: formData.avatar_url,
          preferred_currency: formData.preferred_currency,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error

      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      loadProfile()
    } catch (error) {
      console.error('Error updating profile:', error)
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Settings</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <h2 className="text-lg font-medium text-[var(--text-primary)]">Profile Information</h2>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  Update your personal information and preferences
                </p>
              </div>

              <div className="flex items-center space-x-6">
                <div className="relative h-24 w-24 rounded-full overflow-hidden bg-[var(--background-secondary)]">
                  {formData.avatar_url ? (
                    <Image
                      src={formData.avatar_url}
                      alt="Avatar"
                      className="h-full w-full object-cover"
                      width={96}
                      height={96}
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-[var(--text-secondary)]">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block">
                    <span className="sr-only">Choose profile photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      disabled={uploading}
                      className="block w-full text-sm text-[var(--text-secondary)]
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-primary-50 file:text-primary-700
                        hover:file:bg-primary-100
                        disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </label>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    {uploading ? 'Uploading...' : 'PNG, JPG, GIF up to 10MB'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-[var(--text-primary)]">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    id="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border border-[var(--border-primary)] bg-[var(--background-primary)] px-3 py-2 text-[var(--text-primary)] shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-[var(--text-primary)]">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    id="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border border-[var(--border-primary)] bg-[var(--background-primary)] px-3 py-2 text-[var(--text-primary)] shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[var(--text-primary)]">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border border-[var(--border-primary)] bg-[var(--background-primary)] px-3 py-2 text-[var(--text-primary)] shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="preferred_currency" className="block text-sm font-medium text-[var(--text-primary)]">
                    Preferred Currency
                  </label>
                  <select
                    name="preferred_currency"
                    id="preferred_currency"
                    value={formData.preferred_currency}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border border-[var(--border-primary)] bg-[var(--background-primary)] px-3 py-2 text-[var(--text-primary)] shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:text-sm"
                  >
                    {currencies.map(currency => (
                      <option key={currency.code} value={currency.code}>
                        {currency.code} - {currency.name} ({currency.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {message && (
                <div className={`rounded-md p-4 ${
                  message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                  <p className="text-sm">{message.text}</p>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={loading}
                  className="inline-flex justify-center"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
