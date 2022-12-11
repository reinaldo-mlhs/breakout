console.log("game file loaded");

import { Ball, Paddle, Brick, Collider, PowerUp } from "./objects.js";
import { playAudio, setCanvasFontSize } from "./util.js";


export class Breakout {
    constructor(canvas, isMobileDevice = false) {
        this.won = false;
        this.lost = false;
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.numberOfLevels = 2;
        this.isMobileDevice = false;
        this.inPlay = false;

        this.canvas = canvas;

        this.ball = null;
        this.paddle = new Paddle(canvas);
        this.bricks = null;

        // canvas.addEventListener("touchstart", this.setInPlay.bind(this));
        // canvas.addEventListener("touchmove", this.paddle.onMoveTouch.bind(this.paddle, canvas));
    }

    setInPlay(evt) {
        evt.preventDefault();
        this.inPlay = true;
    }

    buildBricks() {
        this.bricks = null;

        const brickWidth = this.isMobileDevice ? window.innerWidth / 22 : 40;
        const brickHeight = brickWidth / 2;
        const paddingH = 50;
        const paddingV = 50;
        const rowGap = brickHeight;
        
        if (this.level === 1) {
            const nBricksPerRow = Math.floor((this.canvas.width - (paddingH * 2)) / brickWidth);
            const brickCenterGapIndex = nBricksPerRow / 2;
            const rows = ["rgb(253, 21, 27)", "rgb(255, 179, 15)", "rgb(132, 147, 36)", "rgb(67, 127, 151)", "rgb(1, 41, 95)"];

            this.bricks = Array.from({ length: rows.length }, (_, iOut) => {
                return Array.from({ length: nBricksPerRow - 2 }, (_, i) => {
                    const tempIndex = i + 1 >= brickCenterGapIndex ? i + 2 : i;
                    return new Brick(paddingH + (tempIndex * brickWidth), paddingV + (rowGap * iOut), brickWidth, brickHeight, rows[iOut])
                });
            });
        }
        else if (this.level === 2) {
            const nBricksPerRow = Math.floor((this.canvas.width - (paddingH * 2)) / brickWidth);
            const rows = ["rgb(253, 21, 27)", "rgb(255, 179, 15)", "rgb(132, 147, 36)", "rgb(67, 127, 151)", "rgb(1, 41, 95)"];

            this.bricks = Array.from({ length: rows.length }, (_, iOut) => {
                return Array.from({ length: nBricksPerRow }, (_, i) => new Brick(paddingH + (i * brickWidth), paddingV + (rowGap * iOut), brickWidth, brickHeight, rows[iOut]));
            });
        }

        
    }

    start(level = 1) {
        this.won = false;
        this.lost = false;
        this.score = 0;
        this.lives = 3;

        this.level = 1;
        if (level <= this.numberOfLevels) {
            this.level = level;
        }
        
        this.ball = null;
        Collider.allInstances = [this.paddle];

        this.ball = new Ball(this.canvas.width / 2, this.canvas.height / 2);

        this.buildBricks();
    }

    checkLost() {
        this.lives = Math.max(0, Math.min(this.lives - 1, 10));

        if (this.lost === false) {
            if (this.lives === 0) {
                this.lost = true;
                this.inPlay = false;
                this.ball = null;
                playAudio("./assets/audio/gameover_fail.wav");
                setTimeout(() => {
                    this.start();
                }, 5000);
            }
            else {
                this.inPlay = false;
                this.ball = null;
                this.ball = new Ball(this.canvas.width / 2, this.canvas.height / 2);
            }
        }
    }

    checkWin() {
        const won = this.bricks.every(brickRow => {
            return brickRow.every(brk => brk.state === 0);
        });

        if (won) {
            this.won = true;
            this.ball.dX = 0;
            this.ball.dY = 0;
            playAudio("./assets/audio/gameover_win.wav");
            setTimeout(() => {
                this.start(this.level + 1);
            }, 5000);
        }

    }

    drawUI() {
        const ctx = this.canvas.getContext('2d');
        //score ui
        setCanvasFontSize(ctx, "20px");
        ctx.fillStyle = "white";
        ctx.fillText(this.lives, 50, 30);
        //lives ui
        setCanvasFontSize(ctx, "20px");
        ctx.fillStyle = "white";
        ctx.fillText(this.score, this.canvas.width - 50, 30);
        //level ui
        setCanvasFontSize(ctx, "20px");
        ctx.fillStyle = "white";
        ctx.textAlign = 'center';
        ctx.fillText("Level: " + this.level, this.canvas.width / 2, 30);
        //win ui
        if (this.won) {
            setCanvasFontSize(ctx, "50px");
            ctx.fillStyle = "white";
            ctx.textAlign = 'center';
            ctx.fillText("YOU WON", this.canvas.width / 2, this.canvas.height / 2);
        }
        else if (this.lost) {
            setCanvasFontSize(ctx, "50px");
            ctx.fillStyle = "white";
            ctx.textAlign = 'center';
            ctx.fillText("YOU LOST", this.canvas.width / 2, this.canvas.height / 2);
        }
    }

    tick() {

        if (this.ball?.outOfBounds) {
            this.checkLost();
        }

        if (this.ball?.scored > 0) {
            this.score = this.score + this.ball.scored;
            this.ball.scored = 0;
            this.checkWin();
        }

        this.ball?.render(this.canvas, this.inPlay);
        this.paddle.render(this.canvas);

        this.bricks.forEach(brickRow => {
            brickRow.forEach(brk => brk.render(this.canvas));
        });

        PowerUp.allInstances?.forEach((pwr, index) => {
            if (pwr.inPlay === false) {
                pwr = null;
                PowerUp.allInstances.splice(index, 1);
            }
            else {
                const score = pwr.render(this.canvas, this.paddle);
                this.score = this.score + score;
            }
        });

        this.drawUI();
    }
}