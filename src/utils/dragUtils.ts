/**
 * Returns a canvas element that can be used as an empty drag image
 * This is useful when you want to hide the default drag preview
 */
export function getEmptyDragImage(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 0;
    canvas.height = 0;
    return canvas;
} 