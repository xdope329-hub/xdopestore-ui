import AuthModal from '@/components/auth/authModal'
import ThemeOptionContext from '@/context/themeOptionsContext'
import request, { sideCookieOptions } from '@/utils/axiosUtils'
import TabFocusChecker from '@/utils/customFunctions/TabFocus'
import { ToastNotification } from '@/utils/customFunctions/ToastNotification'
import Cookies from 'js-cookie'
import { usePathname, useSearchParams } from 'next/navigation'
import NextTopLoader from 'nextjs-toploader'
import { useContext, useEffect, useState } from 'react'
import ConfettiBurst from './confettiBurst'
import ExitModal from './exitModal'
import Footers from './footer'
import Headers from './header'
import MobileMenu from './header/widgets/MobileMenu'
import NewsLetterModal from './newsLetterModal'
import RecentPurchase from './recentPurchase'
import TapTop from './tapTop'
import WhatsAppButton from './whatsappButton'
import AnnouncementBar from './announcementBar'

const SubLayout = ({ children }) => {
  const isTabActive = TabFocusChecker()
  const { themeOption, setOpenAuthModal } = useContext(ThemeOptionContext)
  const path = useSearchParams()
  const theme = path.get('theme')
  const pathName = usePathname()
  const disableMetaTitle = ['product', 'blogs', 'brand']
  const accountVerified = Cookies.get('uat')
  const authToast = Cookies.get('showAuthToast')

  const protectedRoutes = [
    `/account/dashboard`,
    `/account/notification`,
    `/account/point`,
    `/account/refund`,
    `/account/order`,
    `/account/addresses`,
  ]

  useEffect(() => {
    if (!accountVerified && authToast && protectedRoutes.includes(pathName)) {
      ToastNotification('error', 'Unauthenticated')
      setOpenAuthModal(true)
    }
    return () => Cookies.remove('showAuthToast')
  }, [pathName])

  useEffect(() => {
    const setThemeColors = () => {
      let newThemeColor = ''
      let newThemeColor2 = ''

      if (theme) {
        newThemeColor = '#51ec8cff'
      } else {
        newThemeColor = themeOption?.general?.primary_color
        newThemeColor2 = themeOption?.general?.secondary_color
      }

      setThemeColor(newThemeColor)
      setThemeColor2(newThemeColor2)
    }

    setThemeColors()
  }, [theme, pathName, themeOption])

  //  Setting the current url in cookies for redirection of protected routes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      Cookies.set('currentPath', window.location.pathname + window.location.search, sideCookieOptions(60))
    }
  }, [pathName, path])

  const [themeColor, setThemeColor] = useState('')
  const [themeColor2, setThemeColor2] = useState('')

  useEffect(() => {
    if (themeColor) {
      document.body.style.setProperty('--theme-color', themeColor)
    }
    if (themeColor2) {
      document.body.style.setProperty('--theme-color2', themeColor2)
    } else {
      document.body.style.removeProperty('--theme-color2')
    }
  }, [themeColor, themeColor2])

  useEffect(() => {
    const messages = themeOption?.general?.taglines
    let timer

    const updateTitle = (index) => {
      document.title = messages[index]
      timer = setTimeout(() => {
        const nextIndex = (index + 1) % messages.length
        updateTitle(nextIndex)
      }, 500)
    }

    if (!disableMetaTitle.includes(pathName.split('/')[1].toLowerCase())) {
      if (!isTabActive && themeOption?.general?.exit_tagline_enable && messages?.length) {
        updateTitle(0)
      } else {
        let value =
          themeOption?.general?.site_title && themeOption?.general?.site_tagline
            ? `${themeOption?.general?.site_title} | ${themeOption?.general?.site_tagline}`
            : 'Multikart Marketplace: Where Vendors Shine Together'
        document.title = value
        clearTimeout(timer)
      }
    }

    return () => {
      clearTimeout(timer)
    }
  }, [isTabActive, themeOption])

  return (
    <>
      {/* Cinta de anuncios: sobre el header en todas las páginas */}
      <AnnouncementBar />
      <Headers />
      {/* Bottom navigation is available on every page, product pages included
          (the product page's floating checkout pill is offset above it). */}
      <MobileMenu />
      {children}
      <AuthModal />
      {theme != 'full_page' && <Footers />}
      <NextTopLoader showSpinner={false} />
      <ConfettiBurst />
      <RecentPurchase />
      {themeOption?.popup?.news_letter?.is_enable && (
        <NewsLetterModal />
      )}
      <TapTop />
      <WhatsAppButton />
      {themeOption?.popup?.exit?.is_enable && (
        <ExitModal />
      )}
    </>
  )
}

export default SubLayout
