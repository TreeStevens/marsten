export default function Inventory({ items }) {
  return (
    <div>
      <h3 className="text-bone-400 text-xs font-bold uppercase tracking-wider mb-2">
        Inventory ({items.length})
      </h3>
      {items.length === 0 ? (
        <p className="text-bone-500 text-xs italic text-center py-2">Empty pockets</p>
      ) : (
        <div className="space-y-1">
          {items.map(inv => (
            <div key={inv.id} className="bg-manor-800 rounded p-2 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-yellow-400">&#9670;</span>
                <span className="font-bold text-bone-200">{inv.items?.name}</span>
              </div>
              {inv.items?.description && (
                <p className="text-bone-400 mt-0.5 ml-4 leading-tight">{inv.items?.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
