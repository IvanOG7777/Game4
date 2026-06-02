import { 
    createDragon,
    dragonActions
} from "./GameFunctions.js";

class Valhalla extends Phaser.Scene {
    constructor() {
        super("valhallaScene");

        this.my = {sprite: {}, vfx: {}};
        this.SCALE = 1.75;

        this.playerHealth = 100;
        this.playerHitDamage = 5;
        this.currentWeapon;
        this.nextPlayerHitTime = 0;
        this.playerHitSpeed = 1000;
        this.heartArray = [];

        this.gameOver = false;
        this.gameWon = false;
        this.playerAlive = true;
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

        let my = this.my;

        my.sounds = {};
        my.sounds.footSteps = this.sound.add("footSteps", {loop: true});
        my.sounds.jump = this.sound.add("jumpSound");
        my.sounds.hurtSound = this.sound.add("hurtSound");
        my.sounds.deathSound = this.sound.add("deathSound");
        my.sounds.axeSound = this.sound.add("axeSound");
        my.sounds.swordSound = this.sound.add("swordSound");
        my.sounds.daggerSound = this.sound.add("daggerSound");
        my.sounds.winSound = this.sound.add("winSound");
        my.sounds.loseSound = this.sound.add("loseSound");
        my.sounds.healthPickUp = this.sound.add("healthPickUp");
        my.sounds.dragonStomp = this.sound.add("dragonStomp", {
            loop: true,
            volume: 0.5,
        });
        my.sounds.dragonBite = this.sound.add("dragonBite");
        my.sounds.dragonImpact = this.sound.add("dragonGroundImpact");
        my.sounds.dragonHurt = this.sound.add("dragonHurt");

        my.sounds.music;

        // chat
        this.musicKeys = [
            "music1",
            "music2",
            "music3",
            "music4",
        ];
        let randomMusic = Phaser.Utils.Array.GetRandom(this.musicKeys);
        // end of chat

        my.sounds.music = this.sound.add(randomMusic, {loop: true, volume: 0.4});

        my.sounds.music.play();

        this.hitKey = this.input.keyboard.addKey('space');
        this.equipKey = this.input.keyboard.addKey('E');
        this.openKey = this.input.keyboard.addKey('F');
        this.rKey = this.input.keyboard.addKey('R');

        this.map = this.add.tilemap("valhalla-level");

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

        this.my.sprite.player = this.physics.add.sprite(200, 400, "vikingPlayer").setScale(2.25);
        this.my.sprite.player.setCollideWorldBounds(true);

        this.physics.add.collider(this.my.sprite.player, this.groundLayer);

        this.dragon = createDragon(this);

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

        const worldWidth = this.map.widthInPixels * 2;
        const worldHeight = this.map.heightInPixels * 2;

        this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
        this.cameras.main.startFollow(this.my.sprite.player);

        this.cursors = this.input.keyboard.createCursorKeys();

    }

    update(time, deltaTime) {
        if (this.playerAlive == true) {
            let cursors = this.cursors;
            let my = this.my;

            let grounded = my.sprite.player.body.blocked.down;

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

            // if the dragon is alive
            if (this.dragon.alive == true) {
                dragonActions(this, this.dragon, time);
            }
        }
    }
}

export default Valhalla;