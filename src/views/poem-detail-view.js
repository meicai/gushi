/**
 * 诗歌详情视图模块
 * 渲染详情模态框、拼音/译文切换、背诵模式、状态标记
 */
import { getState, getPoemStatus, getStatusClass, getStatusText, getFilteredPoems, getAudioManager } from '../state/app-state.js';
import { allPoems, Status, rubyLine, getPoemBgImage } from '../data/index.js';
import { savePoemStatus, saveLastViewed } from '../../utils/storage.js';
import { speak, stopSpeaking, speakEncouragement } from '../../utils/tts.js';
import { showToast } from '../components/toast.js';
import { renderPoemList } from './poem-list-view.js';
import { showShareModal } from '../components/share-card.js';

const FONT_SIZES = ['1.3rem', '1.5rem', '1.8rem', '2rem', '2.2rem'];
let fontSizeIndex = 2;

// 背诵模式枚举
const ReciteMode = {
  OFF: 'OFF',               // 关闭
  FULL_HIDE: 'FULL_HIDE',   // 全遮挡
  KEYWORD_HINT: 'KEYWORD_HINT', // 关键词提示
  FIRST_CHAR: 'FIRST_CHAR', // 首字提示
};

// 背诵模式循环顺序
const RECITE_CYCLE = [ReciteMode.OFF, ReciteMode.FULL_HIDE, ReciteMode.KEYWORD_HINT, ReciteMode.FIRST_CHAR];

// 背诵模式标签
const RECITE_LABELS = {
  [ReciteMode.OFF]: '背',
  [ReciteMode.FULL_HIDE]: '全遮',
  [ReciteMode.KEYWORD_HINT]: '提示',
  [ReciteMode.FIRST_CHAR]: '首字',
};

/**
 * 打开诗歌详情模态框
 */
export function openDetail(poem) {
  const state = getState();
  state.detailPoem = poem;
  state.speakingLineIndex = null;
  state.reciteMode = ReciteMode.OFF;
  state.revealedLines = new Set();
  
  // 记录最后查看的诗词
  saveLastViewed(poem.id);

  const modal = document.getElementById('poemDetailModal');
  renderDetailContent(modal, poem);
  modal.classList.remove('hidden');
  modal.classList.add('visible');
}

/**
 * 关闭详情模态框
 */
export function closeDetail() {
  const state = getState();
  const audioManager = getAudioManager();
  stopSpeaking();
  state.speakingLineIndex = null;
  const modal = document.getElementById('poemDetailModal');
  modal.classList.remove('visible');
  modal.classList.add('hidden');
  state.detailPoem = null;
  renderPoemList();
}

/**
 * 渲染详情内容
 */
function renderDetailContent(modal, poem) {
  const state = getState();
  const audioManager = getAudioManager();
  const filtered = getFilteredPoems();
  const index = filtered.findIndex(p => p.id === poem.id);
  const hasPrev = index > 0;
  const hasNext = index < filtered.length - 1;
  const status = getPoemStatus(poem.id);
  const amState = audioManager.getState();
  const isPlaying = amState.isPlaying && amState.currentPoem?.id === poem.id;

  // 根据诗句数量决定字号
  const lineCount = poem.content.length;
  let fontSize;
  if (lineCount <= 4) fontSize = '36px';
  else if (lineCount <= 6) fontSize = '30px';
  else fontSize = '26px';

  const detailBgUrl = getPoemBgImage(poem);

  modal.innerHTML = `
    <div class="detail-header">
      <button class="btn-back" id="detailClose">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>
      <div class="detail-toolbar">
        <button class="tool-btn ${state.showPinyin ? 'active' : ''}" id="togglePinyin" title="拼音">
          <span style="font-size:12px;font-weight:700;">拼</span>
        </button>
        <button class="tool-btn ${state.showTranslation ? 'active' : ''}" id="toggleTranslation" title="译文">
          <span style="font-size:12px;font-weight:700;">译</span>
        </button>
        <button class="tool-btn ${state.reciteMode !== ReciteMode.OFF ? 'active' : ''}" id="toggleRecite" title="背诵模式">
          <span style="font-size:11px;font-weight:700;">${RECITE_LABELS[state.reciteMode]}</span>
        </button>
        <button class="tool-btn" id="shareBtn" title="分享长图">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
        </button>
        <div class="detail-counter">第 ${index + 1} 首 / 共 ${filtered.length} 首</div>
      </div>
      <button class="btn-play ${isPlaying ? 'playing' : ''}" id="detailPlay">
        ${isPlaying ? `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
          </svg>
        ` : `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 5L6 9H2v6h4l5 4V5z"/>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
          </svg>
        `}
      </button>
    </div>

    <div class="detail-body">
      <div class="detail-bg" style="background-image: url('${detailBgUrl}')"></div>
      <button class="detail-nav-btn prev ${hasPrev ? '' : 'invisible'}" id="detailPrev">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m15 18-6-6 6-6"/>
        </svg>
      </button>

      <h2 class="detail-title ${state.speakingLineIndex === -1 ? 'speaking' : ''}" id="detailTitle">${poem.title}</h2>
      <div class="detail-meta" id="detailMeta">
        <div class="divider-line"></div>
        <div class="meta-text ${state.speakingLineIndex === -1 ? 'speaking' : ''}">
          ${poem.dynasty ? poem.dynasty + ' · ' : ''}${poem.author}
        </div>
        <div class="divider-line"></div>
      </div>

      <div class="detail-content ${state.showPinyin && state.reciteMode === ReciteMode.OFF ? 'with-pinyin' : ''} ${state.speakingLineIndex !== null && state.speakingLineIndex >= 0 ? 'is-speaking' : ''}">
        ${poem.content.map((line, i) => {
          const isReciting = state.reciteMode !== ReciteMode.OFF;
          const isRevealed = state.revealedLines.has(i);
          
          let lineHtml = '';
          const isCurrentLineSpeaking = state.speakingLineIndex === i;
          
          if (isReciting && !isRevealed) {
            // 背诵模式：由于遮挡逻辑内置在 renderReciteLine 里，传递 isCurrentLineSpeaking 和当前的 speakingCharIndex 进行字级高亮
            lineHtml = renderReciteLine(line, state.reciteMode, state.showPinyin ? poem.pinyin?.[i] : null, isCurrentLineSpeaking ? state.speakingCharIndex : null);
          } else {
            // 正常模式：切割行内每个字配以 span
            const chars = [...line];
            const pinyins = (state.showPinyin && poem.pinyin?.[i]) ? poem.pinyin[i].split(/\s+/) : [];
            let pIdx = 0;
            
            chars.forEach((ch, charIdx) => {
               const isSpeakingThisChar = isCurrentLineSpeaking && state.speakingCharIndex === charIdx;
               const charClass = isSpeakingThisChar ? 'char-speaking' : '';
               
               if (/[\u4e00-\u9fff]/.test(ch)) {
                  if (state.showPinyin && pinyins.length > 0) {
                     const py = pIdx < pinyins.length ? pinyins[pIdx] : '';
                     lineHtml += `<ruby class="${charClass}">${ch}<rt>${py}</rt></ruby>`;
                     pIdx++;
                  } else {
                     lineHtml += `<span class="${charClass}">${ch}</span>`;
                  }
               } else {
                  // 标点符号或其他字符
                  lineHtml += `<span class="${charClass}">${ch}</span>`;
                  // 跳过可能带上的标点拼音占位
                  if (state.showPinyin && pinyins.length > 0 && pIdx < pinyins.length && /^[，。？！、；：""''《》（）\u3002\uff01\uff1f\uff0c]$/.test(pinyins[pIdx])) {
                     pIdx++;
                  }
               }
            });
          }
          
          return `
          <p class="detail-line ${state.speakingLineIndex === i ? 'speaking' : ''} ${isReciting && !isRevealed ? 'recite-hidden' : ''} ${isReciting && isRevealed ? 'recite-revealed' : ''}"
             style="font-size: ${fontSize}"
             data-line-index="${i}">${lineHtml}</p>
        `;
        }).join('')}
      </div>

      ${state.reciteMode !== ReciteMode.OFF ? `
        <div class="recite-hint">
          ${state.revealedLines.size < poem.content.length
            ? `<span class="recite-mode-label">${RECITE_LABELS[state.reciteMode]}模式</span> · 点击可揭示诗句`
            : '🎉 太棒了，全部背出来了！'}
        </div>
      ` : ''}

      ${state.showTranslation && poem.translation ? `
        <div class="detail-translation">
          <div class="translation-label">译文</div>
          <p class="translation-text">${poem.translation}</p>
        </div>
      ` : ''}

      <button class="detail-nav-btn next ${hasNext ? '' : 'invisible'}" id="detailNext">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m9 18 6-6-6-6"/>
        </svg>
      </button>
    </div>

    <div class="detail-actions">
      <button class="action-btn ${status === Status.REVIEW ? 'selected' : ''}" data-action="${Status.REVIEW}">再练练</button>
      <button class="action-btn ${status === Status.PARTIAL ? 'selected' : ''}" data-action="${Status.PARTIAL}">一半了</button>
      <button class="action-btn ${status === Status.MASTERED ? 'selected' : ''}" data-action="${Status.MASTERED}">记住啦</button>
    </div>
    
    <!-- 印章特效 -->
    <div class="stamp-fx" id="stampFx">
      <div class="stamp-border">已掌握</div>
    </div>
  `;

  // 绑定事件
  modal.querySelector('#detailClose').addEventListener('click', closeDetail);

  // 拼音/译文/背诵/分享 切换
  modal.querySelector('#shareBtn').addEventListener('click', () => {
    showShareModal(poem);
  });
  modal.querySelector('#togglePinyin').addEventListener('click', () => {
    state.showPinyin = !state.showPinyin;
    renderDetailContent(modal, poem);
  });
  modal.querySelector('#toggleTranslation').addEventListener('click', () => {
    state.showTranslation = !state.showTranslation;
    renderDetailContent(modal, poem);
  });
  modal.querySelector('#toggleRecite').addEventListener('click', () => {
    // 循环切换背诵模式：关 → 全遮 → 关键词 → 首字 → 关
    const currentIdx = RECITE_CYCLE.indexOf(state.reciteMode);
    state.reciteMode = RECITE_CYCLE[(currentIdx + 1) % RECITE_CYCLE.length];
    state.revealedLines = new Set();
    if (state.reciteMode !== ReciteMode.OFF) {
      state.showTranslation = false;
    }
    renderDetailContent(modal, poem);
  });

  // 详情页播放按钮
  modal.querySelector('#detailPlay').addEventListener('click', () => {
    const amSt = audioManager.getState();
    if (amSt.isPlaying && amSt.currentPoem?.id === poem.id) {
      audioManager.stop();
      state.speakingLineIndex = null;
      state.speakingCharIndex = null;
      renderDetailContent(modal, poem);
    } else {
      stopSpeaking();
      // 这里传 null 列表代表只单曲播放不连播
      audioManager.playPoem(poem, null, 0, {
        onBoundary: (charIndex) => {
          // charIndex 是基于全文字符串（含标题等）的绝对偏移
          const dynastyText = poem.dynasty ? `${poem.dynasty}，` : '';
          const metaText = `${poem.title}，${dynastyText}${poem.author}。`;
          
          if (charIndex < metaText.length) {
            state.speakingLineIndex = -1; // 正在读标题/作者
            state.speakingCharIndex = charIndex;
          } else {
            let relativeIdx = charIndex - metaText.length;
            let currentLine = 0;
            let currentCharInLine = 0;
            for (let i = 0; i < poem.content.length; i++) {
              if (relativeIdx < poem.content[i].length) {
                currentLine = i;
                currentCharInLine = relativeIdx;
                break;
              }
              relativeIdx -= poem.content[i].length;
            }
            state.speakingLineIndex = currentLine;
            state.speakingCharIndex = currentCharInLine;
          }
          renderDetailContent(modal, poem);
        }
      });
    }
  });

  // ========== 音频管理器状态回调监听 ==========
  const unsubscribeAm = audioManager.subscribe((amSt) => {
    if (!amSt.isPlaying) {
      state.speakingLineIndex = null;
      state.speakingCharIndex = null;
      renderDetailContent(modal, poem);
    }
  });
  // 覆盖 closeDetail 添加去订阅监听
  const originalClose = modal.dataset.onClose;
  modal.querySelector('#detailClose').addEventListener('click', () => {
    unsubscribeAm();
    closeDetail();
  });

  // 标题/作者点读
  const titleEl = modal.querySelector('#detailTitle');
  const metaEl = modal.querySelector('#detailMeta');
  const speakTitle = () => {
    stopSpeaking();
    audioManager.stop();
    state.speakingLineIndex = -1;
    state.speakingCharIndex = 0; // 粗略定位
    renderDetailContent(modal, poem);
    const text = `${poem.title}，${poem.dynasty ? poem.dynasty + '，' : ''}${poem.author}。`;
    speak(text, {
      speed: state.settings.speed,
      onBoundary: (idx) => {
        state.speakingCharIndex = idx;
        renderDetailContent(modal, poem);
      },
      onEnd: () => { state.speakingLineIndex = null; state.speakingCharIndex = null; renderDetailContent(modal, poem); },
      onError: () => { state.speakingLineIndex = null; state.speakingCharIndex = null; renderDetailContent(modal, poem); },
    });
  };
  titleEl.addEventListener('click', speakTitle);
  metaEl.addEventListener('click', speakTitle);

  // 逐句点读 / 背诵揭示
  modal.querySelectorAll('.detail-line').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.dataset.lineIndex);
      if (state.reciteMode && !state.revealedLines.has(idx)) {
        state.revealedLines.add(idx);
        renderDetailContent(modal, poem);
        return;
      }
      stopSpeaking();
      audioManager.stop();
      state.speakingLineIndex = idx;
      state.speakingCharIndex = 0;
      renderDetailContent(modal, poem);
      speak(poem.content[idx], {
        speed: state.settings.speed,
        onBoundary: (charIdx) => {
          state.speakingCharIndex = charIdx;
          renderDetailContent(modal, poem);
        },
        onEnd: () => { state.speakingLineIndex = null; state.speakingCharIndex = null; renderDetailContent(modal, poem); },
        onError: () => { state.speakingLineIndex = null; state.speakingCharIndex = null; renderDetailContent(modal, poem); },
      });
    });
  });

  // 上下首切换
  if (hasPrev) {
    modal.querySelector('#detailPrev').addEventListener('click', () => {
      stopSpeaking();
      state.speakingLineIndex = null;
      const prev = filtered[index - 1];
      state.detailPoem = prev;
      renderDetailContent(modal, prev);
    });
  }
  if (hasNext) {
    modal.querySelector('#detailNext').addEventListener('click', () => {
      stopSpeaking();
      state.speakingLineIndex = null;
      const next = filtered[index + 1];
      state.detailPoem = next;
      renderDetailContent(modal, next);
    });
  }

  // 学习状态标记
  modal.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const oldStatus = state.poemStatuses[poem.id];
      const newStatus = btn.dataset.action;
      state.poemStatuses[poem.id] = newStatus;
      savePoemStatus(poem.id, newStatus);

      if (newStatus === Status.MASTERED && oldStatus !== Status.MASTERED) {
        if (state.settings.enableEncouragement) {
          stopSpeaking();
          audioManager.stop();
          speakEncouragement(state.settings.speed);
        }
        showToast('太棒了！已记住 🎉');
      } else {
        showToast('继续加油！💪');
      }
      
      renderDetailContent(modal, poem);

      // 如果标记为已掌握，触发印章动画
      if (newStatus === Status.MASTERED && oldStatus !== Status.MASTERED) {
        const stamp = modal.querySelector('#stampFx');
        if (stamp) {
          // 在下一帧添加类触发 CSS 动画
          requestAnimationFrame(() => {
            stamp.classList.add('animate');
            setTimeout(() => { stamp.classList.remove('animate'); }, 2000);
          });
        }
      }
    });
  });
}

/**
 * 渲染背诵模式的一行
 * @param {string} line - 原始行内容
 * @param {string} mode - 背诵模式枚举值
 * @param {string} [pinyinLine] - 对应行的拼音（可选）
 * @param {number|null} [speakingCharIdx] - 当前正在播放的字索引
 * @returns {string} 渲染后的 HTML
 */
function renderReciteLine(line, mode, pinyinLine, speakingCharIdx) {
  const chars = [...line];
  
  // 找出所有汉字的索引
  const hanziIndexes = [];
  chars.forEach((ch, idx) => {
    if (/[\u4e00-\u9fff]/.test(ch)) {
      hanziIndexes.push(idx);
    }
  });

  if (hanziIndexes.length === 0) return line;

  const showIndexes = new Set();
  
  if (mode === ReciteMode.FIRST_CHAR) {
    // 首字提示：只显示第一个汉字
    showIndexes.add(hanziIndexes[0]);
  } else if (mode === ReciteMode.KEYWORD_HINT) {
    // 关键词提示：显示开头和结尾的汉字
    showIndexes.add(hanziIndexes[0]);
    if (hanziIndexes.length >= 3) {
       showIndexes.add(hanziIndexes[hanziIndexes.length - 1]);
    }
    // 如果长句，固定再加一个中间的字
    if (hanziIndexes.length >= 7) {
       showIndexes.add(hanziIndexes[Math.floor(hanziIndexes.length / 2)]);
    }
  }
  // ReciteMode.FULL_HIDE 则什么都不加，全遮挡

  const pinyins = pinyinLine ? pinyinLine.split(/\s+/) : [];
  let pIdx = 0;
  let html = '';

  chars.forEach((ch, idx) => {
    const isSpeakingThisChar = speakingCharIdx !== null && speakingCharIdx === idx;
    const charClass = isSpeakingThisChar ? 'char-speaking' : '';
    
    if (/[\u4e00-\u9fff]/.test(ch)) {
      const isShow = showIndexes.has(idx);
      const displayChar = isShow ? ch : '<span class="blank-char">　</span>';
      
      if (pinyinLine && pIdx < pinyins.length) {
        const py = pinyins[pIdx];
        const displayPy = isShow ? py : '　';
        html += `<ruby class="${charClass}">${displayChar}<rt>${displayPy}</rt></ruby>`;
        pIdx++;
      } else {
        html += `<span class="${charClass}">${displayChar}</span>`;
      }
    } else {
      html += `<span class="${charClass}">${ch}</span>`;
      if (pinyinLine && pIdx < pinyins.length && /^[，。？！、；：""''《》（）\u3002\uff01\uff1f\uff0c]$/.test(pinyins[pIdx])) {
        // 消耗标点符号的占位拼音项
        pIdx++;
      }
    }
  });

  return html;
}
