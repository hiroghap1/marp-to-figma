import { render } from '@create-figma-plugin/ui'
import { h } from 'preact'
import '!./output.css'
import JSX = h.JSX;

function Plugin () {

  const handleFileChange = (event: JSX.TargetedEvent<HTMLInputElement, Event>) => {
    const file = event.currentTarget.files?.[0];
    if (!file) {
      console.error('ファイルが選択されていません。');
      return;
    }

    const reader = new FileReader();
    reader.onload = function(loadEvent) {
      // @ts-ignore
      const content = loadEvent.target.result;
      // console.log(content);
      parent.postMessage({ pluginMessage: { type: 'upload-md', content: content } }, '*');
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <h1 class="text-2xl font-bold">
        .mdファイルを読み込んでください
      </h1>
      <input type="file" id="fileInput" accept=".md" onChange={handleFileChange} />
    </div>
  )
}

export default render(Plugin)
