/**
 * 诗单列表视图
 * 渲染首页搜索栏、进度卡片、筛选器和诗歌卡片网格
 */
import { allPoems, GradeLabels, StatusLabels, Status, getPoemBgImage, getRecommendedTheme, THEMES } from '../data/index.js';
import { getState, getPoemStatus, getStatusClass, getStatusText, getFilteredPoems } from '../state/app-state.js';
import { getReviewDuePoems, loadLastViewed } from '../../utils/storage.js';
import { openDetail } from './poem-detail-view.js';

/**
 * 渲染诗单列表
 */
export function renderPoemList() {
  const state = getState();
  const container = document.getElementById('poemListView');
  const filtered = getFilteredPoems();

  // 统计进度
  const masteredCount = allPoems.filter(p => getPoemStatus(p.id) === Status.MASTERED).length;
  const totalCount = allPoems.length;
  const percent = totalCount > 0 ? (masteredCount / totalCount * 100) : 0;

  // 获取今日学习数据
  const lastViewedId = loadLastViewed();
  const lastViewedPoem = lastViewedId ? allPoems.find(p => p.id === lastViewedId) : null;
  
  const dueIds = getReviewDuePoems(3); // 3天未复习
  const duePoems = allPoems.filter(p => dueIds.includes(p.id)).slice(0, 3);
  
  const unlearnedPoems = allPoems.filter(p => {
    const st = getPoemStatus(p.id);
    return st === Status.UNLEARNED || st === Status.REVIEW;
  });
  // 随机推荐2-3首
  const recommendCount = Math.max(0, 3 - duePoems.length - (lastViewedPoem ? 1 : 0)) || 3;
  const recommendations = [...unlearnedPoems].sort(() => Math.random() - 0.5).slice(0, recommendCount);

  // 获取节气/节日专题
  const recommendedTheme = getRecommendedTheme();
  const themeBgUrl = getPoemBgImage({ title: recommendedTheme.cover, dynasty: '', author: '' }); // 借用现有生成 URL 函数

  container.innerHTML = `
    <!-- 顶部欢迎区 -->
    <div class="welcome-section">
      <div class="welcome-text">
        <h2 class="welcome-title">你好，小诗人</h2>
        <p class="welcome-quote">熟读唐诗三百首，不会作诗也会吟</p>
      </div>
      <div class="welcome-progress">
        <div class="wp-ring" style="--percent: ${percent}%">
          <div class="wp-num">${masteredCount}</div>
        </div>
        <div class="wp-label">已掌握</div>
      </div>
    </div>
    
    <!-- 专题推荐卡片 -->
    <div class="theme-banner" id="themeBanner" data-theme-id="${recommendedTheme.id}">
      <div class="theme-bg" style="background-image: url('${themeBgUrl}')"></div>
      <div class="theme-content">
        <h3 class="theme-title">${recommendedTheme.title}</h3>
        <p class="theme-desc">${recommendedTheme.desc}</p>
        <span class="theme-action">探索专题诗词 ➔</span>
      </div>
    </div>

    <!-- 今日学习 -->
    <div class="today-section">
      <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
      </svg>
      <input type="text" class="search-input" id="searchInput"
             placeholder="搜索诗名、作者…"
             value="${state.searchQuery}" />
      ${state.searchQuery ? '<button class="search-clear" id="searchClear">✕</button>' : ''}
    </div>

    <!-- 今日学习 -->
    ${(lastViewedPoem || duePoems.length > 0 || recommendations.length > 0) && !state.searchQuery ? `
      <div class="today-learning-section">
        <div class="section-title">今日学习</div>
        <div class="today-cards-scroller">
          ${lastViewedPoem ? renderTodayCard(lastViewedPoem, '继续学习', 'continue-icon') : ''}
          ${duePoems.map(p => renderTodayCard(p, '温故知新', 'review-icon')).join('')}
          ${recommendations.map(p => renderTodayCard(p, '今日推荐', 'recommend-icon')).join('')}
        </div>
      </div>
    ` : ''}

    <!-- 筛选器 -->
    <div class="filters-section">
      <div class="filter-row">
        ${Object.entries(GradeLabels).map(([key, label]) => `
          <button class="filter-btn grade-btn ${state.selectedGrade === key ? 'active' : ''}"
                  data-grade="${key}">${label}</button>
        `).join('')}
      </div>
      <div class="filter-row">
        ${Object.entries(StatusLabels).map(([key, label]) => `
          <button class="filter-btn status-btn ${state.selectedStatuses.has(key) ? 'active' : ''}"
                  data-status="${key}">${label}</button>
        `).join('')}
      </div>
      <div class="filter-row filter-tags">
        <button class="filter-btn tag-btn ${state.selectedTag === 'ALL' ? 'active' : ''}" data-tag="ALL">全部主题</button>
        ${Array.from(new Set(allPoems.flatMap(p => p.tags || []))).filter(Boolean).map(tag => `
          <button class="filter-btn tag-btn ${state.selectedTag === tag ? 'active' : ''}" data-tag="${tag}">${tag}</button>
        `).join('')}
      </div>
    </div>

    <!-- 诗歌卡片网格 -->
    ${filtered.length > 0 ? `
      <div class="poem-grid">
        ${filtered.map(poem => {
          const status = getPoemStatus(poem.id);
          const bgUrl = getPoemBgImage(poem);
          return `
            <div class="poem-card fade-in" data-poem-id="${poem.id}">
              <div class="card-bg" style="background-image: url('${bgUrl}')"></div>
              <button class="fav-btn ${state.favorites.has(poem.id) ? 'active' : ''}" data-fav-id="${poem.id}">
                ${state.favorites.has(poem.id) ? '❤' : '♡'}
              </button>
              ${status === Status.MASTERED ? `
                <div class="mastered-badge">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
              ` : ''}
              <span class="status-tag ${getStatusClass(status)}">${getStatusText(status)}</span>
              <div class="card-title">${poem.title}</div>
              <div class="card-author">${poem.dynasty ? poem.dynasty + ' · ' : ''}${poem.author}</div>
              <div class="card-preview">${poem.content[0]}</div>
            </div>
          `;
        }).join('')}
      </div>
    ` : `
      <div class="empty-state">
        <div class="empty-icon">📜</div>
        <p>没有找到符合条件的古诗</p>
      </div>
    `}
  `;

  // 绑定年级筛选事件
  container.querySelectorAll('.grade-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.selectedGrade = btn.dataset.grade;
      renderPoemList();
    });
  });

  // 绑定状态筛选事件
  container.querySelectorAll('.status-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.status;
      if (key === 'ALL') {
        state.selectedStatuses.clear();
        state.selectedStatuses.add('ALL');
      } else {
        state.selectedStatuses.delete('ALL');
        if (state.selectedStatuses.has(key)) {
          state.selectedStatuses.delete(key);
          if (state.selectedStatuses.size === 0) state.selectedStatuses.add('ALL');
        } else {
          state.selectedStatuses.add(key);
        }
      }
      renderPoemList();
    });
  });

  // 绑定标签筛选事件
  container.querySelectorAll('.tag-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.selectedTag = btn.dataset.tag;
      renderPoemList();
    });
  });

  // 绑定诗词卡片 和 专题卡片点击事件 (使用 onclick 避免跨次渲染事件叠加)
  container.onclick = (e) => {
    // 处理诗词卡片点击 (打开详情页)
    const card = e.target.closest('.poem-card, .today-card');
    if (card && !e.target.closest('.fav-btn')) {
      const poemId = parseInt(card.dataset.poemId);
      const poem = allPoems.find(p => p.id === poemId);
      if (poem) openDetail(poem);
      return;
    }

    // 处理专题卡片点击 (展示专题浮层)
    const themeBanner = e.target.closest('.theme-banner');
    if (themeBanner) {
      const themeId = themeBanner.dataset.themeId;
      openThemeOverlay(themeId);
    }
  };

  // 搜索事件
  const searchInput = container.querySelector('#searchInput');
  if (searchInput) {
    let isComposing = false;
    searchInput.addEventListener('compositionstart', () => { isComposing = true; });
    searchInput.addEventListener('compositionend', (e) => {
      isComposing = false;
      state.searchQuery = e.target.value;
      renderPoemList();
      const newInput = container.querySelector('#searchInput');
      if (newInput) {
        newInput.focus();
        newInput.setSelectionRange(newInput.value.length, newInput.value.length);
      }
    });
    searchInput.addEventListener('input', (e) => {
      if (isComposing) return;
      state.searchQuery = e.target.value;
      renderPoemList();
      const newInput = container.querySelector('#searchInput');
      if (newInput) {
        newInput.focus();
        newInput.setSelectionRange(newInput.value.length, newInput.value.length);
      }
    });
  }
  const searchClear = container.querySelector('#searchClear');
  if (searchClear) {
    searchClear.addEventListener('click', () => {
      state.searchQuery = '';
      renderPoemList();
    });
  }

  const favBtns = container.querySelectorAll('.fav-btn');
  favBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.favId);
      if (state.favorites.has(id)) {
        state.favorites.delete(id);
      } else {
        state.favorites.add(id);
      }
      btn.classList.toggle('active');
      btn.innerHTML = state.favorites.has(id) ? '❤' : '♡';
      
      try {
        localStorage.setItem('moyu_poem_favorites', JSON.stringify([...state.favorites]));
      } catch (err) {
        console.warn('保存收藏状态失败:', err);
      }
      
      // 如果当前是"一半啦"等状态或收藏夹过滤，重新渲染
      if (state.selectedStatuses.size > 0 || state.searchQuery) {
        renderPoemList();
      }
    });
  });
}

/**
 * 渲染单个今日学习卡片
 */
function renderTodayCard(poem, tagLabel, tagClass) {
  const bgUrl = getPoemBgImage(poem);
  return `
    <div class="today-card fade-in" data-poem-id="${poem.id}">
      <div class="card-bg" style="background-image: url('${bgUrl}')"></div>
      <div class="today-tag ${tagClass}">${tagLabel}</div>
      <div class="card-title">${poem.title}</div>
      <div class="card-author">${poem.dynasty ? poem.dynasty + ' · ' : ''}${poem.author}</div>
    </div>
  `;
}

/**
 * 打开专题覆盖层
 * @param {string} themeId - 专题 ID
 */
function openThemeOverlay(themeId) {
  const theme = THEMES.find(t => t.id === themeId);
  if (!theme) return;

  // 如果已经有专题浮层存在，直接返回，避免多次点击叠加渲染
  if (document.querySelector('.theme-overlay')) return;

  // 根据 theme.poemIds 筛选得到具体的诗歌列表
  const themePoems = allPoems.filter(p => theme.poemIds.includes(p.id));

  const overlay = document.createElement('div');
  overlay.className = 'theme-overlay';
  
  const themeBgUrl = getPoemBgImage({ title: theme.cover, dynasty: '', author: '' });
  
  overlay.innerHTML = `
    <div class="theme-overlay-bg" style="background-image: url('${themeBgUrl}')"></div>
    <div class="theme-overlay-header">
      <button class="btn-back" id="themeClose">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>
      <h2>${theme.title}专题</h2>
    </div>
    <div class="theme-overlay-content">
      <div class="theme-hero">
        <p class="theme-hero-desc">${theme.desc}</p>
        <span class="theme-hero-count">共 ${themePoems.length} 首</span>
      </div>
      <div class="theme-poems-list">
        ${themePoems.map(poem => {
          const status = getPoemStatus(poem.id);
          const state = getState();
          return `
            <div class="poem-card" data-poem-id="${poem.id}">
              <div class="card-bg" style="background-image: url('${getPoemBgImage(poem)}')"></div>
              <button class="fav-btn ${state.favorites.has(poem.id) ? 'active' : ''}" data-fav-id="${poem.id}">
                ${state.favorites.has(poem.id) ? '❤' : '♡'}
              </button>
              ${status === Status.MASTERED ? `
                <div class="mastered-badge">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
              ` : ''}
              <span class="status-tag ${getStatusClass(status)}">${getStatusText(status)}</span>
              <div class="card-title">${poem.title}</div>
              <div class="card-author">${poem.dynasty ? poem.dynasty + ' · ' : ''}${poem.author}</div>
              <div class="card-preview">${poem.content[0]}</div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // 动画登场
  requestAnimationFrame(() => {
    overlay.classList.add('visible');
  });

  // 绑定事件
  overlay.querySelector('#themeClose').addEventListener('click', () => {
    overlay.classList.remove('visible');
    setTimeout(() => {
      document.body.removeChild(overlay);
    }, 300);
  });

  overlay.querySelector('.theme-poems-list').addEventListener('click', (e) => {
    const card = e.target.closest('.poem-card');
    if (card && !e.target.closest('.fav-btn')) {
      const poemId = parseInt(card.dataset.poemId);
      const poem = allPoems.find(p => p.id === poemId);
      if (poem) openDetail(poem);
    }
  });
}
