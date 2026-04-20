export function Table({columns,data,loading,emptyMsg='No records found.',onRowClick}:any){
  if(loading)return <div className="py-16 text-center text-gray-400 text-sm">Loading…</div>
  return(
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="bg-gray-50 border-y border-gray-100">{columns.map((c:any)=><th key={c.key||c.header} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{c.header}</th>)}</tr></thead>
        <tbody className="divide-y divide-gray-50">
          {!data?.length?<tr><td colSpan={columns.length} className="py-12 text-center text-gray-400">{emptyMsg}</td></tr>
          :data.map((row:any,i:number)=><tr key={row.id||i} onClick={()=>onRowClick?.(row)} className={`hover:bg-blue-50/40 transition-colors ${onRowClick?'cursor-pointer':''}`}>{columns.map((c:any)=><td key={c.key||c.header} className="px-4 py-3 text-gray-700 whitespace-nowrap">{c.render?c.render(row):row[c.key]}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
  )
}