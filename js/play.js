var playState = {
    create: function() {
        
        game.input.keyboard.addKeyCapture([Phaser.Keyboard.UP, Phaser.Keyboard.DOWN,
                                        Phaser.Keyboard.LEFT, Phaser.Keyboard.RIGHT]);
        
        this.cursor = game.input.keyboard.createCursorKeys();
        
        this.player = game.add.sprite(game.world.centerX, game.world.centerY, 'player');
        this.player.anchor.setTo(0.5, 0.5);
        game.physics.arcade.enable(this.player);
        this.player.body.gravity.y = 500;
        
        // Create the 'right' animation by looping the frames 1 and 2
        this.player.animations.add('right', [1, 2], 8, true);
        
        // Create the 'left' animation by looping the frames 3 and 4
        this.player.animations.add('left', [3, 4], 8, true);
        
        // Creat the emitter with 15 particles. We don't need to set the x and y
        // since we don't know where to do the explosion yet
        this.emitter = game.add.emitter(0, 0, 15);
        
        // Set the 'pixel' image for the particles
        this.emitter.makeParticles('pixel');
        
        // Set the y speed of the particles between -150 and 150
        // The speed will be randomly picked between -150 and 150 for each particle
        this.emitter.setYSpeed(-150, 150);
        
        // Do the same for the x speed
        this.emitter.setXSpeed(-150, 150);
        
        // Use no gravity for the particles
        this.emitter.gravity = 0;
        
        this.enemies = game.add.group();
        this.enemies.enableBody = true;
        this.enemies.createMultiple(10, 'enemy');
        
        this.coin = game.add.sprite(60, 140, 'coin');
        game.physics.arcade.enable(this.coin);
        this.coin.anchor.setTo(0.5, 0.5);
        
        this.scoreLabel = game.add.text(30, 30, 'score: 0',
                                        {font: '18px Arial', fill: '#ffffff'});
        
        // Score variable
        game.global.score = 0;
        
        this.createWorld();
        
        // Contains the time of the next enemy creation
        this.nextEnemy = 0;
        
        this.jumpSound = game.add.audio('jump');
        this.coinSound = game.add.audio('coin');
        this.deadSound = game.add.audio('dead');
    },
    
    update: function() {
        // This function is called 60 times per second
        // It contains the game's logic
        game.physics.arcade.collide(this.player, this.layer);
        
        this.movePlayer();
        
        if (!this.player.inWorld) {
            this.playerDie();
        }
        
        //If the 'nextEnemy' time has passed
        if (this.nextEnemy < game.time.now) {
            // Define our variables
            var start = 4000, end = 1000, score = 100;
            
            // Formula to decrease the delay between enemies over time
            // At first, it's 4000ms, then slowly goes to 1000ms
            var delay = Math.max(start - (start-end)*game.global.score/score, end);
            
            // We add a new enemy
            this.addEnemy();
            
            // And we update 'nextEnemy' to have a new enemy in 2.2 seconds
            this.nextEnemy = game.time.now + delay;
        }
        
        game.physics.arcade.overlap(this.player, this.coin, this.takeCoin, null, this);
        
        // Make the enemies and wall collide
        game.physics.arcade.collide(this.enemies, this.layer);
        
        // Call the 'playerDie' function when the player and enemy overlap
        game.physics.arcade.overlap(this.player, this.enemies, this.playerDie, null, this);
    },
    
    movePlayer: function() {
        // If the left arrow key is pressed
        if (this.cursor.left.isDown) {
            // Move the player to the left
            this.player.body.velocity.x = -200;
            this.player.animations.play('left'); // Start the left animation
        }
        
        // If the right arrow key is pressed
        else if (this.cursor.right.isDown) {
            // Move the player to the right
            this.player.body.velocity.x = 200;
            this.player.animations.play('right'); // Start the right animation
        }
        
        // If neither the right or left arrow key is pressed
        else {
            // Stop the player
            this.player.body.velocity.x = 0;
            this.player.animations.stop(); // Stop the animation
            this.player.frame = 0; // Set the player frame to 0 (stand still)
        }
        
        // If the up arrow key is pressed and the player is touching ground
        if (this.cursor.up.isDown && this.player.body.onFloor()) {
            // Move the player upward (jump)
            this.player.body.velocity.y = -320;
            this.jumpSound.play();
        }
    },
    
    createWorld: function() {
        
        // Create the tilemap
        this.map = game.add.tilemap('tiles');
        
        // Add the tilset to the map
        this.map.addTilesetImage('tileset');
        
        // Create the layer, by specifying the name of the Tiles Layer
        this.layer = this.map.createLayer('Tile Layer 1');
        
        // Set the world size to match the size of the layer
        this.layer.resizeWorld();
        
        // Enable collisions for the first element of our tileset, the blue wall
        this.map.setCollision(1);
    },
    
    takeCoin: function(player, coin) {
        game.global.score += 5;
        this.scoreLabel.text = 'score: ' + game.global.score;
        
        this.updateCoinPosition();
        
        this.coinSound.play();
        
        // Scale the coin to 0 to make it invisible
        this.coin.scale.setTo(0,0);
        
        // Grow the coin back to its original scale in 300 ms
        game.add.tween(this.coin.scale).to({x: 1, y: 1}, 300).start();
        
        // Scale the player when coin is collected
        game.add.tween(this.player.scale).to({x: 1.3, y:1.3}, 50).to({x: 1, y: 1}, 150).start();
    },
    
    playerDie: function() {
        // If the player is already dead, do nothing
        if (!this.player.alive) {
            return;
        }
        
        // Kill the player to make it disappear from the screen
        this.player.kill();
        
        // When the player dies, we go to the menu
        this.deadSound.play();
        
        // Set the position of the emitter on the player
        this.emitter.x = this.player.x;
        this.emitter.y = this.player.y;
        
        // Start the emitter, by exploding 15 particles that will live for 600 ms
        this.emitter.start(true, 600, null, 15);
        
        // Call the 'startMenu' function in 1000ms
        game.time.events.add(1000, this.startMenu, this);
    },
    
    updateCoinPosition: function() {
        // Store all the possible coin positions in an array
        var coinPosition = [
            {x: 140, y: 60}, {x: 360, y: 60}, // top row
            {x: 60, y: 140}, {x: 440, y: 140}, // middle row
            {x: 130, y: 300}, {x: 370, y: 300} // bottom row
        ];
        
        // Remove the current coin position from the array
        // Otherwise the coin could appear at the same spot twice in a row
        
        for (var i = 0; i < coinPosition.length; i++) {
            if (coinPosition[i].x === this.coin.x) {
                coinPosition.splice(i, 1);
            }
        }
        
        // Randomly select a position from the array
        var newPosition = coinPosition[
            game.rnd.integerInRange(0, coinPosition.length-1)];
        
        // Set the new position of the coin
        this.coin.reset(newPosition.x, newPosition.y);
    },
    
    addEnemy: function() {
        // Get the first dead enemy of the group
        var enemy = this.enemies.getFirstDead();
        
        // If there isn't any dead enemy, do nothing
        if (!enemy) {
            return;
        }
        
        // Initialize the enemy
        // Set the anchor point centered at the bottom
        enemy.anchor.setTo(0.5, 1);
        
        // Put the enemy above the top hole
        enemy.reset(game.world.centerX, 0);
        
        // Add gravity to see it fall
        enemy.body.gravity.y = 500;
        
        // Make the enemy move either right or left, randomly
        enemy.body.velocity.x = 100 * Phaser.Math.randomSign();
        
        // Bounce the enemy in the opposite direction when it hits a wall
        enemy.body.bounce.x = 1;
        
        // Kill the enemy when it leave the game world
        enemy.checkWorldBounds = true;
        enemy.outOfBoundsKill = true;
    },
    
    startMenu: function() {
        game.state.start('menu');
    }
};
        