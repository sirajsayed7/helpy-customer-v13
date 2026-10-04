import { NavProvider, useNav } from './context/NavContext'
import { HelpyDataProvider } from './context/HelpyDataContext'
import { BottomNav } from './components/shared'

import LoginPage          from './pages/LoginPage'
import SplashPage         from './pages/SplashPage'
import VerifyPage         from './pages/VerifyPage'
import HomePage           from './pages/HomePage'
import OrdersPage         from './pages/OrdersPage'
import ChatPage           from './pages/ChatPage'
import ProfilePage        from './pages/ProfilePage'
import ServiceDetailPage  from './pages/ServiceDetailPage'
import BookingSuccessPage from './subpages/BookingSuccessPage'
import GlowCheckoutPage   from './subpages/GlowCheckoutPage'
import BookingCheckoutPage from './subpages/BookingCheckoutPage'
import ChatThreadPage     from './subpages/ChatThreadPage'
import CategoriesPage     from './subpages/CategoriesPage'
import CategoryServicesPage from './subpages/CategoryServicesPage'
import DealsPage          from './subpages/DealsPage'
import OffersEventsPage   from './subpages/OffersEventsPage'
import ProvidersPage      from './subpages/ProvidersPage'
import AllServicesPage    from './subpages/AllServicesPage'
import LocationPickerPage from './subpages/LocationPickerPage'
import HelperPages        from './subpages/HelperPages'
import ReviewsPage        from './subpages/ReviewsPage'

const AUTH = ['splash','login','verify']
const FULLSCREEN = ['chat-thread','service-detail','booking-success','glow-checkout','booking-checkout','location','reviews']

function AppShell() {
  const { screen } = useNav()
  const isAuth = AUTH.includes(screen)
  const hideBottomNav = isAuth || FULLSCREEN.includes(screen)

  const Page = () => {
    switch (screen) {
      case 'splash':             return <SplashPage/>
      case 'login':              return <LoginPage/>
      case 'verify':             return <VerifyPage/>
      case 'home':               return <HomePage/>
      case 'orders':             return <OrdersPage/>
      case 'chat':               return <ChatPage/>
      case 'profile':            return <ProfilePage/>
      case 'service-detail':     return <ServiceDetailPage/>
      case 'booking-success':    return <BookingSuccessPage/>
      case 'booking-checkout':   return <BookingCheckoutPage/>
      case 'glow-checkout':      return <GlowCheckoutPage/>
      case 'chat-thread':        return <ChatThreadPage/>
      case 'categories':         return <CategoriesPage/>
      case 'category-services':  return <CategoryServicesPage/>
      case 'deals':              return <DealsPage/>
      case 'offers-events':      return <OffersEventsPage/>
      case 'providers':          return <ProvidersPage/>
      case 'all-services':       return <AllServicesPage/>
      case 'location':           return <LocationPickerPage/>
      case 'reviews':            return <ReviewsPage/>
      default:                   return <HelperPages screen={screen}/>
    }
  }

  return (
    <div className="min-h-screen flex items-start justify-center" style={{background:'#C7D8F5'}}>
      <div className="relative w-full max-w-[430px] h-[100dvh] min-h-[100dvh] flex flex-col overflow-hidden shadow-2xl bg-white">
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          <Page/>
        </div>
        {!hideBottomNav && <BottomNav/>}
      </div>
    </div>
  )
}

export default function App() {
  return <NavProvider><HelpyDataProvider><AppShell/></HelpyDataProvider></NavProvider>
}
