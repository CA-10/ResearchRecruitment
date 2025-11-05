window.renderingCode = {
    start: function (apiDataJson, dotNetRef) {
        if (window.myP5) {
            window.myP5.remove();
        }
        const parsedApiData = JSON.parse(apiDataJson);
        const sketch = (p) => {
            let vectors = [];
            let clusters = [];
            let offsetX = 0, offsetY = 0, zoom = 1;
            let hoveredPoint = null;
            const scaleFactorX = 200, scaleFactorY = 200;
            const clusterDistance = 500;
            const minBlobRadius = 100;
            let container;
            let isMouseOverCanvas = false;

            p.setup = function () {
                container = document.getElementById('p5-container');
                const c = p.createCanvas(container.offsetWidth, container.offsetHeight);
                c.parent("p5-container");

                // Track mouse enter/leave events
                c.elt.addEventListener('mouseenter', () => {
                    isMouseOverCanvas = true;
                });
                c.elt.addEventListener('mouseleave', () => {
                    isMouseOverCanvas = false;
                });

                // Find bounds for color mapping
                let minX = Infinity, maxX = -Infinity;
                let minY = Infinity, maxY = -Infinity;

                for (let participant of parsedApiData) {
                    let x = participant.x * scaleFactorX;
                    let y = participant.y * scaleFactorY;
                    minX = Math.min(minX, x);
                    maxX = Math.max(maxX, x);
                    minY = Math.min(minY, y);
                    maxY = Math.max(maxY, y);
                }

                // Parse participant data
                for (let participant of parsedApiData) {
                    let x = participant.x * scaleFactorX;
                    let y = participant.y * scaleFactorY;

                    vectors.push({
                        id: participant.id,
                        vec: p.createVector(x, y),
                        baseSize: 8,
                        pulseOffset: p.random(p.TWO_PI),
                        // Normalize position for color calculation
                        normX: p.map(x, minX, maxX, 0, 1),
                        normY: p.map(y, minY, maxY, 0, 1),
                        clusterId: -1
                    });
                }

                // Create clusters
                findClusters();

                // Center the view
                if (vectors.length > 0) {
                    let avgX = vectors.reduce((sum, v) => sum + v.vec.x, 0) / vectors.length;
                    let avgY = vectors.reduce((sum, v) => sum + v.vec.y, 0) / vectors.length;
                    offsetX = p.width / 2 - avgX;
                    offsetY = p.height / 2 - avgY;
                }
            };

            function findClusters() {
                // Simple clustering algorithm - group nearby points
                let visited = new Array(vectors.length).fill(false);
                let currentClusterId = 0;

                for (let i = 0; i < vectors.length; i++) {
                    if (visited[i]) continue;

                    let clusterPoints = [];
                    let queue = [i];
                    visited[i] = true;

                    while (queue.length > 0) {
                        let current = queue.shift();
                        clusterPoints.push(current);
                        vectors[current].clusterId = currentClusterId;

                        // Find nearby points
                        for (let j = 0; j < vectors.length; j++) {
                            if (!visited[j]) {
                                let dist = p.dist(
                                    vectors[current].vec.x, vectors[current].vec.y,
                                    vectors[j].vec.x, vectors[j].vec.y
                                );
                                if (dist < clusterDistance) {
                                    visited[j] = true;
                                    queue.push(j);
                                }
                            }
                        }
                    }

                    // Only create cluster if it has more than 2 points
                    if (clusterPoints.length > 2) {
                        clusters.push({
                            id: currentClusterId,
                            points: clusterPoints,
                            blobPoints: calculateBlobPoints(clusterPoints)
                        });
                    }

                    currentClusterId++;
                }
            }

            function calculateBlobPoints(pointIndices) {
                if (pointIndices.length < 3) return [];

                let points = pointIndices.map(i => vectors[i].vec);

                // Calculate center
                let center = p.createVector(0, 0);
                for (let pt of points) {
                    center.add(pt);
                }
                center.div(points.length);

                // Create blob points with perpendicular expansion
                let blobPoints = [];

                // For linear arrangements, we need to add width
                // Create points around each actual point
                for (let i = 0; i < points.length; i++) {
                    let pt = points[i];

                    // Direction from center to point
                    let toCenter = p5.Vector.sub(center, pt);
                    let fromCenter = p5.Vector.sub(pt, center);
                    fromCenter.normalize();

                    // Find neighboring points for perpendicular direction
                    let neighbors = [];
                    for (let j = 0; j < points.length; j++) {
                        if (i !== j) {
                            let dist = p.dist(pt.x, pt.y, points[j].x, points[j].y);
                            if (dist < clusterDistance * 0.8) {
                                neighbors.push(points[j]);
                            }
                        }
                    }

                    // Calculate perpendicular direction
                    let perpendicular;
                    if (neighbors.length > 0) {
                        // Average direction to neighbors
                        let avgDir = p.createVector(0, 0);
                        for (let neighbor of neighbors) {
                            avgDir.add(p5.Vector.sub(neighbor, pt));
                        }
                        avgDir.div(neighbors.length);
                        avgDir.normalize();

                        // Perpendicular to average direction
                        perpendicular = p.createVector(-avgDir.y, avgDir.x);
                    } else {
                        // If no close neighbors, perpendicular to radial direction
                        perpendicular = p.createVector(-fromCenter.y, fromCenter.x);
                    }

                    // Add blob points perpendicular to the line
                    let expansion = minBlobRadius;

                    // Create multiple points around each actual point for smoother blob
                    for (let angle = 0; angle < p.TWO_PI; angle += p.TWO_PI / 8) {
                        let offset = p.createVector(
                            Math.cos(angle) * expansion,
                            Math.sin(angle) * expansion
                        );
                        blobPoints.push(p5.Vector.add(pt, offset));
                    }
                }

                // Calculate convex hull of expanded points
                return calculateConvexHull(blobPoints);
            }

            function calculateConvexHull(points) {
                if (points.length < 3) return points;

                // Gift wrapping algorithm for convex hull
                let hull = [];
                let leftmost = 0;
                for (let i = 1; i < points.length; i++) {
                    if (points[i].x < points[leftmost].x) {
                        leftmost = i;
                    }
                }

                let current = leftmost;
                do {
                    hull.push(points[current]);
                    let next = (current + 1) % points.length;

                    for (let i = 0; i < points.length; i++) {
                        let cross = (points[next].x - points[current].x) * (points[i].y - points[current].y) -
                            (points[next].y - points[current].y) * (points[i].x - points[current].x);
                        if (cross < 0) {
                            next = i;
                        }
                    }

                    current = next;
                } while (current !== leftmost && hull.length < points.length);

                return hull;
            }

            p.draw = function () {
                // Dark background
                p.background(15, 23, 42);

                // Subtle grid
                drawGrid();

                p.push();
                p.translate(offsetX, offsetY);
                p.scale(zoom);

                // Find hovered point only if mouse is over canvas
                if (isMouseOverCanvas) {
                    hoveredPoint = findHoveredPoint();
                } else {
                    hoveredPoint = null;
                }

                // Draw cluster shapes FIRST (behind everything)
                drawClusters();

                // Draw connections for nearby points
                if (zoom > 0.8) {
                    drawConnections();
                }

                // Draw all points
                for (let i = 0; i < vectors.length; i++) {
                    let point = vectors[i];
                    let isHovered = hoveredPoint === i;
                    drawPoint(point, isHovered, i);
                }

                p.pop();

                // Draw UI overlay
                drawUIOverlay();
            };

            function drawClusters() {
                for (let cluster of clusters) {
                    if (cluster.blobPoints.length < 3) continue;

                    // Calculate average position for color
                    let avgX = 0, avgY = 0;
                    for (let idx of cluster.points) {
                        avgX += vectors[idx].normX;
                        avgY += vectors[idx].normY;
                    }
                    avgX /= cluster.points.length;
                    avgY /= cluster.points.length;

                    let col = getColorForPosition(avgX, avgY);

                    // Draw smooth blob
                    p.push();

                    // Filled blob
                    p.noStroke();
                    p.fill(col.r, col.g, col.b, 25);

                    p.beginShape();
                    // Add first point
                    p.vertex(cluster.blobPoints[0].x, cluster.blobPoints[0].y);

                    // Add curve points
                    for (let i = 0; i < cluster.blobPoints.length; i++) {
                        let pt = cluster.blobPoints[i];
                        p.curveVertex(pt.x, pt.y);
                    }

                    // Complete the curve by repeating first few points
                    for (let i = 0; i < 3; i++) {
                        let pt = cluster.blobPoints[i % cluster.blobPoints.length];
                        p.curveVertex(pt.x, pt.y);
                    }
                    p.endShape();

                    // Draw border
                    p.noFill();
                    p.stroke(col.r, col.g, col.b, 60);
                    p.strokeWeight(2);

                    p.beginShape();
                    p.vertex(cluster.blobPoints[0].x, cluster.blobPoints[0].y);
                    for (let i = 0; i < cluster.blobPoints.length; i++) {
                        let pt = cluster.blobPoints[i];
                        p.curveVertex(pt.x, pt.y);
                    }
                    for (let i = 0; i < 3; i++) {
                        let pt = cluster.blobPoints[i % cluster.blobPoints.length];
                        p.curveVertex(pt.x, pt.y);
                    }
                    p.endShape();

                    p.pop();
                }
            }

            function getColorForPosition(normX, normY) {
                // Create a vibrant color gradient based on position
                // Using HSB color space for bright, saturated colors
                p.colorMode(p.HSB, 360, 100, 100);

                // Map position to hue (vibrant spectrum)
                let hue = p.map(normX, 0, 1, 180, 320); // Cyan to blue to purple to magenta
                let saturation = p.map(normY, 0, 1, 85, 100); // High saturation for vibrancy
                let brightness = 95; // Keep brightness high for visibility

                let col = p.color(hue, saturation, brightness);

                // Switch back to RGB mode
                p.colorMode(p.RGB, 255);

                return {
                    r: p.red(col),
                    g: p.green(col),
                    b: p.blue(col)
                };
            }

            function drawGrid() {
                p.push();
                p.stroke(255, 255, 255, 10);
                p.strokeWeight(1);

                let gridSize = 100 * zoom;
                let startX = (offsetX % gridSize) - gridSize;
                let startY = (offsetY % gridSize) - gridSize;

                for (let x = startX; x < p.width; x += gridSize) {
                    p.line(x, 0, x, p.height);
                }
                for (let y = startY; y < p.height; y += gridSize) {
                    p.line(0, y, p.width, y);
                }
                p.pop();
            }

            function drawConnections() {
                p.strokeWeight(0.5);

                for (let i = 0; i < vectors.length; i++) {
                    for (let j = i + 1; j < vectors.length; j++) {
                        let dist = p.dist(vectors[i].vec.x, vectors[i].vec.y, vectors[j].vec.x, vectors[j].vec.y);
                        if (dist < 80) {
                            let alpha = p.map(dist, 0, 80, 30, 0);
                            p.stroke(255, 255, 255, alpha);
                            p.line(vectors[i].vec.x, vectors[i].vec.y,
                                vectors[j].vec.x, vectors[j].vec.y);
                        }
                    }
                }
            }

            function drawPoint(point, isHovered, index) {
                let vec = point.vec;
                let baseSize = point.baseSize;
                let pulseOffset = point.pulseOffset;

                // Get color based on position
                let col = getColorForPosition(point.normX, point.normY);

                // Subtle pulse animation
                let pulse = p.sin(p.frameCount * 0.02 + pulseOffset) * 0.15 + 1;
                let size = baseSize * pulse;

                if (isHovered) {
                    size *= 1.8;

                    // Bright glow effect for hovered point
                    for (let i = 3; i > 0; i--) {
                        p.noStroke();
                        p.fill(col.r, col.g, col.b, 60 / i);
                        p.ellipse(vec.x, vec.y, size * (2 + i * 0.8), size * (2 + i * 0.8));
                    }
                }

                // Main point with bright gradient-like effect
                p.noStroke();

                // Outer glow - brighter
                p.fill(col.r, col.g, col.b, 80);
                p.ellipse(vec.x, vec.y, size * 2.5, size * 2.5);

                // Middle layer - brighter
                p.fill(col.r, col.g, col.b, 180);
                p.ellipse(vec.x, vec.y, size * 1.5, size * 1.5);

                // Core - full brightness, even brighter if hovered
                if (isHovered) {
                    // Super bright when hovered
                    p.fill(Math.min(255, col.r * 1.4), Math.min(255, col.g * 1.4), Math.min(255, col.b * 1.4));
                } else {
                    // Already bright, but boost a bit more
                    p.fill(Math.min(255, col.r * 1.2), Math.min(255, col.g * 1.2), Math.min(255, col.b * 1.2));
                }
                p.ellipse(vec.x, vec.y, size, size);

                // Inner highlight - brighter white spot
                p.fill(255, 255, 255, isHovered ? 220 : 150);
                p.ellipse(vec.x - size * 0.15, vec.y - size * 0.15, size * 0.4, size * 0.4);

                // Show ID on hover or when zoomed in
                if (isHovered || zoom > 2) {
                    p.fill(255, 255, 255);
                    p.noStroke();
                    p.textAlign(p.CENTER);
                    p.textSize(10 / zoom);
                    p.text('ID: ' + point.id, vec.x, vec.y - size - 8);
                }
            }

            function findHoveredPoint() {
                let mouseXWorld = (p.mouseX - offsetX) / zoom;
                let mouseYWorld = (p.mouseY - offsetY) / zoom;

                for (let i = 0; i < vectors.length; i++) {
                    let d = p.dist(mouseXWorld, mouseYWorld, vectors[i].vec.x, vectors[i].vec.y);
                    if (d < 15) {
                        return i;
                    }
                }
                return null;
            }

            function drawUIOverlay() {
                // Zoom indicator
                p.push();
                p.fill(255, 255, 255, 200);
                p.noStroke();
                p.textAlign(p.LEFT);
                p.textSize(12);
                p.text('Zoom: ' + zoom.toFixed(1) + 'x', 20, p.height - 20);
                p.text('Points: ' + vectors.length, 20, p.height - 40);
                p.text('Clusters: ' + clusters.length, 20, p.height - 60);
                p.pop();
            }

            p.mouseDragged = function () {
                // Only pan if mouse is over canvas
                if (!isMouseOverCanvas) return;

                offsetX += p.movedX;
                offsetY += p.movedY;
                p.cursor(p.MOVE);
                return false;
            };

            p.mouseReleased = function () {
                p.cursor(p.ARROW);
            };

            p.mouseWheel = function (event) {
                // Only zoom if mouse is over canvas
                if (!isMouseOverCanvas) return true;

                let zoomFactor = 0.1;
                let newZoom = zoom + (event.delta > 0 ? -zoomFactor : zoomFactor);
                newZoom = p.constrain(newZoom, 0.1, 10);

                // Zoom towards mouse position
                let mouseXWorld = (p.mouseX - offsetX) / zoom;
                let mouseYWorld = (p.mouseY - offsetY) / zoom;
                offsetX -= (mouseXWorld - (p.mouseX - offsetX) / newZoom) * newZoom;
                offsetY -= (mouseYWorld - (p.mouseY - offsetY) / newZoom) * newZoom;

                zoom = newZoom;
                return false;
            };

            p.windowResized = function () {
                if (container) {
                    p.resizeCanvas(container.offsetWidth, container.offsetHeight);
                }
            };

            // Add click handler for selection
            p.mouseClicked = function () {
                if (!isMouseOverCanvas) return;

                if (hoveredPoint !== null) {
                    console.log('Selected participant:', vectors[hoveredPoint].id);
                    dotNetRef.invokeMethodAsync("OnParticipantSelected", vectors[hoveredPoint].id.toString());
                }
            };
        };
        window.myP5 = new p5(sketch);
    }
};