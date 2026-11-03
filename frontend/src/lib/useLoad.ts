// Loads data for a page and reloads it whenever `key` changes.
// Pass null as the key to wait (for example, until the session has loaded).
//   const { data, loading, error, reload } = useLoad(clubId, () => fetchClubEvents(clubId))
import { useCallback, useEffect, useRef, useState } from 'react'

type LoadState<T> = { key: string | null; data?: T; error?: string }

const errorMessage = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong. Please try again.')

export function useLoad<T>(key: string | null, load: () => Promise<T>) {
  const [state, setState] = useState<LoadState<T>>({ key: null })
  const [version, setVersion] = useState(0)
  const loadRef = useRef(load)
  useEffect(() => {
    loadRef.current = load
  })

  const fullKey = key === null ? null : `${key}#${version}`

  useEffect(() => {
    if (fullKey === null) return
    let cancelled = false
    loadRef.current().then(
      (data) => !cancelled && setState({ key: fullKey, data }),
      (e: unknown) => !cancelled && setState({ key: fullKey, error: errorMessage(e) }),
    )
    return () => {
      cancelled = true
    }
  }, [fullKey])

  const reload = useCallback(() => setVersion((v) => v + 1), [])
  const current = state.key === fullKey

  return {
    // Keeps showing the previous data during a reload, so lists don't flash empty.
    data: state.data,
    loading: fullKey === null || !current,
    error: current ? state.error : undefined,
    reload,
  }
}
