import { PaymentProviderLoader } from '@/components/payments/PaymentProviderLoader'

export default function JoinLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // PaymentProviderLoader only loads Klarna/Affirm SDKs on checkout pages
  return (
    <PaymentProviderLoader>
      {children}
    </PaymentProviderLoader>
  )
}
