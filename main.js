
// GameBoard code below

function distance(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function Circle(game) {
    this.player = 1;
    this.radius = 5;
    this.visualRadius = 200;
    this.closeRange = 50;
    this.colors = ["Red", "Green", "Blue", "White"];
    this.color = 1;
    this.alignmentWeight = 1;
    this.cohesionWeight = 1;
    this.separationWeight = 1.5;
    this.hungryModifier = 3;
    this.food = false;
    Entity.call(this, game, this.radius + Math.random() * (700 - this.radius * 2), this.radius + Math.random() * (700 - this.radius * 2));
    this.velocity = { x: (Math.random() * 2 - 1) * 1000, y: (Math.random() * 2 - 1) * 1000 };
    var speed = Math.sqrt(Math.abs(this.velocity.x) * Math.abs(this.velocity.x) + Math.abs(this.velocity.y) * Math.abs(this.velocity.y));
    if (speed > maxSpeed) {
        var ratio = maxSpeed / speed;
        this.velocity.x *= ratio;
        this.velocity.y *= ratio;
    }
};

Circle.prototype = new Entity();
Circle.prototype.constructor = Circle;

Circle.prototype.setFood = function () {
    this.food = true;
    this.velocity.x = 0;
    this.velocity.y = 0;
    this.color = 2;
};

Circle.prototype.collide = function (other) {
    return distance(this, other) < this.radius + other.radius;
};

Circle.prototype.update = function () {
    // Entity.prototype.update.call(this);

    if (!this.food) {
        // Budgie behavior
        this.x += this.velocity.x * this.game.clockTick;
        this.y += this.velocity.y * this.game.clockTick;

        // Go after food
        var food = this.game.entities[0];
        var dist = distance(this, food);
        if (food.x < this.x) {
            this.velocity.x -= food.x / dist * this.hungryModifier;
        } else {
            this.velocity.x += food.x / dist * this.hungryModifier;
        }
        if (food.y < this.y) {
            this.velocity.y -= food.y / dist * this.hungryModifier;
        } else {
            this.velocity.y += food.y / dist * this.hungryModifier;
        }

        // Flocking behavior
        var alignment = { x: 0, y: 0 };
        var cohesion = { x: 0, y: 0 };
        var separation = { x: 0, y: 0 };
        var neighbors = 0;
        var nextDoor = 0;
        var i = 0;

        for (; i < this.game.entities.length; i++) {
            var ent = this.game.entities[i];
            var dist = distance(this, ent);
            alignment.x += ent.velocity.x;
            alignment.y += ent.velocity.y;
            if (ent !== this && distance(this, ent) < this.visualRange) {
                if (ent.x < this.x) {
                    cohesion.x -= ent.x / dist;
                } else {
                    cohesion.x += ent.x / dist;
                }
                if (ent.y < this.y) {
                    cohesion.y -= ent.y / dist;
                } else {
                    cohesion.y += ent.y / dist;
                }
                neighbors++;
            }
            if (ent !== this && distance(this, ent) < this.closeRange) { 
                if (ent.x < this.x) {
                    separation.x -= (ent.x - this.x) / dist;
                } else {
                    separation.x += (ent.x - this.x) / dist;
                }
                if (ent.y < this.y) {
                    separation.y -= (ent.y - this.y) / dist;
                } else {
                    separation.y += (ent.y - this.y) / dist;
                }
                nextDoor++;
            }
        }

        alignment.x /= --i;
        alignment.y /= i;
        var aSpeed = Math.sqrt(Math.abs(alignment.x) * Math.abs(alignment.x) + Math.abs(alignment.y) * Math.abs(alignment.y));
        alignment.x /= aSpeed;
        alignment.y /= aSpeed;

        if (neighbors > 0) {
            cohesion.x = (cohesion.x / neighbors) - this.x;
            cohesion.y = (cohesion.y / neighbors) - this.y;
            var cSpeed = Math.sqrt(Math.abs(cohesion.x) * Math.abs(cohesion.x) + Math.abs(cohesion.y) * Math.abs(cohesion.y));
            cohesion.x /= cSpeed;
            cohesion.y /= cSpeed;
        }

        if (nextDoor > 0) {
            separation.x = (separation.x / nextDoor) - this.x;
            separation.y = (separation.y / nextDoor) - this.y;
            var sSpeed = Math.sqrt(Math.abs(separation.x) * Math.abs(separation.x) + Math.abs(separation.y) * Math.abs(separation.y));
            separation.x = -(separation.x / sSpeed);
            separation.y = -(separation.y / sSpeed);
        }

        this.velocity.x += this.alignmentWeight * alignment.x + this.cohesionWeight * cohesion.x + this.separationWeight * separation.x;
        this.velocity.y += this.alignmentWeight * alignment.y + this.cohesionWeight * cohesion.y + this.separationWeight * separation.y;
        var speed = Math.sqrt(Math.abs(this.velocity.x) * Math.abs(this.velocity.x) + Math.abs(this.velocity.y) * Math.abs(this.velocity.y));
        if (speed > maxSpeed) {
            var ratio = maxSpeed / speed;
            this.velocity.x *= ratio;
            this.velocity.y *= ratio;
        }

        // Wraparound
        if (this.x > 700 + 2 * this.radius) this.x = 0;
        if (this.x < 0 - 2 * this.radius) this.x = 700;
        if (this.y > 700 + 2 * this.radius) this.y = 0;
        if (this.y < 0 - 2 * this.radius) this.y = 700;

        // this.velocity.x -= (1 - friction) * this.game.clockTick * this.velocity.x;
        // this.velocity.y -= (1 - friction) * this.game.clockTick * this.velocity.y;
    } else {
        // Food behavior
        for (var i = 0; i < this.game.entities.length; i++) {
        var ent = this.game.entities[i];
            if (ent !== this && this.collide(ent)) {
                this.x = this.radius + Math.random() * (700 - this.radius * 2);
                this.y = this.radius + Math.random() * (700 - this.radius * 2);
            }
        }
    }
};

Circle.prototype.draw = function (ctx) {
    ctx.beginPath();
    ctx.fillStyle = this.colors[this.color];
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.closePath();

};


// the "main" code begins here
var friction = 1;
var acceleration = 1000000;
var maxSpeed = 150;

var ASSET_MANAGER = new AssetManager();

ASSET_MANAGER.queueDownload("./img/shrubland.jpg");

ASSET_MANAGER.downloadAll(function () {
    console.log("starting up da sheild");
    var canvas = document.getElementById('gameWorld');
    var ctx = canvas.getContext('2d');


    var gameEngine = new GameEngine();
    var circle = new Circle(gameEngine);
    circle.setFood();
    gameEngine.addEntity(circle);
    for (var i = 0; i < 80; i++) {
        circle = new Circle(gameEngine);
        gameEngine.addEntity(circle);
    }
    gameEngine.init(ctx);
    gameEngine.start();
});
