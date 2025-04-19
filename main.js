import "./style.css";
import Phaser from "phaser";

document.addEventListener('touchmove', function(e) {
    if (e.scale !== 1) { e.preventDefault(); }
}, { passive: false });

document.addEventListener('gesturestart', function(e) {
    e.preventDefault();
});

window.addEventListener('touchmove', function(e) {
    e.preventDefault();
}, { passive: false });

const sizes = {
    fruitWidth: 50,
    vegetableWidth: 90
};

const timeLimitSec = 30;
const textColor = "white";
const fruitPath = "./assets/fruit/pngs/";
const fruitImages = [
    "banana.png",
    "black-berry-dark.png",
    "black-berry-light.png",
    "black-cherry.png",
    "green-grape.png",
    "lemon.png",
    "lime.png",
    "orange.png",
    "peach.png",
    "plum.png",
    "raspberry.png",
    "red-cherry.png",
    "red-grape.png",
    "strawberry.png",
];

const vegetablesPath = "./assets/vegetables/PNG/without_shadow/";
const vegetables = {
    1: "Broccoli",
    2: "Cabbage",
    3: "Lettuce",
    4: "Cauliflower",
    5: "Carrot",
    6: "Eggplant",
    7: "Cucumber",
    8: "Tomato",
    9: "Potato",
    10: "Kohlrabi",
    11: "Turnip",
    12: "White Eggplant",
    13: "Brussels Sprout",
    14: "Asparagus",
    15: "Onion",
    16: "Bok Choy",
    17: "Garlic",
    18: "Chives",
    19: "Green Beans",
    20: "Chili Pepper",
    21: "Peas",
    22: "Bell Pepper",
    26: "Broccolini",
    27: "Corn",
    28: "Parsnip",
    29: "Pattypan Squash",
    30: "Zucchini",
    32: "Chayote",
    33: "Fennel",
    34: "Cherry Tomato",
    35: "Okra",
    36: "Frisée",
    37: "Yam",
    38: "Eggplant (Thai)",
    41: "Pumpkin",
    42: "Butternut Squash",
    44: "Artichoke",
    45: "Sweet Potato",
    48: "Snow Pea"
};

const speedDown = 330;
const gameStartDiv = document.querySelector("#gameStartDiv");
const gameStartBtn = document.querySelector("#gameStartBtn");
const gameEndDiv = document.querySelector("#gameEndDiv");
const gameWinLoseSpan = document.querySelector("#gameWinLoseSpan");
const gameEndScoreSpan = document.querySelector("#gameEndScoreSpan");
const gameCanvas = document.getElementById('gameCanvas');
gameCanvas.style.cursor = 'none';

class GameScene extends Phaser.Scene {
    constructor() {
        super("scene-game");
        this.playerLeft;
        this.playerRight;
        this.cursor;
        this.playerSpeed = speedDown + 80;
        this.target;
        this.fruitPoints = 0;
        this.vegetablePoints = 0;
        this.textFruitScore;
        this.textVegetableScore;
        this.textTime;
        this.timedEvent;
        this.remainingTime;
        this.coinMusic;
        this.bgMusic;
        this.emitter;
        this.fruitIcon;
        this.vegetableIcon;
        this.isPaused = false;
        this.leftButton = null;
        this.rightButton = null;
        this.isMobile = false;
    }

    preload() {
        document.addEventListener('contextmenu', event => event.preventDefault());
        gameCanvas.addEventListener('mousedown', e => {
            e.preventDefault();
        });

        // Показываем лоадер перед началом загрузки
        document.getElementById('loaderDiv').style.display = 'flex';

        // Обработчик прогресса
        this.load.on('progress', (value) => {
        document.getElementById('progressSpan').textContent = 
            `${Math.floor(value * 100)}%`;
        });

        // Обработчик завершения загрузки
        this.load.on('complete', () => {
        document.getElementById('loaderDiv').style.display = 'none';
        });

        this.load.image("bg", "./assets/bg.jpg");
        this.load.image("left_arrow", "./assets/left_arrow.png");
        this.load.image("right_arrow", "./assets/right_arrow.png");
        this.load.image("pause", "./assets/pause.png");
        this.load.image("basket", "./assets/basket.png");
        this.load.image("money", "./assets/money.png");
        this.load.audio("coin", "./assets/coin.mp3");
        this.load.audio("bgMusic", "./assets/bgMusic.mp3");

        fruitImages.forEach((fruitName) => {
            this.load.image(fruitName, fruitPath + fruitName);
        });

        Object.keys(vegetables).forEach(key => {
            this.load.image(`${key}.png`, vegetablesPath + `${key}.png`);
        });
    }

    create() {
        this.isMobile = !this.sys.game.device.os.desktop;

        this.coinMusic = this.sound.add("coin");
        this.bgMusic = this.sound.add("bgMusic");
        
        this.add.image(0, 0, "bg").setOrigin(0, 0);
    
        const basketScale = this.isMobile ? 0.8 : 1;
        this.playerLeft = this.physics.add.image(0, this.scale.height - 100, "basket")
            .setOrigin(0, 0)
            .setScale(basketScale);
        this.playerRight = this.physics.add.image(this.playerLeft.width, this.scale.height - 100, "basket")
            .setOrigin(0, 0)
            .setScale(basketScale);
    
        this.playerLeft.setImmovable(true);
        this.playerLeft.body.allowGravity = false;
        this.playerLeft.setCollideWorldBounds(true);
    
        this.playerRight.setImmovable(true);
        this.playerRight.body.allowGravity = false;
        this.playerRight.setCollideWorldBounds(true);

        this.input.on('pointerdown', (pointer) => {
            if (this.isMobile) {
                const touchX = pointer.x;
                const middleX = this.scale.width / 2;
                
                if (touchX < middleX) {
                    this.playerLeft.setVelocityX(-this.playerSpeed);
                    this.playerRight.setVelocityX(-this.playerSpeed);
                } else {
                    this.playerLeft.setVelocityX(this.playerSpeed);
                    this.playerRight.setVelocityX(this.playerSpeed);
                }
            }
        });

        this.input.on('pointerup', () => {
            if (this.isMobile) {
                this.playerLeft.setVelocityX(0);
                this.playerRight.setVelocityX(0);
            }
        });

        const randomFruitIcon = fruitImages[Math.floor(Math.random() * fruitImages.length)];
        const vegetableKeys = Object.keys(vegetables);
        const randomVegetableKey = vegetableKeys[Math.floor(Math.random() * vegetableKeys.length)];
        const randomVegetableImage = `${randomVegetableKey}.png`;

        const fruitTexture = this.textures.get(randomFruitIcon);
        const vegetableTexture = this.textures.get(randomVegetableImage);
        
        this.fruitIcon = this.add.image(
            this.playerLeft.x + this.playerLeft.width / 2, 
            this.playerLeft.y + this.playerLeft.height / 2,
            randomFruitIcon
        ).setScale((sizes.fruitWidth / 1.2) / fruitTexture.getSourceImage().width);
    
        this.vegetableIcon = this.add.image(
            this.playerRight.x + this.playerRight.width / 2,
            this.playerRight.y + this.playerRight.height / 2,
            randomVegetableImage
        ).setScale((sizes.vegetableWidth / 1.2) / vegetableTexture.getSourceImage().width);

        this.createNewTarget();
        this.cursor = this.input.keyboard.createCursorKeys();

        this.input.keyboard.on('keydown-SPACE', () => {
            this.togglePause();
        });

        const textScale = this.isMobile ? 0.8 : 1;
        this.textFruitScore = this.add.text(this.scale.width - 200, 10, "🍓: 0", {
            font: `${20 * textScale}px Arial`,
            fill: textColor,
        });
        this.textVegetableScore = this.add.text(this.scale.width - 200, 40, "🌽: 0", {
            font: `${20 * textScale}px Arial`,
            fill: textColor,
        });
        this.textTime = this.add.text(20, 10, `⏰: ${timeLimitSec}`, {
            font: `${20 * textScale}px Arial`,
            fill: textColor,
        });

        this.playerLeft.setDepth(5);
        this.playerRight.setDepth(5);
        this.target.setDepth(5);
        this.fruitIcon.setDepth(10);
        this.vegetableIcon.setDepth(10);

        this.timedEvent = this.time.delayedCall(timeLimitSec * 1000, this.gameOver, [], this);

        this.emitter = this.add.particles(0, 0, "money", {
            scale: { start: 0.2, end: 0.1 },
            speed: { min: 20, max: 100 },
            gravityY: speedDown - 200,
            lifespan: 200,
            emitting: false
        });
        this.emitter.startFollow(this.playerLeft);

        if (this.isMobile) {
            this.createMobileControls();
        }
        
        this.scale.on('resize', this.resize, this);
        
        this.bgMusic.pause();
        this.scene.pause();
        
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.scene.pause();
                if (this.bgMusic && this.bgMusic.isPlaying) {
                    this.bgMusic.pause();
                }
            } else if (!this.isPaused && gameStartDiv.style.display === "none") {
                this.scene.resume();
                if (this.bgMusic && !this.bgMusic.isPlaying) {
                    this.bgMusic.resume();
                }
            }
        });
    }

    createMobileControls() {
        const buttonSize = this.scale.width * 0.07;
        const buttonSpacing = this.scale.width * 0.05;
        const pauseButtonSize = buttonSize * 0.75;

        if (this.leftButton) {
            this.leftButton.destroy();
        }
        if (this.rightButton) {
            this.rightButton.destroy();
        }

        this.leftButton = this.add.image(buttonSpacing, this.scale.height - buttonSize - buttonSpacing, 'left_arrow')
            .setOrigin(0, 0)
            .setDisplaySize(buttonSize, buttonSize)
            .setInteractive()
            .setAlpha(0.7)
            .setScrollFactor(0);

        this.rightButton = this.add.image(this.scale.width - buttonSize - buttonSpacing, this.scale.height - buttonSize - buttonSpacing, 'right_arrow')
            .setOrigin(0, 0)
            .setDisplaySize(buttonSize, buttonSize)
            .setInteractive()
            .setAlpha(0.7)
            .setScrollFactor(0);

            ['pointerdown', 'pointerover'].forEach(eventName => {
                this.leftButton.on(eventName, () => {
                    if (!this.isPaused) {
                        this.playerLeft.setVelocityX(-this.playerSpeed);
                    }
                });
        
                this.rightButton.on(eventName, () => {
                    if (!this.isPaused) {
                        this.playerLeft.setVelocityX(this.playerSpeed);
                    }
                });
            });
        
            ['pointerup', 'pointerout'].forEach(eventName => {
                this.leftButton.on(eventName, () => {
                    if (!this.isPaused) {
                        this.playerLeft.setVelocityX(0);
                    }
                });
        
                this.rightButton.on(eventName, () => {
                    if (!this.isPaused) {
                        this.playerLeft.setVelocityX(0);
                    }
                });
            });

        const pauseButton = this.add.image(this.scale.width - pauseButtonSize - buttonSpacing, buttonSpacing, 'pause')
            .setOrigin(1, 0)
            .setDisplaySize(pauseButtonSize, pauseButtonSize)
            .setInteractive()
            .on('pointerdown', this.togglePause, this)
            .setScrollFactor(0);
    }

    togglePause() {
        if (this.isPaused) {
            this.isPaused = false;
            this.physics.resume();
            this.timedEvent.paused = false;
            this.bgMusic.resume();
        } else {
            this.isPaused = true;
            this.physics.pause();
            this.timedEvent.paused = true;
            this.bgMusic.pause();
        }
    }

    update() {
        if (this.isPaused) return;

        this.remainingTime = this.timedEvent.getRemainingSeconds();
        this.textTime.setText(`⏰: ${Math.round(this.remainingTime)}`);

        if (this.target.y >= this.scale.height) {
            this.target.destroy();
            this.createNewTarget();
        }

        const { left, right } = this.cursor;

        if (!this.isMobile) {
            this.playerLeft.setVelocityX(0);
            this.playerRight.setVelocityX(0);

            if (left.isDown) {
                this.playerLeft.setVelocityX(-this.playerSpeed);
                this.playerRight.setVelocityX(-this.playerSpeed);
            } else if (right.isDown) {
                this.playerLeft.setVelocityX(this.playerSpeed);
                this.playerRight.setVelocityX(this.playerSpeed);
            }
        }

        const basketDistance = this.playerLeft.width;
        
        if (this.playerLeft.x + basketDistance + this.playerRight.width > this.scale.width) {
            this.playerLeft.x = this.scale.width - basketDistance - this.playerRight.width;
        }
        this.playerRight.x = this.playerLeft.x + basketDistance;
        
        this.updateIconPositions();
    }

    updateIconPositions() {
        this.fruitIcon.setPosition(
            this.playerLeft.x + this.playerLeft.width / 2,
            this.playerLeft.y + this.playerLeft.height / 2
        );
        this.vegetableIcon.setPosition(
            this.playerRight.x + this.playerRight.width / 2,
            this.playerRight.y + this.playerRight.height / 2
        );
    }

    createNewTarget() {
        const newItem = this.getRandomItem();
        this.target = this.physics.add.image(0, 0, newItem.key)
            .setOrigin(0.5)
            .setVelocity(0, speedDown);

        const texture = this.textures.get(newItem.key);
        const scale = newItem.type === 'fruit' 
            ? sizes.fruitWidth / texture.getSourceImage().width 
            : sizes.vegetableWidth / texture.getSourceImage().width;
            
        this.target.setScale(scale);
        this.target.body.setSize(
            texture.getSourceImage().width * scale,
            texture.getSourceImage().height * scale
        );

        this.setTargetRandomPosition();
        
        this.physics.add.overlap(this.target, this.playerLeft, this.targetHitLeft, null, this);
        this.physics.add.overlap(this.target, this.playerRight, this.targetHitRight, null, this);
    }

    setTargetRandomPosition() {
        const basketWidth = this.playerLeft.width + this.playerRight.width;
        const min = basketWidth;
        const max = this.scale.width - basketWidth;
        this.target.setPosition(
            Phaser.Math.Between(min, max),
            -50
        );
        this.target.setVelocityY(speedDown);
    }

    targetHitLeft(target, player) {
        if (fruitImages.includes(target.texture.key)) {
            this.fruitPoints++;
            this.textFruitScore.setText(`🍓: ${this.fruitPoints}`);
        } else {
            this.fruitPoints = Math.max(0, this.fruitPoints - 1);
            this.textFruitScore.setText(`🍓: ${this.fruitPoints}`);
        }
        this.handleTargetCollision();
    }

    targetHitRight(target, player) {
        const vegetableImageKeys = Object.keys(vegetables).map(key => `${key}.png`);
        if (vegetableImageKeys.includes(target.texture.key)) {
            this.vegetablePoints++;
            this.textVegetableScore.setText(`🌽: ${this.vegetablePoints}`);
        } else {
            this.vegetablePoints = Math.max(0, this.vegetablePoints - 1);
            this.textVegetableScore.setText(`🌽: ${this.vegetablePoints}`);
        }
        this.handleTargetCollision();
    }

    handleTargetCollision() {
        this.coinMusic.play();
        this.emitter.explode(10);
        this.target.destroy();
        this.createNewTarget();
    }

    getRandomItem() {
        const isFruit = Math.random() < 0.5;
        if (isFruit) {
            const randomFruit = fruitImages[Math.floor(Math.random() * fruitImages.length)];
            return {
                key: randomFruit,
                type: 'fruit'
            };
        } else {
            const vegetableKeys = Object.keys(vegetables);
            const randomKey = vegetableKeys[Math.floor(Math.random() * vegetableKeys.length)];
            return {
                key: `${randomKey}.png`,
                type: 'vegetable'
            };
        }
    }

    resize(gameSize) {
        const width = gameSize.width;
        const height = gameSize.height;
        const isMobile = !this.sys.game.device.os.desktop;

        const basketScale = isMobile ? 0.8 : 1;
        const textScale = isMobile ? 0.8 : 1;

        this.playerLeft.setScale(basketScale);
        this.playerRight.setScale(basketScale);
        
        this.playerLeft.setY(height - 100);
        this.playerRight.setY(height - 100);

        this.textFruitScore.setPosition(width - 200, 10);
        this.textVegetableScore.setPosition(width - 200, 40);
        this.textTime.setPosition(20, 10);

        if (isMobile) {
            this.createMobileControls();
        }
        const basketDistance = this.playerLeft.width;
        
        if (this.playerLeft.x + basketDistance + this.playerRight.width > this.scale.width) {
            this.playerLeft.x = this.scale.width - basketDistance - this.playerRight.width;
        }
        this.playerRight.x = this.playerLeft.x + basketDistance;
        
        this.updateIconPositions();
    }

    gameOver() {
        const totalScore = this.fruitPoints + this.vegetablePoints;
        const isBalanced = this.fruitPoints === this.vegetablePoints;
        
        gameEndScoreSpan.textContent = totalScore;
        gameWinLoseSpan.textContent = (totalScore >= 10 && isBalanced) 
            ? "Win! 😊" 
            : "Lose! 😭 (We need an equal amount of fruits and vegetables.)";
        gameEndDiv.style.display = "flex";
    
        this.scene.pause();
        this.bgMusic.stop();
        
        if (this.target) {
            this.target.destroy();
        }
        
        this.input.keyboard.enabled = false;
    }

    restartGame() {
        this.fruitPoints = 0;
        this.vegetablePoints = 0;
        this.textFruitScore.setText("🍓: 0");
        this.textVegetableScore.setText("🌽: 0");
        
        if (this.target) {
            this.target.destroy();
        }
        
        this.createNewTarget();
        
        if (this.timedEvent) {
            this.timedEvent.remove();
        }
        this.timedEvent = this.time.delayedCall(timeLimitSec * 1000, this.gameOver, [], this);
        
        this.isPaused = false;
        this.physics.resume();
        this.input.keyboard.enabled = true;
        
        if (!this.bgMusic.isPlaying) {
            this.bgMusic.play({ loop: true });
        }
        
        gameEndDiv.style.display = "none";
        this.scene.resume();
    }
}

const config = {
    type: Phaser.CANVAS,
    width: window.innerWidth,
    height: window.innerHeight,
    canvas: gameCanvas,
    parent: 'gameContainer',
    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: speedDown },
            debug: false,
        },
    },
    scene: [GameScene],
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    render: {
        pixelArt: false,
        antialias: true
    }
};

const game = new Phaser.Game(config);

gameStartBtn.addEventListener("click", () => {
    if (game.scene.scenes[0].load.isLoading()) {
        alert('Resources are still loading!');
        return;
      }
      
      gameStartDiv.style.display = "none";
    if (game.scene.scenes[0]) {
        const gameScene = game.scene.scenes[0];
        gameScene.isPaused = false;
        gameScene.scene.resume();
        
        // Проверяем, существует ли bgMusic перед вызовом play
        if (gameScene.bgMusic) {
            gameScene.bgMusic.play({ loop: true });
        }
    }
});

document.getElementById('restartBtn').addEventListener('click', () => {
    game.scene.getScene('scene-game').restartGame();
});