export default function ContadorEstado({ label, count, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`${color} border rounded-xl p-4 text-left transition-all hover:shadow-md hover:-translate-y-0.5 w-full`}
    >
      <p className="text-3xl font-bold">{count}</p>
      <p className="text-sm font-medium mt-1 opacity-80">{label}</p>
    </button>
  )
}
