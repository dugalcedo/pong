const frameRate = 32
let paused = true
let workingFrame = false

const initialPaddleSize = 100
let paddleSize = initialPaddleSize

const ballSize = 16

let initialSpeed = 20
let paddleSpeed = initialSpeed
let ballSpeed = initialSpeed

let padding = 4

let roundHits = 0

let xMin = () => {return Math.round(ballSpeed/8)}

let cpuPlayer = false

let audio1 = new Audio ('./1.wav')
let audio2 = new Audio ('./2.wav')
let audio3 = new Audio ('./3.wav')

class Pong {
    constructor() {
        this.el = document.getElementById('pong')
    }

    height() {return this.el.offsetHeight}
    width() {return this.el.offsetWidth}
}

const pong = new Pong()

class Paddle {
    constructor(el, is2) {
        this.is2 = is2
        this.el = el
        this.reset()
    }

    reset() {
        this.el.style.height = px(initialPaddleSize)
        this.top = (pong.height()/2)-(initialPaddleSize/2)
        this.position()
    }

    position() {
        this.el.style.top = px(this.top)
    }

    move(isUp) {
        const newPos = this.top + paddleSpeed * (isUp ? -1 : 1)
        this.top = clamp(2, newPos, pong.height() - paddleSize - padding)
        this.position()
    }

    rect() {
        return {
            top: this.top,
            right: this.is2 ? pong.width() - 2 : 12,
            bottom: this.top + paddleSize,
            left: this.is2 ? pong.width() - 12 : 2
        }
    }
}

class Ball {
    constructor(el) {
        this.collisions = {}
        this.el = el
        this.reset(false)
    }

    reset(server) {
        this.top = (pong.height()/2)-(ballSize/2)
        this.left = (pong.width()/2)-(ballSize/2)
        paddleSize = initialPaddleSize
        paddleSpeed = initialSpeed
        ballSpeed = initialSpeed
        this.position()
        this.getDirection(server)
    }

    position() {
        this.el.style.top = px(this.top)
        this.el.style.left = px(this.left)
    }

    getDirection(server) {
        // const x = random(xMin, ballSpeed)
        // const y = ballSpeed - x
        // this.direction = [posneg(x), posneg(y)]

        if (server === 1) {
            this.direction = [ballSpeed/2, posneg(ballSpeed/2)]
        } else if (server === 2) {
            this.direction = [ballSpeed/2*-1, posneg(ballSpeed/2)]
        } else {
            this.direction = [posneg(ballSpeed/2), posneg(ballSpeed/2)]
        }
    }

    move() {


        let p1rect
        let p2rect
        let rect

        if (this.collisions.top || this.collisions.bottom) {
            this.direction[1] *= -1
            audio2.play()
        }
        
        let newX = this.left + this.direction[0]
        let leftBoundary = padding
        let rightBoundary = pong.width() - ballSize - padding
        p1rect = player1.rect()
        p2rect = player2.rect()
        rect = this.rect()

        if (this.collisions.p1) {
            this.bounceOffPlayer(p1rect, rect)
            return
        }
        if (this.collisions.p2) {
            this.bounceOffPlayer(p2rect, rect)
            return
        }

        this.collisions.p1align = false
        this.collisions.p2align = false
        if (rect.bottom >= p1rect.top && rect.top <= p1rect.bottom) {
            leftBoundary = p1rect.right
            this.collisions.p1align = true
        } 
        if (rect.bottom >= p2rect.top && rect.top <= p2rect.bottom) {
            rightBoundary = p2rect.left - ballSize + 1
            this.collisions.p2align = true
        }
        newX = clamp(leftBoundary, newX, rightBoundary)
        
        let newY = this.top + this.direction[1]
        let bottomBoundary = pong.height() - ballSize - padding
        newY = clamp(padding, newY, bottomBoundary)
        this.collisions.top = newY <= padding
        this.collisions.bottom = newY >= bottomBoundary

        this.left = newX
        this.top = newY

        if (this.collisions.p1align || this.collisions.p2align) this.checkForPlayerCollissions(p1rect, p2rect, this.rect())

        if (this.left <= padding) {
            //point for player 2
            point(true)
        }
        if (this.left + ballSize >= pong.width() - padding) {
            //point for player 1
            point(false)
        }

        this.position()
    }

    bounceOffPlayer(playerRect, rect) {
        let [x, y] = this.direction
        let xRight = x > 0
        let yDown = y > 0
        let ballCenter = (rect.top + rect.bottom) / 2
        let paddleCenter = (playerRect.top + playerRect.bottom) / 2
        let edge = (y > 0 ? ballCenter - paddleCenter : paddleCenter - ballCenter) / (paddleSize/2)
        let newX = x
        switch(true) {
            case edge > 0.75:
                newX = ballSpeed * 0.75
                break
            case edge > 0.5:
                newX = ballSpeed * 0.67
                break
            case edge > 0.25:
                newX = ballSpeed * 0.58
                break
            case edge > -0.25:
                newX = ballSpeed * 0.5
                break
            case edge > -0.5:
                newX = ballSpeed * 0.47
                break
            case edge > -0.75:
                newX = ballSpeed * 0.33
                break
            default:
                newX = ballSpeed * 0.25
                break
        }
        newX = Math.round(newX)
        this.direction[0] = newX * (xRight ? -1 : 1)
        this.direction[1] = (ballSpeed - Math.abs(newX)) * (yDown ? 1 : -1)
        roundHits ++
        rampUp()
        this.collisions.p1 = false
        this.collisions.p2 = false
        audio1.play()
    }

    checkForPlayerCollissions(p1rect, p2rect, rect) {
        if (this.collisions.p1align && rect.left === p1rect.right) {
            this.collisions.p1 = true
            this.collisions.p2 = false
        } else if (this.collisions.p2align && rect.right === p2rect.left + 1) {
            this.collisions.p2 = true
            this.collisions.p1 = false
        } else {
            this.collisions.p1 = false
            this.collisions.p2 = false
        }
    }

    rect() {
        return {
            top: this.top,
            right: this.left + ballSize,
            bottom: this.top + ballSize,
            left: this.left
        }
    }

    speedUp() {
        ballSpeed += 2
        let [x, y] = this.direction
        this.direction = [
            x + (x > 0 ? 1 : -1),
            y + (y > 0 ? 1 : -1)
        ]
    }

}

const player1 = new Paddle(document.getElementById('player1'), false)
const player2 = new Paddle(document.getElementById('player2'), true)
const ball = new Ball(document.getElementById('ball'))

const keys = {}
window.addEventListener('keydown', ({key}) => {keys[key] = true;})
window.addEventListener('keyup', ({key}) => {keys[key] = false})

setInterval(() => {
    controls()
    if (paused) return
    frame()
}, 1000/frameRate);

function frame() {
    ball.move()
}

function controls() {
    if (keys['w'] || keys['W']) {
        player1.move(true)
    }
    if (keys['s'] || keys['S']) {
        player1.move(false)
    }
    if (keys['ArrowUp'] && !cpuPlayer) {
        player2.move(true)
    }
    if (keys['ArrowDown'] && !cpuPlayer) {
        player2.move(false)
    }
}

window.addEventListener('keyup', ({key}) => {
    switch(key) {
        case ' ':
            paused = !paused
            break
        case 'c':
        case 'C':
            toggleCPU()
            break
        case 'r':
        case 'R':
            reset()
            break
    }
})

function reset() {
    paused = true
    player1.reset()
    player2.reset()
    ball.reset()
    resetPoints()
    roundHits = 0
}

function point(is2) {
    const el = is2 ?
        document.getElementById('p2Score') :
        document.getElementById('p1Score')
    el.innerText = parseInt(el.innerText) + 1
    ball.reset(is2 ? 1 : 2)
    roundHits = 0
    audio3.play()
}

function resetPoints() {
    const els = document.querySelectorAll('.score')
    els.forEach(el => el.innerText = '0')
}

function rampUp() {
    paddleSpeed += 2
    ball.speedUp()
    // paddleSize = paddleSize <= 50 ? 50 : paddleSize - 1
}

function toggleCPU() {
    cpuPlayer = !cpuPlayer
    document.getElementById('who').innerHTML = `${cpuPlayer?'CPU':'HUMAN'}<br>OPPONENT`
}

// tools

function px(n) {return n + 'px'}

function clamp(min, target, max) {return target > max ? max : target < min ? min : target}

function random(min, max) {return Math.floor(Math.random() * (max - min + 1)) + min}

function posneg(n) {return n * (Math.round(Math.random()) ? 1 : -1)}