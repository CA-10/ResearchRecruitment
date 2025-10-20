window.renderingCode = {
    start: function (apiDataJson, groupDataJson) {
        if (window.myP5) {
            window.myP5.remove();
        }

        const parsedApiData = JSON.parse(apiDataJson);
        const parsedGroupData = JSON.parse(groupDataJson);

        const sketch = (p) => {
            let vectors = [];
            let groupVectors = [];
            let offsetX = 0, offsetY = 0, zoom = 1;
            const scaleFactorX = 120, scaleFactorY = 120;

            p.setup = function () {
                const c = p.createCanvas(p.windowWidth, p.windowHeight);
                c.parent("p5-container");
                p.background(255, 252, 242);

                for (let course of parsedApiData) {
                    vectors.push({
                        word: course.name,
                        vec: p.createVector(course.embedding_x * scaleFactorX, course.embedding_y * scaleFactorY),
                        summary: course.summary
                    });
                }

                for (let group of parsedGroupData) {
                    groupVectors.push({
                        vec: p.createVector(group.center[0] * scaleFactorX, group.center[1] * scaleFactorY),
                        hull: group.convex_hull,
                        name: group.cluster_name
                    });
                }
            };

            p.draw = function () {
                p.background(255, 252, 242);
                p.translate(offsetX, offsetY);
                p.scale(zoom);

                for (let { word, vec } of vectors) {
                    let colorValue = p.map(vec.x, 0, 400, 0, 255); // Color based on x-axis
                    let colorValueY = p.map(vec.y, 0, 400, 0, 255); // Color based on y-axis

                    // Mix the x and y-based color values using a lerp (linear interpolation)
                    let finalColor = p.lerpColor(p.color(vec.x, 0, 0), p.color(0, 0, vec.y), 0.5); // Blend red and blue

                    p.noStroke();
                    p.fill(finalColor, 100, 150);
                    p.ellipse(vec.x, vec.y, 8, 8);
                    p.fill(0);

                    if (zoom > 0.5) {
                        p.textAlign(p.CENTER);
                        //p.text(word, vec.x, vec.y - 15);
                    }
                }

                for (let { vec, hull, name } of groupVectors) {
                    let groupX = vec.group_x;
                    let groupY = vec.group_y;
                    let hullPoints = hull;

                    let colorValueX = p.map(vec.x, 200, 100, 0, 255); // Color based on x-axis
                    let colorValueY = p.map(vec.y, 200, 100, 0, 255); // Color based on y-axis

                    let alphaValue = 10; // Transparency value (0-255)

                    // Create two colors: one red (with varying intensity based on vec.x), and one blue (with varying intensity based on vec.y)
                    let color1 = p.color(colorValueX, 0, 0, alphaValue); // Red color based on vec.x
                    let color2 = p.color(0, 0, colorValueY, alphaValue); // Blue color based on vec.y

                    // Blend the colors using lerpColor (mix between the two colors)
                    let blendedColor = p.lerpColor(color1, color2, 0.5); // 50% mix of red and blue

                    // Now you have the final blended color with alpha
                    let finalColor = p.color(p.red(blendedColor), p.green(blendedColor), p.blue(blendedColor), alphaValue);

                    // Use finalColor for drawing or other operations

                    p.fill(finalColor);

                    // Move to the group center before drawing the hull
                    p.push();
                    p.translate(groupX, groupY);

                    // Begin drawing the convex hull
                    p.beginShape();
                    for (let point of hullPoints) {
                        let x = point[0];
                        let y = point[1];
                        p.curveVertex(x * scaleFactorX, y * scaleFactorY);
                    }
                    p.endShape(p.CLOSE);  // Close the shape to form the convex hull

                    p.fill(0);

                    if (zoom <= 0.5) {
                        p.textSize(10 * (1 / zoom));
                        p.textAlign(p.CENTER);
                        p.text(name, vec.x, vec.y - 15);
                    }

                    // Reset transformations
                    p.pop();

                    p.textSize(12);
                    // Reset fill color for other elements
                    p.fill(0);
                }
            };

            p.mouseDragged = function () {
                offsetX += p.movedX;
                offsetY += p.movedY;
            };

            p.mouseWheel = function (event) {
                const zoomFactor = 0.1;
                let newZoom = zoom + (event.delta > 0 ? -zoomFactor : zoomFactor);
                newZoom = p.constrain(newZoom, 0.1, 10);
                zoom = newZoom;
                return false;
            };

            p.windowResized = function () {
                p.resizeCanvas(p.windowWidth, p.windowHeight);
            };
        };

        window.myP5 = new p5(sketch);
    }
};