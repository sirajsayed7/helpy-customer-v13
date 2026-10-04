import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { helpyApi, hasHelpyUserSession, type HelpyAddressInput, type HelpyAvailabilitySlot, type HelpyBanner, type HelpyCategory, type HelpyProvider, type HelpyService } from '../api/helpy'
import { useNav } from './NavContext'

const pick = (value: Record<string, unknown>, ...keys: string[]) => keys.map(key => value[key]).find(item => item !== null && item !== undefined && item !== '')
const text = (value: unknown, fallback = '') => value === null || value === undefined ? fallback : String(value)
const number = (value: unknown, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback
const cleanText = (value: unknown) => text(value).replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()

export type LiveCategory = { id: number; name: string; image: string; count: number }
export type LiveBanner = { id: number; name: string; image: string; serviceId: number; targetType: string; targetId: number; raw: Record<string, unknown> }
export type LiveService = {
  id: string; serviceVendorMapId: number; serviceId: number; categoryId: number; vendorId: number
  name: string; provider: string; category: string; price: number; rating: number; reviews: number
  image: string; description: string; duration: string; raw: Record<string, unknown>
}
export type LiveProvider = { id: number; name: string; image: string; rating: number; service?: LiveService; raw: Record<string, unknown> }
export type LiveBusiness = { id: number; name: string; image: string; rating: number; about: string; services: LiveService[]; raw: Record<string, unknown> }
export type LiveProfile = { name: string; email: string; phone: string; about: string; image: string; memberSince: string; wallet: number; raw: Record<string, unknown> }
export type LiveAddress = { id: string; title: string; address: string; stateId: number; cityId: number; raw: Record<string, unknown> }
export type LiveBooking = { id: string; service: string; provider: string; date: string; time: string; price: number; status: string; image: string; address: string; raw: Record<string, unknown> }

function mapCategory(item: HelpyCategory): LiveCategory {
  const raw = item as Record<string, unknown>
  return { id: number(item.category_id), name: text(pick(raw, 'name_english', 'name'), 'Category'), image: text(pick(raw, 'category_image_url', 'category_image')), count: number(pick(raw, 'service_count', 'services_count', 'total_services')) }
}

function mapBanner(item: HelpyBanner): LiveBanner {
  const raw = item as Record<string, unknown>
  const images = raw.banner_images
  const image = Array.isArray(images)
    ? text(images.find(value => typeof value === 'string' || (value && typeof value === 'object')))
    : images && typeof images === 'object'
      ? text(pick(images as Record<string, unknown>, 'url', 'image_url', 'image', 'path'))
      : text(images)
  return {
    id: number(item.banner_id),
    name: text(item.name, 'Featured service'),
    image,
    serviceId: number(item.service_id),
    targetType: text(item.target_type),
    targetId: number(item.target_id),
    raw,
  }
}

export function mapService(item: HelpyService, categories: LiveCategory[] = []): LiveService {
  const raw = item as Record<string, unknown>
  const category = raw.category && typeof raw.category === 'object' ? raw.category as Record<string, unknown> : {}
  const vendor = raw.vendor && typeof raw.vendor === 'object' ? raw.vendor as Record<string, unknown> : {}
  const creator = raw.created_by && typeof raw.created_by === 'object' ? raw.created_by as Record<string, unknown> : {}
  const nestedService = raw.service && typeof raw.service === 'object' ? raw.service as Record<string, unknown> : {}
  const images = Array.isArray(raw.all_service_images) ? raw.all_service_images : []
  const id = number(pick(raw, 'service_vendor_mapp_id', 'id'))
  const categoryId = number(pick(raw, 'category_id', 'service_category_id'))
  const imageValue = pick(raw, 'service_image_url', 'service_setup_image_url', 'image_url', 'image') || images[0] || pick(nestedService, 'service_image_url')
  return {
    id: String(id || pick(raw, 'service_id', 'name') || crypto.randomUUID()),
    serviceVendorMapId: id,
    serviceId: number(pick(raw, 'service_id')),
    categoryId,
    vendorId: number(pick(raw, 'vendor_id', 'user_id', 'service_vendor_id') || pick(creator, 'id')),
    name: text(pick(raw, 'name_english', 'name', 'service_name'), 'Unnamed service'),
    provider: text(pick(raw, 'created_by_name', 'vendor_name', 'provider_name') || pick(creator, 'name_english', 'name') || pick(vendor, 'name_english', 'name'), 'Service provider'),
    category: text(pick(category, 'name_english', 'name') || categories.find(value => value.id === categoryId)?.name, 'Services'),
    price: number(pick(raw, 'price', 'service_price', 'amount')),
    rating: number(pick(raw, 'rating', 'rateing', 'average_rating')),
    reviews: number(pick(raw, 'review_count', 'reviews_count', 'total_reviews')),
    image: text(imageValue),
    description: cleanText(pick(raw, 'description_english', 'description', 'service_description')),
    duration: text(pick(raw, 'duration_text', 'duration_unit_text', 'service_duration', 'duration')),
    raw,
  }
}

function mapProvider(item: HelpyProvider, categories: LiveCategory[]): LiveProvider {
  const raw = item as Record<string, unknown>
  const setup = Array.isArray(item.service_setup) ? item.service_setup[0] : item.service_setup
  const mapped = setup && typeof setup === 'object' ? mapService(setup as HelpyService, categories) : undefined
  const service = mapped ? { ...mapped, vendorId: number(pick(raw, 'id', 'vendor_id')), provider: text(pick(raw, 'name_english', 'name')), image: mapped.image || text((setup as Record<string, unknown>).service_image_url) } : undefined
  return { id: number(pick(raw, 'id', 'vendor_id')), name: text(pick(raw, 'name_english', 'name'), 'Service provider'), image: text(pick(raw, 'vendor_profile_image_url', 'user_profile_image_url', 'profile_photo')), rating: number(pick(raw, 'rateing', 'rating')), service, raw }
}

function mapAddress(value: unknown): LiveAddress {
  const raw = value && typeof value === 'object' ? value as Record<string, unknown> : {}
  const rawTitle = text(pick(raw, 'address_type_english', 'address_type', 'label', 'title', 'name'))
  const title = /^\d+$/.test(rawTitle) ? text(pick(raw, 'name', 'address_type_english', 'address_type'), 'Saved address') : rawTitle || 'Saved address'
  return { id: text(pick(raw, 'id', 'address_id'), crypto.randomUUID()), title, address: text(pick(raw, 'full_address_english', 'full_address', 'address_english', 'address_en', 'address', 'street_address')), stateId: number(pick(raw, 'state_id')), cityId: number(pick(raw, 'city_id')), raw }
}

export function mapBooking(value: unknown, status: string): LiveBooking {
  const raw = value && typeof value === 'object' ? value as Record<string, unknown> : {}
  const objectAt = (...keys: string[]) => { const found = pick(raw, ...keys); return found && typeof found === 'object' ? found as Record<string, unknown> : {} }
  const setup = objectAt('service_setup', 'service_vendor_map', 'service_vendor_mapp', 'service_details')
  const service = Object.keys(objectAt('service')).length ? objectAt('service') : (setup.service && typeof setup.service === 'object' ? setup.service as Record<string, unknown> : setup)
  const vendor = Object.keys(objectAt('vendor', 'provider', 'created_by')).length ? objectAt('vendor', 'provider', 'created_by') : (setup.created_by && typeof setup.created_by === 'object' ? setup.created_by as Record<string, unknown> : {})
  const address = objectAt('booking_address', 'user_address', 'address_data')
  const payment = objectAt('payment', 'payment_details')
  const imageList = Array.isArray(setup.all_service_images) ? setup.all_service_images : []
  return {
    id: text(pick(raw, 'id', 'order_id', 'booking_id'), crypto.randomUUID()),
    service: text(pick(raw, 'service_name') || pick(service, 'name_english', 'name', 'service_name') || pick(setup, 'name_english', 'name'), 'Booked service'),
    provider: text(pick(raw, 'vendor_name', 'provider_name', 'created_by_name') || pick(vendor, 'name_english', 'name'), 'Service provider'),
    date: text(pick(raw, 'selected_date', 'booking_date', 'date', 'service_date', 'scheduled_date')),
    time: text(pick(raw, 'selected_time', 'booking_time', 'time', 'slot', 'booking_slot')),
    price: number(pick(raw, 'total_amount', 'total_price', 'payable_amount', 'price', 'amount') || pick(payment, 'total_amount', 'amount')),
    status: text(pick(raw, 'status_text', 'booking_status_text', 'order_status_text'), status),
    image: text(pick(raw, 'service_image', 'service_setup_image_url', 'image_url') || pick(setup, 'service_image_url', 'image_url') || imageList[0]),
    address: text(pick(raw, 'service_address', 'address_english') || pick(address, 'address_english', 'address_en', 'address', 'full_address')),
    raw,
  }
}

type DataContext = {
  loading: boolean; accountLoading: boolean; error: string; banners: LiveBanner[]; categories: LiveCategory[]; services: LiveService[]; featured: LiveService[]; providers: LiveProvider[]; businesses: LiveBusiness[]
  profile: LiveProfile | null; addresses: LiveAddress[]; bookings: LiveBooking[]; favorites: unknown[]; walletHistory: unknown[]; notifications: unknown[]
  refreshCatalog: () => Promise<void>; refreshAccount: () => Promise<void>; getAvailability: (vendorId: number, date: string) => Promise<HelpyAvailabilitySlot[]>
  updateProfile: (input: { name: string; email: string; phoneNumber: string; aboutMe?: string }) => Promise<void>
  addAddress: (input: HelpyAddressInput) => Promise<void>
}

const Context = createContext<DataContext>(null as never)

export function HelpyDataProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useNav()
  const [loading, setLoading] = useState(true)
  const [accountLoading, setAccountLoading] = useState(false)
  const [error, setError] = useState('')
  const [banners, setBanners] = useState<LiveBanner[]>([])
  const [categories, setCategories] = useState<LiveCategory[]>([])
  const [services, setServices] = useState<LiveService[]>([])
  const [featured, setFeatured] = useState<LiveService[]>([])
  const [providers, setProviders] = useState<LiveProvider[]>([])
  const [profile, setProfile] = useState<LiveProfile | null>(null)
  const [addresses, setAddresses] = useState<LiveAddress[]>([])
  const [bookings, setBookings] = useState<LiveBooking[]>([])
  const [favorites, setFavorites] = useState<unknown[]>([])
  const [walletHistory, setWalletHistory] = useState<unknown[]>([])
  const [notifications, setNotifications] = useState<unknown[]>([])

  const businesses = useMemo<LiveBusiness[]>(() => {
    const grouped = new Map<number, LiveBusiness>()
    services.forEach(service => {
      const creator = service.raw.created_by && typeof service.raw.created_by === 'object' ? service.raw.created_by as Record<string, unknown> : {}
      const id = service.vendorId
      if (!id) return
      const current = grouped.get(id)
      if (current) { current.services.push(service); return }
      grouped.set(id, {
        id,
        name: service.provider,
        image: text(pick(creator, 'vendor_profile_image_url', 'user_profile_image_url', 'profile_photo')),
        rating: number(pick(creator, 'rateing', 'rating')),
        about: cleanText(pick(creator, 'about_me_english', 'about_me')),
        services: [service],
        raw: creator,
      })
    })
    providers.forEach(provider => {
      const current = grouped.get(provider.id)
      if (current) {
        current.image ||= provider.image
        current.rating ||= provider.rating
        return
      }
      grouped.set(provider.id, { id: provider.id, name: provider.name, image: provider.image, rating: provider.rating, about: cleanText(pick(provider.raw, 'about_me_english', 'about_me')), services: provider.service ? [provider.service] : [], raw: provider.raw })
    })
    return [...grouped.values()].sort((a, b) => b.services.length - a.services.length || b.rating - a.rating)
  }, [services, providers])

  const refreshCatalog = useCallback(async () => {
    setLoading(true); setError('')
    try {
      await helpyApi.ensureGuestSession()
      const categoryRows = await helpyApi.getCategories()
      const mappedCategories = categoryRows.map(mapCategory)
      setCategories(mappedCategories)
      const [bannerRows, featuredRows, providerRows, ...servicePages] = await Promise.all([
        helpyApi.getBanners().catch(() => []), helpyApi.getFeaturedServices(), helpyApi.getTopProviders(),
        ...mappedCategories.map(category => helpyApi.getServices(category.id).catch(() => ({ total_records: 0, page: 1, limit: 100, data: [] }))),
      ])
      setBanners(bannerRows.map(mapBanner).filter(banner => Boolean(banner.image)))
      const deduped = new Map<string, LiveService>()
      servicePages.flatMap(page => page.data || []).map(item => mapService(item, mappedCategories)).forEach(item => deduped.set(item.id, item))
      setServices([...deduped.values()])
      setFeatured(featuredRows.map(item => mapService(item, mappedCategories)))
      setProviders(providerRows.map(item => mapProvider(item, mappedCategories)))
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load Helpy services.') }
    finally { setLoading(false) }
  }, [])

  const refreshAccount = useCallback(async () => {
    if (!hasHelpyUserSession()) { setProfile(null); setAddresses([]); setBookings([]); return }
    setAccountLoading(true)
    try {
      const [profileRaw, addressRows, active, progress, completed, favoriteRows, walletRows, notificationRows] = await Promise.all([
        helpyApi.getUserProfile(), helpyApi.getAddresses(), helpyApi.getBookings(0), helpyApi.getBookings(1), helpyApi.getBookings(2), helpyApi.getFavorites(), helpyApi.getWalletHistory(), helpyApi.getNotifications(),
      ])
      setProfile({ name: text(pick(profileRaw, 'name_english', 'name')), email: text(profileRaw.email), phone: text(profileRaw.phone_number), about: text(pick(profileRaw, 'about_me_english', 'about_me')), image: text(pick(profileRaw, 'user_profile_image_url', 'profile_photo')), memberSince: text(pick(profileRaw, 'member_since', 'created_at_formatted')), wallet: number(profileRaw.wallet), raw: profileRaw })
      setAddresses(addressRows.map(mapAddress))
      setBookings([...active.map(row => mapBooking(row, 'Confirmed')), ...progress.map(row => mapBooking(row, 'In progress')), ...completed.map(row => mapBooking(row, 'Completed'))])
      setFavorites(favoriteRows); setWalletHistory(walletRows); setNotifications(notificationRows)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to load account data.') }
    finally { setAccountLoading(false) }
  }, [])

  useEffect(() => { void refreshCatalog() }, [refreshCatalog])
  useEffect(() => { void refreshAccount() }, [refreshAccount, isLoggedIn])

  const value = useMemo<DataContext>(() => ({
    loading, accountLoading, error, banners, categories, services, featured, providers, businesses, profile, addresses, bookings, favorites, walletHistory, notifications,
    refreshCatalog, refreshAccount,
    getAvailability: (vendorId, date) => helpyApi.getVendorAvailability(vendorId, date),
    updateProfile: async input => { await helpyApi.updateUserProfile(input); await refreshAccount() },
    addAddress: async input => { await helpyApi.storeAddress(input); await refreshAccount() },
  }), [loading, accountLoading, error, banners, categories, services, featured, providers, businesses, profile, addresses, bookings, favorites, walletHistory, notifications, refreshCatalog, refreshAccount])

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export const useHelpyData = () => useContext(Context)
