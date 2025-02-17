import { Fragment, useState, useRef } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useUser } from '@/lib/hooks/useUser'
import {
  ImportPreviewData,
  ImportOptions,
  ImportError,
  ImportResult,
  ImportService
} from '@/lib/services/importService'
import type { Database } from '@/lib/types/database'

type Tables = Database['public']['Tables']
type Account = Tables['accounts']['Row']

interface ImportTransactionsModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  accounts: Account[]
}

export function ImportTransactionsModal({
  isOpen,
  onClose,
  onSuccess,
  accounts
}: ImportTransactionsModalProps) {
  const { user } = useUser()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<ImportPreviewData | null>(null)
  const [validationErrors, setValidationErrors] = useState<ImportError[]>([])
  const [canImport, setCanImport] = useState(false)
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    account_id: accounts[0]?.id || '',
    columnMap: {
      amount: '',
      type: '',
      description: '',
      date: '',
      category_id: ''
    },
    dateFormat: 'YYYY-MM-DD',
    skipFirstRow: true
  })

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const csvContent = e.target?.result as string
        if (!csvContent) {
          throw new Error('Failed to read file content')
        }

        // Parse CSV and get preview data
        const rows = csvContent.split('\n').map(row => row.split(','))
        const headers = rows[0]
        const data = rows.slice(1).map(row => {
          const rowData: Record<string, string> = {}
          headers.forEach((header, index) => {
            rowData[header.trim()] = row[index]?.trim() || ''
          })
          return rowData
        })

        setPreviewData({
          headers,
          rows: data,
          totalRows: data.length
        })
        setSelectedFile(file)
        setError(null)
      }
      reader.readAsText(file)
    } catch (error) {
      console.error('Error reading file:', error)
      setError('Failed to read file')
    }
  }

  const handleMappingChange = (header: string, field: string) => {
    const newImportOptions = { ...importOptions }
    switch (field) {
      case 'date':
        newImportOptions.columnMap.date = header
        break
      case 'description':
        newImportOptions.columnMap.description = header
        break
      case 'amount':
        newImportOptions.columnMap.amount = header
        break
      case 'type':
        newImportOptions.columnMap.type = header
        break
      case 'category':
        newImportOptions.columnMap.category_id = header
        break
      default:
        break
    }
    setImportOptions(newImportOptions)
  }

  const handleAccountChange = (accountId: string) => {
    setImportOptions(prev => ({ ...prev, account_id: accountId }))
  }

  const handleValidate = async () => {
    if (!previewData) return
    setValidationErrors([])

    try {
      const errors = await ImportService.validateImportData(previewData.rows, importOptions)
      setValidationErrors(errors)

      if (errors.length === 0) {
        setCanImport(true)
      } else {
        setCanImport(false)
      }
    } catch (error) {
      console.error('Validation error:', error)
      setError('Failed to validate transactions')
    }
  }

  const handleImport = async () => {
    if (!previewData || !user) return

    try {
      setLoading(true)

      if (!selectedFile || !importOptions.account_id) {
        throw new Error('Please select a file and account')
      }

      await ImportService.importTransactions(user.id, previewData, importOptions)
      onClose()
      onSuccess?.()
    } catch (error) {
      console.error('Error importing transactions:', error)
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-10 overflow-y-auto"
        onClose={onClose}
      >
        <div className="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <span
            className="hidden sm:inline-block sm:h-screen sm:align-middle"
            aria-hidden="true"
          >
            &#8203;
          </span>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
              <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                <button
                  type="button"
                  className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  onClick={onClose}
                >
                  <span className="sr-only">Close</span>
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              <div className="sm:flex sm:items-start">
                <div className="mt-3 w-full text-center sm:ml-4 sm:mt-0 sm:text-left">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Import Transactions
                  </Dialog.Title>

                  {error && (
                    <div className="mt-2">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  <div className="mt-4">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      ref={fileInputRef}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex w-full justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:text-sm"
                      disabled={loading}
                    >
                      {loading ? 'Uploading...' : 'Select CSV File'}
                    </button>
                  </div>

                  <div className="mt-4">
                    <label htmlFor="account" className="block text-sm font-medium text-gray-700">
                      Account
                    </label>
                    <select
                      id="account"
                      name="account"
                      value={importOptions.account_id}
                      onChange={(e) => handleAccountChange(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                    >
                      <option value="">Select Account</option>
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {previewData && (
                    <div>
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-900">
                          Map CSV Columns
                        </h4>
                        {previewData.headers.map(header => (
                          <div
                            key={header}
                            className="mt-2 flex items-center space-x-2"
                          >
                            <span className="text-sm text-gray-500">
                              {header}
                            </span>
                            <select
                              value={
                                importOptions.columnMap.date === header
                                  ? 'date'
                                  : importOptions.columnMap.description ===
                                    header
                                  ? 'description'
                                  : importOptions.columnMap.amount ===
                                    header
                                  ? 'amount'
                                  : importOptions.columnMap.type ===
                                    header
                                  ? 'type'
                                  : importOptions.columnMap.category_id ===
                                    header
                                  ? 'category'
                                  : ''
                              }
                              onChange={e =>
                                handleMappingChange(header, e.target.value)
                              }
                              className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                            >
                              <option value="">Select Field</option>
                              <option value="date">Date</option>
                              <option value="description">
                                Description
                              </option>
                              <option value="amount">Amount</option>
                              <option value="type">Type</option>
                              <option value="category">Category</option>
                            </select>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={handleValidate}
                          className="inline-flex w-full justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:text-sm"
                          disabled={loading}
                        >
                          {loading ? 'Validating...' : 'Validate Mapping'}
                        </button>
                      </div>

                      {validationErrors.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium text-red-800">
                            Validation Errors
                          </h4>
                          <ul className="mt-2 list-inside list-disc text-sm text-red-700">
                            {validationErrors.map((error, index) => (
                              <li key={index}>
                                Row {error.row}: {error.message}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {canImport && (
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={handleImport}
                        className="inline-flex w-full justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:text-sm"
                        disabled={loading}
                      >
                        {loading ? 'Importing...' : 'Import Transactions'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
