
let highScore = localStorage.getItem('highScore') || 0;
let paused = false;



        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        const startButton = document.getElementById('startButton');

        const paddleHeight = 10;
        let paddleWidth = 100;
        let paddleX = (canvas.width - paddleWidth) / 2;
        let rightPressed = false;
        let leftPressed = false;

        const ballRadius = 10;
        let balls = [{ x: canvas.width / 2, y: canvas.height - 30, dx: 3, dy: -3 }];

        let brickRowCount = 5;
        let brickColumnCount = 11;
        const brickWidth = 65;
        const brickHeight = 20;
        const brickPadding = 5;
        const brickOffsetTop = 30;
        const brickOffsetLeft = 17;

        let bricks = [];
        let lives = 3;
        let level = 1;
        let score = 0; // Track score

        // Powerups
        let powerups = [];
        const powerupSize = 20;
        const powerupTypes = [
            { type: 'expandPaddle', color: '#FF4500' },
            { type: 'extraBall', color: '#32CD32' },
            { type: 'slowBall', color: '#1E90FF' },
            { type: 'fastBall', color: '#FFD700' },
            { type: 'scoreBoost', color: '#800080' },
            { type: 'shootPaddle', color: '#FF69B4' }, // New: Shooting powerup
            { type: 'extraLife', color: '#FF6347' }, // Extra life power-up
        ];



        // partical

        const PARTICLE_POOL_SIZE = 25;
        let particlePool = [];

        function menu() {
            // Paused screen rendering
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.font = "24px Arial";
            ctx.fillStyle = "#FFFFFF";
            ctx.textAlign = "center";
            ctx.fillText("Welcome to Breakout by Sinner", canvas.width / 2, canvas.height / 2);
            ctx.fillText("Click Start new game", canvas.width / 2, canvas.height / 2 + 30);
            return;
        };
        menu();


// Initialize the particle pool
        function initializeParticlePool() {
         for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
         particlePool.push(new Particle(0, 0, 0, 0, '255,255,255')); // Default values
        }
    }
    class Particle {
    constructor(x, y, dx, dy, color) {
        this.reset(x, y, dx, dy, color);
    }

    reset(x, y, dx, dy, color) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.color = color;
        this.size = Math.random() * 4 + 2; // Random initial size
        this.life = 0;
        this.maxLife = 50;
        this.active = true; // Mark as active
    }

    update() {
        if (!this.active) return false;

        this.x += this.dx;
        this.y += this.dy;
        this.size *= 0.95;
        this.life++;
        this.alpha = Math.max(0, 1 - this.life / this.maxLife);

        if (this.size < 0.5 || this.life > this.maxLife) {
            this.active = false; // Deactivate particle
        }

        return !this.active;
    }

    draw() {
        if (!this.active) return;

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color}, ${this.alpha || 1})`;
        ctx.fill();
        ctx.closePath();
    }
}


// Create particles at the brick location
function createParticles(x, y, color) {
    let particlesCreated = 0;

    for (let particle of particlePool) {
        if (!particle.active) {
            particle.reset(
                x,
                y,
                Math.random() * 4 - 2, // Random horizontal speed
                Math.random() * 4 - 2, // Random vertical speed
                color
            );
            particlesCreated++;
            if (particlesCreated >= 10) break; // Limit the number of particles
        }
    }
}

// Function to handle particle updates and rendering
function drawParticles() {
    for (let particle of particlePool) {
        if (particle.active) {
            particle.update();
            particle.draw();
        }
    }
}
initializeParticlePool();


        // Projectiles
        let projectiles = [];
        let canShoot = false; // Flag to determine if paddle can shoot
        let shootingInterval;

        function getRandomColor() {
            const letters = '0123456789ABCDEF';
            let color = '#';
            for (let i = 0; i < 6; i++) {
                color += letters[Math.floor(Math.random() * 16)];
            }
            return color;
        }
        

        function initializeBricks() {
            bricks = [];
            for (let c = 0; c < brickColumnCount; c++) {
                bricks[c] = [];
                for (let r = 0; r < brickRowCount; r++) {
                    bricks[c][r] = {
                        x: 0,
                        y: 0,
                        status: 1,
                        color: getRandomColor()
                    };
                }
            }
        }

        initializeBricks();

        document.addEventListener('keydown', keyDownHandler, false);
        document.addEventListener('keyup', keyUpHandler, false);

        function keyDownHandler(e) {
    if (e.key === 'Right' || e.key === 'ArrowRight') {
        rightPressed = true;
    } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
        leftPressed = true;
    } else if (e.key === 'p' || e.key === 'P') {
        togglePause(); // Toggle pause when 'P' is pressed
    }
}

        function keyUpHandler(e) {
            if (e.key === 'Right' || e.key === 'ArrowRight') {
                rightPressed = false;
            } else if (e.key === 'Left' || e.key === 'ArrowLeft') {
                leftPressed = false;
            }
        }

        function togglePause() {
    paused = !paused;

    if (!paused) {
        draw(); // Resume the game loop
    }
}



        function drawBricks() {
            for (let c = 0; c < brickColumnCount; c++) {
                for (let r = 0; r < brickRowCount; r++) {
                    if (bricks[c][r].status === 1) {
                        let brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
                        let brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
                        bricks[c][r].x = brickX;
                        bricks[c][r].y = brickY;
                        ctx.beginPath();
                        ctx.rect(brickX, brickY, brickWidth, brickHeight);
                        ctx.fillStyle = bricks[c][r].color;
                        ctx.fill();
                        ctx.closePath();
                    }
                }
            }
        }

        function drawPowerups() {
            powerups.forEach((powerup) => {
                ctx.beginPath();
                ctx.rect(powerup.x, powerup.y, powerupSize, powerupSize);
                ctx.fillStyle = powerup.color;
                ctx.fill();
                ctx.closePath();
            });
        }

        function movePowerups() {
            powerups.forEach((powerup, index) => {
                powerup.y += 2;
                if (powerup.y > canvas.height) {
                    powerups.splice(index, 1);
                }
            });
        }

// Load the powerup collection audio file
const powerupCollectAudio = new Audio('sounds/powerup_collect.mp3'); // Make sure the file path is correct

function collectPowerups() {
    powerups.forEach((powerup, index) => {
        if (
            powerup.y + powerupSize > canvas.height - paddleHeight &&
            powerup.x > paddleX &&
            powerup.x < paddleX + paddleWidth
        ) {
            activatePowerup(powerup.type);
            powerups.splice(index, 1);

            // Play the powerup collection sound
            powerupCollectAudio.currentTime = 0; // Reset audio to the start
            powerupCollectAudio.play();
        }
    });
}

        function activatePowerup(type) {
            switch (type) {
                case 'expandPaddle':
                    paddleWidth += 20;
                    setTimeout(() => (paddleWidth = Math.max(100, paddleWidth - 20)), 10000);
                    break;
                case 'extraBall':
                    balls.push({ x: canvas.width / 2, y: canvas.height - 30, dx: 3, dy: -3 });
                    break;
                case 'slowBall':
                    balls.forEach((ball) => {
                        ball.dx *= 0.7;
                        ball.dy *= 0.7;
                    });
                    setTimeout(() => balls.forEach((ball) => {
                        ball.dx /= 0.7;
                        ball.dy /= 0.7;
                    }), 10000);
                    break;
                case 'fastBall':
                    balls.forEach((ball) => {
                        ball.dx *= 1.3;
                        ball.dy *= 1.3;
                    });
                    setTimeout(() => balls.forEach((ball) => {
                        ball.dx /= 1.3;
                        ball.dy /= 1.3;
                    }), 10000);
                    break;
                case 'scoreBoost':
                    score += 50;
                    break;
                    case 'shootPaddle':
    if (!canShoot) {
        canShoot = true;
        shootingInterval = setInterval(() => {
            projectiles.push({ x: paddleX + paddleWidth / 2 - 2, y: canvas.height - paddleHeight - 10 });
           
        }, 300);
        setTimeout(() => {
            canShoot = false;
            clearInterval(shootingInterval);
            shootingInterval = null; // Reset interval reference
        }, 10000);
    }
    break;
    case 'extraLife':
    if (lives < 5) { // Maximum of 5 lives
        lives++;
    }
    break;
            }
        }

        function drawProjectiles() {
            projectiles.forEach((projectile) => {
                ctx.beginPath();
                ctx.rect(projectile.x, projectile.y, 4, 10);
                ctx.fillStyle = "#FF0000";
                ctx.fill();
                ctx.closePath();
            });
        }

        function resetBall() {
    balls.push({ x: canvas.width / 2, y: canvas.height - 30, dx: 2, dy: -2 });
    paddleX = (canvas.width - paddleWidth) / 2;
}

        function moveProjectiles() {
            projectiles.forEach((projectile, index) => {
                projectile.y -= 6;
                if (projectile.y < 0) {
                    projectiles.splice(index, 1);
                }
            });
        }

        const brickBreakAudio = new Audio("sounds/brick_break.mp3"); // Make sure the file path is correct


        function handleProjectileCollisions() {
    for (let pIndex = projectiles.length - 1; pIndex >= 0; pIndex--) {
        const projectile = projectiles[pIndex];
        for (let c = 0; c < brickColumnCount; c++) {
            for (let r = 0; r < brickRowCount; r++) {
                let b = bricks[c][r];
                if (b.status === 1) {
                    if (
                        projectile.x > b.x &&
                        projectile.x < b.x + brickWidth &&
                        projectile.y > b.y &&
                        projectile.y < b.y + brickHeight
                    ) {
                        b.status = 0;
                        projectiles.splice(pIndex, 1); // Remove projectile
                        score += 10;
                                                // Play the brick break sound
                                                brickBreakAudio.currentTime = 0; // Reset audio to the start
                                                brickBreakAudio.play();
                        break;
                    }
                }
            }
        }
    }
}



 // Load the audio file


function collisionDetection() {
    balls.forEach((ball) => {
        for (let c = 0; c < brickColumnCount; c++) {
            for (let r = 0; r < brickRowCount; r++) {
                let b = bricks[c][r];
                if (b.status === 1) {
                    if (
                        ball.x > b.x &&
                        ball.x < b.x + brickWidth &&
                        ball.y > b.y &&
                        ball.y < b.y + brickHeight
                    ) {
                        b.status = 0; // Brick destroyed
                        ball.dy = -ball.dy; // Ball bounces off

                        score += 10; // Increase score

                        // Play the brick break sound
                        brickBreakAudio.currentTime = 0; // Reset audio to the start
                        brickBreakAudio.play();

                        // 30% chance to drop a random power-up
                        if (Math.random() < 0.3) {
                            const randomPowerup = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
                            powerups.push({
                                x: b.x + brickWidth / 2 - powerupSize / 2,
                                y: b.y,
                                type: randomPowerup.type,
                                color: randomPowerup.color,
                            });
                        }

                        // Create particles at the brick location
                        createParticles(b.x + brickWidth / 2, b.y + brickHeight / 2, b.color);
                    }
                }
            }
        }
    });
}


        function drawBalls() {
            balls.forEach((ball) => {
                ctx.beginPath();
                ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
                ctx.fillStyle = "#0095DD";
                ctx.fill();
                ctx.closePath();
            });
        }

// Load the audio file
const ballLostAudio = new Audio('sounds/ball_lost.mp3'); // Make sure the file path is correct
const paddleHitAudio = new Audio('sounds/hit.mp3'); // Replace with the actual file path

function moveBalls() {
    balls.forEach((ball, index) => {
        // Wall collisions
        if (ball.x + ball.dx > canvas.width - ballRadius || ball.x + ball.dx < ballRadius) {
            ball.dx = -ball.dx; // Reflect horizontally
        }

        if (ball.y + ball.dy < ballRadius) {
            ball.dy = -ball.dy; // Reflect vertically
        } else if (ball.y + ball.dy > canvas.height - ballRadius) {
            // Paddle collision
            if (ball.x > paddleX && ball.x < paddleX + paddleWidth) {
                let relativeHit = (ball.x - (paddleX + paddleWidth / 2)) / (paddleWidth / 2);
                let reflectionAngle = relativeHit * Math.PI / 4; // Max angle: ±45 degrees
                let speed = Math.sqrt(ball.dx ** 2 + ball.dy ** 2); // Preserve speed
                ball.dx = speed * Math.sin(reflectionAngle);
                ball.dy = -speed * Math.cos(reflectionAngle);
                ball.dx *= 1 + (Math.random() * 0.1 - 0.05); // Add randomness for realism

                paddleHitAudio.currentTime = 0; // Reset audio to the start
                paddleHitAudio.play();
            } else {
                // Ball misses paddle
                balls.splice(index, 1);

                // Play the ball lost sound
                ballLostAudio.currentTime = 0; // Reset audio to the start
                ballLostAudio.play();

                if (balls.length === 0) {
                    lives--;
                    if (lives > 0) {
                        resetBall();
                    } else {
                        gameOver();
                    }
                }
            }
        }

        ball.x += ball.dx;
        ball.y += ball.dy;
    });
}


        function drawPaddle() {
            ctx.beginPath();
            ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
            ctx.fillStyle = "#0095DD";
            ctx.fill();
            ctx.closePath();
        }

        function drawScore() {
    ctx.font = "16px Arial";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText("Score: " + score, 15, 20);
    ctx.fillText("High Score: " + highScore, 150, 20);
}


        function drawLives() {
            ctx.font = "16px Arial";
            ctx.fillStyle = "#FFFFFF";
            ctx.fillText("Lives: " + lives, canvas.width - 65, 20);
        }

        function drawLevel() {
            ctx.font = "16px Arial";
            ctx.fillStyle = "#FFFFFF";
            ctx.fillText("Level: " + level, canvas.width / 2 - 30, 20);
        }

        let speedMultiplier = 1.0; // Initial speed multiplier

function checkLevelComplete() {
    if (bricks.every(column => column.every(brick => brick.status === 0))) {
        level++;
        speedMultiplier += 0.1; // Increase ball speed multiplier
        initializeBricks();

        balls.length = 0;
        resetBall();

        balls.forEach(ball => {
            ball.dx *= 1.3; // Increase ball speed
            ball.dy *= 1.3;
        });
        paddleX = (canvas.width - paddleWidth) / 2;
    }
}

function draw() {
    if (paused) {
        // Paused screen rendering
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = "24px Arial";
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.fillText("Game Paused", canvas.width / 2, canvas.height / 2);
        ctx.fillText("Press 'P' to Resume", canvas.width / 2, canvas.height / 2 + 30);
        return;
    }



    // Clear canvas before redrawing elements
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw elements
    drawBricks();
    drawBalls();
    drawPaddle();
    drawLives();
    drawLevel();
    drawScore();
    drawPowerups();
    drawProjectiles();

    // Draw particle effects
    drawParticles();

    // Other logic
    collisionDetection();
    handleProjectileCollisions();
    moveBalls();
    movePowerups();
    moveProjectiles();
    collectPowerups();
    checkLevelComplete();

    // Paddle movement logic
    if (rightPressed && paddleX < canvas.width - paddleWidth) {
        paddleX += 10;
    } else if (leftPressed && paddleX > 0) {
        paddleX -= 10;
    }

    requestAnimationFrame(draw);
}

const gameOverAudio = new Audio('sounds/game_over.mp3'); // Make sure the file path is correct

function gameOver() {
    // Play the game over sound
    gameOverAudio.currentTime = 0; // Reset audio to the start
    gameOverAudio.play();

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
        alert("New High Score: " + highScore + "\nPlease click OK to restart.\nMade by xS1NN3Rx");
    } else {
        alert("GAME OVER!\nPlease click OK to restart.\nMade by xS1NN3Rx");
    }
    document.location.reload();
    menu();
}




startButton.addEventListener('click', () => {
            // Hide the button and show the canvas
            startButton.style.display = 'none';
            canvas.style.display = 'block';

            // Initialize game state and start the game
            initializeBricks();
            draw(); // Start the game loop

            const game_start = new Audio('sounds/game_start.mp3');
            game_start.play()
        .then(() => console.log('Audio played successfully!'))
        .catch((error) => console.error('Audio play error:', error));
        });