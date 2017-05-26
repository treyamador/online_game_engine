/*  */


var MSEC_PER_SEC = 1000;
var FRAMES_PER_SEC = 30;
var TIME_INTERVAL = MSEC_PER_SEC / FRAMES_PER_SEC;
var CANVAS_WIDTH = 800;
var CANVAS_HEIGHT = 600;


// there should be vectors of accel and vel
// where the magnitude is capped at max value
// not each individual var
var ACCEL_FORWARD = -0.002;
var ACCEL_LEFT = -0.002;
var ACCEL_RIGHT = 0.002
var ACCEL_BACK = 0.002;
var ACCEL_STOP = 0.0;

var MAX_VEL_FORWARD = -0.2;
var MAX_VEL_LEFT = -0.2;
var MAX_VEL_RIGHT = 0.2;
var MAX_VEL_REVERSE = 0.2;

var MAX_VEL_MAG = 0.2;

var FRICTION = 0.7;


var KEY = Object({
    UP:38,
    DOWN:40,
    RIGHT:39,
    LEFT:37,
    SPACE:32
});


var PLAYER_STATE = Object.freeze({
    FLY:0
});



// corresponds to action strings
// enemeis do action here
// ex.  fly in certain direction
//      fly towards player
//      fire missle somewhere
//      fire missle at player
//      rotate in player's direction
var ENEMY_ACTIONS = Object({

});



function Input() {
    this.held_keys = {};
    this.pressed_keys = {};
    this.released_keys = {};
    this.timer = new Date();
    this.init();
}


Input.prototype.begin_new_frame = function() {
    this.pressed_keys = {};
    this.released_keys = {};
}


Input.prototype.key_down_event = function(event) {
    this.pressed_keys[event.keyCode] = this.timer.getTime();
    this.held_keys[event.keyCode] = this.timer.getTime();
}


Input.prototype.key_up_event = function(event) {
    this.pressed_keys[event.keyCode] = this.timer.getTime();
    delete this.held_keys[event.keyCode];
}


Input.prototype.was_key_pressed = function(key) {
    return this.pressed_keys[key];
}


Input.prototype.was_key_released = function(key) {
    return this.released_keys[key];
}


Input.prototype.is_key_held = function(key) {
    return this.held_keys[key];
}


Input.prototype.init = function() {

    var self = this;
    window.addEventListener('keyup',function(event) { 
        self.key_up_event(event); 
    },false);

    window.addEventListener('keydown',function(event) {
        self.key_down_event(event);
    },false);

}



var MediaManager = {
    files:{},
    load:function(filepath) {
        if (!this.files[filepath]) {
            var img = new Image();
            img.src = filepath;
            this.files[filepath] = img;
        }
        return this.files[filepath];
    }
}



function Pos2D(x,y) {
    this.x = x;
    this.y = y;
}



function Vec2D(x,y) {
    this.x = x;
    this.y = y;
}



Vec2D.prototype.magnitude = function() {
    return Math.sqrt(
        this.x * this.x +
        this.y * this.y);
}


Vec2D.prototype.normalize = function(factor) {
    var magnitude = this.magnitude();
    factor /= magnitude;
    this.x *= factor;
    this.y *= factor;
}


// TODO test this the radians and degrees functions
Vec2D.prototype.radians = function() {
    return Math.atan2(this.y/this.x);
}


Vec2D.prototype.degrees = function() {
    return Math.atan(this.y/this.x);
}


// TODO add more physics!
var Physics = {

    velocity_delta: function(a,v,t) {
        return a*t + v;
    },

    // pass accel and vel vector to get vel
    velocity_delta_2d: function(a,v,t) {
        v.x += (a.x * t);
        v.y += (a.y * t);
        return v;
    },

    kinematics: function(a,v,x,t) {
        return (a/2)*t*t + v*t + x;
    },

    kinematics_2d: function(a,v,p,t) {
        var delta = new Pos2D(
            a.x/2*t*t + v.x*t + p.x,
            a.y/2*t*t + v.y*t + p.y);
        return delta;

        //p.x = a.x/2*t*t + v.x*t + p.x;
        //p.y = a.y/2*t*t + v.y*t + p.y;
        //return p;
    },

    kinematics_delta_2d: function(a,v,t) {
        var delta = new Pos2D(
            a.x/2*t*t + v.x*t,
            a.y/2*t*t + v.y*t);
        return delta;
    },

    friction: function(f,x) {
        return f*x;
    },

    friction_2d: function(f,p) {
        p.x *= f;
        p.y *= f;
        return p;
    }

};


function Rectangle(x,y,w,h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
}



// TODO add offset to sprite itself
function Sprite(x,y,w,h) {
    this.body = new Rectangle(x,y,w,h);
    this.height_scale = 1;
    this.width_scale = 1;
}


Sprite.prototype.init = function(filepath,manager) {
    this.img = manager.load(filepath);
}


Sprite.prototype.shrink_width = function(factor) {
    this.size_width = 1 / factor;
}


Sprite.prototype.shrink_height = function(factor) {
    this.size_height = 1 / factor;
}


Sprite.prototype.shrink = function(factor) {
    this.size_width = this.size_height = 1 / factor;
}


Sprite.prototype.enlarge_width = function(factor) {
    this.size_width = factor;
}


Sprite.prototype.enlarge_height = function(factor) {
    this.size_height = factor;
}


Sprite.prototype.enlarge = function(factor) {
    this.size_width = this.size_height = factor;
}


// update should probably go with player?
// there will be some sprite update stuff
Sprite.prototype.update = function(elapsed_time) {

}


// pass different functions for src and dest dimensions
Sprite.prototype.draw = function(context,x,y) {

    context.drawImage(this.img,
        this.body.x,this.body.y,
        this.body.w,this.body.h,x,y,
        this.width_scale*this.body.w,
        this.height_scale*this.body.h);

}



function Background(x,y) {

    //this.rect = new Rectangle(x,y,w,h);
    //this.scroll = new Vec2D(0,0);

    // TODO add vel,acc vector to background
    //      this allow dynamic map movement

    this.sprites = [];
    this.sprite_no = 0;
    this.vel = new Vec2D(0,0);
    this.pos = new Pos2D(x,y);

    this.spatiality = new Rectangle(0,0,0,0);

    this.loopable = false;

}


Background.prototype.set_spatiality = function(x,y,w,h) {
    this.spatiality = new Rectangle(x,y,w,h);
}


Background.prototype.set_size = function(w,h) {
    //this.rect.w = w;
    //this.rect.h = h;
}


// TODO pass in x,y starting pos, canvas width and canvas height
//      or just the entirety of the image and only
//      cut the image when you draw it
Background.prototype.add_sprite = function(x,y,w,h,filepath) {
    var sprite = new Sprite(x,y,w,h);
    sprite.init(filepath,MediaManager);
    this.sprites.push(sprite);
}


// is this necessary?
Background.prototype.init_img = function(filepath,manager) {
    //this.img = new Image();
    //this.img.src = manager.load(filepath);
}


Background.prototype.set_scroll_speed = function(x,y) {
    //this.scroll.x = x;
    //this.scroll.y = y;

    this.vel.x = x;
    this.vel.y = y;

}


Background.prototype.set_if_loopable = function(loopable) {
    this.loopable = loopable;
}


// TODO set acceleration that slows down at designated points
//      such as, slowing scroll when reach end of screen
Background.prototype.update = function(elapsed_time) {

    if (this.loopable) {

    }
    if (this.pos.y < 0) {
        this.pos.x += this.vel.x * elapsed_time;
        this.pos.y += this.vel.y * elapsed_time;
    }

}


Background.prototype.draw = function(context,canvas) {
    //context.drawImage(this.img,
    //    this.rect.x,this.rect.y,
    //    this.rect.w,this.rect.h,
    //    0,0,canvas.width,canvas.height);

    this.sprites[this.sprite_no].draw(context,this.pos.x,this.pos.y);
    // should differentiate the draw here, as it should
    // not be wider than the canvas element

    //context.drawImage(this.sprites[this.sprite_no],
    //    this.rect.x,this.rect.y,
    //    this.rect.w,this.rect.h,
    //    0,0,canvas.width,canvas.height);

}



//function Enemy(x,y,w,h) {
    // TODO give certain enemies action_string
    //      a string representing a sequence of actions
    //      to preform... gives illusion of AI
//    this.action_string = 'abcdefg';
//}


function PlayerState(invincible,in_motion) {
    this.invincible = invincible;
    this.in_motion = in_motion;
}



/*

// TODO modify this to be a player superclass
// TODO sprite should be drawn relative to body
//      not body relative to sprite
function Body(x,y) {

    this.sprites = {};
    this.state = 0;

    this.pos = new Pos2D(x,y);
    this.vel = new Vec2D(0,0);
    this.accel = new Vec2D(0,0);
    
}


Body.prototype = {

    set_pos: function(x,y) {
        this.pos.x = x;
        this.pos.y = y;
    },

    set_state: function(state) {
        this.state = state;
    },

    add_sprite: function(filepath,state,x,y,w,h) {
        this.sprites[state] = new Sprite(x,y,w,h);
        this.sprites[state].init(filepath,MediaManager);
    },

    move_pos: function(delta) {
        this.pos.x += delta.x;
        this.pos.y += delta.y;
    },

};


function RectBody(x,y,w,h) {
    
    //this.body = new Rectangle(x,y,w,h);

}


RectBody.prototype = {

    init_collision_offset: function(left,right,top,bottom) {
        // TODO check if offset make sense spatially
        this.collision = new Rectangle(
            this.x + left,
            this.w - (left+right),
            this.y + top,
            this.h - (top+bottom));
    },

    //init_body: function(x,y,w,h) {
    //    
    //},

    //add_sprite_offset: function(left,right,top,bottom) {

    //},

    draw_body: function(context,color) {
        context.strokeStyle = color;
        context.strokeRect(
            this.collision.x,
            this.collision.y,
            this.collision.w,
            this.collision.h);
    },

};

*/



var Body = {

    sprites:{},
    state:0,
    //pos: null,
    vel: new Vec2D(0,0),
    accel: new Vec2D(0,0),

    init_pos: function(x,y) {
        this.pos = new Pos2D(x,y);
    },

    set_pos: function(pos) {
        this.pos.x = pos.x;
        this.pos.y = pos.y;
    },

    set_state: function(state) {
        this.state = state;
    },

    add_sprite: function(filepath,state,x,y,w,h) {
        this.sprites[state] = new Sprite(x,y,w,h);
        this.sprites[state].init(filepath,MediaManager);
    },

};


var RectBody = {

    //collision: null,

    init_collision: function(x,y,w,h) {
        this.collision = new Rectangle(x,y,w,h);
    },

    init_collision_offset: function(left,right,top,bottom) {
        // TODO implement this function
    },

    //move: function(offset) {
    //    this.pos.x += offset.x;
    //    this.pos.y += offset.y;
    //    this.collision.x += offset.x;
    //    this.collision.y += offset.y;
    //},

    move_body: function(x,y) {
        this.pos.x += x;
        this.pos.y += y;
        this.collision.x += x;
        this.collision.y += y;
    },

    //set_pos: function(offset) {
    //
    //},

    draw_collision: function(context,color) {
        context.strokeStyle = color;
        context.strokeRect(
            this.collision.x,
            this.collision.y,
            this.collision.w,
            this.collision.h);
    },

};




// pass args through ctor
Player.prototype.inherit_from = function(BaseBody) {
    for (var i in Body)
        BaseBody[i] = Body[i];
    for (var i in BaseBody)
        this[i] = BaseBody[i];
}




function Player(BaseBody,x,y) {
    this.inherit_from(BaseBody);
    //this.init_pos(x,y);
    this.invincible = false;
    this.in_motion = false;
}


Player.prototype.move_up = function() {
    this.accel.y = ACCEL_FORWARD;
}


Player.prototype.move_down = function() {
    this.accel.y = ACCEL_BACK;
}


Player.prototype.move_right = function() {
    this.accel.x = ACCEL_RIGHT;
}


Player.prototype.move_left = function() {
    this.accel.x = ACCEL_LEFT;
}


Player.prototype.stop_moving_horizontally = function() {
    this.accel.x = ACCEL_STOP;
}


Player.prototype.stop_moving_vertically = function() {
    this.accel.y = ACCEL_STOP;
}


Player.prototype.update = function(elapsed_time) {

    this.vel = Physics.velocity_delta_2d(this.accel,this.vel,elapsed_time);
    this.vel = Physics.friction_2d(FRICTION,this.vel);

    if (this.vel.magnitude() > MAX_VEL_MAG)
        this.vel.normalize(MAX_VEL_MAG);

    var offset = Physics.kinematics_2d(this.accel,this.vel,this.pos,elapsed_time);
    //this.set_pos(offset);
    //offset.x = offset.x - this.pos.x;
    //offset.y = offset.y - this.pos.y;
    //this.move(offset.x-this.pos.x,offset.y-this.pos.y);
    //this.move(offset);

    //console.log(this.collision);
    
    //console.log(offset.x-this.pos.x);

    this.move_body(offset.x-this.pos.x,offset.y-this.pos.y);
    
}


Player.prototype.draw = function(context) {
    this.sprites[this.state].draw(context,this.pos.x,this.pos.y);
}




/*

function Player(x,y) {

    this.invincible = false;
    this.in_motion = false;

    this.pos = new Pos2D(x,y);
    this.vel = new Vec2D(0,0);
    this.accel = new Vec2D(0,0);

}


Player.prototype.init_position = function(x,y) {
    this.pos = new Pos2D(x,y);
}


Player.prototype.init_collision = function(x,y,w,h) {
    this.skeleton = new Rectangle(x,y,w,h);
}


Player.prototype.init_sprite = function(filepath,x,y,w,h) {
    this.sprite = new Sprite(x,y,w,h);
    this.sprite.init(filepath,MediaManager);
}


Player.prototype.move_up = function() {
    this.accel.y = ACCEL_FORWARD;
}


Player.prototype.move_down = function() {
    this.accel.y = ACCEL_BACK;
}


Player.prototype.move_right = function() {
    this.accel.x = ACCEL_RIGHT;
}


Player.prototype.move_left = function() {
    this.accel.x = ACCEL_LEFT;
}


Player.prototype.stop_moving_horizontally = function() {
    this.accel.x = ACCEL_STOP;
}


Player.prototype.stop_moving_vertically = function() {
    this.accel.y = ACCEL_STOP;
}


Player.prototype.update = function(elapsed_time) {

    this.vel = Physics.velocity_delta_2d(this.accel,this.vel,elapsed_time);
    this.vel = Physics.friction_2d(FRICTION,this.vel);

    if (this.vel.magnitude() > MAX_VEL_MAG)
        this.vel.normalize(MAX_VEL_MAG);

    this.pos = Physics.kinematics_2d(this.accel,this.vel,this.pos,elapsed_time);
    
}


Player.prototype.draw = function(context) {
    this.sprite.draw(context,this.pos.x,this.pos.y);
}

*/


var Core = {

    init: function() {
        
        this.canvas = document.createElement('canvas');
        this.canvas.width = CANVAS_WIDTH;
        this.canvas.height = CANVAS_HEIGHT;
        this.context = this.canvas.getContext('2d');
        
        var game_port = document.getElementById('game-port');
        game_port.textContent = '';
        game_port.appendChild(this.canvas);

        this.input = new Input();

        //this.player = new Player(0,0);
        //this.player.init_sprite('img/ship3 (3).png',0,0,104,81);
        //this.player.init_collision(0,0,104,81);


        this.player = new Player(RectBody,0,0);
        this.player.set_state(PLAYER_STATE.FLY);
        this.player.add_sprite('img/ship3 (3).png',
            PLAYER_STATE.FLY,0,0,104,81);
        this.player.init_pos(0,0);
        this.player.init_collision(20,10,64,61);


        //this.background = new Background(-1200,this.canvas.height-5120);
        //this.background.set_spatiality(0,0,2880,5120);
        //this.background.add_sprite(0,0,
        //    this.background.spatiality.w,
        //    this.background.spatiality.h,
        //    'img/carina-nebulae-ref.png');
        
        //this.background.set_scroll_speed(0,0.01);
        //this.background.set_if_loopable(false);
        

        // TODO add a filereader that inputs xml files for level loading
        //      including enemy placement and landmarks


        var self = this;
        setInterval(function(){
            self.update(TIME_INTERVAL);
            self.handle_input();
            self.draw();
        });

    },

    update: function(elapsed_time) {
        this.player.update(elapsed_time);
        //this.background.update(elapsed_time);
        this.input.begin_new_frame();
    },

    handle_input: function() {

        if (this.input.is_key_held(KEY.RIGHT) && this.input.is_key_held(KEY.LEFT)) {
            this.player.stop_moving_horizontally();
        }
        else if (this.input.is_key_held(KEY.RIGHT)) {
            this.player.move_right();
        }
        else if (this.input.is_key_held(KEY.LEFT)){
            this.player.move_left();
        }
        else if (!this.input.is_key_held(KEY.RIGHT) && !this.input.is_key_held(KEY.LEFT)){
            this.player.stop_moving_horizontally();
        }

        if (this.input.is_key_held(KEY.UP) && this.input.is_key_held(KEY.DOWN)) {
            this.player.stop_moving_vertically();
        }
        else if (this.input.is_key_held(KEY.UP)) {
            this.player.move_up();
        }
        else if (this.input.is_key_held(KEY.DOWN)) {
            this.player.move_down();
        }
        else if (!this.input.is_key_held(KEY.UP) && !this.input.is_key_held(KEY.DOWN)) {
            this.player.stop_moving_vertically();
        }

        if (this.input.was_key_pressed(KEY.SPACE)) {
            console.log('fire!');
        }

    },

    draw: function() {
        this.clear();
        //this.background.draw(this.context,this.canvas);
        this.player.draw(this.context);
        this.player.draw_collision(this.context,'#ff0000');
    },

    clear: function() {
        this.context.clearRect(0,0,
        this.canvas.width,this.canvas.height);
    }

};


function run() {
    Core.init();
}

