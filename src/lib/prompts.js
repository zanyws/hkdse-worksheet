export const SYSTEM_PROMPT = `你是一位擁有20年HKDSE中文科教學及擬題經驗的中文科老師。
請嚴格按照要求生成閱讀工作紙內容，使用繁體中文，確保內容準確、符合原文。
所有答案必須以<span class="teacher-answer">答案內容</span>包裹。`

export function buildAuthorPrompt(textConfig) {
  return `根據以下篇章信息，生成「知人論世」工作紙內容，輸出JSON格式：

篇名：《${textConfig.title}》
作者：${textConfig.author}
朝代：${textConfig.dynasty || '未知'}
文體：${textConfig.genre || '未知'}
原文：${textConfig.content.substring(0, 500)}...

請輸出以下JSON結構（所有答案以<span class="teacher-answer">包裹）：
{
  "authorProfile": {
    "name": "作者名字",
    "dynasty": "朝代",
    "style": "文學風格",
    "identity": "身份（如詩人、政治家等）",
    "majorWorks": ["代表作1", "代表作2"],
    "background": "時代背景說明（3-5句）",
    "ideology": "思想特色"
  },
  "timeline": [
    { "year": "年份", "event": "事件", "significance": "意義" }
  ],
  "writingContext": "寫作背景（3-4句）",
  "expectedReader": "預期讀者分析",
  "intertextuality": [
    { "title": "相關篇章", "author": "作者", "connection": "關聯說明" }
  ],
  "criticalQuestions": [
    { "question": "批判性問題", "answer": "<span class='teacher-answer'>參考答案（提供2個方向）</span>" }
  ],
  "causalChain": {
    "cause": "寫作動機/起因",
    "effect": "情感表達/效果",
    "language": "用字/語氣特色"
  },
  "fillBlanks": [
    { "question": "填空題目", "answer": "<span class='teacher-answer'>答案</span>" }
  ]
}

只輸出JSON，不要任何說明文字。`
}

export function buildTranslationPrompt(textConfig) {
  return `根據以下篇章，生成「篇章語譯」工作紙內容，輸出JSON格式：

篇名：《${textConfig.title}》
原文：${textConfig.content}

請輸出以下JSON結構：
{
  "paragraphs": [
    {
      "original": "原文段落（完整）",
      "markedOriginal": "原文（重點字詞以**數字. 詞語**標記，如：**1. 蒼茫**）",
      "translation": "現代語譯（完整）",
      "keyWords": [
        { "index": 1, "word": "重點詞語", "meaning": "<span class='teacher-answer'>詞義解釋</span>" }
      ],
      "markedTranslation": "語譯（關鍵對應位置留空，用___1___格式標記）"
    }
  ],
  "comprehensionQuestions": [
    { "question": "理解問題", "answer": "<span class='teacher-answer'>答案</span>" }
  ]
}

只輸出JSON，不要任何說明文字。`
}

export function buildStructurePrompt(textConfig) {
  return `根據以下篇章，生成「課文結構與主旨分析」工作紙內容，輸出JSON格式：

篇名：《${textConfig.title}》
文體：${textConfig.genre}
原文：${textConfig.content}

請輸出以下JSON結構：
{
  "structureType": "結構類型（時間線/起承轉合/論點論據/流程圖）",
  "sections": [
    {
      "label": "段落標籤（如「起」「首段」「論點一」）",
      "paragraphs": "段落範圍（如「第1-2段」）",
      "summary": "段落大意",
      "keyPoint": "<span class='teacher-answer'>關鍵詞（填空答案）</span>",
      "fillHint": "填空提示（給學生的線索）"
    }
  ],
  "thesisThreeLayers": {
    "content": {
      "question": "內容層問題（What）",
      "answer": "<span class='teacher-answer'>記敘了什麼/論述了什麼</span>"
    },
    "emotion": {
      "question": "情感層問題（How）",
      "answer": "<span class='teacher-answer'>作者態度</span>"
    },
    "culture": {
      "question": "文化/普世層問題（Why）",
      "answer": "<span class='teacher-answer'>價值觀/人生哲理</span>"
    }
  },
  "thesisSentence": {
    "scaffold": "本文通過______，塑造了/表達了作者對______的______態度，從而彰顯______。",
    "sampleAnswer1": "<span class='teacher-answer'>完整主旨句範例一</span>",
    "sampleAnswer2": "<span class='teacher-answer'>完整主旨句範例二</span>"
  },
  "structureQuestions": [
    { "question": "結構分析問題", "answer": "<span class='teacher-answer'>答案</span>" }
  ]
}

只輸出JSON，不要任何說明文字。`
}

export function buildTechniquePrompt(textConfig) {
  return `根據以下篇章，生成「寫作手法分析」工作紙內容，輸出JSON格式：

篇名：《${textConfig.title}》
原文：${textConfig.content}

請輸出以下JSON結構：
{
  "frequencyTable": [
    {
      "technique": "手法名稱",
      "count": 次數,
      "paragraphs": "分佈段落",
      "trend": "趨勢分析"
    }
  ],
  "mainTechniques": [
    {
      "name": "手法名稱",
      "isCompound": false,
      "compoundWith": "若為複合手法，與哪個手法結合",
      "textEvidence": "原文依據（標明段落）",
      "structure": {
        "type": "手法類型",
        "components": "內部結構（如比喻：本體、喻體、相似點）"
      },
      "effects": {
        "literal": "<span class='teacher-answer'>字面效果</span>",
        "emotional": "<span class='teacher-answer'>情感效果</span>",
        "thematic": "<span class='teacher-answer'>主題效果</span>"
      },
      "identificationTip": "辨識要訣（如何快速看出此手法）",
      "commonErrors": ["常見錯誤1", "常見錯誤2"],
      "fillBlanks": {
        "effectLiteral": "字面效果填空提示",
        "effectEmotional": "情感效果填空提示",
        "effectThematic": "主題效果填空提示"
      }
    }
  ],
  "compoundAnalysis": {
    "combination": "手法組合名稱（如情景交融）",
    "synergy": "<span class='teacher-answer'>兩種手法如何協同分析</span>"
  },
  "dseModelAnswer": {
    "question": "仿DSE問題",
    "answer": "<span class='teacher-answer'>完整答題範文（約80字，標示得分點）</span>",
    "scoringPoints": ["得分點1", "得分點2", "得分點3", "得分點4"]
  },
  "answerTips": {
    "fourSteps": ["第一步：定位文本", "第二步：辨識手法", "第三步：拆解結構", "第四步：分層述效"],
    "mnemonic": "口訣（如：抄句點名拆結構，字面情感扣主旨）",
    "timeAllocation": { "total": "8分鐘", "reading": "2分鐘", "planning": "2分鐘", "writing": "4分鐘" },
    "templates": ["作者運用了______的手法，在文中「______」（抄錄原句）可見……"],
    "transitions": ["由此可見", "這正正突顯", "進一步深化", "從而彰顯"]
  },
  "evaluationQuestion": {
    "question": "評價題（手法是否最妥？）",
    "answer": "<span class='teacher-answer'>評價參考答案</span>"
  },
  "comparisonTable": {
    "relatedText": "可比較的相關篇章",
    "similarities": "<span class='teacher-answer'>相同點</span>",
    "differences": "<span class='teacher-answer'>不同點</span>"
  }
}

只輸出JSON，不要任何說明文字。`
}

export function buildPracticePrompt(textConfig) {
  return `根據以下篇章，生成「課文鞏固練習」工作紙內容，輸出JSON格式：

篇名：《${textConfig.title}》
原文：${textConfig.content}

請輸出以下JSON結構：
{
  "questions": [
    {
      "id": "q1",
      "type": "vocabulary",
      "typeName": "字詞理解",
      "question": "題目",
      "marks": 2,
      "answer": "<span class='teacher-answer'>答案</span>",
      "errorAnalysis": "常見錯誤分析",
      "leveledSamples": {
        "level5": "<span class='teacher-answer'>5**級答案示例</span>",
        "level3": "3級答案示例",
        "level1": "1級答案示例"
      }
    },
    {
      "id": "q2",
      "type": "extraction",
      "typeName": "截取信息",
      "question": "題目",
      "marks": 2,
      "answer": "<span class='teacher-answer'>答案</span>",
      "errorAnalysis": "常見錯誤分析"
    },
    {
      "id": "q3",
      "type": "synthesis",
      "typeName": "整合論述",
      "question": "題目",
      "marks": 4,
      "answer": "<span class='teacher-answer'>答案</span>",
      "errorAnalysis": "常見錯誤分析"
    },
    {
      "id": "q4",
      "type": "attitude",
      "typeName": "觀點態度",
      "question": "題目",
      "marks": 3,
      "answer": "<span class='teacher-answer'>答案</span>",
      "errorAnalysis": "常見錯誤分析"
    },
    {
      "id": "q5",
      "type": "technique",
      "typeName": "寫作手法",
      "question": "題目",
      "marks": 4,
      "answer": "<span class='teacher-answer'>答案</span>",
      "errorAnalysis": "常見錯誤分析"
    },
    {
      "id": "q6",
      "type": "technique_compare",
      "typeName": "寫作手法（比較）",
      "question": "題目",
      "marks": 4,
      "answer": "<span class='teacher-answer'>答案</span>",
      "errorAnalysis": "常見錯誤分析"
    }
  ],
  "motherQuestions": [
    {
      "questionId": "mq1",
      "type": "technique",
      "content": "母題內容",
      "answerKey": "<span class='teacher-answer'>評分關鍵點</span>",
      "variations": [
        {
          "variationId": "v1",
          "type": "comparison",
          "content": "跨段比較變式題",
          "scoringNote": "評分差異說明"
        },
        {
          "variationId": "v2",
          "type": "transfer",
          "content": "情境遷移變式題",
          "scoringNote": "評分差異說明"
        },
        {
          "variationId": "v3",
          "type": "evaluation",
          "content": "評價反思變式題",
          "scoringNote": "評分差異說明"
        }
      ]
    }
  ]
}

只輸出JSON，不要任何說明文字。`
}

export function buildVariationPrompt(motherQuestion, variationType, textConfig) {
  const typeMap = {
    comparison: '跨段比較（要求比較文中不同段落或與另一篇章的異同）',
    transfer: '情境遷移（改變手法或背景，要求預測效果或改寫）',
    evaluation: '評價反思（提供批判觀點，要求評價作者選擇妥當性）',
  }
  return `基於以下母題，生成一道${typeMap[variationType]}類型的變式題。

篇名：《${textConfig.title}》
原文摘要：${textConfig.content.substring(0, 300)}

母題：${motherQuestion}

要求：
1. 變式題的答案結構必須與母題不同（防止套用）
2. 難度提升一個層級
3. 輸出JSON：
{
  "content": "變式題完整題目",
  "answer": "<span class='teacher-answer'>參考答案</span>",
  "scoringNote": "與母題的評分差異說明",
  "keyPoints": ["得分點1", "得分點2"]
}

只輸出JSON。`
}
