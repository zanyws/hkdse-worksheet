import Dexie from 'dexie'

export const db = new Dexie('HKDSEWorksheetDB')

db.version(1).stores({
  worksheets: '++id, title, author, createdAt, updatedAt',
  questionBanks: '++id, worksheetId, questionId, type, used',
  preferences: 'key',
})

export async function saveWorksheet(data) {
  const now = new Date()
  const existing = await db.worksheets
    .where('title').equals(data.title)
    .and(w => w.author === data.author)
    .first()

  if (existing) {
    await db.worksheets.update(existing.id, { ...data, updatedAt: now })
    return existing.id
  } else {
    // LRU: keep only 10
    const count = await db.worksheets.count()
    if (count >= 10) {
      const oldest = await db.worksheets.orderBy('updatedAt').first()
      if (oldest) await db.worksheets.delete(oldest.id)
    }
    return await db.worksheets.add({ ...data, createdAt: now, updatedAt: now })
  }
}

export async function loadWorksheet(id) {
  return await db.worksheets.get(id)
}

export async function getAllWorksheets() {
  return await db.worksheets.orderBy('updatedAt').reverse().toArray()
}

export async function savePreference(key, value) {
  await db.preferences.put({ key, value })
}

export async function getPreference(key) {
  const pref = await db.preferences.get(key)
  return pref?.value
}

export async function markVariationUsed(worksheetId, questionId, variationId) {
  await db.questionBanks.add({ worksheetId, questionId, variationId, used: true, usedAt: new Date() })
}

export async function getUsedVariations(worksheetId) {
  return await db.questionBanks.where('worksheetId').equals(worksheetId).toArray()
}
