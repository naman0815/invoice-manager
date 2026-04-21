import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useSettings() {
  const { user } = useAuth()
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase.from('settings').select('*').eq('user_id', user.id).maybeSingle()
    if (!error) setSettings(data)
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  const save = async (updates) => {
    const payload = { ...updates, user_id: user.id }
    const { data, error } = await supabase.from('settings').upsert(payload).select().single()
    if (!error) setSettings(data)
    return { data, error }
  }

  return { settings, loading, save, reload: load }
}
