// Frames Amplify's sign-in screen like the rest of the app: the dark top bar with
// the app name, the gray page, and a short welcome above the form. The form's own
// colors come from the [data-amplify-authenticator] rules in index.css.
// Once someone is signed in (or while Amplify is still checking), the app shows as usual.
import { useAuthenticator } from '@aws-amplify/ui-react'
import type { ReactNode } from 'react'
import { BrandName } from '../components/BrandName'

export function SignInLayout({ children }: { children: ReactNode }) {
  const { authStatus } = useAuthenticator((context) => [context.authStatus])
  if (authStatus !== 'unauthenticated') return <>{children}</>

  return (
    <div className="min-h-svh bg-page">
      <header className="bg-squid text-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center px-4 text-lg font-bold tracking-tight">
          <BrandName />
        </div>
      </header>
      <main className="px-4 pt-10 pb-16">
        <div className="mx-auto mb-6 max-w-md text-center">
          <h1 className="text-2xl font-bold">Welcome</h1>
          <p className="text-sm text-gray-600">One home for every club on campus. Sign in or create an account.</p>
        </div>
        {children}
      </main>
    </div>
  )
}
