import { OrderProvider } from './contexts/OrderContext'
import SiteAdminApp from './SiteAdminApp'

export default function SiteAdminAppWithOrders() {
  // We'll get the activeSite from within SiteAdminApp and pass it to OrderProvider
  return (
    <OrderProvider clientId={null}>
      <SiteAdminApp />
    </OrderProvider>
  )
}
