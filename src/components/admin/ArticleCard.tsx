import { actions } from "astro:actions";

interface Props {
  post: {
    id: string;
    title: string;
    author: string;
    category: string | null;
    status: string;
    created_at: any;
  };
}

export default function ArticleCard({ post }: Props) {
  const formatDate = (date: any) => {
    return new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div class="bg-white p-4 md:p-6 rounded-[1.5rem] border border-slate-200 shadow-sm hover:shadow-md transition-all group">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Kolom Kiri: Info */}
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200">
              {post.category || 'No Category'}
            </span>
            <span class={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
              post.status === 'published' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
              post.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
              'bg-slate-50 text-slate-400'
            }`}>
              {post.status}
            </span>
          </div>
          <h3 class="font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors truncate">{post.title}</h3>
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{post.author} • {formatDate(post.created_at)}</p>
        </div>

        {/* Kolom Kanan: Aksi */}
        <div class="flex flex-wrap md:flex-nowrap items-center gap-2 shrink-0">
          <a href={`/admin/posts/edit/${post.id}`} class="flex-1 md:flex-none px-4 py-2.5 bg-slate-50 text-slate-700 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-all text-center">Edit</a>
          
          {post.status === 'pending' && (
            <>
              <form method="POST" action={actions.approvePost} class="flex-1 md:flex-none m-0">
                <input type="hidden" name="id" value={post.id} />
                <button type="submit" class="w-full px-4 py-2.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all">Publish</button>
              </form>

              <form 
                method="POST" 
                action={actions.rejectPost} 
                class="flex-1 md:flex-none m-0" 
                onSubmit={(e: any) => {
                  const r = prompt('Alasan penolakan:'); 
                  if(!r) {
                    e.preventDefault();
                    return;
                  }
                  e.target.reason.value = r;
                }}
              >
                <input type="hidden" name="id" value={post.id} />
                <input type="hidden" name="reason" value="" />
                <button type="submit" class="w-full px-4 py-2.5 bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-amber-100 transition-all">Tolak</button>
              </form>
            </>
          )}

          <form 
            method="POST" 
            action={actions.deletePost} 
            class="flex-1 md:flex-none m-0" 
            onSubmit={(e: any) => {
              if(!confirm('Hapus artikel ini?')) e.preventDefault();
            }}
          >
            <input type="hidden" name="id" value={post.id} />
            <button type="submit" class="w-full px-4 py-2.5 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-100 transition-all">Hapus</button>
          </form>
        </div>
      </div>
    </div>
  );
}
