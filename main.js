/**
 * 墨韵诗林 — 主程序入口
 * 管理 Tab 路由、初始化和全局事件
 *
 * 模块拆分后，各功能职责：
 * - src/state/app-state.js    → 全局状态管理
 * - src/views/poem-list-view.js → 诗单列表视图
 * - src/views/poem-detail-view.js → 详情视图
 * - src/views/listen-view.js  → 磨耳朵播放器
 * - src/views/settings-view.js → 设置面板
 * - src/components/toast.js   → Toast 提示组件
 */
import { initState, getState, getAudioManager } from './src/state/app-state.js';
import { renderPoemList } from './src/views/poem-list-view.js';
import { renderListenPlayer } from './src/views/listen-view.js';
import { openSettings } from './src/views/settings-view.js';
import { stopSpeaking } from './utils/tts.js';

// ========== 初始化 ==========
function init() {
  // 加载本地存储数据
  initState();

  const audioManager = getAudioManager();

  // 音频管理器回调：播放状态变化时刷新视图
  audioManager.subscribe(() => {
    const state = getState();
    if (state.currentTab === 'listen') {
      renderListenPlayer();
    }
  });

  // 渲染初始视图
  renderPoemList();
  setupTabNavigation();
}

// ========== Tab 路由 ==========
function setupTabNavigation() {
  const state = getState();
  const tabBtns = document.querySelectorAll('.nav-item');
  const settingsBtn = document.getElementById('settingsBtn');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      if (tab === state.currentTab) return;

      // 切 tab 时停止朗读
      stopSpeaking();

      state.currentTab = tab;

      // 更新 tab 按钮状态
      tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === tab));

      // 切换视图可见性
      document.getElementById('poemListView').classList.toggle('active', tab === 'poems');
      document.getElementById('listenView').classList.toggle('active', tab === 'listen');

      // 渲染目标视图
      if (tab === 'poems') {
        renderPoemList();
      } else if (tab === 'listen') {
        renderListenPlayer();
      }
    });
  });

  // 设置按钮
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => openSettings());
  }
}

// ========== 启动（兼容 module 脚本加载时机） ==========
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// 注册 Service Worker，利用 Vite 提供的 BASE_URL 确保路径在不同环境下均有效
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(err => {
      console.warn('ServiceWorker 注册失败: ', err);
    });
  });
}
