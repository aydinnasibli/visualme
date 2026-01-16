import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#a7f3d0",
        "primary-dark": "#6ee7b7",
        "accent-warm": "#d6d3d1",
        "background-dark": "#0c0a09",
        "surface-dark": "#1c1917",
        "surface-darker": "#151312",
        "border-color": "#292524",
        "subtle-green": "#57756f",
      },
      fontFamily: {
        "display": ["Space Grotesk", "sans-serif"]
      },
      borderRadius: {"DEFAULT": "0.5rem", "lg": "1rem", "xl": "1.5rem", "2xl": "2rem", "full": "9999px"},
    },
  },
  plugins: [],
}
export default config
