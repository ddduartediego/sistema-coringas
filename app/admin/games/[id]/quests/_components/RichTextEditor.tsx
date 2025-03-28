'use client';

import { useEffect, useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<any>(null);
  
  const handleEditorChange = (content: string) => {
    onChange(content);
  };

  return (
    <div className="min-h-[300px] border rounded-md">
      <Editor
        apiKey="94olm4pfn812479sqrgoyqmqs4h5rn4w0rypkdje52kbgkc4" // Substitua com sua chave API real do TinyMCE Cloud
        onInit={(evt, editor) => editorRef.current = editor}
        initialValue={value || ''}
        value={value}
        onEditorChange={handleEditorChange}
        init={{
          height: 300,
          menubar: true,
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
          ],
          toolbar: 'undo redo | blocks | ' +
            'bold italic forecolor | alignleft aligncenter ' +
            'alignright alignjustify | bullist numlist outdent indent | ' +
            'removeformat table image link | help',
          content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
          placeholder: placeholder,
          branding: false,
          promotion: false,
          browser_spellcheck: true,
          contextmenu: false,
          resize: true,
          paste_data_images: true,
          entity_encoding: 'raw',
          convert_urls: false,
          relative_urls: false,
          remove_script_host: false,
          skin: 'oxide', // tema claro
          setup: (editor) => {
            editor.on('Placeholder', function(e) {
              e.preventDefault();
              if (!editor.getContent()) {
                const placeholderText = placeholder || 'Digite o conteúdo aqui...';
                editor.setContent(`<span class="tox-placeholder">${placeholderText}</span>`);
              }
            });
          }
        }}
      />
    </div>
  );
} 