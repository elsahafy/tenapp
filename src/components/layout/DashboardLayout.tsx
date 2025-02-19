'use client'

import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { supabase } from '@/lib/supabase'
import { Dialog, Transition } from '@headlessui/react'
import {
  ArrowsRightLeftIcon,
  BanknotesIcon,
  Bars3Icon,
  ChartBarIcon,
  Cog6ToothIcon,
  HomeIcon,
  TagIcon,
  WalletIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Fragment, useState } from 'react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Accounts', href: '/dashboard/accounts', icon: WalletIcon },
  { name: 'Transactions', href: '/dashboard/transactions', icon: ArrowsRightLeftIcon },
  { name: 'Analytics', href: '/dashboard/analytics', icon: ChartBarIcon },
  { name: 'Debts', href: '/dashboard/debts', icon: BanknotesIcon },
  { name: 'Goals', href: '/dashboard/goals', icon: TagIcon },
  { name: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-[var(--background-primary)]">
      {/* Mobile sidebar */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-[var(--gray-900)]/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-[var(--background-primary)] border-r border-[var(--border-primary)] px-6 pb-4">
                  <div className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--border-primary)]">
                    <Link href="/dashboard" className="flex items-center gap-2">
                      <img src="/logo.svg" alt="TenApp Logo" className="h-6 w-6" />
                      <span className="text-lg font-bold text-[var(--text-primary)]">
                        TenApp
                      </span>
                    </Link>
                    <ThemeToggle />
                  </div>
                  <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                      <li>
                        <ul role="list" className="-mx-2 space-y-1">
                          {navigation.map((item) => (
                            <li key={item.name}>
                              <Link
                                href={item.href}
                                className="group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-[var(--text-primary)] hover:bg-[var(--background-secondary)]"
                              >
                                <item.icon
                                  className="h-5 w-5 shrink-0 text-[var(--text-secondary)] group-hover:text-[var(--primary-600)]"
                                  aria-hidden="true"
                                />
                                {item.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </li>
                      <li className="mt-auto">
                        <button
                          onClick={handleSignOut}
                          className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-[var(--text-primary)] hover:bg-[var(--background-secondary)] hover:text-[var(--error-600)]"
                        >
                          <span className="truncate">Sign out</span>
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-[var(--background-primary)] border-r border-[var(--border-primary)] px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--border-primary)]">
            <Link href="/dashboard" className="flex items-center gap-2">
              <img src="/logo.svg" alt="TenApp Logo" className="h-6 w-6" />
              <span className="text-lg font-bold text-[var(--text-primary)]">
                TenApp
              </span>
            </Link>
            <ThemeToggle />
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-[var(--text-primary)] hover:bg-[var(--background-secondary)]"
                      >
                        <item.icon
                          className="h-5 w-5 shrink-0 text-[var(--text-secondary)] group-hover:text-[var(--primary-600)]"
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
              <li className="mt-auto">
                <button
                  onClick={handleSignOut}
                  className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-[var(--text-primary)] hover:bg-[var(--background-secondary)] hover:text-[var(--error-600)]"
                >
                  <span className="truncate">Sign out</span>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Mobile header */}
      <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-[var(--background-primary)] px-4 py-4 shadow-sm border-b border-[var(--border-primary)] sm:px-6 lg:hidden">
        <button
          type="button"
          className="-m-2.5 p-2.5 text-[var(--text-primary)] lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <span className="sr-only">Open sidebar</span>
          <Bars3Icon className="h-6 w-6" aria-hidden="true" />
        </button>
        <div className="flex-1 text-sm font-semibold leading-6 text-[var(--text-primary)]">
          <Link href="/dashboard" className="flex items-center gap-2">
            <img src="/logo.svg" alt="TenApp Logo" className="h-6 w-6" />
            <span>TenApp</span>
          </Link>
        </div>
        <ThemeToggle />
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        <main className="py-10">
          {children}
        </main>
      </div>
    </div>
  )
}
