// ==================== Data Management ====================
class LearningManager {
    constructor() {
        this.topics = this.loadData();
        this.currentTopicId = null;
        this.currentContentId = null;
        this.editMode = false;
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

// ==================== UI Management ====================
class UIManager {
    constructor(learningManager) {
        this.lm = learningManager;
        this.initializeElements();
        this.attachEventListeners();
        this.render();
    }

    initializeElements() {
        // Modals
        this.topicModal = document.getElementById('topicModal');
        this.contentModal = document.getElementById('contentModal');
        
        // Forms
        this.topicForm = document.getElementById('topicForm');
        this.contentForm = document.getElementById('contentForm');
        
        // Containers
        this.topicsGrid = document.getElementById('topicsGrid');
        this.emptyState = document.getElementById('emptyState');
        
        // Dynamic lists
        this.subtopicsList = document.getElementById('subtopicsList');
        this.linksList = document.getElementById('linksList');
        this.imagePreview = document.getElementById('imagePreview');
    }

    attachEventListeners() {
        // Topic modal triggers
        document.getElementById('addTopicBtn').addEventListener('click', () => this.openTopicModal());
        document.getElementById('addTopicBtnEmpty').addEventListener('click', () => this.openTopicModal());
        document.getElementById('topicModalClose').addEventListener('click', () => this.closeTopicModal());
        document.getElementById('topicModalOverlay').addEventListener('click', () => this.closeTopicModal());
        document.getElementById('cancelTopicBtn').addEventListener('click', () => this.closeTopicModal());
        
        // Content modal triggers
        document.getElementById('contentModalClose').addEventListener('click', () => this.closeContentModal());
        document.getElementById('contentModalOverlay').addEventListener('click', () => this.closeContentModal());
        document.getElementById('cancelContentBtn').addEventListener('click', () => this.closeContentModal());
        
        // Form submissions
        this.topicForm.addEventListener('submit', (e) => this.handleTopicSubmit(e));
        this.contentForm.addEventListener('submit', (e) => this.handleContentSubmit(e));
        
        // Dynamic list buttons
        document.getElementById('addSubtopicBtn').addEventListener('click', () => this.addSubtopicField());
        document.getElementById('addLinkBtn').addEventListener('click', () => this.addLinkField());
        
        // Image upload
        document.getElementById('contentImage').addEventListener('change', (e) => this.handleImageUpload(e));
    }

    // ==================== Topic Modal ====================
    openTopicModal(topicId = null) {
        this.lm.editMode = !!topicId;
        this.lm.currentTopicId = topicId;
        
        const modalTitle = document.getElementById('topicModalTitle');
        const topicNameInput = document.getElementById('topicName');
        const topicDescInput = document.getElementById('topicDescription');
        
        if (topicId) {
            const topic = this.lm.topics.find(t => t.id === topicId);
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
        
        if (this.lm.editMode) {
            this.lm.updateTopic(this.lm.currentTopicId, name, description);
        } else {
            this.lm.addTopic(name, description);
        }
        
        this.closeTopicModal();
        this.render();
    }

    // ==================== Content Modal ====================
    openContentModal(topicId, contentId = null) {
        this.lm.currentTopicId = topicId;
        this.lm.currentContentId = contentId;
        this.lm.editMode = !!contentId;
        
        const modalTitle = document.getElementById('contentModalTitle');
        
        // Clear form
        this.contentForm.reset();
        this.subtopicsList.innerHTML = '';
        this.linksList.innerHTML = '';
        this.imagePreview.innerHTML = '';
        this.imagePreview.classList.remove('active');
        
        if (contentId) {
            const topic = this.lm.topics.find(t => t.id === topicId);
            const content = topic.contents.find(c => c.id === contentId);
            
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
        
        if (this.lm.editMode) {
            this.lm.updateContent(this.lm.currentTopicId, this.lm.currentContentId, contentData);
        } else {
            this.lm.addContent(this.lm.currentTopicId, contentData);
        }
        
        this.closeContentModal();
        this.render();
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
        if (this.lm.topics.length === 0) {
            this.emptyState.style.display = 'block';
            this.topicsGrid.style.display = 'none';
        } else {
            this.emptyState.style.display = 'none';
            this.topicsGrid.style.display = 'grid';
            this.renderTopics();
        }
    }

    renderTopics() {
        this.topicsGrid.innerHTML = this.lm.topics.map(topic => `
            <div class="topic-card" data-topic-id="${topic.id}">
                <div class="topic-header">
                    <div>
                        <h3 class="topic-title">${this.escapeHtml(topic.name)}</h3>
                        ${topic.description ? `<p class="topic-description">${this.escapeHtml(topic.description)}</p>` : ''}
                    </div>
                    <div class="topic-actions">
                        <button class="icon-btn" onclick="ui.openTopicModal('${topic.id}')" title="Edit topic">✏️</button>
                        <button class="icon-btn" onclick="ui.deleteTopic('${topic.id}')" title="Delete topic">🗑️</button>
                    </div>
                </div>
                
                <div class="content-cards">
                    ${this.renderContentCards(topic)}
                </div>
                
                <button class="btn add-content-btn" onclick="ui.openContentModal('${topic.id}')">
                    <span class="btn-icon">➕</span>
                    Add Content Card
                </button>
            </div>
        `).join('');
    }

    renderContentCards(topic) {
        if (topic.contents.length === 0) {
            return '<p style="color: var(--color-text-muted); text-align: center; padding: 1rem;">No content yet. Add your first card!</p>';
        }
        
        return topic.contents.map(content => `
            <div class="content-card">
                <div class="content-card-header">
                    <h4 class="content-title">${this.escapeHtml(content.title)}</h4>
                    <div class="topic-actions">
                        <button class="icon-btn" onclick="ui.openContentModal('${topic.id}', '${content.id}')" title="Edit content">✏️</button>
                        <button class="icon-btn" onclick="ui.deleteContent('${topic.id}', '${content.id}')" title="Delete content">🗑️</button>
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

    deleteTopic(id) {
        if (confirm('Are you sure you want to delete this topic and all its content?')) {
            this.lm.deleteTopic(id);
            this.render();
        }
    }

    deleteContent(topicId, contentId) {
        if (confirm('Are you sure you want to delete this content card?')) {
            this.lm.deleteContent(topicId, contentId);
            this.render();
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// ==================== Initialize Application ====================
const learningManager = new LearningManager();
const ui = new UIManager(learningManager);

// Make UI accessible globally for inline event handlers
window.ui = ui;
