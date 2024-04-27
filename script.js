let game = {
    start: function() {
        this.canvas = document.getElementById("canvas");
        this.ctx = this.canvas.getContext("2d");

        this.canvas.height = window.innerHeight;
        this.canvas.width = window.innerWidth;

        this.isDragging = false;
        this.targetX = null;
        this.speed = 1;

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


function Wave(amplitude, frequency, speed, offset) {
    this.amplitude = amplitude;
    this.frequency = frequency;
    this.speed = speed;
    this.phase = 0;
    this.offset = offset;

    this.draw = function(ctx, width, height, isLeft) {
        ctx.beginPath();

        const baseline = (height / 2) - this.offset;

        if (isLeft) {
            for (let x = width / 2; x >= 0; x--) {
                let y = baseline + this.amplitude * Math.sin(this.frequency * x + this.phase);
                ctx.lineTo(x, y);
            }
        } else {
            for (let x = width / 2; x < width; x++) {
                let y = baseline + this.amplitude * Math.sin(this.frequency * x + this.phase);
                ctx.lineTo(x, y);
            }
        }

        ctx.stroke();
        this.phase += this.speed;
    };

    this.increaseFrequency = function(value) {
        this.frequency += value;
    };

    this.decreaseFrequency = function(value) {
        this.frequency = Math.max(0, this.frequency - value);
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
    window.requestAnimationFrame(animate);
    game.ctx.clearRect(0, 0, game.canvas.width, game.canvas.height);

    if (game.targetX !== null) {
        const dx = game.targetX - galaxyImage.pos.x;
        const step = Math.sign(dx) * game.speed;

        if (Math.abs(dx) > Math.abs(step)) {
            galaxyImage.pos.x += step;
        } else {
            galaxyImage.pos.x = game.targetX;
        }
    }

    wave.draw(game.ctx, game.canvas.width, game.canvas.height);
    earth.draw();
    galaxyImage.draw(game.ctx);
    galaxyCircles.updateAndDraw(game.ctx);

    if (game.isDragging) {
        game.ctx.strokeStyle = "red";
        game.ctx.beginPath();
        game.ctx.moveTo(
            galaxyImage.pos.x + galaxyImage.size.width / 2,
            game.cursorPosition.y
        );
        game.ctx.lineTo(game.cursorPosition.x, game.cursorPosition.y);
        game.ctx.stroke();
    }
}

game.start();

let earth = new Earth(new Vector2D(100, (game.canvas.height / 2) - 50));
let galaxyImage = new GalaxyImage(
    new Vector2D((game.canvas.width / 2) - 50, (game.canvas.height / 2) - 75)
);
let galaxyCircles = new GalaxyCircles(galaxyImage);
let wave = new Wave(20, 0.05, 0.05, 25);

galaxyCircles.addCircle();
setInterval(() => {
    galaxyCircles.addCircle();
}, 1000);

animate();
