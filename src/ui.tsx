import { render } from '@create-figma-plugin/ui'
import { h, Fragment } from 'preact'
import { useState } from 'preact/hooks'
import '!./output.css'
import JSX = h.JSX;

function Plugin () {
  const [errorMessage, setErrorMessage] = useState('');

  const handleFileChange = (event: JSX.TargetedEvent<HTMLInputElement, Event>) => {
    setErrorMessage(''); // エラーメッセージをリセット
    const file = event.currentTarget.files?.[0];
    if (!file) {
      setErrorMessage('ファイルが選択されていません。');
      return;
    }

    const reader = new FileReader();
    reader.onload = function(loadEvent) {
      const content = loadEvent.target?.result as string;
      if (content.startsWith('---\nmarp: true\n---')) {
        parent.postMessage({ pluginMessage: { type: 'upload-md', content } }, '*');
      } else {
        setErrorMessage('このファイルはMarp対応のMarkdownフォーマットではありません。');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div class="p-4">
      <h1 class="text-xl font-bold mb-2">
        .mdファイルを読み込んでください
      </h1>
      <input type="file" id="fileInput" accept=".md" onChange={handleFileChange} />
      {errorMessage && <p class="text-red-500 mt-2">{errorMessage}</p>}
    </div>
  )
}

export default render(Plugin)
