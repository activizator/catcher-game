import "./style.css";
import Phaser from "phaser";

const sizes = {
  fruitWidth: 60
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
// "coconut.png",
// "watermelon.png"
// "green-apple.png",
// "red-apple.png",
// "star-fruit.png",

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
  }

  create() {
    this.scene.pause("scene-game");
    this.coinMusic = this.sound.add("coin");
    this.bgMusic=this.sound.add("bgMusic");
    this.bgMusic.play();
    // this.bgMusic.stop();

    this.add.image(0, 0, "bg").setOrigin(0, 0);
    
    this.player = this.physics.add.image(0, 0, "basket").setOrigin(0, 0);
    this.player.setY(this.scale.height - this.player.height);
    this.player.setImmovable(true);
    this.player.body.allowGravity = false;
    this.player.setCollideWorldBounds(true);

    const initialFruit = fruitImages[Math.floor(Math.random() * fruitImages.length)];
    this.target = this.physics.add.image(0, 0, initialFruit).setOrigin(0, 0);
    
    const originalWidth = this.textures.get(initialFruit).getSourceImage().width;
    const scale = sizes.fruitWidth / originalWidth;
    this.target.setScale(scale);
    this.target.setMaxVelocity(0, speedDown);

    this.physics.add.overlap(this.target,this.player,this.targetHit, null, this);
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

    this.emitter = this.add.particles(0,-10,"money", {
      speed: 100,
      gravityY: speedDown-200,
      scale: 0.2,
      duration: 200,
      emitting: false
    })
    this.emitter.startFollow(this.player, this.player.width / 2, this.player.height / 2  - 50, true);
    
    this.scale.on('resize', this.resize, this);
  }

  resize(gameSize) {
    const width = gameSize.width;
    const height = gameSize.height;
    this.player.setY(height - this.player.height);
    this.textScore.setPosition(width - 100, 10);
    this.textTime.setPosition(20, 10);
  }

  update() {
    this.remainingTime=this.timedEvent.getRemainingSeconds();
    this.textTime.setText(`🕔:  ${Math.round(this.remainingTime).toString()}`);

    if (this.target.y >= this.scale.height) {
      this.target.setY(0);
      this.target.setX(this.getRandomX());
      this.changeFruitTexture();
    }

    const { left, right } = this.cursor;

    if (left.isDown) {
      this.player.setVelocityX(-this.playerSpeed);
    } else if (right.isDown) {
      this.player.setVelocityX(this.playerSpeed);
    } else {
      this.player.setVelocityX(0);
    }
  }

  getRandomX() {
    const min = 80;
    const max = this.scale.width - 80;
    return Phaser.Math.Between(min, max);
  }

  targetHit() {
    this.coinMusic.play();
    // this.coinMusic.stop();
    this.emitter.start();
    this.target.setY(0);
    this.target.setX(this.getRandomX());
    this.changeFruitTexture();
    this.points++;
    this.textScore.setText(`✔️: ${this.points}`);
  }

  changeFruitTexture() {
    const randomFruit = fruitImages[Math.floor(Math.random() * fruitImages.length)];
    this.target.setTexture(randomFruit);
    const originalWidth = this.textures.get(randomFruit).getSourceImage().width;
    const scale = sizes.fruitWidth / originalWidth;
    this.target.setScale(scale);
  }

  gameOver(){
    this.sys.game.destroy(true);
    if(this.points >=10) {
      gameEndScoreSpan.textContent = this.points;
      gameWinLoseSpan.textContent= "Win! 😊";
    } else {
      gameEndScoreSpan.textContent = this.points;
      gameWinLoseSpan.textContent= "Lose! 😭";
    }
    gameEndDiv.style.display="flex";
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
})