import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { hasHelpyUserSession } from '../api/helpy'

export type Screen =
  | 'splash' | 'login' | 'verify' | 'home' | 'orders' | 'chat' | 'profile'
  | 'categories' | 'location' | 'service-detail' | 'booking-confirm' | 'booking-checkout'
  | 'booking-success' | 'glow-checkout' | 'chat-thread' | 'wallet' | 'favorites'
  | 'addresses' | 'contact-us' | 'terms' | 'privacy' | 'notifications'
  | 'order-detail' | 'category-services' | 'deals' | 'offers-events'
  | 'providers' | 'all-services'
  | 'reviews'

interface NavState { screen: Screen; params?: any; history: { screen: Screen; params?: any }[] }

interface NavCtx {
  screen: Screen; params: any
  navigate: (s: Screen, p?: any) => void
  goBack: () => void
  canGoBack: boolean
  activeTab: string
  setActiveTab: (t: string) => void
  isLoggedIn: boolean
  login: () => void
  bookedServices: BookedService[]
  addBooking: (b: BookedService) => void
  pendingReview: BookedService | null
  clearPendingReview: () => void
}

export interface BookedService {
  id: string; provider: string; service: string
  date: string; time: string; price: string
  status: 'Confirmed'|'In Progress'|'Completed'
  providerBg: string; providerEmoji: string
  providerImage?: string
  addressLabel?: string; address?: string; addressDetails?: string
}

const Ctx = createContext<NavCtx>(null as any)

const SCREENS: Screen[] = [
  'splash', 'login', 'verify', 'home', 'orders', 'chat', 'profile', 'categories',
  'location', 'service-detail', 'booking-confirm', 'booking-checkout', 'booking-success',
  'glow-checkout', 'chat-thread', 'wallet', 'favorites', 'addresses', 'contact-us',
  'terms', 'privacy', 'notifications', 'order-detail', 'category-services', 'deals',
  'offers-events', 'providers', 'all-services', 'reviews'
]

const screenFromUrl = (): Screen => {
  if (typeof window === 'undefined') return 'splash'
  const candidate = window.location.hash.replace('#', '') as Screen
  return SCREENS.includes(candidate) ? candidate : 'splash'
}

const updateUrl = (screen: Screen, replace = false) => {
  if (typeof window === 'undefined') return
  const url = `${window.location.pathname}${window.location.search}#${screen}`
  window.history[replace ? 'replaceState' : 'pushState']({ screen }, '', url)
}

export function NavProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<NavState>(() => ({ screen: screenFromUrl(), history: [] }))
  const [activeTab, setActiveTabState] = useState('home')
  const [isLoggedIn, setIsLoggedIn] = useState(() => hasHelpyUserSession())
  const [bookedServices, setBookedServices] = useState<BookedService[]>([])
  const [pendingReview, setPendingReview] = useState<BookedService | null>(null)

  useEffect(() => {
    const syncFromBrowser = () => {
      const screen = screenFromUrl()
      setState(current => screen === current.screen ? current : { screen, params: undefined, history: [] })
    }
    window.addEventListener('popstate', syncFromBrowser)
    window.addEventListener('hashchange', syncFromBrowser)
    return () => {
      window.removeEventListener('popstate', syncFromBrowser)
      window.removeEventListener('hashchange', syncFromBrowser)
    }
  }, [])

  const navigate = (screen: Screen, params?: any) => {
    setState(s => ({ screen, params, history: [...s.history, { screen: s.screen, params: s.params }] }))
    updateUrl(screen)
  }

  const goBack = () =>
    setState(s => {
      const history = [...s.history]
      const prev = history.pop()
      if (prev) updateUrl(prev.screen, true)
      return prev ? { screen: prev.screen, params: prev.params, history } : s
    })

  const setActiveTab = (t: string) => {
    setActiveTabState(t)
    setState({ screen: t as Screen, params: undefined, history: [] })
    updateUrl(t as Screen)
  }

  const login = () => {
    setIsLoggedIn(true)
    setState({ screen: 'home', params: undefined, history: [] })
    setActiveTabState('home')
    updateUrl('home')
  }

  const addBooking = (b: BookedService) => {
    setBookedServices(prev => [b, ...prev])
    setPendingReview(b)
  }

  const clearPendingReview = () => setPendingReview(null)

  return (
    <Ctx.Provider value={{ screen: state.screen, params: state.params, navigate, goBack, canGoBack: state.history.length > 0, activeTab, setActiveTab, isLoggedIn, login, bookedServices, addBooking, pendingReview, clearPendingReview }}>
      {children}
    </Ctx.Provider>
  )
}

export const useNav = () => useContext(Ctx)
