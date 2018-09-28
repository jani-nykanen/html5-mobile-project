/**
 * Item object
 * 
 * @author Jani Nykänen
 */


// Constructor
var Item = function () {

    const DEFAULT_SIZE = 0.4;
    const DEATH_MAX = 20.0;

    this.id = 0;
    this.exist = false;
    this.pos = { x: 0, y: 0, z: 0 };

    // Dimensions
    this.w = DEFAULT_SIZE;
    this.h = DEFAULT_SIZE;

    // Sprite
    this.spr = new Sprite(24, 24);

    // Wave
    this.wave = 0.0;

    // Is dying
    this.dying = false;
    this.deathTimer = 0.0;
    this.maxDeathTime = DEATH_MAX;
}


// Create
Item.prototype.createSelf = function (x, y, z, id) {

    this.pos.x = x;
    this.pos.y = y;
    this.pos.z = z;
    this.id = id;

    this.spr.row = this.id;

    this.exist = true;
    this.dying = false;
}


// Player collision
Item.prototype.playerCollision = function (pl) {

    const PL_WIDTH = 0.0;
    const DEPTH = 0.2;

    if(!this.exist) return;

    if(pl.pos.x + PL_WIDTH > this.pos.x-this.w/2 
    && pl.pos.x - PL_WIDTH < this.pos.x+this.w/2
    && pl.pos.y > this.pos.y-this.h/2
    && pl.pos.z > this.pos.z-DEPTH - pl.speed.z
    && pl.pos.z < this.pos.z+DEPTH + pl.speed.z) {

        this.exist = false;
        this.dying = true;
        this.deathTimer = this.maxDeathTime;

        // Effect
        switch(this.id) {

        // Gem
        case 0:
            pl.boost();
            break;

        default: 
            break;
        }
    }
}


// Update
Item.prototype.update = function (pl, near, tm) {

    const ANIM_SPEED = 6;
    const WAVE_SPEED = 0.1;

    if (!this.exist) {

        // Update death timer
        if(this.dying) {

            this.deathTimer -= 1.0 * tm;
            if(this.deathTimer <= 0.0)
                this.dying = false;

            // Move
            this.pos.z -= pl.speed.z * tm;

            // Set animation row to one bigger
            this.spr.animate(this.id*2 +1, 0, 4,
                this.maxDeathTime / 5, tm);
        }
        
        return;
    }

    // Move
    this.pos.z -= pl.speed.z * tm;
    if (this.pos.z < near) {

        this.exist = false;
    }

    // Animate
    this.spr.animate(this.id*2, 0, 4, ANIM_SPEED, tm);

    // Update wave
    this.wave += WAVE_SPEED * tm;

    // Player collision
    this.playerCollision(pl);
}


// Draw
Item.prototype.draw = function (g, a) {

    const SHADOW_WIDTH = 0.5;
    const SHADOW_HEIGHT = 0.30;
    const AMPLITUDE = 0.025;
    const DEATH_SCALE = 1.25;

    let scale = 1.0;

    if (!this.exist) {

        if(this.dying) {

            // Set dying alpha
            let t = this.deathTimer / this.maxDeathTime;
            scale += (1.0 - t) * DEATH_SCALE;
        }
        else
            return;
    }

    // Draw shadow
    g.drawFlat3D(a.bitmaps.shadow, 0, 0, 24, 24, this.pos.x, 0.0, this.pos.z,
        SHADOW_WIDTH, SHADOW_HEIGHT, 4, Flip.None);

    // Draw sprite
    this.spr.draw3D(g, a.bitmaps.items, this.pos.x,
        this.pos.y + Math.sin(this.wave) * AMPLITUDE,
        this.pos.z - this.h * (scale-1),
        this.w*scale, this.h*scale,
        12,
        Flip.None);

    if(this.dying) {

        g.setGlobalAlpha(1.0);
    }
}
