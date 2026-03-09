import fs from 'fs';
import path from 'path';

const dataDir = path.join(import.meta.dirname, '../src/data');

// 标签生成规则字典 (Keyword -> TagName)
const tagRules = [
  { keywords: ['春', '柳', '草', '花'], tag: '春景' },
  { keywords: ['夏', '莲', '荷', '暑'], tag: '夏日' },
  { keywords: ['秋', '月', '霜', '菊', '雁'], tag: '秋思' },
  { keywords: ['冬', '雪', '寒', '梅', '冰'], tag: '冬雪' },
  { keywords: ['山', '水', '江', '河', '湖', '海', '泉', '瀑'], tag: '山水' },
  { keywords: ['思', '乡', '客', '家', '愁'], tag: '思乡' },
  { keywords: ['客', '饯', '行', '泪', '别', '辞'], tag: '送别' },
  { keywords: ['边', '塞', '角', '营', '战', '将', '兵', '马', '烽', '戍'], tag: '边塞' },
  { keywords: ['农', '田', '耕', '蚕', '桑', '稼', '村', '野'], tag: '田园' },
  { keywords: ['鹅', '牛', '马', '鸟', '燕', '蝉', '鹭'], tag: '动物' },
  { keywords: ['童', '儿', '娃', '戏', '嬉'], tag: '童趣' },
  { keywords: ['理', '书', '学', '勤', '奋'], tag: '哲理' },
  { keywords: ['国', '君', '臣', '社', '稷', '忧', '民'], tag: '爱国' },
  { keywords: ['隐', '仙', '道', '酒', '醉', '归'], tag: '隐逸' },
];

function generateTagsForPoem(title, contentStr, translation) {
  const textToScan = `${title} ${contentStr} ${translation || ''}`;
  const generatedTags = new Set();
  
  for (const rule of tagRules) {
    for (const keyword of rule.keywords) {
      if (textToScan.includes(keyword)) {
        generatedTags.add(rule.tag);
        break; // 命中该类下的一个关键字即可加这个 tag
      }
    }
  }

  // 若根据规则未匹配到任何标签，给一个保底的杂项标签
  if (generatedTags.size === 0) {
    generatedTags.add('自然');
  }

  return Array.from(generatedTags).slice(0, 3); // 最多只保留3个标签以免 UI 拥挤
}

// 遍历 /src/data 下的所有 grade 和 preschool文件
const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.js') && (f.startsWith('grade') || f === 'preschool.js'));

let totalPoemsUpdated = 0;

for (const file of files) {
  const filePath = path.join(dataDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // 由于文件是纯文本导出的 js 对象数组，我们利用正则进行匹配和替换
  // 匹配类似：
  // title: "静夜思",
  // ...
  // translation: "xxxx",
  // background: 'xxxx',
  // tags: [],
  
  // 按照对象分块去替换
  const poemRegex = /\{\s*id:\s*\d+,[\s\S]*?tags:\s*\[(.*?)\],[\s\S]*?\}/g;
  
  content = content.replace(poemRegex, (match, existingTags) => {
    // 已经有手动录入的 tag 的，跳过（比如我们在 grade1 刚手工填过的那几首）
    if (existingTags.trim().length > 0) {
      return match;
    }

    // 粗略抽取文本进行分析
    const titleMatch = match.match(/title:\s*"(.*?)"/);
    const translationMatch = match.match(/translation:\s*"(.*?)"/);
    const contentMatch = match.match(/content:\s*\[(.*?)\]/);

    const title = titleMatch ? titleMatch[1] : '';
    const translation = translationMatch ? translationMatch[1] : '';
    const codeContentStr = contentMatch ? contentMatch[1] : '';

    const newTags = generateTagsForPoem(title, codeContentStr, translation);
    const tagsStr = newTags.map(t => `'${t}'`).join(', ');

    totalPoemsUpdated++;
    
    // 替换 tags 数组
    return match.replace(/tags:\s*\[\]/, `tags: [${tagsStr}]`);
  });

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`已处理 ${file}`);
}

console.log(`\\n🎉 处理完毕！共自动为 ${totalPoemsUpdated} 首空白古诗分配了标签。`);
