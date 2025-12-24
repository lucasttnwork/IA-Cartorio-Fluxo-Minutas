import Breadcrumb from '../components/common/Breadcrumb'

export default function TestBreadcrumbPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Breadcrumb Navigation - UI Test Page
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            This page demonstrates the breadcrumb navigation styling component.
          </p>
        </div>

        {/* Default Breadcrumb Style */}
        <div className="card p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Default Breadcrumb Style
          </h2>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <Breadcrumb />
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Note: Breadcrumb is context-aware and shows based on current route.
            On this test page, it may not display items since we're not in a case context.
          </p>
        </div>

        {/* Static Breadcrumb Examples */}
        <div className="card p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Breadcrumb Style Examples (Static)
          </h2>

          {/* Example 1: Simple */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Simple Navigation
            </h3>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <nav className="breadcrumb" aria-label="Breadcrumb">
                <ol className="breadcrumb-list">
                  <li className="breadcrumb-item">
                    <a href="#" className="breadcrumb-link">
                      <svg className="breadcrumb-icon" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                      </svg>
                      <span className="breadcrumb-text">Dashboard</span>
                    </a>
                  </li>
                  <li className="breadcrumb-item">
                    <svg className="breadcrumb-separator" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                    <span className="breadcrumb-current">
                      <span className="breadcrumb-text">Current Page</span>
                    </span>
                  </li>
                </ol>
              </nav>
            </div>
          </div>

          {/* Example 2: With Case */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Case Navigation
            </h3>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <nav className="breadcrumb" aria-label="Breadcrumb">
                <ol className="breadcrumb-list">
                  <li className="breadcrumb-item">
                    <a href="#" className="breadcrumb-link">
                      <svg className="breadcrumb-icon" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                      </svg>
                      <span className="breadcrumb-text">Dashboard</span>
                    </a>
                  </li>
                  <li className="breadcrumb-item">
                    <svg className="breadcrumb-separator" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                    <a href="#" className="breadcrumb-link">
                      <span className="breadcrumb-text">Compra e Venda - Lote 45</span>
                    </a>
                  </li>
                  <li className="breadcrumb-item">
                    <svg className="breadcrumb-separator" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                    <span className="breadcrumb-current">
                      <span className="breadcrumb-text">Entities</span>
                    </span>
                  </li>
                </ol>
              </nav>
            </div>
          </div>

          {/* Example 3: With Divider Style */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Divider Style (Alternative)
            </h3>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <nav className="breadcrumb breadcrumb-divider" aria-label="Breadcrumb">
                <ol className="breadcrumb-list">
                  <li className="breadcrumb-item">
                    <a href="#" className="breadcrumb-link">
                      <svg className="breadcrumb-icon" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                      </svg>
                      <span className="breadcrumb-text">Dashboard</span>
                    </a>
                  </li>
                  <li className="breadcrumb-item">
                    <svg className="breadcrumb-separator" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                    <a href="#" className="breadcrumb-link">
                      <span className="breadcrumb-text">Case #12345</span>
                    </a>
                  </li>
                  <li className="breadcrumb-item">
                    <svg className="breadcrumb-separator" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                    <span className="breadcrumb-current">
                      <span className="breadcrumb-text">Draft</span>
                    </span>
                  </li>
                </ol>
              </nav>
            </div>
          </div>
        </div>

        {/* CSS Classes Reference */}
        <div className="card p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            CSS Classes Reference
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="text-left py-2 pr-4 font-medium text-gray-900 dark:text-white">Class</th>
                  <th className="text-left py-2 font-medium text-gray-900 dark:text-white">Description</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 dark:text-gray-400">
                <tr className="border-b dark:border-gray-700">
                  <td className="py-2 pr-4"><code className="text-blue-600 dark:text-blue-400">.breadcrumb</code></td>
                  <td className="py-2">Main container for breadcrumb navigation</td>
                </tr>
                <tr className="border-b dark:border-gray-700">
                  <td className="py-2 pr-4"><code className="text-blue-600 dark:text-blue-400">.breadcrumb-list</code></td>
                  <td className="py-2">Ordered list containing breadcrumb items</td>
                </tr>
                <tr className="border-b dark:border-gray-700">
                  <td className="py-2 pr-4"><code className="text-blue-600 dark:text-blue-400">.breadcrumb-item</code></td>
                  <td className="py-2">Individual breadcrumb item wrapper</td>
                </tr>
                <tr className="border-b dark:border-gray-700">
                  <td className="py-2 pr-4"><code className="text-blue-600 dark:text-blue-400">.breadcrumb-link</code></td>
                  <td className="py-2">Clickable link with hover effects</td>
                </tr>
                <tr className="border-b dark:border-gray-700">
                  <td className="py-2 pr-4"><code className="text-blue-600 dark:text-blue-400">.breadcrumb-current</code></td>
                  <td className="py-2">Current/active page (non-clickable)</td>
                </tr>
                <tr className="border-b dark:border-gray-700">
                  <td className="py-2 pr-4"><code className="text-blue-600 dark:text-blue-400">.breadcrumb-separator</code></td>
                  <td className="py-2">Chevron separator between items</td>
                </tr>
                <tr className="border-b dark:border-gray-700">
                  <td className="py-2 pr-4"><code className="text-blue-600 dark:text-blue-400">.breadcrumb-icon</code></td>
                  <td className="py-2">Icon displayed before text</td>
                </tr>
                <tr className="border-b dark:border-gray-700">
                  <td className="py-2 pr-4"><code className="text-blue-600 dark:text-blue-400">.breadcrumb-text</code></td>
                  <td className="py-2">Text label with truncation support</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4"><code className="text-blue-600 dark:text-blue-400">.breadcrumb-divider</code></td>
                  <td className="py-2">Alternative style with background container</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Feature Checklist */}
        <div className="card p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Feature Checklist
          </h2>
          <ul className="space-y-2">
            {[
              'Responsive design with text truncation',
              'Dark mode support',
              'Hover effects on clickable items',
              'Icon support for navigation items',
              'Chevron separators between items',
              'Current page highlighting (bold text)',
              'Alternative divider style variant',
              'Proper accessibility with aria-label',
              'Smooth color transitions',
            ].map((feature, index) => (
              <li key={index} className="flex items-center text-gray-600 dark:text-gray-400">
                <svg className="w-5 h-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
