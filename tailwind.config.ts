import type { Config } from 'tailwindcss'

export default {
  content: ['./app/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [
    /* eslint-disable */
    require('tailwind-scrollbar')({ 
      preferredStrategy: 'pseudoelements' 
    }),
  ],
} satisfies Config

