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

const themeList = ['RaiseTech'];

const themeSettings:{[key: string]: string} = {}

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
    const config = parseHeaderSection(sections[1]);
    console.log(config);
    if(config.theme === 'RaiseTech') {
      themeSettings.theme = config.theme;
      themeSettings.headlineText = '';
      themeSettings.headlineNumber = '0';
    }


    // Markdownテキストが特定のヘッダーで始まるかどうかをチェック
    if (typeof config['marp'] === 'boolean' && config['marp'] === true) {
      console.log('フォントロードスタート');
      await loadFonts();
      console.log('フォントロード完了');

      const templateFrame = findTemplateFrame();
      if (!templateFrame) return;

      // 最初のヘッダー部分と最初のセクションを除去
      sections.splice(0, 2);
      applyMarkdownContent(sections, templateFrame, config);
    } else {
      console.log('このMarkdownファイルは指定されたフォーマットに一致しません。');
    }
  }
};


function parseHeaderSection(headerSection: string): { [key: string]: any } {
  const lines = headerSection.split('\n');
  const config: { [key: string]: any } = {};
  lines.forEach(line => {
    const [key, value] = parseConfigLine(line);
    if (key && value !== undefined) config[key] = value;
  });
  return config;
}

async function loadFonts() {
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  await figma.loadFontAsync({ family: "Noto Sans JP", style: "Bold" });
  await figma.loadFontAsync({ family: "Noto Sans", style: "SemiBold" });
}

function findTemplateFrame() {
  // 'ひな形'という名前のフレームを検索し、存在しない場合はログを出力する処理
  const templateFrame = figma.currentPage.findOne(node => node.type === "FRAME" && node.name === "ひな形");
  if (!templateFrame) {
    console.log('「ひな形」という名前のフレームが見つかりませんでした。');
    return;
  }
  return templateFrame;
}

function applyMarkdownContent(sections: string[], templateFrame: SliceNode | FrameNode | GroupNode | ComponentSetNode | ComponentNode | InstanceNode | BooleanOperationNode | VectorNode | StarNode | LineNode | EllipseNode | PolygonNode | RectangleNode | TextNode | StickyNode | ConnectorNode | ShapeWithTextNode | CodeBlockNode | StampNode | WidgetNode | EmbedNode | LinkUnfurlNode | MediaNode | SectionNode | HighlightNode | WashiTapeNode | TableNode, config: {
  [p: string]: any
}) {
  if(config.theme === 'RaiseTech') applyThemeSettingsRaiseTech(sections, templateFrame, config);
}

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

function applyThemeSettingsRaiseTech(sections: string | any[], templateFrame: {
  clone: () => any;
  x: number;
  y: any;
  height: any;
}, config: { [x: string]: string; }) {
  let row = 0; // 現在の行
  let column = 0; // 現在の列
  console.log('コンテンツ処理スタート');

  for (let i = 0; i < sections.length; i++) {
    // フレームを複製して連番の名前を付ける
    const clonedFrame = templateFrame.clone();
    clonedFrame.name = `Slide ${(i + 1).toString().padStart(3, '0')}`; // 001, 002, ...
    let textNodes = [];

    // const lines = sections[i].trim().split('\n').filter((line: any) => line); // 空の行を除外
    const lines = sections[i].trim().split('\n');
    let totalTextHeight = 0;

    if (lines[0].startsWith('# ')) {
      const headlineNode = findHeadlineNode(clonedFrame);
      const headlineNumberNode = findHeadlineNumberNode(clonedFrame);
      if (headlineNode) {
        const headlineText = lines[0].substring(2).trim();
        if(themeSettings.headlineText !== headlineText) {
          themeSettings.headlineText = headlineText;
          themeSettings.headlineNumber = (Number(themeSettings.headlineNumber) + 1).toString().padStart(2, '0');
        }
        headlineNode.characters = headlineText; // h1のマークダウン記号を除去して更新
        if(headlineNumberNode) {
          const headlineNumber = themeSettings.headlineNumber;
          headlineNumberNode.characters = headlineNumber;
        }
      }
      lines.shift(); // h1行を削除して残りの処理を続行
      if(lines[0].startsWith('## ')) {

      } else {
        const h2Group = clonedFrame.findOne((node: { name: string; }) => node.name === '子見出し') as unknown as FrameNode;
        if(h2Group) h2Group.remove();
      }
    } else {
      const h1Group = clonedFrame.findOne((node: { name: string; }) => node.name === '大見出し') as unknown as GroupNode;
      if(h1Group) h1Group.remove();
      const h2Group = clonedFrame.findOne((node: { name: string; }) => node.name === '子見出し') as unknown as FrameNode;
      if(h2Group) h2Group.remove();
    }

    if(lines.length > 0) {
      for (const line of lines) {
        if(line === '') continue;
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
  }}

function parseConfigLine(line: string): [string, any] {
  const [key, rawValue] = line.split(':').map(part => part.trim());
  if (!key || rawValue === undefined) return ["", null];

  let value: any = rawValue;
  if (rawValue === "true" || rawValue === "false") {
    value = rawValue === "true";
  } else if (!isNaN(Number(rawValue))) {
    value = Number(rawValue);
  } else if (rawValue.startsWith('"') && rawValue.endsWith('"')) {
    value = rawValue.slice(1, -1);
  }
  return [key, value];
}

// configのテーマがテーマリストに含まれているかチェック
function findThemeInList(theme: string): string | null {
  return themeList.includes(theme) ? theme : null;
}

// 大見出しを探す
function findHeadlineNode(frame: FrameNode): TextNode | null {
  const headlineGroup = frame.findOne(node => node.name === "大見出しが入ります") as unknown as TextNode;
  return headlineGroup;
}

function findHeadlineNumberNode(frame: FrameNode): TextNode | null {
  const headlineNumberGroup = frame.findOne(node => node.name === "01") as unknown as TextNode;
  return headlineNumberGroup;

}