'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md mx-auto text-center">
            <div className="mb-8">
              <h1 className="text-6xl font-bold text-red-600 mb-2">500</h1>
              <h2 className="text-2xl font-semibold text-gray-600 mb-4">Something went wrong!</h2>
              <p className="text-gray-500 mb-8">
                An unexpected error occurred. Please try again.
              </p>
              <button
                onClick={() => reset()}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}