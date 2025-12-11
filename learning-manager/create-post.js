document.addEventListener('DOMContentLoaded', () => {
    const editor = document.getElementById('editor');
    const toolbar = document.getElementById('floatingToolbar');
    const imageUpload = document.getElementById('imageUpload');
    const buttons = toolbar.querySelectorAll('button[data-command]');

    // --- Toolbar Positioning ---
    function updateToolbarPosition() {
        const selection = window.getSelection();

        // Hide if no selection or selection is collapsed (cursor only)
        if (selection.isCollapsed) {
            toolbar.classList.remove('active');
            return;
        }

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        // Only show if selection is inside the editor
        if (!editor.contains(range.commonAncestorContainer)) {
            toolbar.classList.remove('active');
            return;
        }

        // Calculate position
        const editorRect = editor.getBoundingClientRect();
        const top = rect.top - editorRect.top + editor.offsetTop;
        const left = rect.left + (rect.width / 2) - editorRect.left + editor.offsetLeft;

        // Using fixed positioning relative to viewport for simplicity with scroll
        // But here we are using absolute relative to container. 
        // Let's try absolute relative to body/viewport to handle scroll better if needed.
        // For now, let's stick to absolute relative to the nearest positioned ancestor (main).

        // Actually, let's use absolute positioning relative to the document
        const scrollX = window.scrollX || window.pageXOffset;
        const scrollY = window.scrollY || window.pageYOffset;

        toolbar.style.top = `${rect.top + scrollY}px`;
        toolbar.style.left = `${rect.left + (rect.width / 2) + scrollX}px`;
        toolbar.classList.add('active');
    }

    // Listen for selection changes
    document.addEventListener('selectionchange', () => {
        // Debounce slightly to avoid flickering
        setTimeout(updateToolbarPosition, 10);
    });

    // --- Formatting Commands ---
    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent losing focus
            const command = btn.dataset.command;

            if (command === 'h2') {
                document.execCommand('formatBlock', false, '<h2>');
            } else if (command === 'blockquote') {
                document.execCommand('formatBlock', false, '<blockquote>');
            } else {
                document.execCommand(command, false, null);
            }

            updateToolbarPosition(); // Re-position if needed
        });
    });

    // --- Image Upload ---
    imageUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                insertImage(event.target.result);
            };
            reader.readAsDataURL(file);
        }
        // Reset input so same file can be selected again if needed
        imageUpload.value = '';
    });

    function insertImage(src) {
        // Restore selection or focus editor
        editor.focus();

        // If we have a selection, we might want to insert at the end of it or replace it.
        // For simplicity, let's just append if no selection, or insert at cursor.

        // Create image element
        const img = document.createElement('img');
        img.src = src;

        // Insert image at cursor
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            range.insertNode(img);

            // Move cursor after image
            range.collapse(false);

            // Insert a new paragraph after image so user can continue typing easily
            const p = document.createElement('p');
            p.innerHTML = '<br>';
            range.insertNode(p);
            range.setStart(p, 0);
            range.setEnd(p, 0);
            selection.removeAllRanges();
            selection.addRange(range);
        } else {
            editor.appendChild(img);
        }
    }

    // --- Placeholder Behavior Fix ---
    // Ensure there's always at least one paragraph
    editor.addEventListener('input', () => {
        if (editor.innerHTML.trim() === '') {
            editor.innerHTML = '<p><br></p>';
        }
    });

    // Initialize with a paragraph if empty
    if (editor.innerHTML.trim() === '') {
        editor.innerHTML = '<p><br></p>';
    }
});
