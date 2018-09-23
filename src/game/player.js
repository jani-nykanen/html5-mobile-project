/**
 * Player object
 * 
 * @author Jani Nykänen
 */


// Constructor
var Player = function (z) {

    const LIMIT_X = 0.010;
    const LIMIT_Z = 0.065;
    const LIMIT_OFF_ROAD = 0.020;

    // Position
    this.pos = { x: 0.00001, y: 0, z: z };
    // Speed
    this.speed = { x: 0, y: 0, z: 0 };
    // Target speed
    this.target = { x: 0, y: 0, z: 0 };

    // Speed limits
    this.speedLimit = { x: LIMIT_X, z: LIMIT_Z, offroad: LIMIT_OFF_ROAD };

    // Can jump
    this.canJump = false;
    // Has double jumped
    this.doubleJump = false;
    // Is rolling
    this.rolling = false;
    // Roll timer
    this.rollTimer = 0.0;
    // Does touch road
    this.touchRoad = false;

    // Flip (for sprite)
    this.flip = Flip.None;
    // Animation row
    this.animRow = 0;

    // Sprite
    this.spr = new Sprite(24, 24);
}


// Update speed
Player.prototype.updateSpeed = function (speed, target, acc, tm) {

    if (speed < target) {

        speed += acc * tm;
        if (speed > target) {

            speed = target;
        }
    }
    else if (speed > target) {

        speed -= acc * tm;
        if (speed < target) {

            speed = target;
        }
    }

    return speed;
}


// Control
Player.prototype.control = function (vpad, tm) {

    const BRAKE_FACTOR = 0.001;
    const DELTA = 0.05;
    const X_BONUS = 3.0;
    const GRAVITY = 0.025;
    const JUMP_HEIGHT = 0.045;
    const DOUBLE_JUMP_HEIGHT = 0.035;
    const JUMP_END_DIVISOR = 2;
    const ROLL_TIME = 60.0;
    const ROLL_BONUS = 1.5;
    const ROLL_JUMP_HEIGHT = 0.0525;
    const ROLL_JUMP_BONUS = 1.15;

    // Default
    this.target.x = 0.0;
    this.target.z = 0.0;
    this.target.y = GRAVITY;

    // Horizontal
    this.animRow = 0;
    this.flip = Flip.None;
    if (Math.abs(vpad.stick.x) > DELTA) {

        this.target.x = vpad.stick.x * this.speedLimit.x;
        this.target.x *= 1.0 + X_BONUS * Math.abs(this.speed.z) / this.speedLimit.z;

        this.animRow = 1;
        this.flip = vpad.stick.x < 0.0 ? Flip.Horizontal : Flip.None;
    }

    // "Depth"
    if (!this.rolling && vpad.stick.y < -DELTA) {

        this.target.z = -vpad.stick.y *
            (this.touchRoad ? this.speedLimit.z : this.speedLimit.offroad);
    }

    // Brakes
    if (!this.rolling && vpad.stick.y > DELTA && this.speed.z > 0.0) {

        this.speed.z -= BRAKE_FACTOR * Math.abs(vpad.stick.y) * tm;
        if (this.speed.z < 0.0) {

            this.speed.z = 0.0;
        }
        this.target.z = 0.0;
    }

    // Jump
    let f1 = vpad.buttons.fire1;
    let f2 = vpad.buttons.fire2;
    if (f1 == State.Pressed) {

        if (this.canJump) {

            let height = JUMP_HEIGHT;
            if (this.rolling) {

                this.doubleJump = true;
                this.rolling = false;

                height = ROLL_JUMP_HEIGHT;

                this.speed.z *= ROLL_JUMP_BONUS;
                this.speed.x *= ROLL_JUMP_BONUS;
            }

            this.speed.y = -height;
        }
        else if (!this.doubleJump) {

            this.speed.y = -DOUBLE_JUMP_HEIGHT;
            this.doubleJump = true;
        }
    }
    else if (this.speed.y < 0.0 && !this.canJump && f1 == State.Released) {

        this.speed.y /= JUMP_END_DIVISOR;
    }

    // Roll
    if (!this.rolling && this.canJump && vpad.stick.y < -DELTA
        && f2 == State.Pressed) {

        this.rolling = true;
        this.rollTimer = ROLL_TIME;

        this.speed.x = Math.abs(this.speed.x) * vpad.stick.x * ROLL_BONUS;
        this.speed.z *= ROLL_BONUS;
    }
    else if (this.rolling && this.rollTimer > 0.0 && f2 == State.Released) {

        this.rollTimer = 0.0;
    }
}


// Restrict speed
Player.prototype.restrictSpeed = function () {

    if (this.speed.x > 0.0)
        this.speed.x = Math.min(this.speedLimit.x, this.speed.x);
    else
        this.speed.x = Math.max(-this.speedLimit.x, this.speed.x);

    this.speed.z = Math.min(this.speedLimit.z, this.speed.z);
}


// Move
Player.prototype.move = function (tm) {

    const ACCELERATION_X = 0.0020;
    const ACCELERATION_Z = 0.0010;
    const ACC_OFF_ROAD = 0.0020;
    const GRAVITY_ACC = 0.002;
    const SLOW_MODIF = 0.80;

    // Calculate Z acceleration
    let accl = 0;
    if (this.touchRoad)
        accl = ACCELERATION_Z - (ACCELERATION_Z * SLOW_MODIF) *
            Math.min(1.0, Math.pow(this.speed.z / this.speedLimit.z, 2));
    else
        accl = ACC_OFF_ROAD;


    // Update speeds
    this.speed.x = this.updateSpeed(
        this.speed.x, this.target.x, ACCELERATION_X, tm);
    this.speed.z = this.updateSpeed(
        this.speed.z, this.target.z, accl, tm);
    this.speed.y = this.updateSpeed(
        this.speed.y, this.target.y, GRAVITY_ACC, tm);

    // Update position
    this.pos.x += this.speed.x * tm;
    this.pos.y += this.speed.y * tm;

    // Floor collision
    this.canJump = false;
    if (this.pos.y >= 0.0 && this.speed.y >= 0.0) {

        if (this.doubleJump) {

            this.restrictSpeed();
        }

        this.pos.y = 0.0;
        this.speed.y = 0.0;
        this.canJump = true;
        this.doubleJump = false;
    }

    // Update rolling
    if (this.rolling) {

        this.rollTimer -= 1.0 * tm;
        if (this.rollTimer <= 0.0) {

            this.rolling = false;

            this.restrictSpeed();
        }
    }
}


// Animate
Player.prototype.animate = function (tm) {

    const DELTA = 0.0001;
    const JUMP_DELTA = 0.01;
    const ROLL_SPEED = 4;

    // Double jumping or rolling
    if (this.doubleJump || this.rolling) {

        this.spr.animate(this.animRow, 8, 11, ROLL_SPEED, tm);
    }
    // Jumping
    else if (!this.canJump) {

        let frame = 4;
        if (this.speed.y < 0.0) {

            if (this.speed.y > -JUMP_DELTA) {

                frame = 5;
            }
        }
        else if (this.speed.y >= 0.0) {

            frame = 5 + Math.floor(this.speed.y / JUMP_DELTA);
            if (frame > 7) frame = 7;
        }

        this.spr.animate(this.animRow, frame, frame, 0, tm);

    }
    else {

        // Running
        let totalSpeed = Math.max(Math.abs(this.speed.x), Math.abs(this.speed.z) );
        if (totalSpeed < DELTA) {

            this.spr.animate(this.animRow, 0, 0, 0, tm);
        }
        else {

            let speed = 12 - Math.floor(totalSpeed / 0.01);
            this.spr.animate(this.animRow, 0, 3, speed, tm);
        }

    }
}


// Update camera
Player.prototype.updateCamera = function (cam, tm) {

    const MIN_DIST = 0.0025;
    const SPEED_FACTOR = 8;

    if (Math.abs(this.pos.x - cam) < MIN_DIST)
        return cam;

    cam += (this.pos.x - cam) / SPEED_FACTOR * tm;

    return cam;
}



// Update
Player.prototype.update = function (vpad, camX, tm) {

    // Control
    this.control(vpad, tm);
    // Move
    this.move(tm);
    // Animate
    this.animate(tm);

    if(this.canJump)
        this.touchRoad = false;

    // Update camera
    return this.updateCamera(camX, tm);
}


// Draw
Player.prototype.draw = function (g, a) {

    const SHADOW_DIVISOR = 0.175;

    let p = g.project(this.pos.x, this.pos.y, this.pos.z);
    if (p == null) return;

    // Draw shadow
    let sy = g.project(this.pos.x, 0.0, this.pos.z).y;
    let frame = Math.floor(Math.abs(this.pos.y) / SHADOW_DIVISOR);
    g.drawBitmapRegion(a.bitmaps.shadow, 24 * frame, 0, 24, 24, p.x - 12, sy - 20);

    let yplus = this.rolling ? 2 : 0;

    // Draw sprite
    this.spr.draw(g, a.bitmaps.player, p.x - 12, p.y - 20 + yplus, this.flip);
}