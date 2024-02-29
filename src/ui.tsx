import { render } from '@create-figma-plugin/ui'
import { h } from 'preact'
import '!./output.css'

function Plugin () {
  return (
    <div>
      <h1 class="text-2xl font-bold">
        .mdファイルを読み込んでください
      </h1>
      <input type="file" id="fileInput" accept=".md" />
    </div>
  )
}

export default render(Plugin)
