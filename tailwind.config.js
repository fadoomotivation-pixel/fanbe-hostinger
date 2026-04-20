export default {
  content: ['./index.html','./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter','system-ui','sans-serif'] },
      colors: {
        brand: { DEFAULT:'#1d4ed8', hover:'#1e40af', light:'#dbeafe' },
        sidebar: { DEFAULT:'#0f172a', hover:'#1e293b', active:'#1e40af', border:'#1e293b', text:'#94a3b8', 'text-active':'#f1f5f9' }
      }
    }
  },
  plugins: []
}