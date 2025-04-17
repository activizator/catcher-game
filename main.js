import "./style.css";
import Phaser from "phaser";

const sizes = {
    fruitWidth: 50,
    vegetableWidth: 90
};

const timeLimitSec = 35;
const textColor = "white";
const fruitPath = "/assets/fruit/pngs/";
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

const vegetablesPath = "/assets/vegetables/PNG/without_shadow/";
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

const speedDown = 350;
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
    }

    preload() {
        document.addEventListener('contextmenu', event => event.preventDefault());
        gameCanvas.addEventListener('mousedown', e => {
            e.preventDefault();
        });

        this.load.image("bg", "/assets/bg.jpg");
        this.load.image("basket", "/assets/basket.png");
        this.load.image("money", "/assets/money.png");
        this.load.audio("coin", "/assets/coin.mp3");
        this.load.audio("bgMusic", "/assets/bgMusic.mp3");

        fruitImages.forEach((fruitName) => {
            this.load.image(fruitName, fruitPath + fruitName);
        });

        Object.keys(vegetables).forEach(key => {
            this.load.image(`${key}.png`, vegetablesPath + `${key}.png`);
        });
    }

    create() {
        this.scene.pause("scene-game");

        this.coinMusic = this.sound.add("coin");
        this.bgMusic = this.sound.add("bgMusic");
        this.bgMusic.play({ loop: true });

        this.add.image(0, 0, "bg").setOrigin(0, 0);

        this.playerLeft = this.physics.add.image(0, this.scale.height - 100, "basket").setOrigin(0, 0);
        this.playerRight = this.physics.add.image(this.playerLeft.width, this.scale.height - 100, "basket").setOrigin(0, 0);

        this.playerLeft.setImmovable(true);
        this.playerLeft.body.allowGravity = false;
        this.playerLeft.setCollideWorldBounds(true);

        this.playerRight.setImmovable(true);
        this.playerRight.body.allowGravity = false;
        this.playerRight.setCollideWorldBounds(true);

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

        this.textFruitScore = this.add.text(this.scale.width - 200, 10, "🍓: 0", {
            font: "20px Arial",
            fill: textColor,
        });
        this.textVegetableScore = this.add.text(this.scale.width - 200, 40, "🌽: 0", {
            font: "20px Arial",
            fill: textColor,
        });
        this.textTime = this.add.text(20, 10, `⏰: ${timeLimitSec}`, {
            font: "20px Arial", 
            fill: textColor,
        });

        this.playerLeft.setDepth(5);
        this.playerRight.setDepth(5);
        this.target.setDepth(5);
        this.fruitIcon.setDepth(10);
        this.vegetableIcon.setDepth(10);

        this.timedEvent = this.time.delayedCall(timeLimitSec * 1000, this.gameOver, [], this);

        this.emitter = this.add.particles(0, 0, "money", {
            speed: 100,
            gravityY: speedDown - 200,
            scale: 0.2,
            duration: 200,
            emitting: false
        });
        this.emitter.startFollow(this.playerLeft);

        this.scale.on('resize', this.resize, this);
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

    resize(gameSize) {
        const width = gameSize.width;
        const height = gameSize.height;

        this.playerLeft.setY(height - 100);
        this.playerRight.setY(height - 100);

        this.textFruitScore.setPosition(width - 200, 10);
        this.textVegetableScore.setPosition(width - 200, 40);
        this.textTime.setPosition(20, 10);
        
        this.updateIconPositions();
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

        this.playerLeft.setVelocityX(0);
        this.playerRight.setVelocityX(0);

        if (left.isDown) {
            this.playerLeft.setVelocityX(-this.playerSpeed);
            this.playerRight.setVelocityX(-this.playerSpeed);
        } else if (right.isDown) {
            this.playerLeft.setVelocityX(this.playerSpeed);
            this.playerRight.setVelocityX(this.playerSpeed);
        }
        
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
    type: Phaser.WEBGL,
    width: window.innerWidth,
    height: window.innerHeight,
    canvas: gameCanvas,
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
};

const game = new Phaser.Game(config);

gameStartBtn.addEventListener("click", () => {
    gameStartDiv.style.display = "none";
    game.scene.resume("scene-game");
});

document.getElementById('restartBtn').addEventListener("click", () => {
    game.scene.getScene("scene-game").restartGame();
});