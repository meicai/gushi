import html2canvas from 'html2canvas';
import { getPoemBgImage } from '../data/bg-images.js';
import { showToast } from './toast.js';
import { getState } from '../state/app-state.js';
import { Status } from '../data/index.js';

/**
 * 显示分享海报模态框
 * @param {Object} poem - 诗词对象
 */
export async function showShareModal(poem) {
  const bgUrl = getPoemBgImage(poem);
  const state = getState();
  const status = state.poemStatuses[poem.id];
  let statusText = '正在学习';
  if (status === Status.MASTERED) statusText = '已熟记于心';
  else if (status === Status.PARTIAL) statusText = '已掌握一半';
  else if (status === Status.REVIEW) statusText = '温故知新';

  // 创建隐藏容器
  const container = document.createElement('div');
  container.className = 'share-card-container';
  container.innerHTML = `
    <div class="sc-bg" style="background-image: url('${bgUrl}')"></div>
    <div class="sc-content">
      <h2 class="sc-title">${poem.title}</h2>
      <div class="sc-meta">${poem.dynasty ? poem.dynasty + ' · ' : ''}${poem.author}</div>
      <div class="sc-body">
        ${poem.content.map(line => `<p class="sc-line">${line}</p>`).join('')}
      </div>
    </div>
    <div class="sc-footer">
      <div class="sc-info">
        <div class="sc-logo">墨韵诗林</div>
        <div class="sc-desc">“${statusText}”</div>
      </div>
      <div class="sc-qrcode">
        <!-- 模拟二维码效果 -->
        <div class="qr-placeholder">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="var(--accent-gold)"><path d="M3 3h6v6H3V3zm2 2v2h2V5H5zm8-2h6v6h-6V3zm2 2v2h2V5h-2zM3 13h6v6H3v-6zm2 2v2h2v-2H5zm13-2h-2v2h2v-2zm-2 2h-2v2h2v-2zm-2 2h-2v2h2v-2zm2 0h2v2h-2v-2zm2-4h2v6h-2v-6zm-4-4h4v2h-4v-2z"/></svg>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(container);
  showToast('正在生成书卷海报...', 2000);

  try {
    // 渲染为 Canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#FDFBF7'
    });

    const imgUrl = canvas.toDataURL('image/png');
    
    // 显示预览模态框
    showPreviewModal(imgUrl);
  } catch (err) {
    console.error('海报生成失败', err);
    showToast('海报生成失败，请稍后再试');
  } finally {
    // 清理隐藏容器
    document.body.removeChild(container);
  }
}

/**
 * 显示图片预览模态框
 */
function showPreviewModal(imgUrl) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay share-preview-overlay';
  
  overlay.innerHTML = `
    <div class="share-preview-modal">
      <div class="sp-header">
        <span class="sp-title">长按或右键保存海报</span>
        <button class="icon-btn sp-close">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="sp-img-wrapper">
        <img src="${imgUrl}" alt="分享海报" class="sp-img" />
      </div>
      <div class="sp-actions">
        <a href="${imgUrl}" download="墨韵诗林海报.png" class="btn-primary" style="text-decoration: none; color: white;">保存图片</a>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // 动画登场
  requestAnimationFrame(() => {
    overlay.classList.add('visible');
  });

  const closeBtn = overlay.querySelector('.sp-close');
  const closeModal = () => {
    overlay.classList.remove('visible');
    setTimeout(() => {
      document.body.removeChild(overlay);
    }, 300);
  };

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
}
