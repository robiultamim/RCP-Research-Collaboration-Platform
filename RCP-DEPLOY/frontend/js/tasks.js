// HTML5 Drag and Drop Implementation for RCP Kanban Boards with Live DB Sync

let draggedTaskCard = null;

function dragTask(e) {
  draggedTaskCard = e.currentTarget;
  window.draggedTaskCard = draggedTaskCard;
  window.currentDraggedTaskCard = draggedTaskCard;
  const taskId = draggedTaskCard.dataset.taskId || draggedTaskCard.id.replace('task-', '');
  window.currentDraggedTaskId = taskId;

  if (!draggedTaskCard.id) {
    draggedTaskCard.id = 'task-card-' + Math.random().toString(36).substr(2, 9);
  }
  if (e.dataTransfer) {
    e.dataTransfer.setData('text/plain', draggedTaskCard.id);
    e.dataTransfer.setData('text/task-id', String(taskId));
    e.dataTransfer.effectAllowed = 'move';
  }
  draggedTaskCard.classList.add('dragging');
}

function dragEndTask(e) {
  if (draggedTaskCard) {
    draggedTaskCard.classList.remove('dragging');
  }
  setTimeout(() => {
    draggedTaskCard = null;
    window.draggedTaskCard = null;
    window.currentDraggedTaskCard = null;
    window.currentDraggedTaskId = null;
  }, 300);

  document.querySelectorAll('.kanban-column, .kanban-5-col').forEach(col => {
    col.classList.remove('drag-over');
  });
}

function allowDrop(e) {
  e.preventDefault();
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move';
  }
  const targetCol = e.currentTarget.closest('.kanban-column, .kanban-5-col');
  if (targetCol) {
    targetCol.classList.add('drag-over');
  }
}

function dragLeave(e) {
  const targetCol = e.currentTarget.closest('.kanban-column, .kanban-5-col');
  if (targetCol) {
    targetCol.classList.remove('drag-over');
  }
}

async function dropTask(e) {
  e.preventDefault();
  e.stopPropagation();

  const targetCol = e.currentTarget.closest('.kanban-column, .kanban-5-col');
  if (!targetCol) return;

  targetCol.classList.remove('drag-over');

  // Identify card and task ID
  const cardId = e.dataTransfer ? e.dataTransfer.getData('text/plain') : null;
  const card = (cardId ? document.getElementById(cardId) : null) || window.currentDraggedTaskCard || window.draggedTaskCard || draggedTaskCard;
  const taskId = window.currentDraggedTaskId || (card ? (card.dataset.taskId || card.id.replace('task-', '')) : null);

  if (!taskId) {
    console.warn('[DragDrop] Could not identify task ID to update.');
    return;
  }

  // Check permission
  if (card && card.getAttribute('draggable') === 'false') {
    if (typeof showToast === 'function') {
      showToast('⚠️ Permission Denied: You are not assigned to this task. Only the assigned researcher or supervisor can move it.', true);
    }
    return;
  }

  const targetStatus = targetCol.getAttribute('data-status');
  const titleEl = card ? card.querySelector('.task-title') : null;
  const cardTitle = titleEl ? titleEl.textContent.trim() : 'Task';

  console.log(`[DragDrop] Dropping task #${taskId} into ${targetStatus}...`);

  // Optimistic UI move
  if (card) {
    const itemsContainer = targetCol.querySelector('.kanban-items, .kanban-5-body') || targetCol;
    const placeholder = itemsContainer.querySelector('.empty-col-placeholder');
    if (placeholder) placeholder.remove();
    itemsContainer.appendChild(card);
    updateKanbanCounts(targetCol.closest('.kanban-board, .kanban-col-5'));
  }

  // Persist to Database via API
  if (typeof window.moveTaskStatus === 'function') {
    await window.moveTaskStatus(taskId, targetStatus, cardTitle);
  }
}

function updateKanbanCounts(board) {
  if (!board) board = document;
  const columns = board.querySelectorAll('.kanban-column, .kanban-5-col');
  columns.forEach(col => {
    const items = col.querySelectorAll('.kanban-card, .kanban-5-card');
    const badge = col.querySelector('.badge-custom, .nav-badge');
    if (badge) badge.textContent = items.length;
  });
}

// Export to window
window.allowDrop = allowDrop;
window.dragLeave = dragLeave;
window.dropTask = dropTask;
window.dragTask = dragTask;
window.dragEndTask = dragEndTask;
window.updateKanbanCounts = updateKanbanCounts;
