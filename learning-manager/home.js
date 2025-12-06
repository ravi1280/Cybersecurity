// ==================== Data Management ====================
class LearningManager {
    constructor() {
        this.topics = this.loadData();
    }

    loadData() {
        const data = localStorage.getItem('cyberlearn_data');
        if (!data) return [];
        try {
            const parsed = JSON.parse(data);
            if (!Array.isArray(parsed)) return [];
            // Sanitize data on load to ensure structure is correct
            return parsed.map(topic => ({
                ...topic,
                contents: Array.isArray(topic.contents) ? topic.contents : []
            }));
        } catch (e) {
            console.error('Error loading data:', e);
            return [];
        }
    }

    saveData() {
        localStorage.setItem('cyberlearn_data', JSON.stringify(this.topics));
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    addTopic(name, description = '') {
        const topic = {
            id: this.generateId(),
            name,
            description,
            contents: [],
            createdAt: new Date().toISOString()
        };
        this.topics.push(topic);
        this.saveData();
        return topic;
    }

    updateTopic(id, name, description) {
        const topic = this.topics.find(t => t.id === id);
        if (topic) {
            topic.name = name;
            topic.description = description;
            this.saveData();
        }
    }

    deleteTopic(id) {
        this.topics = this.topics.filter(t => t.id !== id);
        this.saveData();
    }

    getTopic(id) {
        return this.topics.find(t => t.id === id);
    }

    // Export data to downloadable JSON file
    exportData() {
        const dataStr = JSON.stringify(this.topics, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'cyberlearn_data.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // Import data from JSON file
    importData(file, callback) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                if (Array.isArray(importedData)) {
                    this.topics = importedData.map(topic => ({
                        ...topic,
                        contents: Array.isArray(topic.contents) ? topic.contents : []
                    }));
                    this.saveData();
                    if (callback) callback(true, 'Data imported successfully!');
                } else {
                    if (callback) callback(false, 'Invalid data format. Please select a valid backup file.');
                }
            } catch (error) {
                if (callback) callback(false, 'Error reading file. Please select a valid JSON file.');
            }
        };
        reader.readAsText(file);
    }
}

// ==================== Home Page UI ====================
class HomeUI {
    constructor(learningManager) {
        this.lm = learningManager;
        this.currentTopicId = null;
        this.initializeElements();
        this.attachEventListeners();
        this.render();
    }

    initializeElements() {
        this.topicModal = document.getElementById('topicModal');
        this.topicForm = document.getElementById('topicForm');
        this.topicsTableContainer = document.getElementById('topicsTableContainer');
        this.topicsTableBody = document.getElementById('topicsTableBody');
        this.emptyState = document.getElementById('emptyState');
    }

    attachEventListeners() {
        // Topic modal triggers
        document.getElementById('addTopicBtn').addEventListener('click', () => this.openTopicModal());
        document.getElementById('addTopicBtnEmpty').addEventListener('click', () => this.openTopicModal());
        document.getElementById('topicModalClose').addEventListener('click', () => this.closeTopicModal());
        document.getElementById('topicModalOverlay').addEventListener('click', () => this.closeTopicModal());
        document.getElementById('cancelTopicBtn').addEventListener('click', () => this.closeTopicModal());

        // Form submission
        this.topicForm.addEventListener('submit', (e) => this.handleTopicSubmit(e));

        // Export/Import buttons
        document.getElementById('exportDataBtn')?.addEventListener('click', () => this.exportData());
        document.getElementById('importDataBtn')?.addEventListener('click', () => this.importData());
    }

    // ==================== Custom UI Methods ====================
    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        let icon = 'ℹ️';
        if (type === 'success') icon = '✅';
        if (type === 'error') icon = '❌';

        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-content">
                <div class="toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">&times;</button>
        `;

        toastContainer.appendChild(toast);

        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.style.animation = 'toastSlideOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        });

        // Auto remove
        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.animation = 'toastSlideOut 0.3s ease forwards';
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000);
    }

    showConfirm(title, message, onConfirm) {
        const modal = document.getElementById('confirmModal');
        const overlay = document.getElementById('confirmModalOverlay');
        const titleEl = document.getElementById('confirmTitle');
        const messageEl = document.getElementById('confirmMessage');
        const cancelBtn = document.getElementById('confirmCancelBtn');
        const okBtn = document.getElementById('confirmOkBtn');

        titleEl.textContent = title;
        messageEl.textContent = message;

        const closeModal = () => {
            modal.classList.remove('active');
            // Remove event listeners to prevent duplicates
            okBtn.replaceWith(okBtn.cloneNode(true));
            cancelBtn.replaceWith(cancelBtn.cloneNode(true));
            overlay.replaceWith(overlay.cloneNode(true));
        };

        modal.classList.add('active');

        // Re-select buttons after cloning
        const newOkBtn = document.getElementById('confirmOkBtn');
        const newCancelBtn = document.getElementById('confirmCancelBtn');
        const newOverlay = document.getElementById('confirmModalOverlay');

        newOkBtn.addEventListener('click', () => {
            closeModal();
            onConfirm();
        });

        newCancelBtn.addEventListener('click', closeModal);
        newOverlay.addEventListener('click', closeModal);
    }

    exportData() {
        this.lm.exportData();
        this.showToast('Data exported successfully!', 'success');
    }

    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.showConfirm(
                    'Import Data?',
                    'This will replace all your current topics and content. Are you sure you want to proceed?',
                    () => {
                        this.lm.importData(file, (success, message) => {
                            if (success) {
                                this.showToast(message, 'success');
                                setTimeout(() => window.location.reload(), 1500);
                            } else {
                                this.showToast(message, 'error');
                            }
                        });
                    }
                );
            }
        };
        input.click();
    }

    openTopicModal(topicId = null) {
        this.currentTopicId = topicId;

        const modalTitle = document.getElementById('topicModalTitle');
        const topicNameInput = document.getElementById('topicName');
        const topicDescInput = document.getElementById('topicDescription');

        if (topicId) {
            const topic = this.lm.getTopic(topicId);
            modalTitle.textContent = 'Edit Topic';
            topicNameInput.value = topic.name;
            topicDescInput.value = topic.description || '';
        } else {
            modalTitle.textContent = 'Add New Topic';
            topicNameInput.value = '';
            topicDescInput.value = '';
        }

        this.topicModal.classList.add('active');
    }

    closeTopicModal() {
        this.topicModal.classList.remove('active');
        this.topicForm.reset();
    }

    handleTopicSubmit(e) {
        e.preventDefault();
        const name = document.getElementById('topicName').value.trim();
        const description = document.getElementById('topicDescription').value.trim();

        if (this.currentTopicId) {
            this.lm.updateTopic(this.currentTopicId, name, description);
        } else {
            this.lm.addTopic(name, description);
        }

        this.closeTopicModal();
        this.render();
    }

    viewTopic(topicId) {
        window.location.href = `topic.html?id=${topicId}`;
    }

    editTopic(topicId) {
        this.openTopicModal(topicId);
    }

    deleteTopic(topicId) {
        const topic = this.lm.getTopic(topicId);
        this.showConfirm(
            'Delete Topic?',
            `Are you sure you want to delete "${topic.name}" and all its content? This cannot be undone.`,
            () => {
                this.lm.deleteTopic(topicId);
                this.render();
                this.showToast('Topic deleted successfully', 'success');
            }
        );
    }

    render() {
        if (this.lm.topics.length === 0) {
            this.emptyState.style.display = 'block';
            this.topicsTableContainer.style.display = 'none';
        } else {
            this.emptyState.style.display = 'none';
            this.topicsTableContainer.style.display = 'block';
            this.renderTable();
        }
    }

    renderTable() {
        this.topicsTableBody.innerHTML = this.lm.topics.map(topic => {
            const contentCount = Array.isArray(topic.contents) ? topic.contents.length : 0;
            return `
            <tr>
                <td class="topic-row-icon">📚</td>
                <td class="topic-row-name">
                    <a href="topic.html?id=${topic.id}">${this.escapeHtml(topic.name || 'Untitled')}</a>
                </td>
                <td class="topic-row-description">
                    ${topic.description ? this.escapeHtml(topic.description) : '<em style="color: var(--color-text-muted);">No description</em>'}
                </td>
                <td class="topic-row-content">
                    <span class="content-count">${contentCount}</span>
                </td>
                <td class="topic-row-actions">
                    <div class="table-action-buttons">
                        <button class="btn btn-small btn-secondary" onclick="homeUI.viewTopic('${topic.id}')" title="View topic">
                            <span class="btn-icon">👁️</span>
                            View
                        </button>
                        <button class="icon-btn" onclick="homeUI.editTopic('${topic.id}')" title="Edit topic">✏️</button>
                        <button class="icon-btn" onclick="homeUI.deleteTopic('${topic.id}')" title="Delete topic">🗑️</button>
                    </div>
                </td>
            </tr>
        `}).join('');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// ==================== Initialize Home Page ====================
const learningManager = new LearningManager();
const homeUI = new HomeUI(learningManager);

// Make homeUI accessible globally for inline event handlers
window.homeUI = homeUI;

// Handle Loading Overlay
window.addEventListener('load', () => {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        setTimeout(() => {
            loadingOverlay.classList.add('hidden');
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 500); // Wait for transition to finish
        }, 1500); // Show loader for 1.5 seconds
    }
});
