import { showUI } from '@create-figma-plugin/utilities'

export default function () {
  showUI({
    height: 240,
    width: 360
  })
}

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'upload-md') {
    const text = msg.content; // UIから送信されたファイルの内容

    // Markdownテキストが特定のヘッダーで始まるかどうかをチェック
    if (text.startsWith('---\nmarp: true\n---')) {
      // 'ひな形'という名前のフレームを検索
      const templateFrame = figma.currentPage.findOne(node => node.type === "FRAME" && node.name === "ひな形");
      if (!templateFrame) {
        console.log('「ひな形」という名前のフレームが見つかりませんでした。');
        return;
      }

      // テキストを '---' で分割し、最初のヘッダー部分と最初のセクションを除去
      const sections = text.split('---').slice(2);

      let row = 0; // 現在の行
      let column = 0; // 現在の列

      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        // フレームを複製して連番の名前を付ける
        const clonedFrame = templateFrame.clone();
        clonedFrame.name = `Slide ${(i + 1).toString().padStart(3, '0')}`; // 001, 002, ...

        // 横に10個並べ、10個で次の行へ
        if (i % 10 === 0 && i !== 0) {
          row++;
          column = 0;
        }

        clonedFrame.x = templateFrame.x + (clonedFrame.width + 100) * column; // 横に並べる
        clonedFrame.y = templateFrame.y + templateFrame.height + 200 + (row * (clonedFrame.height + 200)); // 縦に並べる

        figma.currentPage.appendChild(clonedFrame);

// テキストノードを作成して複製したフレームに追加
        const textNode = figma.createText();
        await figma.loadFontAsync({ family: "Inter", style: "Regular" });

// テキストの内容からフォントサイズを決定
        let fontSize = 40; // デフォルトのフォントサイズ
        const trimmedText = section.trim();
        if (trimmedText.startsWith('# ')) {
          fontSize = 100; // 見出し1
        } else if (trimmedText.startsWith('## ')) {
          fontSize = 56; // 見出し2
        } else if (trimmedText.startsWith('### ')) {
          fontSize = 48; // 見出し3
        }

// フォントサイズを設定
        textNode.fontSize = fontSize;

// テキストノードにテキストを設定
        textNode.characters = trimmedText.replace(/^#+\s/, ''); // 見出し記号を削除

// テキストノードのサイズと位置を調整するために、レイアウトが完了するのを待つ
        if ('appendChild' in clonedFrame) {
          clonedFrame.appendChild(textNode);
          // await textNode.syncFontGeometryWithTextAsync(); // テキストのジオメトリを同期

          // テキストノードをフレームの中央に配置
          const textWidth = textNode.width;
          const textHeight = textNode.height;
          textNode.x = (clonedFrame.width - textWidth) / 2;
          textNode.y = (clonedFrame.height - textHeight) / 2;
        }


        column++; // 次の列へ
      }

    } else {
      console.log('このMarkdownファイルは指定されたフォーマットに一致しません。');
    }
  }
};