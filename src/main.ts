import { showUI } from '@create-figma-plugin/utilities'

// 設定
const fontSettings = {
  h1: {
    size: 100,
    family: 'Noto Sans JP',
    style: 'Bold',
  },
  h2: {
    size: 56,
    family: 'Noto Sans JP',
    style: 'Bold',
  },
  h3: {
    size: 48,
    family: 'Noto Sans JP',
    style: 'Bold',
  },
  base: {
    size: 40,
    family: 'Noto Sans JP',
    style: 'Bold',
  }
};

export default function () {
  showUI({
    height: 240,
    width: 360
  })
}

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'upload-md') {
    const text = msg.content;
    const sections = text.split('---');
    const headerSection = sections[1];
    const lines = headerSection.split('\n');
    const config:{[key: string]: string} = {};

    for (const line of lines) {
      const [key, rawValue] = line.split(':').map((part: string) => part.trim());
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
    console.log(config);

    // Markdownテキストが特定のヘッダーで始まるかどうかをチェック
    if (typeof config['marp'] === 'boolean' && config['marp'] === true) {
      // 'ひな形'という名前のフレームを検索
      const templateFrame = figma.currentPage.findOne(node => node.type === "FRAME" && node.name === "ひな形");
      if (!templateFrame) {
        console.log('「ひな形」という名前のフレームが見つかりませんでした。');
        return;
      }
      await figma.loadFontAsync({ family: "Inter", style: "Regular" });
      await figma.loadFontAsync({ family: "Noto Sans JP", style: "Bold" });

      // 最初のヘッダー部分と最初のセクションを除去
      sections.splice(0, 2);

      let row = 0; // 現在の行
      let column = 0; // 現在の列

      for (let i = 0; i < sections.length; i++) {
        // フレームを複製して連番の名前を付ける
        const clonedFrame = templateFrame.clone();
        clonedFrame.name = `Slide ${(i + 1).toString().padStart(3, '0')}`; // 001, 002, ...
        let textNodes = [];

        const lines = sections[i].trim().split('\n').filter((line: any) => line); // 空の行を除外
        let totalTextHeight = 0;

        if(lines.length > 0) {
          for (const line of lines) {
            const fontSetting = setFontSetting(line);

            const textNode = figma.createText();
            textNode.fontSize = fontSetting.size;
            textNode.fontName = { family: fontSetting.family, style: fontSetting.style };
            textNode.characters = line.replace(/^#+\s/, '');
            if (config['color'] && /^#[0-9a-fA-F]{6}$/.test(config['color'])) {
              const rHex = config['color'].substring(1, 3);
              const gHex = config['color'].substring(3, 5);
              const bHex = config['color'].substring(5, 7);
              const r = parseInt(rHex, 16) / 255;
              const g = parseInt(gHex, 16) / 255;
              const b = parseInt(bHex, 16) / 255;
              const fills: SolidPaint[] = [{
                type: "SOLID" as "SOLID", // 'type' プロパティを "SOLID" リテラル型として扱う
                color: { r, g, b }
              }];
              textNode.setRangeFills(0, textNode.characters.length, fills);
            }
            if ('appendChild' in clonedFrame) {
              clonedFrame.appendChild(textNode);
            }
            // await textNode.syncFontGeometryWithTextAsync();

            totalTextHeight += textNode.height;
            textNodes.push(textNode);
          }

          let currentY = (clonedFrame.height - totalTextHeight) / 2;
          textNodes.forEach(node => {
            node.y = currentY;
            currentY += node.height;

            // テキストノードをフレームの中央に配置（左右）
            node.x = (clonedFrame.width - node.width) / 2;
          });
        }

        if (i % 10 === 0 && i !== 0) {
          row++;
          column = 0;
        }
        clonedFrame.x = templateFrame.x + (clonedFrame.width + 100) * column;
        clonedFrame.y = templateFrame.y + templateFrame.height + 200 + (row * (clonedFrame.height + 200));
        column++;
      }

    } else {
      console.log('このMarkdownファイルは指定されたフォーマットに一致しません。');
    }
  }
};

function setFontSetting(line: string) {
  let fontSetting = fontSettings.base;
  if (line.startsWith('# ')) {
    fontSetting = fontSettings.h1;
  } else if (line.startsWith('## ')) {
    fontSetting = fontSettings.h2;
  } else if (line.startsWith('### ')) {
    fontSetting = fontSettings.h3;
  }

  return fontSetting;
}