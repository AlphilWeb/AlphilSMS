'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import {
  Table,
  TableRow,
  TableCell,
  TableHeader,
} from '@tiptap/extension-table';
import { useEffect, useState } from 'react';
import { FiImage, FiTable } from 'react-icons/fi';

interface TipTapEditorProps {
  content: string | { html: string; json: object };
  onChange: (content: { html: string; json: object }) => void;
}

export default function TipTapEditor({ content, onChange }: TipTapEditorProps) {
  const [mounted, setMounted] = useState(false);

const editor = useEditor({
  extensions: [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3],
      },
    }),
    Underline,
    Image.configure({
      HTMLAttributes: {
        class: 'rounded-lg my-2'
      }
    }),
    Table.configure({
      resizable: true,
      HTMLAttributes: {
        class: 'table-auto border-collapse border border-gray-300 my-2'
      },
    }),
    TableRow,
    TableHeader,
    TableCell.configure({
      HTMLAttributes: {
        class: 'border border-gray-300 px-4 py-2'
      }
    }),
  ],
  content: typeof content === 'string' ? content : content.html,
onUpdate({ editor }) {
  onChange({
    html: editor.getHTML(),
    json: editor.getJSON()
  });
},
  editorProps: {
    attributes: {
      class: 'prose max-w-none focus:outline-none min-h-[200px] p-2',
    },
  },
  // 👇 FIX FOR SSR ERROR
  immediatelyRender: false,
});

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const addImage = () => {
    const url = prompt('Enter image URL');
    if (url) {
      editor?.chain().focus().setImage({ src: url }).run();
    }
  };

  const addTable = () => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  if (!mounted || !editor) {
    return <div className="min-h-[200px] border rounded-lg p-4 bg-gray-50 animate-pulse"></div>;
  }

  return (
    <div className="text-black border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 bg-gray-50">
        {/* Text Formatting */}
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded-md hover:bg-gray-200 transition-colors ${
            editor.isActive('bold') ? 'bg-emerald-100 text-emerald-800' : 'text-gray-700'
          }`}
          title="Bold"
        >
          <span className="font-bold">B</span>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded-md hover:bg-gray-200 transition-colors ${
            editor.isActive('italic') ? 'bg-emerald-100 text-emerald-800' : 'text-gray-700'
          }`}
          title="Italic"
        >
          <span className="italic">I</span>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-2 rounded-md hover:bg-gray-200 transition-colors ${
            editor.isActive('underline') ? 'bg-emerald-100 text-emerald-800' : 'text-gray-700'
          }`}
          title="Underline"
        >
          <span className="underline">U</span>
        </button>

        {/* Headings */}
        <div className="border-l border-gray-300 h-6 my-1 mx-1"></div>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-2 rounded-md hover:bg-gray-200 transition-colors ${
            editor.isActive('heading', { level: 1 }) ? 'bg-emerald-100 text-emerald-800' : 'text-gray-700'
          }`}
          title="Heading 1"
        >
          <span className="font-semibold">H1</span>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded-md hover:bg-gray-200 transition-colors ${
            editor.isActive('heading', { level: 2 }) ? 'bg-emerald-100 text-emerald-800' : 'text-gray-700'
          }`}
          title="Heading 2"
        >
          <span className="font-semibold">H2</span>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-2 rounded-md hover:bg-gray-200 transition-colors ${
            editor.isActive('heading', { level: 3 }) ? 'bg-emerald-100 text-emerald-800' : 'text-gray-700'
          }`}
          title="Heading 3"
        >
          <span className="font-semibold">H3</span>
        </button>

        {/* Lists */}
        <div className="border-l border-gray-300 h-6 my-1 mx-1"></div>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded-md hover:bg-gray-200 transition-colors ${
            editor.isActive('bulletList') ? 'bg-emerald-100 text-emerald-800' : 'text-gray-700'
          }`}
          title="Bullet List"
        >
          <span className="font-semibold">•</span>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded-md hover:bg-gray-200 transition-colors ${
            editor.isActive('orderedList') ? 'bg-emerald-100 text-emerald-800' : 'text-gray-700'
          }`}
          title="Numbered List"
        >
          <span className="font-semibold">1.</span>
        </button>

        {/* Media */}
        <div className="border-l border-gray-300 h-6 my-1 mx-1"></div>
        <button
          onClick={addImage}
          className={`p-2 rounded-md hover:bg-gray-200 transition-colors ${
            editor.isActive('image') ? 'bg-pink-100 text-pink-800' : 'text-gray-700'
          }`}
          title="Insert Image"
        >
          <FiImage className="w-4 h-4" />
        </button>
        <button
          onClick={addTable}
          className={`p-2 rounded-md hover:bg-gray-200 transition-colors ${
            editor.isActive('table') ? 'bg-pink-100 text-pink-800' : 'text-gray-700'
          }`}
          title="Insert Table"
        >
          <FiTable className="w-4 h-4" />
        </button>
        {editor.isActive('table') && (
          <button
            onClick={() => editor.chain().focus().deleteTable().run()}
            className="p-2 rounded-md hover:bg-red-100 text-red-600 transition-colors"
            title="Delete Table"
          >
            <span className="text-xs font-semibold">Del Table</span>
          </button>
        )}
      </div>

      {/* Editor Content */}
      <div className="p-4">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}