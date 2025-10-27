window.renderingCode = {
    start: function (apiDataJson) {
        if (window.myP5) {
            window.myP5.remove();
        }

        const parsedApiData = JSON.parse(apiDataJson);

        const sketch = (p) => {
            let vectors = [];
            let groupVectors = [];
            let offsetX = 0, offsetY = 0, zoom = 1;
            const scaleFactorX = 120, scaleFactorY = 120;

            p.setup = function () {
                const c = p.createCanvas(p.windowWidth, p.windowHeight);
                c.parent("p5-container");
                p.background(255, 252, 242);

                for (let participant of parsedApiData) {
                    vectors.push({
                        id: participant.id,
                        vec: p.createVector(participant.x * scaleFactorX, participant.y * scaleFactorY),
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

                    //Mix the x and y-based color values using a lerp (linear interpolation)
                    let finalColor = p.lerpColor(p.color(vec.x, 0, 0), p.color(0, 0, vec.y), 0.5); // Blend red and blue

                    p.noStroke();
                    p.fill(finalColor, 100, 150);
                    p.ellipse(vec.x, vec.y, 15, 15);
                    p.fill(0);

                    if (zoom > 0.5) {
                        p.textAlign(p.CENTER);
                        //p.text(word, vec.x, vec.y - 15);
                    }
                }
            };

            p.mouseDragged = function () {
                offsetX += p.movedX;
                offsetY += p.movedY;
            };

            p.mouseWheel = function (event) {
                let zoomFactor = 0.1;
                let newZoom = zoom + (event.delta > 0 ? -zoomFactor : zoomFactor);

                newZoom = p.constrain(newZoom, 0.1, 10); //Limits the zoom level

                let mouseXWorld = (p.mouseX - offsetX) / zoom;
                let mouseYWorld = (p.mouseY - offsetY) / zoom;

                offsetX -= (mouseXWorld - (p.mouseX - offsetX) / newZoom) * newZoom;
                offsetY -= (mouseYWorld - (p.mouseY - offsetY) / newZoom) * newZoom;

                zoom = newZoom;
                return false; //Prevent default scrolling
            };

            p.windowResized = function () {
                p.resizeCanvas(p.windowWidth, p.windowHeight);
            };
        };

        window.myP5 = new p5(sketch);
    }
};