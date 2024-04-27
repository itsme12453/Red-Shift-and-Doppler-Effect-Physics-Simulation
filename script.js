const waveWidth = 75
let waves = [];
let wavesRight = [];
let latestWave = undefined;
let latestWaveRight = undefined

let game = {
    start: function() {
        this.canvas = document.getElementById("canvas");
        this.ctx = this.canvas.getContext("2d");

        this.canvas.height = window.innerHeight;
        this.canvas.width = window.innerWidth;

        this.isDragging = false;
        this.targetX = null;
        this.speed = 0.25;

        this.canvas.addEventListener("mousedown", (e) => {
            this.isDragging = true;
            this.updateCursorPosition(e);
        });

        this.canvas.addEventListener("mousemove", (e) => {
            if (this.isDragging) {
                this.updateCursorPosition(e);
            }
        });

        this.canvas.addEventListener("mouseup", () => {
            this.isDragging = false;
            this.targetX = this.cursorPosition.x;
        });
    },

    updateCursorPosition: function(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.cursorPosition = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
    },

    stop: function() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
};

function Vector2D(x, y) {
    this.x = x;
    this.y = y;
}

function Earth(pos) {
    this.pos = pos;
    this.size = { width: 50, height: 50 };

    this.image = new Image();
    this.image.src = "./assets/earth.png";

    this.image.onload = () => {
        this.draw();
    };

    this.image.onerror = () => {
        console.error("Failed to load the image: " + this.image.src);
    };

    this.draw = function() {
        game.ctx.drawImage(
            this.image,
            this.pos.x,
            this.pos.y,
            this.size.width,
            this.size.height
        );
    };
}

function GalaxyImage(pos) {
    this.pos = pos;
    this.size = { width: 100, height: 100 };
    this.angle = 0;
    this.rotationSpeed = 0.01;
    this.direction = "still"; // Default to "still"

    this.image = new Image();
    this.image.src = "./assets/galaxy.png";

    this.draw = function(ctx) {
        const cx = this.pos.x + this.size.width / 2;
        const cy = this.pos.y + this.size.height / 2;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(this.angle);

        ctx.drawImage(
            this.image,
            -this.size.width / 2,
            -this.size.height / 2,
            this.size.width,
            this.size.height
        );

        ctx.restore();

        this.angle += this.rotationSpeed;
    };

    // Update direction based on galaxy movement
    this.updateDirection = function(targetX) {
        if (this.pos.x > targetX) {
            this.direction = "left";
        } else if (this.pos.x < targetX) {
            this.direction = "right";
        } else {
            this.direction = "still"; // If the galaxy is not moving
        }
    };
}

function GalaxyCircles(galaxyImage) {
    this.galaxyImage = galaxyImage;
    this.circles = [];

    this.addCircle = function() {
        this.circles.push({ radius: 1 });
    };

    this.updateAndDraw = function(ctx) {
        ctx.strokeStyle = "white";
        
        // Calculate center position of the galaxy
        const cx = this.galaxyImage.pos.x + this.galaxyImage.size.width / 2;
        const cy = this.galaxyImage.pos.y + this.galaxyImage.size.height / 2;

        this.circles = this.circles.filter(circle => {
            // Increase radius
            circle.radius++;

            // Draw circle
            ctx.beginPath();
            ctx.arc(cx, cy, circle.radius, 0, 2 * Math.PI);
            ctx.stroke();

            // Check if circle is off-screen
            const isOffScreen =
                (cx + circle.radius < 0) ||
                (cx - circle.radius > ctx.canvas.width) ||
                (cy + circle.radius < 0) ||
                (cy - circle.radius > ctx.canvas.height);

            return !isOffScreen;
        });
    };
}

function Wave(pos, direction, color, wavelength, amplitude) {
    this.pos = pos;
    this.color = color;
    this.wavelength = wavelength;
    this.amplitude = amplitude;
    this.direction = direction;

    this.move = function() {
        if (this.direction === "right") {
            this.pos.x += 0.75; // Move rightward
        } else {
            this.pos.x -= 0.75; // Move leftward
        }
    };
    
    this.draw = function() {
        const totalWidth = this.wavelength;

        game.ctx.beginPath();

        // if (this.direction === "right") {
        //     const startDegree = 180;
        //     const startRadian = startDegree * (Math.PI / 180);
        //     const startX = this.pos.x + ((startDegree - 180) / 360) * totalWidth;
        //     const startY = this.pos.y + this.amplitude * Math.sin(startRadian);

        //     game.ctx.moveTo(startX, startY); // Ensure the initial point aligns with the sine wave

        //     for (let degree = 180; degree <= 540; degree++) {
        //         const radian = degree * (Math.PI / 180);
        //         const xPos = this.pos.x + ((degree - 180) / 360) * totalWidth; 
        //         const yPos = this.pos.y + this.amplitude * Math.sin(radian);
        //         game.ctx.lineTo(xPos, yPos); // Draw the sine wave toward the right
        //     }
        // } else {
        const startDegree = 0;
        const startRadian = startDegree * (Math.PI / 180);
        const startX = this.pos.x + (startDegree / 360) * totalWidth;
        const startY = this.pos.y + this.amplitude * Math.sin(startRadian);

        game.ctx.moveTo(startX, startY); // Start the leftward sine wave

        for (let degree = 0; degree <= 360; degree++) {
            const radian = degree * (Math.PI / 180);
            const xPos = this.pos.x + (degree / 360) * totalWidth; 
            const yPos = this.pos.y + this.amplitude * Math.sin(radian);
            game.ctx.lineTo(xPos, yPos); // Draw the sine wave toward the left
        }
        // }

        game.ctx.strokeStyle = this.color; 
        game.ctx.stroke(); // Draw the sine wave
    };
}

function moveArrowX(currentX, targetX, stepSize) {
    const dx = targetX - currentX;
    const step = Math.sign(dx) * stepSize;

    if (Math.abs(dx) > Math.abs(step)) {
        return currentX + step;
    } else {
        return targetX;
    }
}


function animate() {
    window.requestAnimationFrame(animate); // Continue the animation loop
    game.ctx.clearRect(0, 0, game.canvas.width, game.canvas.height); // Clear the canvas

    if (game.targetX !== null) {
        const dx = game.targetX - galaxyImage.pos.x;
        const step = Math.sign(dx) * game.speed;

        if (Math.abs(dx) > Math.abs(step)) {
            galaxyImage.pos.x += step; // Move towards the target
        } else {
            galaxyImage.pos.x = game.targetX; // Ensure smooth movement
        }

        galaxyImage.updateDirection(game.targetX); // Update galaxy direction
    }

    earth.draw(); // Draw the Earth

    // Draw and update existing leftward-moving waves
    for (const wave of waves) {
        wave.move(); // Leftward movement
        wave.draw(); // Draw the wave
    }

    // Draw and update existing rightward-moving waves
    for (const wave of wavesRight) {
        wave.move(); // Rightward movement
        wave.draw(); // Draw the wave
    }

    galaxyImage.draw(game.ctx); // Draw the galaxy
    galaxyCircles.updateAndDraw(game.ctx); // Update and draw galaxy circles

    // Spacing between waves
    const leftWaveSpacing = latestWave ? latestWave.wavelength : 0;
    const rightWaveSpacing = latestWaveRight ? latestWaveRight.wavelength : 0;

    // Create new leftward-moving waves
    if (
        latestWave.pos.x <= galaxyImage.pos.x - leftWaveSpacing
    ) {
        let adjustedWaveWidth = waveWidth;

        if (galaxyImage.direction === "left") {
            adjustedWaveWidth = waveWidth / 2; // Halve the width for leftward waves when moving left
        }

        waves.push(
            new Wave(
                new Vector2D(
                    galaxyImage.pos.x, // Spawn from the current position of the galaxy
                    (game.canvas.height / 2) - 25 // Vertical position
                ),
                "left", // Direction for left-moving waves
                "red", // Color for left-moving waves
                adjustedWaveWidth, // Adjusted wavelength
                15 // Amplitude
            )
        );

        latestWave = waves[waves.length - 1]; // Update the latest leftward-moving wave
    }

    // Create new rightward-moving waves
    if (
        latestWaveRight.pos.x >= galaxyImage.pos.x + rightWaveSpacing
    ) {
        let adjustedWaveWidth = waveWidth; // Default wave width
        let xpos = galaxyImage.pos.x

        if (galaxyImage.direction === "right") {
            adjustedWaveWidth = waveWidth / 2; // Halve the wavelength for rightward waves
        }

        wavesRight.push(
            new Wave(
                new Vector2D(
                    xpos, // Spawn from the current position of the galaxy
                    (game.canvas.height / 2) - 25 // Vertical position
                ),
                "right", // Direction for rightward-moving waves
                "blue", // Color for rightward-moving waves
                adjustedWaveWidth, // Wavelength for right-moving waves
                15 // Amplitude
            )
        );

        latestWaveRight = wavesRight[wavesRight.length - 1]; // Update the latest rightward-moving wave
    }

    if (game.isDragging) {
        game.ctx.strokeStyle = "red";
        game.ctx.beginPath();
        game.ctx.moveTo(
            galaxyImage.pos.x + galaxyImage.size.width / 2,
            game.cursorPosition.y
        );
        game.ctx.lineTo(
            game.cursorPosition.x,
            game.cursorPosition.y
        );
        game.ctx.stroke(); // Draw the dragging line
    }
}







game.start();

let earth = new Earth(new Vector2D(100, (game.canvas.height / 2) - 50));
let galaxyImage = new GalaxyImage(new Vector2D((game.canvas.width / 2) - 50, (game.canvas.height / 2) - 75));
let galaxyCircles = new GalaxyCircles(galaxyImage);

waves.push(new Wave(new Vector2D((game.canvas.width / 2) - 50, (game.canvas.height / 2) - 25), "left", "red", waveWidth, 15));
latestWave = waves[0];


wavesRight.push(new Wave(new Vector2D((game.canvas.width / 2), (game.canvas.height / 2) - 25), "right", "red", waveWidth, 15));
latestWaveRight = wavesRight[0];

galaxyCircles.addCircle();
setInterval(() => {
    galaxyCircles.addCircle();
}, 1000);

animate();
