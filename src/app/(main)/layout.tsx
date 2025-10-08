import Header from '@/_aaa_sheetChat/_components/lendingComponents/lending/lending-layout/Header'
import Footer from '@/_aaa_sheetChat/_components/lendingComponents/lending/lending-layout/Footer'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}