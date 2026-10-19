// Admin bulk actions reuse the existing, authorized single-question GAS APIs.
// No new backend endpoint, role bypass, or auto-publication is introduced.
export const BULK_LIMIT = 30;
const PUBLIC_DOMAINS = new Set(['place','time','language','lifeCulture','japanConnection','thinkConnect']);
const PUBLIC_TYPES = new Set(['text4','photo4','photoText4']);

export function eligibleForBulk(question, mode) {
  if (!question || !question.id) return false;
  if (mode === 'approve') return question.status === 'draft';
  return mode === 'publish' && question.status === 'approved' &&
    /^[a-z]{2}$/.test(String(question.countryIso||'').toLowerCase()) &&
    PUBLIC_DOMAINS.has(question.domain) && PUBLIC_TYPES.has(question.type);
}

export function createBulkPlan(mode, ids, questions, role) {
  if (role !== 'admin') throw new Error('一括操作は管理者だけが実行できます。');
  if (!['approve', 'publish'].includes(mode)) throw new Error('不明な一括操作です。');
  if (!Array.isArray(ids) || !Array.isArray(questions) ||
      ids.length === 0 || ids.length > BULK_LIMIT) {
    throw new Error(`1〜${BULK_LIMIT}件を選択してください。`);
  }
  if (new Set(ids).size !== ids.length || ids.some(id => typeof id !== 'string')) {
    throw new Error('問題IDが重複、または不正です。');
  }
  const byId = new Map(questions.map(q => [q.id, q]));
  const items = ids.map(id => byId.get(id));
  if (items.some(q => !eligibleForBulk(q, mode))) {
    throw new Error('選択した問題の状態が変わっています。一覧を更新して選び直してください。');
  }
  if (mode === 'publish') {
    // Every country/domain has an independent 10-question published quota.
    const selectedPerScope = new Map();
    for (const q of items) {
      const key = String(q.countryIso).toLowerCase()+':'+q.domain;
      selectedPerScope.set(key,(selectedPerScope.get(key)||0)+1);
    }
    for (const [key, selected] of selectedPerScope) {
      const published=questions.filter(q=>
        String(q.countryIso||'').toLowerCase()+':'+q.domain===key &&
        q.status==='published').length;
      if(published+selected>10){
        throw new Error(key+' の公開枠は残り'+Math.max(0,10-published)+'問です。選択数を減らしてください。');
      }
    }
  }
  return { mode, items: items.map(q => ({ id: q.id, title: String(q.prompt || '').slice(0, 70) })) };
}

export async function executeBulkPlan(plan, request, onProgress = () => {}) {
  if (!plan || !['approve', 'publish'].includes(plan.mode) ||
      !Array.isArray(plan.items) || plan.items.length === 0 ||
      plan.items.length > BULK_LIMIT || typeof request !== 'function') {
    throw new Error('一括実行の指定が不正です。');
  }
  const done = [], failed = [];
  for (const item of plan.items) {
    const index = done.length + failed.length + 1;
    onProgress({ current: index, total: plan.items.length, title: item.title, stage: 'running' });
    try {
      if (plan.mode === 'approve') {
        await request('reviewQuestion', { questionId: item.id, status: 'approved' });
      } else {
        // Must be paired with the administrator's explicit batch rights confirmation.
        await request('setPublication', { questionId: item.id, mode: 'publish', rightsConfirmed: true });
      }
      done.push(item);
    } catch (error) {
      // No automatic retries: an upstream timeout may occur AFTER committing.
      failed.push({ ...item, reason: error?.message || '応答を確認できませんでした。' });
    }
    onProgress({ current: index, total: plan.items.length, title: item.title, stage: 'finished' });
  }
  return { mode: plan.mode, total: plan.items.length, done, failed };
}
