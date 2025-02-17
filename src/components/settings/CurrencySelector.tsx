import { Fragment, useState } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'
import { currencies, Currency, formatCurrency } from '@/lib/currency/currencies'
import { useAuth } from '@/lib/auth/AuthProvider'

export default function CurrencySelector() {
  const { user, updateProfile } = useAuth()
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(
    currencies[user?.user_metadata?.currency as string || 'USD']
  )
  const [loading, setLoading] = useState(false)

  const handleCurrencyChange = async (currency: Currency) => {
    setLoading(true)
    try {
      const { error } = await updateProfile({
        currency: currency.code,
      })
      if (!error) {
        setSelectedCurrency(currency)
      }
    } catch (error) {
      console.error('Error updating currency:', error)
    }
    setLoading(false)
  }

  const currencyList = Object.values(currencies)

  return (
    <div className="w-full max-w-sm">
      <Listbox value={selectedCurrency} onChange={handleCurrencyChange} disabled={loading}>
        <div className="relative mt-1">
          <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left border border-gray-300 focus:outline-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-300 sm:text-sm">
            <span className="block truncate">
              {selectedCurrency.name} ({selectedCurrency.code}) - 
              {formatCurrency(1000, selectedCurrency.code, {
                useNativeSymbol: true,
              })}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </span>
          </Listbox.Button>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-10">
              {currencyList.map((currency) => (
                <Listbox.Option
                  key={currency.code}
                  className={({ active }) =>
                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                      active ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                    }`
                  }
                  value={currency}
                >
                  {({ selected }) => (
                    <>
                      <span
                        className={`block truncate ${
                          selected ? 'font-medium' : 'font-normal'
                        }`}
                      >
                        {currency.name} ({currency.code}) - 
                        {formatCurrency(1000, currency.code, {
                          useNativeSymbol: true,
                        })}
                      </span>
                      {selected ? (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
      {loading && (
        <p className="mt-2 text-sm text-gray-500">Updating currency...</p>
      )}
    </div>
  )
}
