import "./style.css";
import Phaser from "phaser";

const sizes = {
    fruitWidth: 50,
    vegetableWidth: 80
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
    "pear.png",
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
    23: "Dill",
    24: "Cilantro",
    25: "Bamboo Shoots",
    26: "Broccolini",
    27: "Corn",
    28: "Parsnip",
    29: "Pattypan Squash",
    30: "Zucchini",
    31: "Shallot",
    32: "Chayote",
    33: "Fennel",
    34: "Cherry Tomato",
    35: "Okra",
    36: "Frisée",
    37: "Yam",
    38: "Eggplant (Thai)",
    39: "Radish (Daikon)",
    40: "Kohlrabi (Purple)",
    41: "Pumpkin",
    42: "Butternut Squash",
    43: "String Beans",
    44: "Artichoke",
    45: "Sweet Potato",
    46: "Celery",
    47: "Artichoke (Globe)",
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
        this.player;
        this.cursor;
        this.playerSpeed = speedDown + 80;
        this.target;
        this.points = 0;
        this.textScore;
        this.textTime;
        this.timedEvent;
        this.remainingTime;
        this.coinMusic;
        this.bgMusic;
        this.emitter;
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

        for (let i = 1; i <= Object.keys(vegetables).length; i++) {
            this.load.image(`${i}.png`, vegetablesPath + `${i}.png`);
        }
    }

    create() {
        this.scene.pause("scene-game");
        this.coinMusic = this.sound.add("coin");
        this.bgMusic = this.sound.add("bgMusic");
        this.bgMusic.play();

        this.add.image(0, 0, "bg").setOrigin(0, 0);

        this.player = this.physics.add.image(0, 0, "basket").setOrigin(0, 0);
        this.player.setY(this.scale.height - this.player.height);
        this.player.setImmovable(true);
        this.player.body.allowGravity = false;
        this.player.setCollideWorldBounds(true);

        const initialItem = this.getRandomItem();
        this.target = this.physics.add.image(0, 0, initialItem.key).setOrigin(0, 0);

        const scale = initialItem.type === 'fruit' ?
            sizes.fruitWidth / this.textures.get(initialItem.key).getSourceImage().width :
            sizes.vegetableWidth / this.textures.get(initialItem.key).getSourceImage().width;

        this.target.setScale(scale);
        this.target.setMaxVelocity(0, speedDown);

        this.target.body.setSize(
            this.textures.get(initialItem.key).getSourceImage().width * scale,
            this.textures.get(initialItem.key).getSourceImage().height * scale
        );
        
        this.physics.add.overlap(this.target, this.player, this.targetHit, null, this);
        this.cursor = this.input.keyboard.createCursorKeys();
        this.textScore = this.add.text(this.scale.width - 100, 10, "✔️: 0", {
            font: "20px Arial",
            fill: textColor,
        });
        this.textTime = this.add.text(20, 10, "🕔: 00", {
            font: "20px Arial",
            fill: textColor,
        });

        this.player.setDepth(10);
        this.target.setDepth(5);

        this.timedEvent = this.time.delayedCall(timeLimitSec * 1000, this.gameOver, [], this);

        this.emitter = this.add.particles(0, -10, "money", {
            speed: 100,
            gravityY: speedDown - 200,
            scale: 0.2,
            duration: 200,
            emitting: false
        })
        this.emitter.startFollow(this.player, this.player.width / 2, this.player.height / 2 - 50, true);

        this.scale.on('resize', this.resize, this);

        // Устанавливаем начальную позицию для первого объекта
        this.setTargetInitialPosition();
    }

    resize(gameSize) {
        const width = gameSize.width;
        const height = gameSize.height;
        this.player.setY(height - this.player.height);
        this.textScore.setPosition(width - 100, 10);
        this.textTime.setPosition(20, 10);
    }

    update() {
        this.remainingTime = this.timedEvent.getRemainingSeconds();
        this.textTime.setText(`🕔:  ${Math.round(this.remainingTime).toString()}`);

        if (this.target.y >= this.scale.height) {
            this.target.setY(0);
            this.setTargetRandomX(); // Используем функцию для установки случайной X координаты
            this.changeFruitTexture();
        }

        const {
            left,
            right
        } = this.cursor;

        if (left.isDown) {
            this.player.setVelocityX(-this.playerSpeed);
        } else if (right.isDown) {
            this.player.setVelocityX(this.playerSpeed);
        } else {
            this.player.setVelocityX(0);
        }
    }

    // Новая функция для установки случайной X координаты с учетом ширины корзины
    setTargetRandomX() {
        const basketWidth = this.player.width;
        const min = basketWidth;
        const max = this.scale.width - basketWidth;
        this.target.setX(Phaser.Math.Between(min, max));
    }

    // Функция для установки начальной позиции цели
    setTargetInitialPosition() {
        this.target.setY(0);
        this.setTargetRandomX(); // Используем функцию для установки случайной X координаты
    }

    targetHit() {
        this.coinMusic.play();
        this.emitter.start();
        this.target.setY(0);
        this.setTargetRandomX(); // Используем функцию для установки случайной X координаты
        this.changeFruitTexture();
        this.points++;
        this.textScore.setText(`✔️: ${this.points}`);
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
            const randomVegetableKey = vegetableKeys[Math.floor(Math.random() * vegetableKeys.length)];
            return {
                key: `${randomVegetableKey}.png`,
                type: 'vegetable'
            };
        }
    }

    changeFruitTexture() {
        const newItem = this.getRandomItem();
        this.target.setTexture(newItem.key);

        const texture = this.textures.get(newItem.key);
        if (texture) {
            const scale = newItem.type === 'fruit' ?
                sizes.fruitWidth / texture.getSourceImage().width :
                sizes.vegetableWidth / texture.getSourceImage().width;

            this.target.setScale(scale);

            this.target.body.setSize(
                texture.getSourceImage().width * scale,
                texture.getSourceImage().height * scale
            );
        } else {
            console.error(`Текстура ${newItem.key} не найдена!`);
        }
    }

    gameOver() {
        this.sys.game.destroy(true);
        if (this.points >= 10) {
            gameEndScoreSpan.textContent = this.points;
            gameWinLoseSpan.textContent = "Win! 😊";
        } else {
            gameEndScoreSpan.textContent = this.points;
            gameWinLoseSpan.textContent = "Lose! 😭";
        }
        gameEndDiv.style.display = "flex";
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
            gravity: {
                y: speedDown
            },
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
})
