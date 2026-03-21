export const SYSTEM_PROMPT = `你是一位擁有20年HKDSE中文科教學及擬題經驗的中文科老師。

【嚴格規定——必須遵守】
1. 所有輸出必須使用繁體中文，絕對不可出現英文單詞（專有名詞除外，如人名地名）
2. 所有答案必須以<span class="teacher-answer">答案內容</span>包裹
3. 篇名、作者等基本資料欄位【不可】包裹teacher-answer標籤，直接輸出純文字
4. 絕對不可在JSON值中輸出任何程式碼、HTML標籤（teacher-answer除外）、Markdown符號（如**、##）
5. 輸出純JSON，不可有任何說明文字、前言、後記
6. JSON字串值中如需換行，使用\\n；不可使用實際換行符
7. 所有內容必須根據原文，不可捏造`

export function buildAuthorPrompt(textConfig) {
  return `根據以下篇章信息，生成「知人論世」工作紙內容。

篇名：${textConfig.title}
作者：${textConfig.author}
朝代：${textConfig.dynasty || '未知'}
文體：${textConfig.genre || '未知'}
原文：${textConfig.content.substring(0, 800)}

【重要規定——必須全部遵守】
1. 只輸出JSON，不可有任何說明文字
2. 所有文字必須繁體中文
3. 標籤規則：identity、style、ideology、timeline的event和significance、writingContext、expectedReader、titleAnalysis三項、scenario的situation和guidingQuestions每項和afterReading——全部加teacher-answer標籤
4. name、dynasty、majorWorks陣列項目、timeline的year——全部純文字不加標籤
5. 時間軸年份必須填寫真實具體年份如「公元207年」，絕對不可填「未知」；不確定時填大概時期如「建安年間」
6. majorWorks為純文字陣列，不可加teacher-answer標籤
7. timeline必須提供5條或以上，涵蓋出生、青年、入仕、重要事件、晚年各階段
8. scenario的情境必須是現代生活場景，與篇章主題高度相關，讓學生容易代入
9. guidingQuestions必須提供3條引導問題，每條對應篇章的一個核心主題

{
  "authorProfile": {
    "name": "作者姓名（純文字）",
    "dynasty": "朝代（純文字）",
    "identity": "<span class='teacher-answer'>身份（可多項，如：政治家、文學家）</span>",
    "style": "<span class='teacher-answer'>文學風格特色（兩至三點）</span>",
    "ideology": "<span class='teacher-answer'>思想特色（結合篇章）</span>",
    "majorWorks": ["代表作一（純文字）", "代表作二（純文字）", "代表作三（純文字）"]
  },
  "timeline": [
    { "year": "公元XXX年（純文字）", "event": "<span class='teacher-answer'>與篇章相關的生平事件（一至兩句）</span>", "significance": "<span class='teacher-answer'>對作者思想或本篇章的意義</span>" },
    { "year": "公元XXX年（純文字）", "event": "<span class='teacher-answer'>事件內容</span>", "significance": "<span class='teacher-answer'>意義</span>" },
    { "year": "公元XXX年（純文字）", "event": "<span class='teacher-answer'>事件內容</span>", "significance": "<span class='teacher-answer'>意義</span>" },
    { "year": "公元XXX年（純文字）", "event": "<span class='teacher-answer'>事件內容</span>", "significance": "<span class='teacher-answer'>意義</span>" },
    { "year": "公元XXX年（純文字）", "event": "<span class='teacher-answer'>事件內容</span>", "significance": "<span class='teacher-answer'>意義</span>" }
  ],
  "writingContext": "<span class='teacher-answer'>寫作背景三至四句：時代環境＋寫作時間＋寫作對象＋寫作目的</span>",
  "expectedReader": "<span class='teacher-answer'>預期讀者是誰＋作者如何因應讀者身份調整語氣與內容</span>",
  "titleAnalysis": {
    "literal": "<span class='teacher-answer'>篇名字面意思解釋</span>",
    "deep": "<span class='teacher-answer'>篇名深層意義，與文章主旨的關係</span>",
    "question": "根據篇名，你預測文章會討論什麼主題？（純文字，供學生填寫）"
  },
  "scenario": {
    "setup": "情境設定說明（純文字，如：以下是一個與本文主題相近的現代情境）",
    "situation": "<span class='teacher-answer'>現代生活情境描述（三至四句，與篇章核心主題高度相關，讓學生容易代入，不可直接提及作者或篇章）</span>",
    "guidingQuestions": [
      "<span class='teacher-answer'>引導問題一：對應篇章第一個核心主題，讓學生表達自己的處理方法</span>",
      "<span class='teacher-answer'>引導問題二：對應篇章第二個核心主題，引發學生思考</span>",
      "<span class='teacher-answer'>引導問題三：對應篇章情感或價值觀，讓學生反思</span>"
    ],
    "afterReading": "<span class='teacher-answer'>讀後對比問題：讀完文章後，比較作者的做法與你的想法有何異同？你認為哪種更有效？原因是什麼？</span>"
  }
}`
}


export function buildTranslationPrompt(textConfig) {
  return `根據以下篇章，生成「篇章語譯」工作紙內容。

篇名：${textConfig.title}
原文：${textConfig.content.substring(0, 2000)}

【重要規定——必須全部遵守】
1. 只輸出JSON，不可有任何說明文字
2. 所有文字必須繁體中文
3. 標籤規則：keyWords的meaning、markedTranslation的留空答案、wordStudy三個子項的所有answers欄位、sentencePatterns的patternName和feature和technique和modelAnswer——全部加teacher-answer標籤
4. original、markedOriginal、word、虛詞原句、古今義的word、一字多義的word——全部純文字不加標籤
5. 關鍵詞只選2至4字的詞語，不選單字或整句，每段選3至5個
6. markedTranslation只在關鍵詞對應位置留空（___1___格式），其餘語譯文字正常顯示，不可整句留空
7. 虛詞辨析必須選同一虛詞在文中出現至少兩次的例子，對比不同意義
8. 古今義只選古今意義明顯不同的詞語，不選古今相同的詞
9. 一字多義必須在文中找到同一字至少兩個不同意義的例子
10. 句式分析每篇選2至3種句式，每種提供語譯技巧和練習例句

{
  "paragraphs": [
    {
      "original": "原文段落完整內容（純文字）",
      "markedOriginal": "原文，重點字詞以**1. 字詞**格式標記，只標記2至4字的詞語，如：先帝創業未半而中道**1. 崩殂**，今天下三分，益州**2. 疲弊**",
      "translation": "完整現代語譯（純文字，不留空）",
      "keyWords": [
        { "index": 1, "word": "字詞（2至4字，純文字）", "meaning": "<span class='teacher-answer'>詞義解釋（簡潔，10字以內）</span>" },
        { "index": 2, "word": "字詞（純文字）", "meaning": "<span class='teacher-answer'>詞義解釋</span>" },
        { "index": 3, "word": "字詞（純文字）", "meaning": "<span class='teacher-answer'>詞義解釋</span>" }
      ],
      "markedTranslation": "語譯，只在關鍵詞對應位置以___1___留空，其餘文字正常顯示。如：先帝開創大業還未完成一半，卻在半途中___1___了。現在天下三分，益州地區民生___2___"
    }
  ],
  "wordStudy": {
    "functionalWords": [
      {
        "word": "虛詞（單字，純文字）",
        "examples": [
          {
            "sentence": "原文例句一（純文字，標示該虛詞位置）",
            "meaning": "<span class='teacher-answer'>此處意義（如：表目的，譯作「用來」）</span>",
            "translation": "<span class='teacher-answer'>該句語譯</span>"
          },
          {
            "sentence": "原文例句二（純文字）",
            "meaning": "<span class='teacher-answer'>此處意義（如：表承接，譯作「從而」）</span>",
            "translation": "<span class='teacher-answer'>該句語譯</span>"
          }
        ]
      },
      {
        "word": "第二個虛詞（純文字）",
        "examples": [
          {
            "sentence": "原文例句一（純文字）",
            "meaning": "<span class='teacher-answer'>此處意義</span>",
            "translation": "<span class='teacher-answer'>該句語譯</span>"
          },
          {
            "sentence": "原文例句二（純文字）",
            "meaning": "<span class='teacher-answer'>此處意義</span>",
            "translation": "<span class='teacher-answer'>該句語譯</span>"
          }
        ]
      }
    ],
    "classicalModernDiff": [
      {
        "word": "詞語（純文字）",
        "classicalMeaning": "<span class='teacher-answer'>古義（結合原文說明）</span>",
        "modernMeaning": "<span class='teacher-answer'>今義</span>",
        "sentence": "原文例句（純文字）",
        "warning": "常見錯誤提示（純文字，如：切勿以今義套古義）"
      },
      {
        "word": "詞語（純文字）",
        "classicalMeaning": "<span class='teacher-answer'>古義</span>",
        "modernMeaning": "<span class='teacher-answer'>今義</span>",
        "sentence": "原文例句（純文字）",
        "warning": "常見錯誤提示（純文字）"
      }
    ],
    "multiMeaning": [
      {
        "word": "字（單字，純文字）",
        "usages": [
          {
            "sentence": "原文例句一（純文字）",
            "meaning": "<span class='teacher-answer'>在此句的意義</span>",
            "pos": "詞性（純文字，如：動詞、名詞）"
          },
          {
            "sentence": "原文例句二（純文字）",
            "meaning": "<span class='teacher-answer'>在此句的意義</span>",
            "pos": "詞性（純文字）"
          }
        ]
      },
      {
        "word": "第二個字（純文字）",
        "usages": [
          {
            "sentence": "原文例句一（純文字）",
            "meaning": "<span class='teacher-answer'>意義</span>",
            "pos": "詞性（純文字）"
          },
          {
            "sentence": "原文例句二（純文字）",
            "meaning": "<span class='teacher-answer'>意義</span>",
            "pos": "詞性（純文字）"
          }
        ]
      }
    ]
  },
  "sentencePatterns": [
    {
      "patternName": "<span class='teacher-answer'>句式名稱（如：判斷句、狀語後置句、省略句）</span>",
      "feature": "<span class='teacher-answer'>句式特徵：標誌詞或結構說明（如：以「者…也」「乃」「即」構成判斷）</span>",
      "example": "原文例句（純文字）",
      "technique": "<span class='teacher-answer'>語譯技巧：具體說明如何翻譯此句式（如：譯時加入「是」，還原邏輯主語）</span>",
      "modelAnswer": "<span class='teacher-answer'>該例句的示範語譯</span>",
      "practice": {
        "question": "練習題：試用以上技巧翻譯以下句子——「原文句子」（純文字）",
        "answer": "<span class='teacher-answer'>參考譯文</span>"
      }
    },
    {
      "patternName": "<span class='teacher-answer'>第二種句式名稱</span>",
      "feature": "<span class='teacher-answer'>句式特徵</span>",
      "example": "原文例句（純文字）",
      "technique": "<span class='teacher-answer'>語譯技巧</span>",
      "modelAnswer": "<span class='teacher-answer'>示範語譯</span>",
      "practice": {
        "question": "練習題（純文字）",
        "answer": "<span class='teacher-answer'>參考譯文</span>"
      }
    },
    {
      "patternName": "<span class='teacher-answer'>第三種句式名稱</span>",
      "feature": "<span class='teacher-answer'>句式特徵</span>",
      "example": "原文例句（純文字）",
      "technique": "<span class='teacher-answer'>語譯技巧</span>",
      "modelAnswer": "<span class='teacher-answer'>示範語譯</span>",
      "practice": {
        "question": "練習題（純文字）",
        "answer": "<span class='teacher-answer'>參考譯文</span>"
      }
    }
  ]
}`
}


export function buildStructurePrompt(textConfig) {
  return `根據以下篇章，生成「課文結構與主旨分析」工作紙內容。

篇名：${textConfig.title}
原文：${textConfig.content.substring(0, 2000)}

【重要規定——必須全部遵守】
1. 只輸出JSON，不可有任何說明文字
2. 所有文字必須繁體中文
3. 不需指明段落編號，不需指明文體
4. structureChart的nodes每個node的label和hint——label加teacher-answer，hint純文字
5. structureChart的edges純文字不加標籤
6. thesisSurface的answer和thesisDeep的answer——加teacher-answer標籤
7. thesisDeepType純文字不加標籤（由AI根據篇章判斷填入「道理」「情感」「形象」「意境」「啟示」之一）
8. thesisSentence的scaffold和sampleAnswer1和sampleAnswer2——scaffold純文字，sampleAnswer加teacher-answer
9. 視覺化結構圖必須用HTML元件組合，不可只用線性列表

【視覺化結構圖規定】
- chartType從以下選擇最合適一種：「flowchart」（流程推進）、「tree」（主從分支）、「timeline」（時間順序）、「contrast」（對比並列）、「cycle」（循環關係）、「freeform」（自由組合）
- nodes：每個節點有id、label（內容，加teacher-answer）、hint（填空提示，純文字）、type（「main」主節點、「sub」次節點、「key」關鍵詞節點）
- edges：節點之間的連線，每條有from、to、label（關係說明，純文字，如「因此」「對比」「引申」，可留空）
- 節點數量：3至8個，根據篇章複雜程度決定
- 學生版：label顯示為填空；教師版：label顯示完整內容

{
  "structureChart": {
    "chartType": "flowchart或tree或timeline或contrast或cycle或freeform",
    "title": "結構圖標題（純文字，如：《出師表》論說結構）",
    "nodes": [
      { "id": "n1", "label": "<span class='teacher-answer'>節點內容（簡潔，4至8字）</span>", "hint": "填空提示（純文字）", "type": "main" },
      { "id": "n2", "label": "<span class='teacher-answer'>節點內容</span>", "hint": "填空提示（純文字）", "type": "sub" },
      { "id": "n3", "label": "<span class='teacher-answer'>節點內容</span>", "hint": "填空提示（純文字）", "type": "sub" },
      { "id": "n4", "label": "<span class='teacher-answer'>節點內容</span>", "hint": "填空提示（純文字）", "type": "key" },
      { "id": "n5", "label": "<span class='teacher-answer'>節點內容</span>", "hint": "填空提示（純文字）", "type": "sub" }
    ],
    "edges": [
      { "from": "n1", "to": "n2", "label": "關係說明（純文字，可空字串）" },
      { "from": "n2", "to": "n3", "label": "關係說明" },
      { "from": "n3", "to": "n4", "label": "關係說明" },
      { "from": "n4", "to": "n5", "label": "關係說明" }
    ]
  },
  "thesis": {
    "surface": {
      "question": "表層意思：這篇文章說了什麼？（純文字）",
      "answer": "<span class='teacher-answer'>內容概括：記敘了誰、做了什麼、或論述了什麼觀點（兩至三句）</span>"
    },
    "deep": {
      "type": "深層類型（純文字：道理／情感／形象／意境／啟示，可多項用頓號分隔）",
      "question": "深層意思：作者真正想表達什麼？（純文字，按type調整問法）",
      "answer": "<span class='teacher-answer'>深層意思：作者想表達的道理或情感或形象（兩至三句，結合原文）</span>"
    },
    "scaffold": {
      "template": "按篇章內容生成的主旨句框架（純文字，用______表示填空位置，不固定格式）",
      "sampleAnswer1": "<span class='teacher-answer'>完整主旨句範例一</span>",
      "sampleAnswer2": "<span class='teacher-answer'>完整主旨句範例二（另一可接受寫法）</span>"
    }
  }
}`
}


export function buildTechniquePrompt(textConfig) {
  return `根據以下篇章，生成「寫作手法分析」工作紙內容。

篇名：${textConfig.title}
原文：${textConfig.content.substring(0, 2000)}

【重要規定——必須全部遵守】
1. 只輸出JSON，不可有任何說明文字
2. 所有文字必須繁體中文
3. 不需統計手法出現次數，不需標示段落編號
4. 不需生成比較題（學生沒有課外篇章）
5. 評價題必須針對具體原文內容，不可只問「是否最為恰當」等廣泛問題
6. 題目鋪排：先出題目→審題引導→學生填寫區→答題技巧→手法分析→範文答案
7. 所有答案欄位加teacher-answer標籤；題目、審題引導的問題、答題技巧純文字不加標籤
8. 每份工作紙出4題：題一至三為手法分析題，題四為結構相關題
9. 題一和題二優先考問同一手法但不同角度（題一指定例子分析效果，題二同一手法另一例子分析如何配合主旨）；若篇章中某手法只出現一次，則題二改考不同手法，並在q2Note欄位標明「改考不同手法，原因：該手法只出現一次」
10. 題三考問另一不同手法
11. 題四要求學生綜合手法與結構分析
12. 主要手法分析（mainTechniques）只為教師備用參考，不在題目前出現

{
  "questions": [
    {
      "id": "q1",
      "level": "入門",
      "question": "題一題目（純文字）：指定手法名稱＋指定文中具體例子，要求分析效果，如：試分析文中「……」一句的排比手法及其效果。（X分）",
      "examSkills": {
        "requirement": "題目要求我做什麼？答：分析______手法的______（純文字）",
        "locate": "手法在哪裡？答：找出文中______的句子（純文字）",
        "scoreEstimate": "需要幾個得分點？答：根據分數估算：______分 ÷ 2 = ______個得分點（純文字）",
        "structure": "答案結構：引用原句 → 點明手法 → 分析效果 → 扣緊主旨（純文字）"
      },
      "marks": 4,
      "answerLines": 6,
      "tips": {
        "steps": ["第一步：引用原文句子，標明位置", "第二步：點明手法名稱", "第三步：分析效果（字面→情感→主旨）", "第四步：扣緊篇章主旨"],
        "template": "作者在「______」一句運用了______手法，……（純文字，用______表示填空）",
        "avoid": "常見錯誤：只指出手法名稱而不分析效果（純文字）"
      },
      "techName": "手法名稱（純文字）",
      "textEvidence": "<span class='teacher-answer'>原文引用</span>",
      "analysis": {
        "structure": "<span class='teacher-answer'>手法結構拆解</span>",
        "literal": "<span class='teacher-answer'>字面效果（具體針對原文，不可泛泛而談）</span>",
        "emotional": "<span class='teacher-answer'>情感效果（具體針對原文）</span>",
        "thematic": "<span class='teacher-answer'>主題效果（具體扣緊篇章主旨）</span>"
      },
      "modelAnswer": "<span class='teacher-answer'>完整範文答案約80字，體現四步結構，標示各得分點</span>"
    },
    {
      "id": "q2",
      "level": "鞏固",
      "question": "題二題目（純文字）：與題一相同手法但不同段落或例子，考問手法如何配合主旨，如：作者另在文中「……」一句同樣運用排比手法，試分析此句如何配合全文主旨。（X分）",
      "examSkills": {
        "requirement": "題目要求我做什麼？答：分析______手法如何配合______（純文字）",
        "locate": "手法在哪裡？答：找出文中______的句子（純文字）",
        "scoreEstimate": "需要幾個得分點？答：______分 ÷ 2 = ______個得分點（純文字）",
        "structure": "答案結構：引用原句 → 分析手法 → 連結主旨 → 說明配合關係（純文字）"
      },
      "marks": 4,
      "answerLines": 6,
      "tips": {
        "steps": ["第一步：引用與題一不同的原文句子", "第二步：分析此句的手法效果", "第三步：點明篇章主旨", "第四步：說明手法如何強化主旨"],
        "template": "作者在「______」一句再次運用______手法，……配合全文______的主旨（純文字）",
        "avoid": "常見錯誤：重複題一的分析，沒有連結主旨（純文字）"
      },
      "techName": "手法名稱（與題一相同，純文字）",
      "textEvidence": "<span class='teacher-answer'>與題一不同的原文引用</span>",
      "analysis": {
        "structure": "<span class='teacher-answer'>手法結構拆解</span>",
        "literal": "<span class='teacher-answer'>字面效果</span>",
        "emotional": "<span class='teacher-answer'>情感效果</span>",
        "thematic": "<span class='teacher-answer'>如何配合主旨（重點）</span>"
      },
      "modelAnswer": "<span class='teacher-answer'>完整範文答案約80字，重點分析手法如何配合主旨</span>"
    },
    {
      "id": "q3",
      "level": "延伸",
      "question": "題三題目（純文字）：不同於題一二的另一手法，難度較高，可要求學生自選原文例子，如：試舉一例，分析作者如何運用對比手法表達______，並說明其效果。（X分）",
      "examSkills": {
        "requirement": "題目要求我做什麼？答：自選例子，分析______手法如何表達______（純文字）",
        "locate": "手法在哪裡？答：在文中找出______的句子（純文字）",
        "scoreEstimate": "需要幾個得分點？答：______分 ÷ 2 = ______個得分點（純文字）",
        "structure": "答案結構：引用自選原句 → 點明手法 → 分析效果 → 說明如何表達指定情感或目的（純文字）"
      },
      "marks": 4,
      "answerLines": 7,
      "tips": {
        "steps": ["第一步：選取最能體現該手法的原文句子", "第二步：點明手法名稱及結構", "第三步：分析效果", "第四步：說明如何達到題目指定的目的"],
        "template": "作者運用______手法，在「______」一句……從而表達______（純文字）",
        "avoid": "常見錯誤：選取例子不夠典型，或未能回應題目指定的目的（純文字）"
      },
      "techName": "與題一二不同的手法名稱（純文字）",
      "textEvidence": "<span class='teacher-answer'>原文引用</span>",
      "analysis": {
        "structure": "<span class='teacher-answer'>手法結構拆解</span>",
        "literal": "<span class='teacher-answer'>字面效果</span>",
        "emotional": "<span class='teacher-answer'>情感效果</span>",
        "thematic": "<span class='teacher-answer'>主題效果</span>"
      },
      "modelAnswer": "<span class='teacher-answer'>完整範文答案約80字</span>"
    },
    {
      "id": "q4",
      "level": "綜合",
      "question": "題四題目（純文字）：結構相關，要求學生分析手法如何配合文章結構或強化整體說服力，如：作者在全文多處運用______，試分析這種手法如何配合文章結構，強化整體______效果。（X分）",
      "examSkills": {
        "requirement": "題目要求我做什麼？答：分析手法如何配合______結構（純文字）",
        "locate": "需要從全文角度思考，找出______手法在不同位置的例子（純文字）",
        "scoreEstimate": "需要幾個得分點？答：______分 ÷ 2 = ______個得分點（純文字）",
        "structure": "答案結構：概述手法在全文的分佈 → 分析各處效果 → 說明如何配合整體結構（純文字）"
      },
      "marks": 6,
      "answerLines": 8,
      "tips": {
        "steps": ["第一步：從全文角度找出手法在不同位置的例子", "第二步：分析各例子的效果", "第三步：說明手法如何配合文章起承轉合或論說結構", "第四步：綜合說明整體效果"],
        "template": "作者在全文______處運用______手法，分別在「______」……這種手法配合文章______的結構（純文字）",
        "avoid": "常見錯誤：只分析單一例子，沒有從全文角度分析（純文字）"
      },
      "techName": "手法名稱（純文字）",
      "textEvidence": "<span class='teacher-answer'>全文多處原文引用（至少兩處）</span>",
      "analysis": {
        "structure": "<span class='teacher-answer'>手法如何貫穿全文結構的分析</span>",
        "literal": "<span class='teacher-answer'>整體字面效果</span>",
        "emotional": "<span class='teacher-answer'>整體情感效果</span>",
        "thematic": "<span class='teacher-answer'>如何配合整體結構強化主旨</span>"
      },
      "modelAnswer": "<span class='teacher-answer'>完整範文答案約120字，體現全文視角</span>",
      "evaluationQuestion": {
        "question": "評價題（純文字）：針對具體原文內容，如：作者在第X段以______手法呈現「……」，若改以______手法表達，效果有何不同？試就______加以分析。",
        "answer": "<span class='teacher-answer'>評價參考答案：分析兩種手法的效果差異，結合具體原文論述，提供正反兩個角度</span>"
      }
    }
  ],
  "mainTechniques": [
    {
      "name": "手法名稱（純文字，供教師參考）",
      "textEvidence": "<span class='teacher-answer'>原文引用</span>",
      "structure": "<span class='teacher-answer'>手法結構說明</span>",
      "effects": {
        "literal": "<span class='teacher-answer'>字面效果</span>",
        "emotional": "<span class='teacher-answer'>情感效果</span>",
        "thematic": "<span class='teacher-answer'>主題效果</span>"
      },
      "identificationTip": "辨識要訣（純文字）",
      "commonErrors": ["常見錯誤一（純文字）", "常見錯誤二（純文字）"]
    },
    {
      "name": "第二個手法（純文字）",
      "textEvidence": "<span class='teacher-answer'>原文引用</span>",
      "structure": "<span class='teacher-answer'>手法結構說明</span>",
      "effects": {
        "literal": "<span class='teacher-answer'>字面效果</span>",
        "emotional": "<span class='teacher-answer'>情感效果</span>",
        "thematic": "<span class='teacher-answer'>主題效果</span>"
      },
      "identificationTip": "辨識要訣（純文字）",
      "commonErrors": ["常見錯誤一（純文字）"]
    }
  ],
  "compoundAnalysis": {
    "combination": "複合手法組合名稱（純文字）",
    "synergy": "<span class='teacher-answer'>兩種手法如何協同強化效果的具體分析，結合原文例子</span>"
  }
}`
}


export function buildPracticePrompt(textConfig) {
  return `根據以下篇章，生成「課文鞏固練習」工作紙內容。

篇名：${textConfig.title}
原文：${textConfig.content.substring(0, 2000)}

【重要規定——必須全部遵守】
1. 只輸出JSON，不可有任何說明文字
2. 所有文字必須繁體中文
3. 答案欄位加teacher-answer標籤；題目、errorAnalysis、leveledSamples的level3和level1——純文字不加標籤
4. 不需生成變式題庫，不需生成審題引導
5. 共出五題，題型和分數按以下規定
6. 題三判斷原則：先評估篇章是否適合考問結構——若篇章有明顯起承轉合或論點論據結構、某段有明顯承上啟下或轉折功能、或篇章七段或以上，則出結構分析題；否則改出手法效果題（考問與題四不同的手法，難度略低於題四）——並在q3Type標明「結構」或「手法」
7. 題四手法題必須結合主旨考問，不可只問手法效果
8. 題五見解體會題必須要求學生表明立場、提出論點、聯繫現實
9. 每題的errorAnalysis必須針對該題的具體常見錯誤，不可泛泛而談
10. 題四和題五必須提供分級答案示例（level5和level3）

{
  "questions": [
    {
      "id": "q1",
      "type": "translation",
      "typeName": "語譯",
      "question": "語譯題（純文字）：選取篇章中含特殊句式（倒裝句、判斷句、省略句等）的原文句子，要求完整語譯，如：試將以下句子譯成現代漢語：「______」",
      "marks": 4,
      "answerLines": 4,
      "sentencePattern": "此句的句式類型（純文字，如：狀語後置句）",
      "answer": "<span class='teacher-answer'>完整語譯答案，體現句式特色</span>",
      "errorAnalysis": "此題常見錯誤：針對該句式的具體翻譯錯誤（純文字）"
    },
    {
      "id": "q2",
      "type": "comprehension",
      "typeName": "內容理解",
      "question": "內容理解題（純文字）：需整合多段信息，不可只抄單一句子，如：根據全文，______試加以說明。",
      "marks": 4,
      "answerLines": 6,
      "answer": "<span class='teacher-answer'>完整答案，體現跨段整合</span>",
      "errorAnalysis": "此題常見錯誤：如只抄錄單一句子而不整合、遺漏某段重要信息等（純文字）"
    },
    {
      "id": "q3",
      "q3Type": "結構或手法（純文字，由AI根據篇章判斷填入）",
      "type": "structure_or_technique",
      "typeName": "結構分析或手法效果（由AI根據q3Type填入對應題型名稱）",
      "question": "結構分析題或手法效果題（純文字）：若q3Type為結構，考問某段在全文結構上的功能或作用；若q3Type為手法，考問與題四不同的手法效果",
      "marks": 4,
      "answerLines": 6,
      "answer": "<span class='teacher-answer'>完整答案</span>",
      "errorAnalysis": "此題常見錯誤（純文字）"
    },
    {
      "id": "q4",
      "type": "technique",
      "typeName": "手法效果",
      "question": "手法效果題（純文字）：必須結合主旨考問，如：作者在文中運用______手法，試分析此手法如何強化文章______的主旨。或：試舉一例，分析作者如何運用______手法表達______，並說明其效果。",
      "marks": 6,
      "answerLines": 8,
      "answer": "<span class='teacher-answer'>完整答案約100字，體現手法分析與主旨結合</span>",
      "errorAnalysis": "此題常見錯誤：如只分析手法效果而沒有扣緊主旨、引用原文不足等（純文字）",
      "leveledSamples": {
        "level5": "<span class='teacher-answer'>5**級答案示例：引用原文充分、手法分析具體、清晰扣緊主旨</span>",
        "level3": "3級答案示例：能指出手法但效果分析空泛，未能扣主旨（純文字）"
      }
    },
    {
      "id": "q5",
      "type": "insight",
      "typeName": "見解體會",
      "question": "見解體會題（純文字）：要求學生表明立場、提出論點、聯繫現實，如：文中______所體現的精神，在現代社會是否仍有價值？試表明你的立場，並舉例加以論述。",
      "marks": 6,
      "answerLines": 10,
      "answer": "<span class='teacher-answer'>完整答案：表明立場→提出兩個論點→各舉一例（原文或現實）→總結</span>",
      "errorAnalysis": "此題常見錯誤：如立場不明確、論點流於空泛、未能聯繫原文或現實例子（純文字）",
      "leveledSamples": {
        "level5": "<span class='teacher-answer'>5**級答案示例：立場鮮明、論點有力、原文與現實例子結合、論述有層次</span>",
        "level3": "3級答案示例：有立場但論點空泛，例子不夠具體（純文字）"
      }
    }
  ]
}`
}


export function buildVariationPrompt(motherQuestion, variationType, textConfig) {
  const typeMap = {
    comparison: '跨段比較（要求比較文中不同段落的異同）',
    transfer: '情境遷移（改變手法或背景，要求預測效果或改寫）',
    evaluation: '評價反思（提供批判觀點，要求評價作者選擇妥當性）',
  }
  return `根據以下母題，生成一道${typeMap[variationType]}類型的變式題。

篇名：《${textConfig.title}》
原文摘要：${textConfig.content.substring(0, 400)}

母題：${motherQuestion}

【重要】只輸出以下JSON，所有文字用繁體中文：
{
  "content": "變式題完整題目（純文字，不加任何標籤）",
  "answer": "<span class='teacher-answer'>參考答案</span>",
  "scoringNote": "與母題的評分差異說明（純文字）",
  "keyPoints": ["得分點一（純文字）", "得分點二（純文字）"]
}`
}
