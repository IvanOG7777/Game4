import {
    moveRandom,
    enemyMovement,
    moveProjectile,
    enemyMelee,
    seperateEnemies,
    specificSpawnEnemies
} from "./GameFunctions.js";

class Overworld extends Phaser.Scene {
    constructor() {
        super("platformerScene");

        this.my = {sprite: {}, vfx: {}};
        this.SCALE = 1.75;

        this.playerHealth = 100;
        this.playerHitDamage = 5;
        this.currentWeapon;
        this.nextPlayerHitTime = 0;
        this.playerHitSpeed = 1000;
        this.heartArray = [];


        this.evilWizardHealth = 100;
        this.evilWizardMeleeDistance = 30; // if player is 10 pixels away melee the player
        this.evilWizardFollowDistance = 275; // if player is within 200 pixels follow
        this.evilWizardShootDistance = 300; // if player is within 250 pixels shoot at them
        this.evilWizardShootDelay = 2000;
        this.evilWizardPotionArray = [];
        this.evilWizardMeleeDelay = 1200;

        this.orcHealth = 50
        this.orcFollowDistance = 300;
        this.orcMeleeDelay = 1500

        this.meleeDamage = 1;

        this.enemyWanderTime = 1000;

        this.dagerDamage = 10;
        this.dagerSpeed = 500; // 1.5 second hit speed

        this.swordDamage = 20;
        this.swordSpeed = 1300; // 2.5 second hit speed

        this.axeDamage = 30;
        this.axeSpeed = 2000; // 4 second hit speed

        this.evilWizardArray = [];
        this.spiderArray = [];
        this.orcArray = [];

        this.keysCollected = 0;
        this.coinsCollected = 0;

        this.gameOver = false;
        this.gameWon = false;
        this.playerAlive = true;

        this.waterDamage = 1;
        this.waterDamageDelay = 1000;
        this.nextWaterDamageTime = 0;
    }

    init() {
        // variables and settings
        this.ACCELERATION = 250;
        this.DRAG = 800;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 1500;
        this.JUMP_VELOCITY = -700;
        this.PARTICLE_VELOCITY = 50;
    }

    create() {
        // Create a new tilemap game object which uses 18x18 pixel tiles, and is
        // 45 tiles wide and 25 tiles tall.

        let my = this.my;

        // Make sounds object
        my.sounds = {};
        my.sounds.footSteps = this.sound.add("footSteps", {loop: true});
        my.sounds.potionThrow = this.sound.add("potionThrow");
        my.sounds.potionImpact = this.sound.add("potionImpact")
        my.sounds.jump = this.sound.add("jumpSound");
        my.sounds.coinCollect = this.sound.add("coinCollect");
        my.sounds.hurtSound = this.sound.add("hurtSound");
        my.sounds.deathSound = this.sound.add("deathSound");
        my.sounds.keyCollect = this.sound.add("keyCollect");
        my.sounds.axeSound = this.sound.add("axeSound");
        my.sounds.swordSound = this.sound.add("swordSound");
        my.sounds.daggerSound = this.sound.add("daggerSound");
        my.sounds.chestDeath = this.sound.add("chestDeath");
        my.sounds.enemyDeath = this.sound.add("enemyDeath");
        my.sounds.orcHitSound = this.sound.add("orcHitSound");
        my.sounds.wizardHitSound = this.sound.add("wizardHitSound");
        my.sounds.winSound = this.sound.add("winSound");
        my.sounds.loseSound = this.sound.add("loseSound");
        my.sounds.healthPickUp = this.sound.add("healthPickUp");
        my.sounds.music;
        
        // chat
        this.musicKeys = [
            "music1",
            "music2",
            "music3",
            "music4",
            "music5"
        ];
        let randomMusic = Phaser.Utils.Array.GetRandom(this.musicKeys);
        // end of chat


        my.sounds.music = this.sound.add(randomMusic, { loop: true, volume: 0.4 });
        
        my.sounds.music.play();

        // init game keys
        this.hitKey = this.input.keyboard.addKey('space');
        this.equipKey = this.input.keyboard.addKey('E');
        this.openKey = this.input.keyboard.addKey('F');
        this.rKey = this.input.keyboard.addKey('R');

        this.map = this.add.tilemap("platformer-level-1");

        // Add a tileset to the map
        // First parameter: name we gave the tileset in Tiled
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.tileset = this.map.addTilesetImage("kenny_tilemap_packed", "tilemap_tiles");
        this.backgroundTileset = this.map.addTilesetImage("kenny_tilemap_background", "tilemap_background");
        this.foreGroundTileset = this.map.addTilesetImage("kenny_tilemap_farm", "tilemap_farm");

        // Create a layer
        this.backGround = this.map.createLayer("Background",
            [this.backgroundTileset, this.tileset, this.foreGroundTileset],
            0, 0);

        this.groundLayer = this.map.createLayer(
            "Ground-n-Platforms",
            [this.tileset, this.foreGroundTileset], 0, 0
        )

        this.foreGround = this.map.createLayer(
            "Foreground",
            [this.tileset, this.foreGroundTileset], 0, 0
        )


        // scale the layers
        this.backGround.setScale(2.0);
        this.groundLayer.setScale(2.0);
        this.foreGround.setScale(2.0);


        this.foreGround.setDepth(1);

        // Make it collidable
        this.groundLayer.setCollisionByProperty({
            collides: true
        });

        this.foreGround.setCollisionByProperty({
            collides: true
        })

        this.waterTiles = this.backGround.filterTiles(tile => {return tile.properties.water == true;});
        let bubbleGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        bubbleGraphics.fillStyle(0xffffff, 1);
        bubbleGraphics.fillCircle(4, 4, 4);
        bubbleGraphics.generateTexture("bubble", 8, 8);

        for (let i = 0; i < this.waterTiles.length; i++) {
            let tile = this.waterTiles[i];

            this.add.particles(tile.getCenterX(), tile.getCenterY(), "bubble", {
                lifespan: 1200,
                speedY: { min: -20, max: -60 },
                speedX: { min: -10, max: 10 },
                scale: { start: 0.7, end: 0 },
                alpha: { start: 0.8, end: 0 },
                frequency: 800,
                quantity: 1
            });
        }



        // animation for coins
        this.anims.create({
            key: 'coinSpin',
            frames: [
                {key: 'tilemap_sheet', frame: 151},
                {key: 'tilemap_sheet', frame: 152}
            ],
            frameRate: 6,
            repeat: -1
        });

        // animation for chests
        this.anims.create({
            key: 'chestAttack',
            frames: [
                {key: 'tilemap_dungeonSheet', frame: 89},
                {key: 'tilemap_dungeonSheet', frame: 90},
                {key: 'tilemap_dungeonSheet', frame: 91},
                {key: 'tilemap_dungeonSheet', frame: 92},
            ],
            frameRate: 8,
            repeat: -1
        })

        ///////////////////////////////////////////////////
        // Gets objects from object layer in tiled
        this.coins = this.map.createFromObjects("Objects", {
            name: "coin",
            key: "tilemap_sheet",
            frame: 151
        });

        this.coinsToCollect = this.coins.length;

        this.keys = this.map.createFromObjects("Objects", {
            name: "key",
            key: "tilemap_sheet",
            frame: 27
        });

        this.keysToCollect = this.keys.length;

        this.enemyChests = this.map.createFromObjects("Objects", {
            name: "enemyChest",
            key: "tilemap_dungeonSheet",
            frame: 89
        });

        this.dagger = this.map.createFromObjects("Objects", {
            name: "dagger",
            key: "tilemap_dungeonSheet",
            frame: 103
        });

        this.sword = this.map.createFromObjects("Objects", {
            name: "sword",
            key: "tilemap_dungeonSheet",
            frame: 104
        });

        this.axe = this.map.createFromObjects("Objects", {
            name: "axe",
            key: "tilemap_dungeonSheet",
            frame: 118
        });
        /////////////////////////////////////////////////

        // setting coin scale 
        for (let coin of this.coins) {
            coin.setScale(2.0);
            coin.x *= 2.0;
            coin.y *= 2.0;
        }

        for (let key of this.keys) {
            key.setScale(2.0);
            key.x *= 2.0;
            key.y *= 2.0;
        }

        //set scale and other values
        for (let enemyChest of this.enemyChests) {
            enemyChest.setScale(2.0);
            enemyChest.x *= 2.0;
            enemyChest.y *= 2.0;
            enemyChest.opened = false;

            enemyChest.health = 50;
            enemyChest.isDead = false;
            enemyChest.chomp = this.sound.add("chompSound", {loop: true});
            enemyChest.nextChompTime = 0;
        }

        for (let i = 0; i < this.enemyChests.length; i++) {
            let heart = this.physics.add.sprite(this.enemyChests[i].x, this.enemyChests[i].y, "heart");

            heart.spawnX = this.enemyChests[i].x;
            heart.spawnY = this.enemyChests[i].y;
            heart.respectiveChest = this.enemyChests[i];

            heart.setVisible(false);
            heart.setScale(2.25);
            heart.setCollideWorldBounds(true);
            heart.giveHealth = 20;

            this.heartArray.push(heart);
        }

        for (let dagger of this.dagger) {
            dagger.setScale(2.0);
            dagger.x *= 2.0;
            dagger.y *= 2.0;
        }

        for (let sword of this.sword) {
            sword.setScale(2.0);
            sword.x *= 2.0;
            sword.y *= 2.0;
        }

        for (let axe of this.axe) {
            axe.setScale(2.0);
            axe.x *= 2.0;
            axe.y *= 2.0;
        }

        for (let coin of this.coins) {
            coin.anims.play('coinSpin');
        }


        // flaten and copy arrays into big weapons array
        //CHAT
        this.weapons = [
            ...this.dagger,
            ...this.sword,
            ...this.axe
        ];
        //END OF CHAT

        this.physics.world.enable(this.weapons, Phaser.Physics.Arcade.STATIC_BODY);
        this.nearWeapon = null;
        this.heldWeapon = null;

        // turn into arcade physics
        this.physics.world.enable(this.coins, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.keys, Phaser.Physics.Arcade.STATIC_BODY);


        // set up player avatar
        my.sprite.player = this.physics.add.sprite(this.game.config.width / 4, this.game.config.height / 2, "vikingPlayer").setScale(2.25)
        // my.sprite.player = this.physics.add.sprite(3700, 500, "platformer_characters", "tile_0000.png").setScale(this.SCALE)
        my.sprite.player.setCollideWorldBounds(true);

        // add collision handler
        this.physics.add.overlap(my.sprite.player, this.coins, (player, coin) => {
            my.sounds.coinCollect.play();
            this.coinsCollected++;

            this.coinsCollectedText.setText("Coins collected: " + this.coinsCollected);
            coin.destroy();
        });

        this.physics.add.overlap(my.sprite.player, this.keys, (player, key) => {
            this.keysCollected++;
            my.sounds.keyCollect.play();

            this.keysCollectedText.setText("Keys collected: " + this.keysCollected);
            key.destroy();
        });

        // Get the worlds width and height
        const worldWidth = this.map.widthInPixels * 2.0;
        const worldHeight = this.map.heightInPixels * 2.0;

        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
        this.cameras.main.startFollow(my.sprite.player, true, 0.5, 0.5); // (target, [,roundPixels][,lerpX][,lerpY])
        this.cameras.main.setDeadzone(50, 50);
        // this.cameras.main.setZoom(2);

        // create map bounds
        this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

        // map to where to spawn wizards, locked means they can move from that area
        let greenSpawns = [
            {x1: 3840, y1: 51, x2: 4200, y2: 51, locked: true}, // top of green tree
            {x1: 3200, y1: 411, x2: 3500, y2: 411, locked: true}, // little tree and rope
            {x1: 3940, y1: 519, x2: 3940, y2: 519},
            {x1: 3903, y1: 735, x2: 3903, y2: 735}
        ];

        let desertSpawns = [
            {x1: 2077, y1: 558, x2: 2317, y2: 558, locked: true},
            {x1: 2470, y1: 663, x2: 2470, y2: 663},
            {x1: 2207, y1: 555, x2: 2207, y2: 555},
            {x1: 2100, y1: 231, x2: 2100, y2: 231}
        ];

        let snowSpawns = [
            {x1: 1101, y1: 234, x2: 1275, y2: 234, locked: true},
            {x1: 486, y1: 234, x2: 1023, y2: 234}
        ];

        //chat
        this.evilWizardArray.push(
            ...specificSpawnEnemies(this, "evilWizard", greenSpawns, 1),
            ...specificSpawnEnemies(this, "evilWizard", desertSpawns, 1),
            ...specificSpawnEnemies(this, "evilWizard", snowSpawns, 1),
        );
        //end of chat

        // Create orcs
        for (let i = 0; i < 10; i++) {
            let randX = Phaser.Math.Between(200, worldWidth);
            let randY = Phaser.Math.Between(820, worldHeight);

            let orc = this.physics.add.sprite(randX, randY, "orc");

            orc.setScale(2.25);
            orc.setCollideWorldBounds(true);

            orc.health = this.orcHealth;
            orc.isDead = false;
            orc.wander = false;
            orc.chase = false;
            orc.shoot = false;

            orc.stopDistance = 30;
            orc.wanderTimer = this.enemyWanderTime;
            orc.nextWanderChange = 0;
            orc.nextShootTime = 0;
            orc.meleeDelay = this.orcMeleeDelay
            orc.meleeDamage = this.meleeDamage;
            orc.sound = my.sounds.orcHitSound;

            orc.speed = 150
            orc.meleeDistance = 40;
            orc.followDistance = this.orcFollowDistance;
            orc.nextMeleeTime = 0;

            this.physics.add.collider(orc, this.groundLayer);

            this.orcArray.push(orc);
        }

        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer);

        // set up Phaser-provided cursor key input
        this.cursors = this.input.keyboard.createCursorKeys();

        my.vfx.walking = this.add.particles(0, 0, "kenny-particles", {
            frame: ['smoke_03.png', 'smoke_09.png'],
            random: true,
            scale: {start: 0.03, end: 0.1},
            maxAliveParticles: 8,
            lifespan: 350,
            gravityY: -400,
            alpha: {start: 1, end: 0.1},
        });

        my.vfx.walking.stop();

        // texts for health coins and keys
        this.health = this.add.text(100, 50, "Health: " + this.playerHealth,
            {
                fontSize: "30px",
                fill: "#fd0000"
            }).setOrigin(0.5).setScrollFactor(0);

        this.keysCollectedText = this.add.text(155, 100, "Keys collected: " + this.keysCollected,
            {
                fontSize: "30px",
                fill: "#25a70b"
            }).setOrigin(0.5).setScrollFactor(0);

        this.coinsCollectedText = this.add.text(162, 150, "Coins collected: " + this.coinsCollected,
            {
                fontSize: "30px",
                fill: "#1e06f8"
            }).setOrigin(0.5).setScrollFactor(0);
    }

    // functiom to reset to init
    resetGameStateVariables() {
            this.playerHealth = 100;
            this.playerHitDamage = 5;
            this.currentWeapon = null;
            this.nextPlayerHitTime = 0;
            this.playerHitSpeed = 1000;
            this.playerAlive = true;

            this.heartArray = [];
            this.evilWizardPotionArray = [];
            this.evilWizardArray = [];
            this.spiderArray = [];
            this.orcArray = [];
            this.enemyChests = [];
            this.enemies = [];

            this.keysCollected = 0;
            this.coinsCollected = 0;

            this.heldWeapon = null;
            this.nearWeapon = null;

            this.endText = null;
            this.resetText = null;

            if (this.my?.sounds?.music) {
                this.my.sounds.music.stop();
            }

            if (this.my?.sounds?.footSteps) this.my.sounds.footSteps.stop();
        }

        // function to show texts when game is won or lost
        showEndScreen(message, color) {
            if (!this.endText) {
                this.endText = this.add.text(this.game.config.width / 2, this.game.config.height / 2 - 200, message, {
                    fontSize: "50px",
                    fill: color,
                }).setOrigin(0.5).setScrollFactor(0);
            }

            if (!this.resetText) {
                this.resetText = this.add.text(this.game.config.width / 2, this.game.config.height / 2 - 100, "Press R to Restart", {
                    fontSize: "50px",
                    fill: color,
                }).setOrigin(0.5).setScrollFactor(0);
            }
            
        }
        
        // function that call the above two when it runs
        reset() {
            if (Phaser.Input.Keyboard.JustDown(this.rKey)) {
                if (this.my?.sounds?.music) {
                    this.my.sounds.music.stop();
                }
                this.resetGameStateVariables();
                this.scene.start("initScene");
            }
        }

    update(time, deltaTime) {

        // only play when player is alive
        if (this.playerAlive == true) {

        let cursors = this.cursors;
        let my = this.my;

        let playerTile = this.backGround.getTileAtWorldXY(
            my.sprite.player.x,
            my.sprite.player.y,
            true
        );

        if (playerTile && playerTile.properties.water == true && time >= this.nextWaterDamageTime) {
            this.playerHealth -= this.waterDamage;
            this.health.setText("Health: " + Math.ceil(this.playerHealth));
            my.sounds.hurtSound.play();

            this.nextWaterDamageTime = time + this.waterDamageDelay;
        }

        let grounded = my.sprite.player.body.blocked.down;

        this.nearWeapon = null;
        // loop through weapons
        for (let weapon of this.weapons) {
            // continue if we are already holding weapon
            if (weapon === this.heldWeapon) continue;
            if (!weapon.body.enable) continue;

            // get distance between weapon and player
            let dist = Phaser.Math.Distance.Between(my.sprite.player.x, my.sprite.player.y, weapon.x, weapon.y);

            // if dis is less than 40 we can equipd it
            if (dist < 40) {
                this.nearWeapon = weapon;
                break;
            }
        }

        if (cursors.left.isDown) {
            my.sprite.player.body.setVelocityX(-this.ACCELERATION);

            my.sprite.player.setFlip(true, false);

            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth / 2 - 10, my.sprite.player.displayHeight / 2 - 5, false);

            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

            if (grounded) {
                my.vfx.walking.start();
                if (!my.sounds.footSteps.isPlaying) {
                    my.sounds.footSteps.play();
                }
            }

        } else if (cursors.right.isDown) {
            my.sprite.player.body.setVelocityX(this.ACCELERATION);

            my.sprite.player.resetFlip();

            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth / 2 - 10, my.sprite.player.displayHeight / 2 - 5, false);

            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

            if (grounded) {
                my.vfx.walking.start();
                if (!my.sounds.footSteps.isPlaying) {
                    my.sounds.footSteps.play();
                }
            }

        } else {
            my.sprite.player.body.setVelocityX(0);
            my.sprite.player.body.setDragX(this.DRAG);
            my.vfx.walking.stop();
            my.sounds.footSteps.stop();
        }

        if (!grounded) {
            my.sounds.footSteps.stop();
        }

        // player jump
        // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
        if (!my.sprite.player.body.blocked.down) {
        }
        if (my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) {
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
            my.sounds.jump.play();
        }

        // when player is near a weapon and presses e
        if (Phaser.Input.Keyboard.JustDown(this.equipKey) && this.nearWeapon) {

            let newWeapon = this.nearWeapon;

            if (this.heldWeapon) {
                this.heldWeapon.body.enable = true;
                this.heldWeapon.body.reset(this.heldWeapon.x, this.heldWeapon.y);
            }

            this.heldWeapon = newWeapon;
            this.heldWeapon.body.enable = false;

            this.nearWeapon = null;

            this.currentWeapon = this.heldWeapon.name;

            // set player damage to respective item
            // damage values
            if (this.currentWeapon == "dagger") {
                this.playerHitDamage = this.dagerDamage;
                this.playerHitSpeed = this.dagerSpeed;
                this.hitSound = my.sounds.daggerSound;
            }

            if (this.currentWeapon == "sword") {
                this.playerHitDamage = this.swordDamage;
                this.playerHitSpeed = this.swordSpeed;
                this.hitSound = my.sounds.swordSound;
            }

            if (this.currentWeapon == "axe") {
                this.playerHitDamage = this.axeDamage;
                this.playerHitSpeed = this.axeSpeed;
                this.hitSound = my.sounds.axeSound;
            }
        }

        if (this.heldWeapon) {

            // if facing right
            if (my.sprite.player.flipX == true) {
                // facing left
                this.heldWeapon.x = my.sprite.player.x - 25;
                this.heldWeapon.y = my.sprite.player.y + 5;
            } else {
                this.heldWeapon.x = my.sprite.player.x + 25;
                this.heldWeapon.y = my.sprite.player.y + 5;
            }
        }

        // create freash array of enemies per update
        this.enemies = [
            ...this.evilWizardArray,
            ...this.enemyChests,
            ...this.orcArray
        ];

        // block used to hit an enemy
        if (Phaser.Input.Keyboard.JustDown(this.hitKey) && this.heldWeapon && time >= this.nextPlayerHitTime) {

            // calculate next time
            this.nextPlayerHitTime = time + this.playerHitSpeed;

            // play sound
            if (this.hitSound) {
                this.hitSound.play();
            }

            for (let enemy of this.enemies) {
                let distance = Phaser.Math.Distance.Between(my.sprite.player.x, my.sprite.player.y, enemy.x, enemy.y);

                if (distance < 100) {
                    enemy.health -= this.playerHitDamage;


                    if (enemy.health <= 0) {
                        if (enemy.chomp) {
                            my.sounds.chestDeath.play();
                            enemy.chomp.stop();
                            enemy.chomp.destroy();

                            let heart = this.heartArray.find(heart => heart.respectiveChest === enemy);
                            if (heart && heart.active) {
                                heart.x = enemy.x;
                                heart.y = enemy.y + 200;
                                heart.setVisible(true);
                            }
                        } else {
                            my.sounds.enemyDeath.play();
                        }

                        enemy.isDead = true;
                        enemy.destroy();
                    }
                }
            }
        }

        // filter out the dead enemies
        this.evilWizardArray = this.evilWizardArray.filter(enemy => !enemy.isDead);
        this.enemyChests = this.enemyChests.filter(chest => !chest.isDead);
        this.orcArray = this.orcArray.filter(orc => !orc.isDead);

        // loop to get heart from killed chest
        for (let heart of this.heartArray) {
            if (!heart.visible) continue;
            if (!heart.active) continue;

            let distToHeart = Phaser.Math.Distance.Between(my.sprite.player.x, my.sprite.player.y, heart.x, heart.y);

            if (distToHeart < 40) {
                my.sounds.healthPickUp.play();
                this.playerHealth = Math.min(100, this.playerHealth + heart.giveHealth);
                this.health.setText("Health: " + Math.ceil(this.playerHealth));
                heart.setVisible(false);
                heart.destroy();
            }
        }

        // filter out dead hears
        this.heartArray = this.heartArray.filter(heart => heart.active);


        enemyMovement(this, this.evilWizardArray);
        enemyMovement(this, this.orcArray);
        enemyMelee(this, this.evilWizardArray);
        enemyMelee(this, this.orcArray);
        seperateEnemies(this.evilWizardArray); //wizard on wizard seperation
        seperateEnemies(this.orcArray); // orc on orc eperation
        seperateEnemies([...this.evilWizardArray, ...this.orcArray]); //wizard on orc seperation
        moveProjectile(this, deltaTime);

        // loop through each chest
        for (let chest of this.enemyChests) {

            if (chest.isDead == true) continue;

            // get disntace from player to chest
            let distanceFromChest = Phaser.Math.Distance.Between(my.sprite.player.x, my.sprite.player.y, chest.x, chest.y);

            if (distanceFromChest < 200 && !chest.opened) {
                chest.opened = true;
                chest.chomp.play();
                chest.anims.play("chestAttack");
            }

            if (chest.opened && distanceFromChest < 50 && time >= chest.nextChompTime) {
                this.playerHealth -= 0.5;
                this.health.setText("Health: " + Math.ceil(this.playerHealth));
                chest.nextChompTime = time + 1000;
                this.my.sounds.hurtSound.play()
            }

            if (distanceFromChest > 50 && chest.opened) {
                chest.opened = false;
                chest.chomp.stop();
                chest.anims.stop();
                chest.setFrame(89);
            }

        }

        if (this.playerHealth <= 0) {
            
            this.health.setText("Health: 0");
            this.gameOver = true;
            this.my.sounds.footSteps.stop();
            this.my.sounds.deathSound.play();
            this.my.sprite.player.setVisible(false);
            this.my.sprite.player.body.enable = false;
            this.my.sprite.player.setVelocity(0, 0);
            this.cameras.main.stopFollow();
            this.playerAlive = false;
            my.vfx.walking.stop();
            my.sounds.music.stop();
            my.sounds.loseSound.play();
            this.showEndScreen("GAME OVER :(", "#ff002b");
            return;
        }
        
        if (this.keysCollected >= this.keysToCollect && this.coinsCollected >= this.coinsToCollect) {
            this.playerAlive = false;
            my.vfx.walking.stop();
            my.sounds.music.stop();
            my.sounds.winSound.play();
            this.showEndScreen("YOU WIN! :)", "#1900ff");
            return;
            }
        } else {
            this.reset();
        }
    }
}

export default Overworld;