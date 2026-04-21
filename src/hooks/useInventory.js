import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useInventory() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true })
    if (error) setError(error.message)
    else { setItems(data || []); setError(null) }
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  const create = async (item) => {
    const payload = { ...item, user_id: user.id }
    const { data, error } = await supabase.from('inventory').insert(payload).select().single()
    if (!error) setItems(prev => [...prev, data].sort((a, b) => a.name?.localeCompare(b.name)))
    return { data, error }
  }

  const update = async (id, updates) => {
    const { data, error } = await supabase.from('inventory').update(updates).eq('id', id).eq('user_id', user.id).select().single()
    if (!error) setItems(prev => prev.map(i => i.id === id ? data : i))
    return { data, error }
  }

  const remove = async (id) => {
    const { error } = await supabase.from('inventory').delete().eq('id', id).eq('user_id', user.id)
    if (!error) setItems(prev => prev.filter(i => i.id !== id))
    return { error }
  }

  const bulkImport = async (rows) => {
    const payload = rows.map(row => ({ ...row, user_id: user.id }))
    const { data, error } = await supabase.from('inventory').insert(payload).select()
    if (!error) setItems(prev => [...prev, ...(data || [])].sort((a, b) => a.name?.localeCompare(b.name)))
    return { data, error }
  }

  return { items, loading, error, create, update, remove, bulkImport, reload: load }
}
