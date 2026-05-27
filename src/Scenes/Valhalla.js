class Valhalla extends Phaser.Scene {
    constructor() {
        super("ValhallaScene");

        this.my = {sprite: {} };
    }

    Init() {
        this.physics.world.gravity.y = 1500;
        this.ACCELERATION = 250;
        this.DRAG = 800;
        this.JUMP_VELOCITY = -700;
    }

    create() {
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

        const worldWidth = this.map.widthInPixels * 2;
        const worldHeight = this.map.heightInPixels * 2;

        this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
        this.cameras.main.startFollow(this.my.sprite.player);

        this.cursors = this.input.keyboard.createCursorKeys();

    }

    update(){
        console.log("You are in valhalla");
        let player = this.my.sprite.player;

        if (this.cursors.left.isDown) {
            player.setVelocityX(-this.ACCELERATION);
        } else if (this.cursors.right.isDown) {
            player.setVelocityX(this.ACCELERATION);
        } else {
            player.setVelocityX(0);
            player.setDragX(this.DRAG);
        }

        if (player.body.blocked.down && Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            player.setVelocityY(this.JUMP_VELOCITY);
        }
    }
}

export default Valhalla;