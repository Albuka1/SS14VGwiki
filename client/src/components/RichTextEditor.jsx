import { useEffect, useRef } from 'react';

import Quill from 'quill';
import 'quill/dist/quill.snow.css';

const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['blockquote', 'code-block', 'link', 'image'],
  [{ align: [] }],
  ['clean']
];

export default function RichTextEditor({ onChange, value }) {
  const hostRef = useRef(null);
  const quillRef = useRef(null);
  const changeHandlerRef = useRef(onChange);
  const valueRef = useRef(value);

  useEffect(() => {
    changeHandlerRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    if (!hostRef.current || quillRef.current) {
      return undefined;
    }

    const editorRoot = document.createElement('div');
    hostRef.current.appendChild(editorRoot);

    const quill = new Quill(editorRoot, {
      theme: 'snow',
      placeholder: 'Напишите содержание страницы...',
      modules: {
        toolbar: TOOLBAR_OPTIONS
      }
    });

    quill.root.innerHTML = value || '';
    quill.on('text-change', () => {
      const nextValue = quill.root.innerHTML === '<p><br></p>' ? '' : quill.root.innerHTML;
      valueRef.current = nextValue;
      changeHandlerRef.current(nextValue);
    });

    quillRef.current = quill;

    return () => {
      quillRef.current = null;

      if (hostRef.current) {
        hostRef.current.innerHTML = '';
      }
    };
  }, []);

  useEffect(() => {
    if (!quillRef.current) {
      return;
    }

    const nextValue = value || '';

    if (valueRef.current === nextValue) {
      return;
    }

    quillRef.current.root.innerHTML = nextValue;
    valueRef.current = nextValue;
  }, [value]);

  return (
    <div className="editor-surface overflow-hidden rounded-[30px] border border-cyan-300/12 shadow-[0_24px_70px_rgba(2,6,23,0.5)]">
      <div ref={hostRef} />
    </div>
  );
}
