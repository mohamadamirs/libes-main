import { actions } from "astro:actions";

interface Props {
  user: {
    id: string;
    full_name: string;
    email: string;
    role: string;
  };
}

export default function UserCard({ user }: Props) {
  return (
    <div class="bg-white p-4 md:p-6 rounded-[1.5rem] border border-slate-200 shadow-sm hover:shadow-md transition-all">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Kolom Kiri: Info */}
        <div class="flex-1 flex items-center gap-4">
          <div class="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-slate-400 uppercase shrink-0">
            {user.full_name[0]}
          </div>
          <div class="min-w-0">
            <h3 class="font-bold text-slate-900 leading-tight truncate">{user.full_name}</h3>
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-tight truncate">
              {user.email} • <span class={user.role === 'admin' ? 'text-indigo-600' : 'text-slate-500'}>{user.role}</span>
            </p>
          </div>
        </div>

        {/* Kolom Kanan: Aksi */}
        <div class="flex items-center gap-2 shrink-0">
          <a href={`/admin/users/edit/${user.id}`} class="px-4 py-2.5 bg-slate-50 text-slate-700 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-all text-center">Edit</a>
          
          <form 
            method="POST" 
            action={actions.deleteUser} 
            class="m-0"
            onSubmit={(e: any) => {
              if(!confirm(`Hapus user "${user.full_name}"? Semua data tulisannya juga akan terhapus.`)) {
                e.preventDefault();
              }
            }}
          >
            <input type="hidden" name="id" value={user.id} />
            <button type="submit" class="px-4 py-2.5 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-100 transition-all">Hapus</button>
          </form>
          
          <div class="hidden md:block ml-2 text-[10px] font-black text-slate-300 uppercase tracking-widest px-3 py-1 border border-slate-100 rounded-lg">
            ID: {user.id.split('-')[0]}
          </div>
        </div>
      </div>
    </div>
  );
}
