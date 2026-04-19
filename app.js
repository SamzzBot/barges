// ==================== GLOBAL STATE ====================
const state = {
    collage: {
        images: [],
        layout: 'grid3',
        ratio: { width: 1080, height: 1920, name: '9:16' },
        padding: 0,
        radius: 0,
        bgColor: '#000000'
    },
    watermark: {
        images: [],
        text: 'BARAKK STUDIO',
        font: "'Montserrat', sans-serif",
        size: 60,
        opacity: 0.5,
        rotation: -45,
        spacing: 200,
        color: '#ffffff',
        shadow: true,
        position: 'center',
        pattern: true,
        bold: true,
        italic: false
    }
};

// ==================== LANDING PAGE ====================
function enterApp() {
    const landing = document.getElementById('landing');
    landing.classList.add('exit');
    setTimeout(() => {
        landing.style.display = 'none';
        document.getElementById('app').classList.remove('hidden');
    }, 600);
}

// ==================== NAVIGATION ====================
document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        const targetTab = tab.dataset.tab;
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.getElementById(`${targetTab}-section`).classList.add('active');
    });
});

// ==================== COLLAGE FEATURES ====================

// File Upload
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');

dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

function handleFiles(files) {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    
    if (imageFiles.length === 0) return;
    
    showLoading(true);
    
    const promises = imageFiles.map(file => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    });
    
    Promise.all(promises).then(images => {
        state.collage.images = [...state.collage.images, ...images];
        updateImageCounter();
        renderCollage();
        showLoading(false);
    });
}

function updateImageCounter() {
    const count = state.collage.images.length;
    document.getElementById('imageCounter').innerHTML = 
        `<span>${count} foto dipilih</span>`;
}

// Layout Selection
document.querySelectorAll('.layout-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.layout-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.collage.layout = btn.dataset.layout;
        renderCollage();
    });
});

// Ratio Selection
document.querySelectorAll('.ratio-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.ratio-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.collage.ratio = {
            width: parseInt(btn.dataset.width),
            height: parseInt(btn.dataset.height),
            name: btn.dataset.ratio
        };
        renderCollage();
    });
});

// Adjustments
document.getElementById('paddingSlider').addEventListener('input', (e) => {
    state.collage.padding = parseInt(e.target.value);
    e.target.nextElementSibling.textContent = `${e.target.value}px`;
    renderCollage();
});

document.getElementById('radiusSlider').addEventListener('input', (e) => {
    state.collage.radius = parseInt(e.target.value);
    e.target.nextElementSibling.textContent = `${e.target.value}px`;
    renderCollage();
});

document.getElementById('bgColor').addEventListener('input', (e) => {
    state.collage.bgColor = e.target.value;
    renderCollage();
});

// Render Collage
function renderCollage() {
    const canvas = document.getElementById('collageCanvas');
    const ctx = canvas.getContext('2d');
    const { width, height } = state.collage.ratio;
    const { images, layout, padding, radius, bgColor } = state.collage;
    
    // Set canvas size
    canvas.width = width;
    canvas.height = height;
    
    // Fill background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
    
    if (images.length === 0) {
        // Draw placeholder
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(0, 0, width, height);
        return;
    }
    
    // Calculate grid layout
    const layouts = {
        grid3: { cols: 1, rows: 3 },
        grid2h: { cols: 2, rows: 1 },
        grid4: { cols: 2, rows: 2 },
        grid6: { cols: 2, rows: 3 },
        grid9: { cols: 3, rows: 3 },
        grid34: { cols: 3, rows: 1 }
    };
    
    const grid = layouts[layout] || layouts.grid3;
    const cellWidth = (width - (padding * (grid.cols - 1))) / grid.cols;
    const cellHeight = (height - (padding * (grid.rows - 1))) / grid.rows;
    
    // Draw images
    let imgIndex = 0;
    for (let row = 0; row < grid.rows; row++) {
        for (let col = 0; col < grid.cols; col++) {
            if (imgIndex >= images.length) break;
            
            const img = images[imgIndex];
            const x = col * (cellWidth + padding);
            const y = row * (cellHeight + padding);
            
            // Create clipping path for rounded corners
            ctx.save();
            ctx.beginPath();
            if (radius > 0) {
                roundRect(ctx, x, y, cellWidth, cellHeight, radius);
                ctx.clip();
            }
            
            // Calculate image scaling to cover cell (object-fit: cover)
            const scale = Math.max(cellWidth / img.width, cellHeight / img.height);
            const scaledWidth = img.width * scale;
            const scaledHeight = img.height * scale;
            const offsetX = (cellWidth - scaledWidth) / 2;
            const offsetY = (cellHeight - scaledHeight) / 2;
            
            ctx.drawImage(img, x + offsetX, y + offsetY, scaledWidth, scaledHeight);
            ctx.restore();
            
            imgIndex++;
        }
    }
}

function roundRect(ctx, x, y, width, height, radius) {
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

// Download Collage
document.getElementById('downloadCollage').addEventListener('click', () => {
    const canvas = document.getElementById('collageCanvas');
    const link = document.createElement('a');
    link.download = `barakk-collage-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
});

// ==================== WATERMARK FEATURES ====================

// File Upload
const wmDropZone = document.getElementById('wmDropZone');
const wmFileInput = document.getElementById('wmFileInput');

wmDropZone.addEventListener('click', () => wmFileInput.click());
wmDropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    wmDropZone.classList.add('dragover');
});
wmDropZone.addEventListener('dragleave', () => wmDropZone.classList.remove('dragover'));
wmDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    wmDropZone.classList.remove('dragover');
    handleWMFiles(e.dataTransfer.files);
});

wmFileInput.addEventListener('change', (e) => handleWMFiles(e.target.files));

function handleWMFiles(files) {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    
    if (imageFiles.length === 0) return;
    
    showLoading(true);
    
    const promises = imageFiles.map(file => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => resolve({ img, name: file.name });
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    });
    
    Promise.all(promises).then(images => {
        state.watermark.images = images;
        updateBatchStatus();
        renderWatermarkPreview();
        showLoading(false);
    });
}

function updateBatchStatus() {
    const count = state.watermark.images.length;
    document.getElementById('batchStatus').innerHTML = 
        `<span>${count} foto siap untuk di-watermark</span>`;
}

// Watermark Controls
document.getElementById('wmText').addEventListener('input', (e) => {
    state.watermark.text = e.target.value;
    renderWatermarkPreview();
});

document.getElementById('wmFont').addEventListener('change', (e) => {
    state.watermark.font = e.target.value;
    renderWatermarkPreview();
});

document.getElementById('wmBold').addEventListener('change', (e) => {
    state.watermark.bold = e.target.checked;
    renderWatermarkPreview();
});

document.getElementById('wmItalic').addEventListener('change', (e) => {
    state.watermark.italic = e.target.checked;
    renderWatermarkPreview();
});

document.getElementById('wmSize').addEventListener('input', (e) => {
    state.watermark.size = parseInt(e.target.value);
    e.target.nextElementSibling.textContent = `${e.target.value}px`;
    renderWatermarkPreview();
});

document.getElementById('wmOpacity').addEventListener('input', (e) => {
    state.watermark.opacity = parseInt(e.target.value) / 100;
    e.target.nextElementSibling.textContent = `${e.target.value}%`;
    renderWatermarkPreview();
});

document.getElementById('wmRotation').addEventListener('input', (e) => {
    state.watermark.rotation = parseInt(e.target.value);
    e.target.nextElementSibling.textContent = `${e.target.value}°`;
    renderWatermarkPreview();
});

document.getElementById('wmSpacing').addEventListener('input', (e) => {
    state.watermark.spacing = parseInt(e.target.value);
    e.target.nextElementSibling.textContent = `${e.target.value}px`;
    renderWatermarkPreview();
});

document.getElementById('wmColor').addEventListener('input', (e) => {
    state.watermark.color = e.target.value;
    renderWatermarkPreview();
});

document.getElementById('wmShadow').addEventListener('change', (e) => {
    state.watermark.shadow = e.target.checked;
    renderWatermarkPreview();
});

document.getElementById('wmPattern').addEventListener('change', (e) => {
    state.watermark.pattern = e.target.checked;
    renderWatermarkPreview();
});

// Position Buttons
document.querySelectorAll('.pos-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.pos-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.watermark.position = btn.dataset.pos;
        renderWatermarkPreview();
    });
});

// Render Watermark Preview
function renderWatermarkPreview() {
    const container = document.getElementById('wmPreviewContainer');
    
    if (state.watermark.images.length === 0) {
        container.innerHTML = `
            <div class="wm-placeholder">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                </svg>
                <p>Upload foto untuk preview</p>
            </div>
        `;
        return;
    }
    
    // Show first image as preview
    const firstImage = state.watermark.images[0];
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = firstImage.img.width;
    canvas.height = firstImage.img.height;
    
    // Draw original image
    ctx.drawImage(firstImage.img, 0, 0);
    
    // Apply watermark
    applyWatermarkToCanvas(ctx, canvas.width, canvas.height);
    
    // Display
    container.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'wm-image-wrapper';
    
    const img = document.createElement('img');
    img.src = canvas.toDataURL('image/png');
    img.style.width = '100%';
    
    wrapper.appendChild(img);
    container.appendChild(wrapper);
}

function applyWatermarkToCanvas(ctx, width, height) {
    const wm = state.watermark;
    
    ctx.save();
    
    // Set font style
    const fontStyle = `${wm.italic ? 'italic ' : ''}${wm.bold ? 'bold ' : ''}${wm.size}px ${wm.font}`;
    ctx.font = fontStyle;
    ctx.fillStyle = wm.color;
    ctx.globalAlpha = wm.opacity;
    
    // Add shadow if enabled
    if (wm.shadow) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
    }
    
    const text = wm.text;
    const textMetrics = ctx.measureText(text);
    const textWidth = textMetrics.width;
    const textHeight = wm.size;
    
    if (wm.pattern) {
        // Pattern/tiling mode
        ctx.translate(width / 2, height / 2);
        ctx.rotate((wm.rotation * Math.PI) / 180);
        ctx.translate(-width / 2, -height / 2);
        
        const spacingX = wm.spacing;
        const spacingY = wm.spacing * 0.6;
        
        for (let x = -width; x < width * 2; x += spacingX) {
            for (let y = -height; y < height * 2; y += spacingY) {
                ctx.fillText(text, x, y);
            }
        }
    } else {
        // Single position mode
        let x, y;
        const padding = 50;
        
        switch(wm.position) {
            case 'top-left':
                x = padding;
                y = padding + textHeight;
                break;
            case 'top-center':
                x = (width - textWidth) / 2;
                y = padding + textHeight;
                break;
            case 'top-right':
                x = width - textWidth - padding;
                y = padding + textHeight;
                break;
            case 'center-left':
                x = padding;
                y = height / 2;
                break;
            case 'center':
                x = (width - textWidth) / 2;
                y = height / 2;
                break;
            case 'center-right':
                x = width - textWidth - padding;
                y = height / 2;
                break;
            case 'bottom-left':
                x = padding;
                y = height - padding;
                break;
            case 'bottom-center':
                x = (width - textWidth) / 2;
                y = height - padding;
                break;
            case 'bottom-right':
                x = width - textWidth - padding;
                y = height - padding;
                break;
            default:
                x = (width - textWidth) / 2;
                y = height / 2;
        }
        
        // Apply rotation around text center
        ctx.translate(x + textWidth / 2, y);
        ctx.rotate((wm.rotation * Math.PI) / 180);
        ctx.fillText(text, -textWidth / 2, 0);
    }
    
    ctx.restore();
}

// Download All Watermarked Images
document.getElementById('downloadWatermark').addEventListener('click', async () => {
    if (state.watermark.images.length === 0) {
        alert('Silakan upload foto terlebih dahulu!');
        return;
    }
    
    showLoading(true);
    
    // Process all images
    const zip = [];
    
    for (let i = 0; i < state.watermark.images.length; i++) {
        const { img, name } = state.watermark.images[i];
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx.drawImage(img, 0, 0);
        applyWatermarkToCanvas(ctx, canvas.width, canvas.height);
        
        // Download each image
        const link = document.createElement('a');
        link.download = `watermarked-${name}`;
        link.href = canvas.toDataURL('image/png', 1.0);
        
        // Small delay between downloads to prevent browser blocking
        await new Promise(resolve => setTimeout(resolve, 100));
        link.click();
    }
    
    showLoading(false);
});

// ==================== UTILITIES ====================
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
        overlay.classList.remove('hidden');
    } else {
        overlay.classList.add('hidden');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    renderCollage();
});
