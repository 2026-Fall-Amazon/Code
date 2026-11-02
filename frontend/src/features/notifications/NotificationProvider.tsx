import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Schema } from '../../../../amplify/data/resource'
import { useNavigate } from 'react-router'
import { client, listAll, throwIfErrors } from '../../lib/dataClient'
import { useCurrentUser } from '../../lib/session/hooks'

type Notification = Schema['Notification']['type']
export type NotificationPreferenceInput = {
  inAppAnnouncements: boolean
  inAppEvents: boolean
  inAppReminders: boolean
  emailAnnouncements: boolean
  emailEvents: boolean
  emailReminders: boolean
  weeklyDigest: boolean
  browserAlerts: boolean
}

const defaultPreferences: NotificationPreferenceInput = {
  inAppAnnouncements: true,
  inAppEvents: true,
  inAppReminders: true,
  emailAnnouncements: false,
  emailEvents: false,
  emailReminders: false,
  weeklyDigest: false,
  browserAlerts: false,
}

type NotificationContextValue = {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  error: string | null
  preferences: NotificationPreferenceInput
  preferencesLoading: boolean
  savingPreferences: boolean
  savePreference: <K extends keyof NotificationPreferenceInput>(key: K, value: boolean) => Promise<void>
  enableBrowserAlerts: () => Promise<void>
  markRead: (notification: Notification, isRead?: boolean) => Promise<void>
  markAllRead: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextValue | null>(null)
const message = (error: unknown) => error instanceof Error ? error.message : 'Something went wrong.'

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { userId, email } = useCurrentUser()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [preferences, setPreferences] = useState(defaultPreferences)
  const [loading, setLoading] = useState(true)
  const [preferencesLoading, setPreferencesLoading] = useState(true)
  const [savingPreferences, setSavingPreferences] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preferenceExists, setPreferenceExists] = useState(false)

  const showBrowserAlert = useCallback((item: Notification) => {
    if (!preferences.browserAlerts || !('Notification' in window) || window.Notification.permission !== 'granted') return
    const alert = new window.Notification(item.title, { body: item.body, tag: item.id })
    alert.onclick = () => {
      window.focus()
      navigate(item.target)
      alert.close()
    }
  }, [navigate, preferences.browserAlerts])

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    setLoading(true)
    setPreferencesLoading(true)
    setError(null)

    Promise.all([
      listAll((nextToken) =>
        client.models.Notification.listNotificationsByUser({ userId }, { nextToken, sortDirection: 'DESC' }),
      ),
      client.models.NotificationPreference.get({ userId }),
    ])
      .then(([items, preferenceResult]) => {
        throwIfErrors(preferenceResult.errors)
        if (cancelled) return
        setNotifications((current) => {
          const visible = new Map<string, Notification>(items.filter((item) => item.inApp !== false).map((item) => [item.id, item]))
          for (const item of current) {
            if (item.userId === userId && item.inApp !== false && !visible.has(item.id)) visible.set(item.id, item)
          }
          return [...visible.values()].sort((a, b) => (b.occurredAt ?? '').localeCompare(a.occurredAt ?? ''))
        })
        const saved = preferenceResult.data
        setPreferenceExists(Boolean(saved))
        if (saved) {
          setPreferences({
            inAppAnnouncements: saved.inAppAnnouncements ?? true,
            inAppEvents: saved.inAppEvents ?? true,
            inAppReminders: saved.inAppReminders ?? true,
            emailAnnouncements: saved.emailAnnouncements ?? false,
            emailEvents: saved.emailEvents ?? false,
            emailReminders: saved.emailReminders ?? false,
            weeklyDigest: saved.weeklyDigest ?? false,
            browserAlerts: saved.browserAlerts ?? false,
          })
        } else {
          setPreferences(defaultPreferences)
        }
      })
      .catch((loadError) => {
        if (!cancelled) setError(message(loadError))
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
          setPreferencesLoading(false)
        }
      })

    const upsert = (item: Notification) => {
      if (item.userId !== userId) return
      setNotifications((current) => {
        if (item.inApp === false) return current
        const withoutItem = current.filter((existing) => existing.id !== item.id)
        return [item, ...withoutItem].sort((a, b) => (b.occurredAt ?? '').localeCompare(a.occurredAt ?? ''))
      })
    }
    const created = client.models.Notification.onCreate().subscribe({
      next: (item) => {
        if (item) {
          upsert(item)
          showBrowserAlert(item)
        }
      },
      error: (subscriptionError) => setError(message(subscriptionError)),
    })
    const updated = client.models.Notification.onUpdate().subscribe({ next: (item) => item && upsert(item) })

    return () => {
      cancelled = true
      created.unsubscribe()
      updated.unsubscribe()
    }
  }, [userId, showBrowserAlert])

  const savePreference = useCallback<NotificationContextValue['savePreference']>(async (key, value) => {
    if (!userId) throw new Error('You need to be signed in.')
    const next = { ...preferences, [key]: value }
    setSavingPreferences(true)
    setError(null)
    try {
      const fields = { userId, email, ...next }
      const result = preferenceExists
        ? await client.models.NotificationPreference.update(fields)
        : await client.models.NotificationPreference.create(fields)
      throwIfErrors(result.errors)
      if (!result.data) throw new Error('Your notification preference was not saved.')
      setPreferences(next)
      setPreferenceExists(true)
    } catch (saveError) {
      setError(message(saveError))
      throw saveError
    } finally {
      setSavingPreferences(false)
    }
  }, [email, preferenceExists, preferences, userId])

  const enableBrowserAlerts = useCallback(async () => {
    if (!('Notification' in window)) throw new Error('This browser does not support desktop notifications.')
    const permission = await window.Notification.requestPermission()
    if (permission !== 'granted') throw new Error('Browser notification permission was not granted.')
    await savePreference('browserAlerts', true)
  }, [savePreference])

  const markRead = useCallback(async (item: Notification, isRead = true) => {
    setError(null)
    try {
      const { errors } = await client.mutations.setNotificationRead({ notificationId: item.id, isRead })
      throwIfErrors(errors)
      const readAt = isRead ? new Date().toISOString() : null
      setNotifications((current) => current.map((existing) => existing.id === item.id ? { ...existing, readAt } : existing))
    } catch (actionError) {
      setError(message(actionError))
      throw actionError
    }
  }, [])

  const markAllRead = useCallback(async () => {
    setError(null)
    try {
      const { errors } = await client.mutations.markAllNotificationsRead({})
      throwIfErrors(errors)
      const readAt = new Date().toISOString()
      setNotifications((current) => current.map((item) => item.readAt ? item : { ...item, readAt }))
    } catch (actionError) {
      setError(message(actionError))
      throw actionError
    }
  }, [])

  const value = useMemo<NotificationContextValue>(() => ({
    notifications,
    unreadCount: notifications.filter((item) => !item.readAt).length,
    loading,
    error,
    preferences,
    preferencesLoading,
    savingPreferences,
    savePreference,
    enableBrowserAlerts,
    markRead,
    markAllRead,
  }), [notifications, loading, error, preferences, preferencesLoading, savingPreferences, savePreference, enableBrowserAlerts, markRead, markAllRead])

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
  const value = useContext(NotificationContext)
  if (!value) throw new Error('useNotifications must be used inside <NotificationProvider>.')
  return value
}
