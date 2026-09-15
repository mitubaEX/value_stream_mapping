// docs/prompts/vsm-data-prompt.md をプロンプトテンプレートから生成する
import { writeFileSync } from 'node:fs'
import { buildPrompt } from '../src/domain/promptTemplate'

const body = buildPrompt({ unit: 'd', title: '業務名', description: '' })
const md = `# VSM データ生成プロンプト (単位: 日)

以下をそのまま ChatGPT / Claude などに貼り付け、「対象の業務」の行を書き換えて送ってください。
回答の JSON はアプリの「AI の回答を貼り付け」欄、または「JSON 読込」で読み込めます。
時間を「時間」単位にしたい場合は \`"unit": "d"\` を \`"unit": "h"\` に、文中の「日」を「時間」に置き換えてください。

---

\`\`\`text
${body}\`\`\`
`
writeFileSync('docs/prompts/vsm-data-prompt.md', md)
console.log('wrote docs/prompts/vsm-data-prompt.md')
