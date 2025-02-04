let isHighlighting = false;
let isErasing = false;
let currentColor = 'yellow';
let pdfUrl = '';
let mouseX = 0;
let mouseY = 0;
document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

// Constants and utilities
const HighlightColors = {
    'yellow': {
        id: 'highlight-yellow'
    },
    'cyan': {
        id: 'highlight-cyan'
    },
    'magenta': {
        id: 'highlight-magenta'
    },
    'red': {
        id: 'highlight-red'
    },
};

class ToolsManager {
    constructor() {
        this.activeTools = {
            isErasing: false
        };
    }
    updateButtonStates() {
        const eraseBtn = document.getElementById('erase-btn');
        eraseBtn.classList.toggle('active', this.activeTools.isErasing);
    }
    updateCursor(event) {
        if (this.activeTools.isErasing) {
            document.body.style.cursor = 'crosshair';
        } else {
            const target = event.target;
            const isTextElement = target.nodeType === Node.TEXT_NODE ||
                (target.nodeType === Node.ELEMENT_NODE &&
                    ['P', 'SPAN', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'TD', 'TH', 'FIGCAPTION'].includes(target.tagName));
            document.body.style.cursor = isTextElement ? 'text' : 'default';
        }
    }
}

function initializeAnnotation() {
    console.log('Initializing annotation...');
    const toolsManager = new ToolsManager()
    // Set up message listener for PDF URL
    window.addEventListener("message", (event) => {
        if (event.data.type === "FROM_CONTENT_SCRIPT") {
            const receivedPdfUrl = event.data.pdfUrl;
            if (receivedPdfUrl === '__proto__' || receivedPdfUrl === 'constructor' || receivedPdfUrl === 'prototype') {
                console.error('Invalid PDF URL received:', receivedPdfUrl);
                return;
            }
            pdfUrl = receivedPdfUrl;
            console.log('PDF URL received:', pdfUrl);
        }
    }, false);


    // Set up button click handlers
    setupButtonHandlers(toolsManager);

    // Set up document event listeners with the manager instance
    // document.addEventListener('mouseup', () => handleSelection(colorPickerManager));
    document.addEventListener('click', (e) => handleErase(e, toolsManager));

    observePageChanges();
}

function setupButtonHandlers(toolsManager) {
    // color buttons
    Object.entries(HighlightColors).forEach(([key, value]) => {
        document.getElementById(value.id).addEventListener('click', () => {
            const selection = window.getSelection();
            if (selection.isCollapsed) return;
            const range = selection.getRangeAt(0);
            const groupId = 'group-' + Date.now();
            highlightRange(range, groupId, key);
            selection.removeAllRanges();
        });
    });
    // Tool buttons
    // document.getElementById(TOOLS.highlight.id).addEventListener('click', () => {
    //     colorPickerManager.activeTools.isHighlighting = !colorPickerManager.activeTools.isHighlighting;
    //     colorPickerManager.activeTools.isErasing = false;
    //     colorPickerManager.updateButtonStates();
    //     colorPickerManager.updateCursor({ target: document.elementFromPoint(mouseX, mouseY) });
    // });

    // Other buttons
    document.getElementById('erase-btn').addEventListener('click', () => {
        toolsManager.activeTools.isErasing = !toolsManager.activeTools.isErasing;
        toolsManager.updateButtonStates();
        toolsManager.updateCursor({ target: document.elementFromPoint(mouseX, mouseY) });
    });

    document.getElementById('erase-all-btn').addEventListener('click', eraseAllAnnotations);
    
    document.getElementById('settings-btn').addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });
}


function observePageChanges() {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('gsr-text-ctn')) {
                        console.log('New page content loaded, applying annotations');
                        chrome.storage.local.get([pdfUrl], function (result) {
                            if (chrome.runtime.lastError) {
                                console.error('Error loading annotations:', chrome.runtime.lastError);
                                return;
                            }
                            const savedAnnotations = result[pdfUrl] || [];
                            console.log('Loaded annotations:', savedAnnotations);
                            applyAnnotationsToPage(node.closest('.gsr-page'), savedAnnotations);
                        });
                    }
                });
            }
        });
    });

    const config = { childList: true, subtree: true };
    observer.observe(document.body, config);
}

// function handleSelection(colorPickerManager) {
//     if (!colorPickerManager.activeTools.isHighlighting || colorPickerManager.activeTools.isErasing) return;

//     const selection = window.getSelection();
//     if (selection.isCollapsed) return;

//     const range = selection.getRangeAt(0);
//     const groupId = 'group-' + Date.now();
//     // Pass the current color from the manager
//     highlightRange(range, groupId, colorPickerManager.currentColors.highlight);
//     selection.removeAllRanges();
// }

function handleErase(event, toolsManager) {
    if (!toolsManager.activeTools.isErasing) return;

    const highlightSpan = findHighlightSpanAtPoint(event.clientX, event.clientY);
    if (highlightSpan) {
        const groupId = highlightSpan.dataset.groupId;
        eraseAnnotation(groupId);
    }
}

function findHighlightSpanAtPoint(x, y) {
    const elements = document.elementsFromPoint(x, y);
    for (let element of elements) {
        if (element.classList.contains('pdf-highlight')) {
            return element;
        }

        const nestedHighlight = element.querySelector('.pdf-highlight');
        if (nestedHighlight) {
            const rect = nestedHighlight.getBoundingClientRect();
            if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                return nestedHighlight;
            }
        }
    }
    return null;
}

function highlightRange(range, groupId, color) {
    const startNode = range.startContainer;
    const endNode = range.endContainer;
    const commonAncestor = range.commonAncestorContainer;

    const highlightedNodes = [];
    const nodesToProcess = getNodesBetween(startNode, endNode, commonAncestor);

    nodesToProcess.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
            const startOffset = (node === startNode) ? range.startOffset : 0;
            const endOffset = (node === endNode) ? range.endOffset : node.length;

            // Check if the node is already partially highlighted
            const existingHighlights = getExistingHighlights(node);
            if (existingHighlights.length > 0) {
                highlightedNodes.push(...handleOverlappingHighlights(node, startOffset, endOffset, groupId, existingHighlights, color));
            } else {
                highlightedNodes.push(highlightTextNode(node, startOffset, endOffset, groupId, color));
            }
        }
    });

    saveAnnotation(groupId, highlightedNodes);
}

function saveAnnotation(groupId, nodes) {
    const annotation = {
        id: groupId,
        color: nodes[0].style.backgroundColor,
        nodes: nodes.map(node => ({
            text: node.textContent,
            xpath: getXPath(node),
            offset: getTextOffset(node)
        }))
    };

    chrome.storage.local.get([pdfUrl], function (result) {
        if (chrome.runtime.lastError) {
            console.error('Error loading annotations:', chrome.runtime.lastError);
            return;
        }

        const savedAnnotations = result[pdfUrl] || [];
        const existingIndex = savedAnnotations.findIndex(group => group.id === groupId);
        if (existingIndex !== -1) {
            savedAnnotations[existingIndex] = annotation;
        } else {
            savedAnnotations.push(annotation);
        }

        chrome.storage.local.set({ [pdfUrl]: savedAnnotations }, function () {
            if (chrome.runtime.lastError) {
                console.error('Error saving annotations:', chrome.runtime.lastError);
            } else {
                console.log('Annotation saved for %s:', pdfUrl, annotation);
            }
        });
    });
}

function getExistingHighlights(node) {
    const highlights = [];
    while (node && node !== document.body) {
        if (node.classList && node.classList.contains('pdf-highlight')) {
            highlights.push(node);
        }
        node = node.parentNode;
    }
    return highlights;
}


function handleOverlappingHighlights(node, startOffset, endOffset, groupId, existingHighlights, color) {
    const highlightedNodes = [];
    let currentOffset = 0;

    existingHighlights.sort((a, b) => {
        return a.textContent.indexOf(node.textContent) - b.textContent.indexOf(node.textContent);
    });

    existingHighlights.forEach((highlight) => {
        const highlightStart = highlight.textContent.indexOf(node.textContent);
        const highlightEnd = highlightStart + node.textContent.length;

        if (startOffset < highlightStart && currentOffset < highlightStart) {
            highlightedNodes.push(highlightTextNode(node, currentOffset, highlightStart, groupId, color));
        }

        if (startOffset <= highlightEnd && endOffset >= highlightStart) {
            highlight.style.backgroundColor = color;
            highlight.dataset.groupId = groupId;
            highlightedNodes.push(highlight);
        }

        currentOffset = highlightEnd;
    });

    if (endOffset > currentOffset) {
        highlightedNodes.push(highlightTextNode(node, currentOffset, endOffset, groupId, color));
    }

    return highlightedNodes;
}

function highlightTextNode(node, startOffset, endOffset, groupId, color) {
    const range = document.createRange();
    range.setStart(node, startOffset);
    range.setEnd(node, endOffset);

    const highlightSpan = document.createElement('span');
    highlightSpan.className = 'pdf-highlight';
    highlightSpan.style.backgroundColor = color;
    highlightSpan.dataset.groupId = groupId;

    range.surroundContents(highlightSpan);
    return highlightSpan;
}

function getNodesBetween(startNode, endNode, commonAncestor) {
    const nodes = [];
    let currentNode = startNode;

    while (currentNode) {
        nodes.push(currentNode);
        if (currentNode === endNode) break;
        currentNode = getNextNode(currentNode, commonAncestor);
    }

    return nodes;
}

function getNextNode(node, stopNode) {
    if (node.firstChild) return node.firstChild;
    while (node) {
        if (node === stopNode) return null;
        if (node.nextSibling) return node.nextSibling;
        node = node.parentNode;
    }
    return null;
}

function removeHighlightGroup(group) {
    group.nodes.forEach(nodeInfo => {
        const node = findNodeByXPath(nodeInfo.xpath);
        if (node) {
            const highlightSpan = node.parentNode.querySelector(`[data-group-id="${group.id}"]`);
            if (highlightSpan) {
                const parent = highlightSpan.parentNode;
                const textContent = highlightSpan.textContent;
                const textNode = document.createTextNode(textContent);
                parent.replaceChild(textNode, highlightSpan);
            } else {
                console.warn('Highlight span not found for node:', node);
            }
        } else {
            // console.warn('Node not found for XPath:', nodeInfo.xpath);
        }
    });

    document.body.normalize();
}

function eraseAnnotation(groupId) {
    chrome.storage.local.get([pdfUrl], function (result) {
        if (chrome.runtime.lastError) {
            console.error('Error loading annotations:', chrome.runtime.lastError);
            return;
        }

        const savedAnnotations = result[pdfUrl] || [];
        const groupIndex = savedAnnotations.findIndex(group => group.id === groupId);
        if (groupIndex !== -1) {
            const group = savedAnnotations[groupIndex];
            
            removeHighlightGroup(group);

            savedAnnotations.splice(groupIndex, 1);

            chrome.storage.local.set({ [pdfUrl]: savedAnnotations }, function () {
                if (chrome.runtime.lastError) {
                    console.error('Error saving annotations:', chrome.runtime.lastError);
                } else {
                    console.log('Annotation removed for groupId:', groupId);
                }
            });
        }
    });
}

function eraseAllAnnotations() {
    if (confirm('Are you sure you want to erase all annotations from this PDF?')) {
        chrome.storage.local.get([pdfUrl], function (result) {
            if (chrome.runtime.lastError) {
                console.error('Error loading annotations:', chrome.runtime.lastError);
                return;
            }

            const savedAnnotations = result[pdfUrl] || [];
            savedAnnotations.forEach(group => {
                removeHighlightGroup(group);
            });

            chrome.storage.local.remove([pdfUrl], function () {
                if (chrome.runtime.lastError) {
                    console.error('Error removing annotations:', chrome.runtime.lastError);
                } else {
                    console.log('All annotations removed for ' + pdfUrl);
                }
            });
        });
    } else {
        console.log('Erase all annotations cancelled');
    }
}

function findNodeByXPath(xpath) {
    try {
        const nodes = document.evaluate(xpath, document, null, XPathResult.ANY_TYPE, null);
        return nodes.iterateNext();
    } catch (e) {
        console.error('Error finding node by XPath:', xpath, e);
        return null;
    }
}


function applyAnnotationsToPage(pageElement, highlightGroups) {
    const textContainer = pageElement.querySelector('.gsr-text-ctn');
    if (!textContainer) return;

    highlightGroups.forEach(group => {
        group.nodes.forEach(nodeInfo => {
            const node = findNodeInPage(textContainer, nodeInfo.xpath, nodeInfo.text);
            if (node) {
                highlightNode(node, nodeInfo.text, group.color || currentColor, group.id);
            } else {
                // console.warn('Node not found for annotation:', nodeInfo);
            }
        });
    });
}

function findNodeInPage(textContainer, xpath, text) {
    try {
        const xpathResult = document.evaluate(xpath, textContainer, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        const node = xpathResult.singleNodeValue;
        if (node && node.textContent.includes(text)) {
            return node;
        }
    } catch (e) {
        console.error('XPath evaluation failed:', e);
    }
    return null;
}


function getXPath(node) {
    const parts = [];
    while (node && node.nodeType === Node.ELEMENT_NODE) {
        let sibling = node;
        let siblingCount = 1;
        while ((sibling = sibling.previousSibling) !== null) {
            if (sibling.nodeType === Node.ELEMENT_NODE && sibling.nodeName === node.nodeName) {
                siblingCount++;
            }
        }
        parts.unshift(node.nodeName.toLowerCase() + '[' + siblingCount + ']');
        node = node.parentNode;
    }
    
    // Remove the last element (innermost span)
    parts.pop();
    
    return '/' + parts.join('/');
}

function getTextOffset(node) {
    let offset = 0;
    let currentNode = node;
    while (currentNode.previousSibling) {
        currentNode = currentNode.previousSibling;
        if (currentNode.nodeType === Node.TEXT_NODE) {
            offset += currentNode.textContent.length;
        }
    }
    return offset;
}

function highlightNode(node, text, color, groupId) {
    const range = document.createRange();
    const textNode = node.firstChild;
    if (!textNode) {
        console.warn('No text node found in:', node);
        return null;
    }
    const startOffset = textNode.textContent.indexOf(text);
    if (startOffset !== -1) {
        range.setStart(textNode, startOffset);
        range.setEnd(textNode, startOffset + text.length);
        const highlightSpan = document.createElement('span');
        highlightSpan.className = 'pdf-highlight';
        highlightSpan.style.backgroundColor = color;
        highlightSpan.dataset.groupId = groupId;
        try {
            range.surroundContents(highlightSpan);
            return highlightSpan;
        } catch (e) {
            console.error('Error highlighting node:', e);
            return null;
        }
    } else {
        // console.warn('Text not found in node:', text);
        return null;
    }
}


// Initialize when the DOM is ready
document.addEventListener('DOMContentLoaded', initializeAnnotation);