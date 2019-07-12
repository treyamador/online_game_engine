/**
 * a very fun platforming engine for a very fun platforming game
 */

const MSEC_PER_SEC = 1000;
const FRAME_PER_SEC = 15;
const FRAME_RATE = MSEC_PER_SEC / FRAME_PER_SEC;

const KEY = Object.freeze({
  UP: 38,
  DOWN: 40,
  LEFT: 37,
  RIGHT: 39,
  SPACE: 32
});

const CANVAS_WIDTH = 720;
const CANVAS_HEIGHT = 540;

const GRAVITY_ACCEL = 0.00098;

const MOVE_HORIZ_ACCEL = 0.0025;
const MOVE_HORIZ_FRICTION = 0.75;
const STOP_HORIZ_ACCEL = 0.0;

const JUMP_HORIZ_ACCEL = 0.0015;
const JUMP_VEL = -0.8;

const STATES = Object.freeze({
  RIGHT_STILL_FORWARD: 'right still horizontal',
  LEFT_STILL_FORWARD: 'left still horizontal',
  RIGHT_WALK_FORWARD: 'right walk horizontal',
  LEFT_WALK_FORWARD: 'left walk horizontal',
  RIGHT_STILL_UP: 'right still up',
  LEFT_STILL_UP: 'left still up',
  RIGHT_WALK_UP: 'right walk up',
  LEFT_WALK_UP: 'left walk up',
  RIGHT_STILL_DOWN: 'right still down',
  LEFT_STILL_DOWN: 'left still down',
});

class PhysicsEngine {
  position(x, v, a, t) {
    return 0.5 * a * t * t + v * t + x;
  }

  velocity(v, a, t) {
    return a * t + v;
  }
};

const Physics = new PhysicsEngine();

class Input {
  constructor() {
    this.pressed = {};
    this.init();
  }

  init() {
    window.addEventListener('keyup', (event) => {
      this.onKeyUp(event);
    });
    window.addEventListener('keydown', (event) => {
      this.onKeyDown(event);
    });
  }

  isDown(keyCode) {
      return this.pressed[keyCode];
  }

  onKeyDown(event) {
      this.pressed[event.keyCode] = true;
  }

  onKeyUp(event) {
      delete this.pressed[event.keyCode];
  }
};

class Media {
  constructor() {
    // TODO: init as map based on efficiency requirements?
    this.imgs = {};
  }

  load(filepath) {
    if (!this.imgs[filepath]) {
      this.imgs[filepath] = new Image();
      this.imgs[filepath].src = filepath;
    }
    return this.imgs[filepath];
  }
};

class Sprite {
  constructor(media, filepath, x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.img = media.load(filepath);
  }

  draw(context, posX, posY) {
    // TODO: implement scaling of image
    context.drawImage(
      this.img,
      this.x, this.y,
      this.w, this.h,
      posX, posY,
      this.w, this.h
    );
  }
}

class AnimatedSprite {
  constructor(media, filepath, poses, w, h) {
    this.sprites = poses.map((pose) => (
      new Sprite(media, filepath, pose.x * w, pose.y * h, w, h)
    ));
    this.pose = 0;
  }

  draw(context, x, y) {
    this.pose = ++this.pose % this.sprites.length;
    this.sprites[this.pose].draw(context, x, y);
  }
}

class Player {
  constructor(media, x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.ax = 0;
    this.ay = 0;

    this.sprites = {};
    this.addState(media, STATES.RIGHT_STILL_FORWARD, [{ x: 0, y: 1 }]);
    this.addState(media, STATES.LEFT_STILL_FORWARD, [{ x: 0, y: 0 }]);
    this.addState(media,
      STATES.RIGHT_WALK_FORWARD,
      [
        { x: 0, y: 1 },
        { x: 1, y: 1 },
        { x: 0, y: 1 },
        { x: 2, y: 1 },
      ]
    );
    this.addState(media,
      STATES.LEFT_WALK_FORWARD,
      [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 0 },
        { x: 2, y: 0 },
      ]
    );
    this.addState(media,
      STATES.RIGHT_WALK_UP,
      [
        { x: 3, y: 1 },
        { x: 4, y: 1 },
        { x: 3, y: 1 },
        { x: 5, y: 1 },
      ]
    );
    this.addState(media,
      STATES.LEFT_WALK_UP,
      [
        { x: 3, y: 0 },
        { x: 4, y: 0 },
        { x: 3, y: 0 },
        { x: 5, y: 0 },
      ]
    );
    this.addState(media, STATES.RIGHT_STILL_UP, [{ x: 3, y: 1 }]);
    this.addState(media, STATES.LEFT_STILL_UP, [{ x: 3, y: 0 }]);
    this.addState(media, STATES.RIGHT_STILL_DOWN, [{ x: 6, y: 1 }]);
    this.addState(media, STATES.RIGHT_STILL_DOWN, [{ x: 6, y: 0 }]);

    this.state = STATES.RIGHT_STILL_FORWARD;
    this.grounded = false;

    this.input = new Input();
  }

  addState(media, state, pose) {
    this.sprites[state] = new AnimatedSprite(media, 'img/player.bmp', pose, 32, 32);
  }

  moveLeft() {
    if (this.grounded) {
      this.ax = -MOVE_HORIZ_ACCEL;
      this.state = STATES.LEFT_WALK_FORWARD;
    } else {
      this.ax = -JUMP_HORIZ_ACCEL;
      this.state = STATES.LEFT_WALK_FORWARD;
    }
  }

  moveRight() {
    if (this.grounded) {
      this.ax = MOVE_HORIZ_ACCEL;
      this.state = STATES.RIGHT_WALK_FORWARD;
    } else {
      this.ax = JUMP_HORIZ_ACCEL;
      this.state = STATES.RIGHT_WALK_FORWARD;
    }
  }

  stopMoving() {
    this.ax = STOP_HORIZ_ACCEL;
    if (this.state === STATES.RIGHT_WALK_FORWARD) {
      this.state = STATES.RIGHT_STILL_FORWARD;
    } else if (this.state === STATES.LEFT_WALK_FORWARD) {
      this.state = STATES.LEFT_STILL_FORWARD;
    } else if (this.state === STATES.RIGHT_WALK_UP) {
      this.state = STATES.RIGHT_STILL_UP;
    } else if (this.state === STATES.LEFT_WALK_UP) {
      this.state = STATES.LEFT_STILL_UP;
    }
  }

  lookUp() {
    if (this.state === STATES.RIGHT_STILL_FORWARD) {
      this.state = STATES.RIGHT_STILL_UP;
    } else if (this.state === STATES.LEFT_STILL_FORWARD) {
      this.state = STATES.LEFT_STILL_UP;
    } else if (this.state === STATES.LEFT_WALK_FORWARD) {
      this.state = STATES.LEFT_WALK_UP;
    } else if (this.state === STATES.RIGHT_WALK_FORWARD) {
      this.state = STATES.RIGHT_WALK_UP;
    }
  }

  lookForward() {
    if (this.state === STATES.RIGHT_STILL_UP) {
      this.state = STATES.RIGHT_STILL_FORWARD;
    } else if (this.state === STATES.LEFT_STILL_UP) {
      this.state = STATES.LEFT_STILL_FORWARD;
    } else if (this.state === STATES.RIGHT_WALK_UP) {
      this.state = STATES.RIGHT_WALK_FORWARD;
    } else if (this.state === STATES.LEFT_WALK_UP) {
      this.state = STATES.LEFT_WALK_FORWARD;
    }
  }

  jump() {
    if (this.grounded) {
      this.vy = JUMP_VEL;
      this.grounded = false;
    }
  }

  update(updateTime) {
    if (this.input.isDown(KEY.LEFT) && this.input.isDown(KEY.RIGHT)) {
      this.stopMoving();
    } else if (this.input.isDown(KEY.LEFT)) {
      this.moveLeft();
    } else if (this.input.isDown(KEY.RIGHT)) {
      this.moveRight();
    } else {
      this.stopMoving();
    }
    if (this.input.isDown(KEY.UP)) {
      this.lookUp();
    } else {
      this.lookForward();
    }
    if (this.input.isDown(KEY.SPACE)) {
      this.jump();
    }

    this.vx = Physics.velocity(this.vx, this.ax, updateTime);
    this.x = Physics.position(this.x, this.vx, this.ax, updateTime);
    this.vx *= MOVE_HORIZ_FRICTION;

    this.vy = Physics.velocity(this.vy, GRAVITY_ACCEL, updateTime);
    this.y = Physics.position(this.y, this.vy, this.ay, updateTime);

    // TODO: add collision detection instead of this hack
    if (this.y > 500) {
      this.y = 500;
      this.vy = 0.0;
      this.grounded = true;
    }
  }

  draw(context) {
    this.sprites[this.state].draw(context, this.x, this.y);
  }
}

class Game {
  constructor() {
    this.initCanvas();
    this.initPlayer();
  }

  initCanvas() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;
    this.canvas.style.backgroundColor = '#fafafa';
    this.context = this.canvas.getContext('2d');
    let port = document.getElementById('game-port');
    port.textContent = '';
    port.appendChild(this.canvas);
  }

  initPlayer() {
    this.media = new Media();
    this.player = new Player(this.media, 0, 0);    
  }

  clear() {
    this.context.clearRect(0, 0,
      this.canvas.width, this.canvas.height);
  }

  run() {
    let self = this;
    setInterval(() => {
      self.clear();
      self.update(FRAME_RATE);
      self.draw(self.context);
    }, FRAME_RATE);

  }

  update(updateTime) {
    this.player.update(updateTime);
  }

  draw(context) {
    this.player.draw(context);
  }
}

window.addEventListener('load',function() {
  let game = new Game();
  game.run();
});
