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
      const sections = content.split('---');
      const headerSection = sections[1]; // 最初の '---' に囲まれたセクション
      const lines = headerSection.split('\n');
      const config:{[key: string]: string} = {};

      for (const line of lines) {
        const [key, rawValue] = line.split(':').map(part => part.trim());
        if (key && rawValue) {
          let value: any = rawValue;

          // "true"または"false"の文字列をブール値に変換
          if (rawValue === "true" || rawValue === "false") {
            value = rawValue === "true";
          }

          // 数値の文字列を数値に変換
          else if (!isNaN(Number(rawValue))) {
            value = Number(rawValue);
          }

          // クォーテーションで囲まれた文字列からクォーテーションを削除
          else if (rawValue.startsWith('"') && rawValue.endsWith('"')) {
            value = rawValue.slice(1, -1);
          }

          config[key] = value;
        }
      }

      if (typeof config['marp'] === 'boolean' && config['marp'] === true) {
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
