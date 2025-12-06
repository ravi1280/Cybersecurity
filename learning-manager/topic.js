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

    getTopic(id) {
        return this.topics.find(t => t.id === id);
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

    addContent(topicId, contentData) {
        const topic = this.topics.find(t => t.id === topicId);
        if (topic) {
            const content = {
                id: this.generateId(),
                ...contentData,
                createdAt: new Date().toISOString()
            };
            topic.contents.push(content);
            this.saveData();
            return content;
        }
    }

    updateContent(topicId, contentId, contentData) {
        const topic = this.topics.find(t => t.id === topicId);
        if (topic) {
            const contentIndex = topic.contents.findIndex(c => c.id === contentId);
            if (contentIndex !== -1) {
                topic.contents[contentIndex] = {
                    ...topic.contents[contentIndex],
                    ...contentData
                };
                this.saveData();
            }
        }
    }

    deleteContent(topicId, contentId) {
        const topic = this.topics.find(t => t.id === topicId);
        if (topic) {
            topic.contents = topic.contents.filter(c => c.id !== contentId);
            this.saveData();
        }
    }
}

// ==================== Topic Page UI ====================
class TopicUI {
    constructor(learningManager, topicId) {
        this.lm = learningManager;
        this.topicId = topicId;
        this.currentContentId = null;
        this.editMode = false;

        this.topic = this.lm.getTopic(topicId);

        if (!this.topic) {
            alert('Topic not found!');
            window.location.href = 'index.html';
            return;
        }

        this.initializeElements();
        this.attachEventListeners();
        this.render();
    }

    initializeElements() {
        this.topicModal = document.getElementById('topicModal');
        this.contentModal = document.getElementById('contentModal');
        this.topicForm = document.getElementById('topicForm');
        this.contentForm = document.getElementById('contentForm');
        this.contentCardsGrid = document.getElementById('contentCardsGrid');
        this.emptyContentState = document.getElementById('emptyContentState');
        this.subtopicsList = document.getElementById('subtopicsList');
        this.linksList = document.getElementById('linksList');
        this.imagePreview = document.getElementById('imagePreview');
    }

    attachEventListeners() {
        // Topic actions
        document.getElementById('editTopicBtn').addEventListener('click', () => this.openTopicModal());
        document.getElementById('deleteTopicBtn').addEventListener('click', () => this.deleteTopic());

        // Topic modal
        document.getElementById('topicModalClose').addEventListener('click', () => this.closeTopicModal());
        document.getElementById('topicModalOverlay').addEventListener('click', () => this.closeTopicModal());
        document.getElementById('cancelTopicBtn').addEventListener('click', () => this.closeTopicModal());
        this.topicForm.addEventListener('submit', (e) => this.handleTopicSubmit(e));

        // Content modal triggers
        document.getElementById('addContentBtn').addEventListener('click', () => this.openContentModal());
        document.getElementById('addContentBtnEmpty').addEventListener('click', () => this.openContentModal());
        document.getElementById('contentModalClose').addEventListener('click', () => this.closeContentModal());
        document.getElementById('contentModalOverlay').addEventListener('click', () => this.closeContentModal());
        document.getElementById('cancelContentBtn').addEventListener('click', () => this.closeContentModal());

        // Content form
        this.contentForm.addEventListener('submit', (e) => this.handleContentSubmit(e));
        document.getElementById('addSubtopicBtn').addEventListener('click', () => this.addSubtopicField());
        document.getElementById('addLinkBtn').addEventListener('click', () => this.addLinkField());
        document.getElementById('contentImage').addEventListener('change', (e) => this.handleImageUpload(e));
    }

    // ==================== Topic Management ====================
    openTopicModal() {
        document.getElementById('topicName').value = this.topic.name;
        document.getElementById('topicDescriptionEdit').value = this.topic.description || '';
        this.topicModal.classList.add('active');
    }

    closeTopicModal() {
        this.topicModal.classList.remove('active');
        this.topicForm.reset();
    }

    handleTopicSubmit(e) {
        e.preventDefault();
        const name = document.getElementById('topicName').value.trim();
        const description = document.getElementById('topicDescriptionEdit').value.trim();

        this.lm.updateTopic(this.topicId, name, description);
        this.topic = this.lm.getTopic(this.topicId);

        document.getElementById('topicTitle').textContent = name;
        document.getElementById('topicDescription').textContent = description;

        this.closeTopicModal();
    }

    deleteTopic() {
        if (confirm(`Are you sure you want to delete "${this.topic.name}" and all its content?`)) {
            this.lm.deleteTopic(this.topicId);
            window.location.href = 'index.html';
        }
    }

    // ==================== Content Management ====================
    openContentModal(contentId = null) {
        this.currentContentId = contentId;
        this.editMode = !!contentId;

        const modalTitle = document.getElementById('contentModalTitle');

        // Clear form
        this.contentForm.reset();
        this.subtopicsList.innerHTML = '';
        this.linksList.innerHTML = '';
        this.imagePreview.innerHTML = '';
        this.imagePreview.classList.remove('active');

        if (contentId) {
            const content = this.topic.contents.find(c => c.id === contentId);

            modalTitle.textContent = 'Edit Content Card';
            document.getElementById('contentTitle').value = content.title;
            document.getElementById('contentDescription').value = content.description || '';

            // Populate subtopics
            if (content.subtopics && content.subtopics.length > 0) {
                content.subtopics.forEach(subtopic => {
                    this.addSubtopicField(subtopic);
                });
            }

            // Populate links
            if (content.links && content.links.length > 0) {
                content.links.forEach(link => {
                    this.addLinkField(link.label, link.url);
                });
            }

            // Show image if exists
            if (content.image) {
                this.imagePreview.innerHTML = `<img src="${content.image}" alt="Content image">`;
                this.imagePreview.classList.add('active');
            }
        } else {
            modalTitle.textContent = 'Add Content Card';
        }

        this.contentModal.classList.add('active');
    }

    closeContentModal() {
        this.contentModal.classList.remove('active');
        this.contentForm.reset();
    }

    handleContentSubmit(e) {
        e.preventDefault();

        const title = document.getElementById('contentTitle').value.trim();
        const description = document.getElementById('contentDescription').value.trim();

        // Collect subtopics
        const subtopics = Array.from(this.subtopicsList.querySelectorAll('input'))
            .map(input => input.value.trim())
            .filter(value => value !== '');

        // Collect links
        const linkInputs = this.linksList.querySelectorAll('.dynamic-item');
        const links = Array.from(linkInputs).map(item => {
            const label = item.querySelector('.link-label').value.trim();
            const url = item.querySelector('.link-url').value.trim();
            return { label, url };
        }).filter(link => link.label && link.url);

        // Get image
        const image = this.imagePreview.querySelector('img')?.src || null;

        const contentData = {
            title,
            description,
            subtopics,
            links,
            image
        };

        if (this.editMode) {
            this.lm.updateContent(this.topicId, this.currentContentId, contentData);
        } else {
            this.lm.addContent(this.topicId, contentData);
        }

        this.topic = this.lm.getTopic(this.topicId);
        this.closeContentModal();
        this.renderContent();
    }

    deleteContent(contentId) {
        if (confirm('Are you sure you want to delete this content card?')) {
            this.lm.deleteContent(this.topicId, contentId);
            this.topic = this.lm.getTopic(this.topicId);
            this.renderContent();
        }
    }

    // ==================== Dynamic Fields ====================
    addSubtopicField(value = '') {
        const item = document.createElement('div');
        item.className = 'dynamic-item';
        item.innerHTML = `
            <input type="text" placeholder="Enter subtopic..." value="${value}">
            <button type="button" class="remove-btn" onclick="this.parentElement.remove()">×</button>
        `;
        this.subtopicsList.appendChild(item);
    }

    addLinkField(label = '', url = '') {
        const item = document.createElement('div');
        item.className = 'dynamic-item';
        item.innerHTML = `
            <input type="text" class="link-label" placeholder="Link label..." value="${label}">
            <input type="url" class="link-url" placeholder="https://..." value="${url}">
            <button type="button" class="remove-btn" onclick="this.parentElement.remove()">×</button>
        `;
        this.linksList.appendChild(item);
    }

    handleImageUpload(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                this.imagePreview.innerHTML = `<img src="${event.target.result}" alt="Preview">`;
                this.imagePreview.classList.add('active');
            };
            reader.readAsDataURL(file);
        }
    }

    // ==================== Rendering ====================
    render() {
        // Update topic header
        document.getElementById('topicTitle').textContent = this.topic.name;
        document.getElementById('topicDescription').textContent = this.topic.description || '';

        // Render content
        this.renderContent();
    }

    renderContent() {
        if (this.topic.contents.length === 0) {
            this.emptyContentState.style.display = 'block';
            this.contentCardsGrid.style.display = 'none';
        } else {
            this.emptyContentState.style.display = 'none';
            this.contentCardsGrid.style.display = 'grid';
            this.renderContentCards();
        }
    }

    renderContentCards() {
        this.contentCardsGrid.innerHTML = this.topic.contents.map(content => `
            <div class="content-card-full">
                <div class="content-card-header">
                    <h4 class="content-title">${this.escapeHtml(content.title)}</h4>
                    <div class="topic-actions">
                        <button class="icon-btn" onclick="topicUI.openContentModal('${content.id}')" title="Edit content">✏️</button>
                        <button class="icon-btn" onclick="topicUI.deleteContent('${content.id}')" title="Delete content">🗑️</button>
                    </div>
                </div>
                
                ${content.description ? `<p class="content-description">${this.escapeHtml(content.description)}</p>` : ''}
                
                ${content.image ? `<img src="${content.image}" alt="${this.escapeHtml(content.title)}" class="content-image">` : ''}
                
                ${content.subtopics && content.subtopics.length > 0 ? `
                    <div class="subtopics-list">
                        <h4>Subtopics</h4>
                        <ul>
                            ${content.subtopics.map(st => `<li>${this.escapeHtml(st)}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                ${content.links && content.links.length > 0 ? `
                    <div class="links-list">
                        <h4>Resources</h4>
                        <div>
                            ${content.links.map(link => `
                                <a href="${this.escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer" class="link-item">
                                    🔗 ${this.escapeHtml(link.label)}
                                </a>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// ==================== Initialize Topic Page ====================
// Get topic ID from URL
const urlParams = new URLSearchParams(window.location.search);
const topicId = urlParams.get('id');

if (!topicId) {
    alert('No topic specified!');
    window.location.href = 'index.html';
} else {
    const learningManager = new LearningManager();
    const topicUI = new TopicUI(learningManager, topicId);

    // Make topicUI accessible globally for inline event handlers
    window.topicUI = topicUI;
}
