import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useCustomers() {
  const { user } = useAuth()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true })
    if (error) setError(error.message)
    else { setCustomers(data || []); setError(null) }
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  const create = async (customer) => {
    const payload = { ...customer, user_id: user.id }
    const { data, error } = await supabase.from('customers').insert(payload).select().single()
    if (!error) setCustomers(prev => [...prev, data].sort((a, b) => a.name?.localeCompare(b.name)))
    return { data, error }
  }

  const update = async (id, updates) => {
    const { data, error } = await supabase.from('customers').update(updates).eq('id', id).eq('user_id', user.id).select().single()
    if (!error) setCustomers(prev => prev.map(c => c.id === id ? data : c))
    return { data, error }
  }

  const remove = async (id) => {
    const { error } = await supabase.from('customers').delete().eq('id', id).eq('user_id', user.id)
    if (!error) setCustomers(prev => prev.filter(c => c.id !== id))
    return { error }
  }

  const bulkImport = async (rows) => {
    const payload = rows.map(r => ({ ...r, user_id: user.id }))
    const { data, error } = await supabase.from('customers').insert(payload).select()
    if (!error) setCustomers(prev => [...prev, ...(data || [])].sort((a, b) => a.name?.localeCompare(b.name)))
    return { data, error }
  }

  return { customers, loading, error, create, update, remove, bulkImport, reload: load }
}

