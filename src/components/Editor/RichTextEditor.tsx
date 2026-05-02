import { useState, useEffect, useRef } from 'preact/hooks';

interface Props {
  name: string;
  value?: string;
  placeholder?: string;
}

declare global {
  interface Window {
    Quill: any;
  }
}

export default function RichTextEditor({ name, value = "", placeholder = "Tulis ceritamu di sini..." }: Props) {
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [content, setContent] = useState(value);
  const quillRef = useRef<HTMLDivElement>(null);
  const quillInstance = useRef<any>(null);

  useEffect(() => {
    // Tunggu sampai Quill tersedia secara global (dimuat lewat script tag di Astro)
    const initQuill = () => {
      if (!window.Quill || !quillRef.current || quillInstance.current) return;

      const quill = new window.Quill(quillRef.current, {
        theme: 'snow',
        placeholder: placeholder,
        modules: {
          toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['link', 'image'],
            ['clean']
          ]
        }
      });

      if (value) {
        quill.root.innerHTML = value;
      }

      quill.on('text-change', () => {
        setContent(quill.root.innerHTML);
      });

      quillInstance.current = quill;
    };

    // Coba inisialisasi
    if (window.Quill) {
      initQuill();
    } else {
      const interval = setInterval(() => {
        if (window.Quill) {
          initQuill();
          clearInterval(interval);
        }
      }, 100);
    }
  }, []);

  return (
    <div className="rich-text-container space-y-4">
      {/* Tabs Header */}
      <div className="flex p-1 bg-slate-100 rounded-xl w-fit border border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('write')}
          className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
            activeTab === 'write' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Ketik
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
            activeTab === 'preview' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Preview
        </button>
      </div>

      {/* Editor / Preview Area */}
      <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden min-h-[400px]">
        {/* Mode Ketik (Quill) - Kita gunakan hidden agar instance Quill tidak hancur saat pindah tab */}
        <div className={activeTab === 'write' ? 'block' : 'hidden'}>
          <div ref={quillRef} className="quill-editor-inner"></div>
        </div>

        {/* Mode Preview (Prose) */}
        {activeTab === 'preview' && (
          <div className="p-8 md:p-12 animate-in fade-in duration-300">
            <article 
              className="prose prose-slate prose-lg md:prose-xl max-w-none 
                         prose-headings:font-black prose-headings:tracking-tight 
                         prose-p:leading-relaxed prose-p:text-slate-600 
                         prose-img:rounded-3xl prose-img:shadow-xl
                         prose-blockquote:border-l-4 prose-blockquote:border-blue-600 
                         prose-blockquote:bg-blue-50/50 prose-blockquote:p-8 
                         prose-blockquote:rounded-r-3xl prose-blockquote:italic"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
        )}
      </div>

      {/* Input tersembunyi untuk form submission */}
      <input type="hidden" name={name} value={content === '<p><br></p>' ? '' : content} />
    </div>
  );
}
