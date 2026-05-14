import { ConditionalAppChrome } from '@/components/layout/conditional-app-chrome'

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <ConditionalAppChrome>{children}</ConditionalAppChrome>
    </div>
  )
}
