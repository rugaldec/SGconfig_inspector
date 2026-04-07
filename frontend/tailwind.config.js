/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        estado: {
          abierto: '#3B82F6',
          engestion: '#F59E0B',
          pendiente: '#8B5CF6',
          cerrado: '#10B981',
          rechazado: '#EF4444',
        },
        criticidad: {
          baja: '#6B7280',
          media: '#F59E0B',
          alta: '#F97316',
          critica: '#EF4444',
        },
      },
    },
  },
  plugins: [],
}
