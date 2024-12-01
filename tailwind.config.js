const plugin = require('tailwindcss/plugin');
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./nuxt.config.{js,ts}",
    "./app.vue",
  ],
  theme: {
    extend: {
      colors: {
        gray: {
          25:  "#fafafa",
          50:  "#f2f2f2",
          100: "#e6e6e6",
          200: "#cccccc",
          300: "#b3b3b3",
          400: "#999999",
          500: "#808080",
          600: "#666666",
          700: "#4d4d4d",
          800: "#333333",
          900: "#1a1a1a",
          925: "#0d0d0d",
        },
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: 'inherit',
            a: {
              color: 'inherit',
              textDecoration: 'underline',
              fontWeight: '500',
            },
            ul: {
              listStyleType: 'disc',
              paddingLeft: '1.5em'
            },
            ol: {
              paddingLeft: '1.5em'
            },
            li: {
              marginTop: '0.25em',
              marginBottom: '0.25em'
            }
          }
        }
      }
    },
  },
  variants: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/typography'),
    plugin(function({ addUtilities }) {
      addUtilities({
        '.bg-green-striped': {
          'background-image': `linear-gradient(45deg, #0a2000 10%, transparent 10%,
            transparent 20%, #0a2000 20%, #0a2000 30%, transparent 30%, transparent 40%,
            #0a2000 40%, #0a2000 50%, transparent 50%, transparent 60%, #0a2000 60%,
            #0a2000 70%, transparent 70%, transparent 80%, #0a2000 80%, #0a2000 90%,
            transparent 90%, transparent)`,
        },
      })
    })
  ],
}