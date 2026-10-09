'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { showToast } from '@/lib/ui/toast'

interface UseResourceOptions {
  enabled?: boolean
  onSuccess?: (data: any) => void
  onError?: (error: string) => void
}

interface ResourceState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

const inFlightCache = new Map<string, Promise<any>>()

export function useResource<T = any>(
  endpoint: string | null,
  options: UseResourceOptions = {}
) {
  const [state, setState] = useState<ResourceState<T>>({
    data: null,
    loading: !!endpoint,
    error: null,
  })
  const fetchedRef = useRef(false)

  const fetchData = useCallback(async () => {
    if (!endpoint) return

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      if (!inFlightCache.has(endpoint)) {
        const promise = fetch(endpoint).then(async res => {
          if (!res.ok) {
            const body = await res.json().catch(() => ({}))
            throw new Error(body.error || `HTTP ${res.status}`)
          }
          return res.json()
        })
        inFlightCache.set(endpoint, promise)
        promise.finally(() => inFlightCache.delete(endpoint))
      }

      const result = await inFlightCache.get(endpoint)!
      const data = (result.data ?? result) as T

      setState({ data, loading: false, error: null })
      options.onSuccess?.(data)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      setState(prev => ({ ...prev, loading: false, error: msg }))
      showToast('error', 'Request failed', msg)
      options.onError?.(msg)
    }
  }, [endpoint])

  useEffect(() => {
    if (!endpoint || options.enabled === false) return
    if (fetchedRef.current) return
    fetchedRef.current = true
    fetchData()
  }, [fetchData, endpoint, options.enabled])

  return {
    ...state,
    refresh: fetchData,
  }
}
