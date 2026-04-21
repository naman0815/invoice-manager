import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useInvoices() {
  const { user } = useAuth()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', user.id)
      .order('invoice_date', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else { setInvoices(data || []); setError(null) }
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  const create = async (invoice) => {
    const payload = { ...invoice, user_id: user.id }
    const { data, error } = await supabase.from('invoices').insert(payload).select().single()
    if (!error) setInvoices(prev => [data, ...prev])
    return { data, error }
  }

  const update = async (id, updates) => {
    const { data, error } = await supabase.from('invoices').update(updates).eq('id', id).eq('user_id', user.id).select().single()
    if (!error) setInvoices(prev => prev.map(inv => inv.id === id ? data : inv))
    return { data, error }
  }

  const remove = async (id) => {
    const { error } = await supabase.from('invoices').delete().eq('id', id).eq('user_id', user.id)
    if (!error) setInvoices(prev => prev.filter(inv => inv.id !== id))
    return { error }
  }

  /**
   * Get next B2C sequence number for current year+month
   */
  const getNextB2CSeq = useCallback(async (date = new Date()) => {
    if (!user) return 1
    const month = date.getMonth() + 1
    const year = date.getFullYear()
    const yearStr = String(year).slice(-2)
    const { count } = await supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('invoice_type', 'B2C')
      .like('invoice_number', `%${month}${yearStr}`)
    return (count || 0) + 1
  }, [user])

  /**
   * Get next B2B sequence number for current year
   */
  const getNextB2BSeq = useCallback(async (date = new Date()) => {
    if (!user) return 1
    const yearStr = String(date.getFullYear()).slice(-2)
    const { count } = await supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('invoice_type', 'B2B')
      .like('invoice_number', `${yearStr}/%`)
    return (count || 0) + 1
  }, [user])

  // Stats
  const getStats = useCallback(async () => {
    if (!user) return {}
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    
    const [monthRes, allRes] = await Promise.all([
      supabase.from('invoices').select('total, status').eq('user_id', user.id).gte('created_at', startOfMonth),
      supabase.from('invoices').select('total, status').eq('user_id', user.id)
    ])

    const monthData = monthRes.data || []
    const allData = allRes.data || []

    const monthRevenue = monthData.filter(i => i.status !== 'cancelled').reduce((s, i) => s + (i.total || 0), 0)
    const allRevenue = allData.filter(i => i.status !== 'cancelled').reduce((s, i) => s + (i.total || 0), 0)
    const paid = allData.filter(i => i.status === 'paid').length
    const pending = allData.filter(i => ['draft', 'sent'].includes(i.status)).length

    return { monthRevenue, allRevenue, paid, pending, total: allData.length }
  }, [user])


  const bulkImport = async (rows) => {
    const payloads = rows.map(r => ({ ...r, user_id: user.id }))
    const { data, error } = await supabase.from('invoices').insert(payloads).select()
    if (!error) load()
    return { data, error }
  }

  return { invoices, loading, error, create, update, remove, bulkImport, reload: load, getNextB2CSeq, getNextB2BSeq, getStats }
}
