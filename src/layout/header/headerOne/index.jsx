'use client'
import ThemeOptionContext from '@/context/themeOptionsContext'
import WishlistContext from '@/context/wishlistContext'
import { useHeaderScroll } from '@/utils/hooks/HeaderScroll'
import { getAccountSummary, logout } from '@/utils/axiosUtils'
import { safeHttpUrl } from '@/utils/security/safeUrl'
import Cookies from 'js-cookie'
import { usePathname, useRouter } from 'next/navigation'
import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { RiHeartLine, RiLogoutBoxRLine, RiMenuLine, RiUserLine, RiDashboardLine } from 'react-icons/ri'
import { Button, Col, Container, Row } from 'reactstrap'
import HeaderCart from '../widgets/headerCart'
import HeaderLogo from '../widgets/HeaderLogo'
import MainHeaderMenu from '../widgets/mainHeaderMenu'
import TopBar from '../widgets/TopBar'
import { useTranslation } from 'react-i18next'

// Dashboard shortcut target. Build-time public value; the link is hidden
// when unset (the old code pointed at a hard-coded http://localhost:3001).
const ADMIN_URL = safeHttpUrl(process.env.NEXT_PUBLIC_ADMIN_URL)

const HeaderOne = () => {
  const { themeOption, setOpenAuthModal, openAuthModal, mobileSideBar, setMobileSideBar } = useContext(ThemeOptionContext)
  const { wishlistIds, wishlistProducts } = useContext(WishlistContext)
  const UpScroll = useHeaderScroll(false)
  const { t } = useTranslation('common')
  const router = useRouter()
  const pathname = usePathname()

  // Close the mobile drawer whenever the route changes — this handles every
  // navigation from inside the drawer (menu links, etc.). Submenu toggles
  // don't change the path, so they correctly leave the drawer open.
  useEffect(() => {
    setMobileSideBar(false)
  }, [pathname])

  // Swipe-to-close: the drawer slides in from the left, so a leftward drag
  // (or a clear horizontal swipe) dismisses it, like a native side menu.
  const touchRef = useRef(null)
  const onDrawerTouchStart = (e) => {
    const touch = e.changedTouches[0]
    touchRef.current = { x: touch.clientX, y: touch.clientY }
  }
  const onDrawerTouchEnd = (e) => {
    if (!touchRef.current) return
    const t = e.changedTouches[0]
    const dx = t.clientX - touchRef.current.x
    const dy = t.clientY - touchRef.current.y
    touchRef.current = null
    // Mostly-horizontal leftward swipe past a threshold → close.
    if (dx < -60 && Math.abs(dx) > Math.abs(dy)) {
      setMobileSideBar(false)
    }
  }

  const wishlistCount = useMemo(() => {
    const fromIds = wishlistIds ? Object.keys(wishlistIds).length : 0
    return fromIds || (wishlistProducts?.length ?? 0)
  }, [wishlistIds, wishlistProducts])

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  useEffect(() => {
    setIsAuthenticated(!!Cookies.get('uat'))
    // Cosmetic only (shows the dashboard shortcut); real authorization is
    // enforced by the API on every request.
    setIsAdmin(getAccountSummary()?.role?.name === 'admin')
  }, [openAuthModal])

  const handleProfileClick = (e) => {
    e.preventDefault()
    isAuthenticated ? router.push('/account/dashboard') : setOpenAuthModal(true)
  }
  const handleWishlistClick = (e) => {
    e.preventDefault()
    router.push('/wishlist')
  }
  const handleLogout = (e) => {
    e.preventDefault()
    // Cierre de sesión compartido: revoca el refresh en el servidor y borra
    // AMBOS tokens. Quitar solo `uat` dejaba vivo `urt`, y el siguiente 401
    // (p. ej. en un checkout de invitado) volvía a iniciar sesión solo.
    logout()
    setIsAuthenticated(false)
    router.push('/')
    router.refresh()
  }

  return (
    <header className={`${themeOption?.header?.sticky_header_enable && UpScroll ? 'sticky fixed' : ''}`}>
      {themeOption?.header?.page_top_bar_enable && <TopBar />}
      <div className="metro">
        <Container>
          <Row>
            <Col sm="12">
              <div className="main-menu">
                <div className="menu-left">
                  <div className="toggle-nav" onClick={() => setMobileSideBar(!mobileSideBar)}>
                    <RiMenuLine className="sidebar-bar" />
                  </div>
                  <div className="brand-logo">
                    <HeaderLogo />
                  </div>
                </div>

                <div className="menu-right pull-right">
                  <div className="main-navbar">
                    <div id="mainnav">
                      <div className="header-nav-middle">
                        <div className="main-nav navbar navbar-expand-xl navbar-light navbar-sticky">
                          {mobileSideBar && (
                            <div
                              className="offcanvas-backdrop fade show d-xl-none"
                              onClick={() => setMobileSideBar(false)}
                            />
                          )}
                          <div
                            className={`offcanvas offcanvas-collapse order-xl-2 ${mobileSideBar ? 'show' : ''}`}
                            onTouchStart={onDrawerTouchStart}
                            onTouchEnd={onDrawerTouchEnd}
                          >
                            <div className="offcanvas-header navbar-shadow">
                              <h5>{t('Menu')}</h5>
                              <Button close className="lead" id="toggle_menu_btn" type="button" onClick={() => setMobileSideBar(false)}>
                                <div><i className="ri-close-fill"></i></div>
                              </Button>
                            </div>
                            <div className="offcanvas-body">
                              <MainHeaderMenu />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="icon-nav">
                      <ul>
                        <li className="onhover-div">
                          <a href="#" onClick={handleWishlistClick}>
                            <RiHeartLine />
                            {wishlistCount > 0 && <span className="cart_qty_cls">{wishlistCount}</span>}
                          </a>
                        </li>
                        <li className="onhover-div">
                          <HeaderCart />
                        </li>
                        <li className="onhover-div">
                          <a href="#" onClick={handleProfileClick}>
                            <RiUserLine />
                          </a>
                        </li>
                        {isAuthenticated && isAdmin && ADMIN_URL && (
                          <li className="onhover-div">
                            <a href={ADMIN_URL} target="_blank" rel="noopener noreferrer" title={t("AdminPanel")}>
                              <RiDashboardLine />
                            </a>
                          </li>
                        )}
                        {isAuthenticated && (
                          <li className="onhover-div">
                            <a href="#" onClick={handleLogout} title={t('LogOut')}>
                              <RiLogoutBoxRLine />
                            </a>
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </header>
  )
}

export default HeaderOne
