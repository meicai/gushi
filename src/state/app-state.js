/**
 * 全局状态管理
 * 集中管理应用的所有状态数据和状态变更操作
 */
import { allPoems, Status } from '../data/index.js';
import { loadPoemStatuses, savePoemStatus, loadSettings } from '../../utils/storage.js';
import { createAudioManager } from '../../utils/audio-manager.js';

// ========== 全局状态对象 ==========
const state = {
  currentTab: 'poems',       // 'poems' | 'listen'
  selectedGrade: 'ALL',
  selectedStatuses: new Set(['ALL']),
  selectedTag: 'ALL',         // 当前选中的标签筛选
  poemStatuses: {},           // { poemId: status }
  settings: {},
  detailPoem: null,           // 当前查看的诗词
  speakingLineIndex: null,    // 当前正在朗读的行索引（-1 = 标题/作者）
  showPinyin: true,           // 是否显示拼音
  showTranslation: false,     // 是否显示译文
  reciteMode: false,          // 背诵模式
  revealedLines: new Set(),   // 已揭示的行号
  searchQuery: '',            // 搜索关键词
  favorites: new Set(),       // 收藏的诗 ID
};

// 音频管理器（单例）
const audioManager = createAudioManager();

/**
 * 初始化状态
 * 从 LocalStorage 恢复数据
 */
export function initState() {
  state.poemStatuses = loadPoemStatuses();
  state.settings = loadSettings();
  audioManager.updateConfig(state.settings);

  // 加载收藏列表
  try {
    const saved = localStorage.getItem('gushi_favorites');
    if (saved) state.favorites = new Set(JSON.parse(saved));
  } catch(e) {}
}

/**
 * 获取全局状态的只读引用
 */
export function getState() {
  return state;
}

/**
 * 获取音频管理器实例
 */
export function getAudioManager() {
  return audioManager;
}

/**
 * 获取诗词学习状态
 */
export function getPoemStatus(poemId) {
  const entry = state.poemStatuses[poemId];
  if (!entry) return Status.UNLEARNED;
  // 兼容 v2 对象格式和 v1 字符串格式
  return typeof entry === 'string' ? entry : (entry.status || Status.UNLEARNED);
}

/**
 * 获取状态对应的 CSS 类名
 */
export function getStatusClass(status) {
  switch (status) {
    case Status.MASTERED: return 'mastered';
    case Status.PARTIAL: return 'partial';
    case Status.REVIEW: return 'review';
    default: return 'unlearned';
  }
}

/**
 * 获取状态对应的显示文本
 */
export function getStatusText(status) {
  switch (status) {
    case Status.MASTERED: return '已记';
    case Status.PARTIAL: return '一半';
    case Status.REVIEW: return '再练';
    default: return '未学';
  }
}

/**
 * 获取筛选后的诗词列表
 */
export function getFilteredPoems() {
  let poems = allPoems;
  // 搜索过滤
  if (state.searchQuery.trim()) {
    const q = state.searchQuery.trim().toLowerCase();
    poems = poems.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.author.toLowerCase().includes(q) ||
      p.content.some(line => line.includes(q))
    );
  }
  if (state.selectedGrade !== 'ALL') {
    poems = poems.filter(p => p.grade === state.selectedGrade);
  }
  if (!state.selectedStatuses.has('ALL')) {
    poems = poems.filter(p => state.selectedStatuses.has(getPoemStatus(p.id)));
  }
  if (state.selectedTag && state.selectedTag !== 'ALL') {
    poems = poems.filter(p => p.tags && p.tags.includes(state.selectedTag));
  }
  return poems;
}
