import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // ДОБАВЬТЕ ЭТУ СЕКЦИЮ
  safelist: [
    'fill-emerald-500', 'text-emerald-500',
    'fill-yellow-400', 'text-yellow-400',
    'fill-red-600', 'text-red-600',
    'fill-gray-400', 'text-gray-400',
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
export default config
