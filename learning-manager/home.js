// ==================== Data Management ====================
class LearningManager {
    constructor() {
        this.topics = this.loadData();
    }

    loadData() {
        const data = localStorage.getItem('cyberlearn_data');
        return data ? JSON.parse(data) : [];
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
        if (confirm(`Are you sure you want to delete "${topic.name}" and all its content?`)) {
            this.lm.deleteTopic(topicId);
            this.render();
        }
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
        this.topicsTableBody.innerHTML = this.lm.topics.map(topic => `
            <tr>
                <td class="topic-row-icon">📚</td>
                <td class="topic-row-name">
                    <a href="topic.html?id=${topic.id}">${this.escapeHtml(topic.name)}</a>
                </td>
                <td class="topic-row-description">
                    ${topic.description ? this.escapeHtml(topic.description) : '<em style="color: var(--color-text-muted);">No description</em>'}
                </td>
                <td class="topic-row-content">
                    <span class="content-count">${topic.contents.length}</span>
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
        `).join('');
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
