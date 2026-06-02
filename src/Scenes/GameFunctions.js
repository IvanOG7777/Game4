// function used to move enemy when player is father than follow distance
function moveRandom(scene, enemy) {
    let currentTime = scene.time.now; // get current this time

    if (currentTime > enemy.nextWanderChange) {
        let direction = Phaser.Math.Between(0, 1); // pick direction
        if (direction == 0) { // if 0 
            enemy.wanderDirection = -1; // make left dirrection
        } else {
            enemy.wanderDirection = 1; // else make right
        }

        enemy.nextWanderChange = currentTime + scene.enemyWanderTime; // continouly add to the next wander change time.
    }


    // else
    enemy.setVelocityX(enemy.speed * enemy.wanderDirection * 0.5); // move enemy with current speed and direction 
    enemy.setFlipX(enemy.wanderDirection < 0); // if (-1) flip left else flip back to right (1)
}


// function to move an enemy in the current passed enemy array 
function enemyMovement(scene, enemyArray) {
    // for each enemy
    for (let enemy of enemyArray) {
        // calculate disntace to player
        let distanceX = scene.my.sprite.player.x - enemy.x;
        let playerX = scene.my.sprite.player.x
        let direction = 1; // get their direction

        let absDistanceX = Math.abs(distanceX);

        let totalDistance = Phaser.Math.Distance.Between(enemy.x, enemy.y, scene.my.sprite.player.x, scene.my.sprite.player.y);

        // total distance disntace checkers for melee, shooting, chasing, and wandering
        if (totalDistance <= enemy.meleeDistance) {
            enemy.attack = true;
        } else if (totalDistance <= enemy.followDistance) {
            enemy.chase = true;
        } else if (enemy.canShoot && totalDistance <= enemy.shootDistance) {
            enemy.shoot = true;
        } else {
            enemy.wander = true;
        }
        // stop enemt movement if its attacking (melee)
        if (enemy.attack == true) {
            enemy.setVelocityX(0);
            direction *= -1;
        }

        // if enemy is chasing
        if (enemy.chase == true) {
            // if distance x is greater than the stop distance
            if (absDistanceX > enemy.stopDistance) {
                // check where the player is to the right or left of enemy and flip direction
                if (distanceX > 0) {
                    enemy.setVelocityX(enemy.speed);
                    enemy.setFlipX(false);
                } else {
                    enemy.setVelocityX(-enemy.speed);
                    enemy.setFlipX(true);
                }
            } else {
                enemy.setVelocityX(0);
            }
        }

        // if enemy can shoot
        if (enemy.shoot == true) {
            // stop movement
            enemy.setVelocityX(0);
            // check where the player is to the right or left of enemy and flip direction
            if (distanceX > 0) {
                enemy.setFlipX(false);
            } else {
                enemy.setFlipX(true);
            }
            // shoot at the player
            enemyShoot(scene, enemy);
        }

        // if its wander is true
        if (enemy.wander == true) {
            moveRandom(scene, enemy); // move around
        }

        // if enemy is supposed to locked in a location
        if (enemy.locked) {
            // clamp the x axis of the enemy
            enemy.x = Phaser.Math.Clamp(enemy.x, enemy.minX, enemy.maxX);

            // move enemy within its bounds
            if (enemy.x <= enemy.minX && enemy.body.velocity.x < 0) {
                enemy.setVelocityX(enemy.speed);
                enemy.wanderDirection = 1;
            }

            if (enemy.x >= enemy.maxX && enemy.body.velocity.x > 0) {
                enemy.setVelocityX(-enemy.speed);
                enemy.wanderDirection = -1;
            }
        }

        // reset the enemy variables
        enemy.wander = false;
        enemy.chase = false;
        enemy.attack = false;
        enemy.shoot = false;
    }
}

// function for enemy to shoot at the player
function enemyShoot(scene, enemy) {
    let currentTime = scene.time.now; // get current this time

    if (currentTime < enemy.nextShootTime) {
        return;
    }

    // get player x/y coordinates
    let playerX = scene.my.sprite.player.x
    let playerY = scene.my.sprite.player.y;

    // calculates distance from player
    let distanceX = Math.abs(playerX - enemy.x);
    let distanceY = playerY - enemy.y;

    // create a potion for the wizzard
    let potion = scene.physics.add.sprite(enemy.x, enemy.y, "redPotion");
    potion.setScale(2);
    potion.body.allowGravity = false;
    potion.isDead = false;
    scene.my.sounds.potionThrow.play();

    // change direction if player is left or right of enemy
    if (playerX > enemy.x) {
        potion.direction = 1;
    } else {
        potion.direction = -1;
    }

    // time to travel over horizontal distance
    let travelTime = distanceX / 350;
    let gravity = 700;

    if (distanceY < 0) {
        //chat gpt formula
        potion.velY = (distanceY - 0.5 * gravity * travelTime * travelTime) / travelTime;
    } else {
        potion.velY = -300;
    }

    // Clamping vel.y so it doenst launch so far
    potion.velY = Phaser.Math.Clamp(potion.velY, -600, 200);

    potion.velX = 350;

    scene.evilWizardPotionArray.push(potion);
    enemy.nextShootTime = currentTime + enemy.shootDelay;
}

// function to move move the postion
function moveProjectile(scene, deltaTime) {
    // for each potion in the potion array
    for (let projectile of scene.evilWizardPotionArray) {

        // if potion is lower than the the world bounds kill it
        if (projectile.y >= scene.physics.world.bounds.height) {
            scene.my.sounds.potionImpact.play();
            projectile.isDead = true;
            projectile.destroy();
            continue;
        }

        // check if it collides with player
        // deal damage and destroy it
        if (collides(scene.my.sprite.player, projectile) == true) {
            scene.my.sounds.hurtSound.play();
            scene.my.sounds.potionImpact.play();
            scene.playerHealth -= 10;
            scene.health.setText("Health: " + scene.playerHealth);
            projectile.isDead = true;
            projectile.destroy();
            continue;
        }

        // else keep moveing it
        projectile.x += projectile.direction * projectile.velX * (deltaTime / 1000);
        projectile.y += projectile.velY * (deltaTime / 1000);

        projectile.velY += 700 * (deltaTime / 1000);
    }

    scene.evilWizardPotionArray = scene.evilWizardPotionArray.filter(projectile => !projectile.isDead); // filter out dead potions
}


// function for the enemy to melee
function enemyMelee(scene, enemyArray) {
    let currentTime = scene.time.now; // grab current time

    // for each enemy in the passed enemy array
    for (let enemy of enemyArray) {

        // if its not time for the enemy to hit skip it
        if (currentTime < enemy.nextMeleeTime) {
            continue;
        }

        // else check if its colliding with player and deal damage
        if (collides(scene.my.sprite.player, enemy)) {
            enemy.sound.play();
            scene.playerHealth -= enemy.meleeDamage;
            scene.my.sounds.hurtSound.play();
            scene.health.setText("Health: " + scene.playerHealth);

            enemy.nextMeleeTime = currentTime + enemy.meleeDelay;
        }
    }
}

// functio to seperate the enemies from each other
// avoids them clumping up in one big enemy
function seperateEnemies(enemyArray) {
    // distnace to push them off eachother
    let pushAmount = 3;
    let minDistance = 60;

    // run a check from one enemy on every other enmy and move them
    // lowkey kinda bad because if there hella enemies it will make preformace really bad but whatever
    for (let enemyA of enemyArray) {
        for (let enemyB of enemyArray) {

            if (enemyA === enemyB) continue;

            if (enemyA != enemyB) {
                let distanceX = enemyA.x - enemyB.x;
                let distanceY = enemyA.y - enemyB.y;

                let totalDistance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

                if (totalDistance < minDistance && totalDistance > 0) {
                    let overlap = (minDistance - totalDistance) / minDistance;
                    let pushX = (distanceX / totalDistance) * overlap * 5;

                    enemyA.x += pushX;
                    enemyB.x -= pushX;
                }
            }
        }
    }
}

// genertic spawner for wizzard for now
function specificSpawnEnemies(scene, mobType, sections, amount) {
    let enemies = []

    // loop through each valid section
    for (let section of sections) {
        // loop through how many enemies i want in section
        for (let i = 0; i < amount; i++) {
            // grab the x/y values from sections
            let x = Phaser.Math.Between(section.x1, section.x2);
            let y = Phaser.Math.Between(section.y1, section.y2);

            // create enemy at new x/y positon
            let enemy = scene.physics.add.sprite(x, y, mobType);

            // if section is locked pass it to enemy
            enemy.locked = section.locked;

            enemy.setScale(2.25);
            enemy.setCollideWorldBounds(true);

            // keep within bound only
            if (enemy.locked) {
                enemy.minX = Math.min(section.x1, section.x2);
                enemy.maxX = Math.max(section.x1, section.x2);
            }

            // set enemies variables
            enemy.isDead = false;
            enemy.wander = false;
            enemy.chase = false;
            enemy.shoot = false;

            enemy.stopDistance = 30;
            enemy.wanderTimer = scene.enemyWanderTime;
            enemy.nextWanderChange = 0;
            enemy.nextShootTime = 0;

            // set the wizard variables
            if (mobType == "evilWizard") {
                enemy.health = 100;
                enemy.speed = 80;
                enemy.meleeDistance = scene.evilWizardMeleeDistance;
                enemy.followDistance = scene.evilWizardFollowDistance;
                enemy.shootDistance = scene.evilWizardShootDistance;
                enemy.shootDelay = scene.evilWizardShootDelay;
                enemy.canShoot = true;
                enemy.meleeDamage = scene.meleeDamage;
                enemy.sound = scene.my.sounds.wizardHitSound;
                enemy.nextMeleeTime = 0;
                enemy.meleeDelay = scene.evilWizardMeleeDelay;
            }

            // add collidsion and pus to array
            scene.physics.add.collider(enemy, scene.groundLayer);

            enemies.push(enemy);
        }
    }
    return enemies;
}

// function used to create a dragon
function createDragon(scene) {
    let dragon = scene.physics.add.sprite(1000, 400, "walk1"); // start dragon off in its first walk png

    // create animations for each dragon state
    if (!scene.anims.exists("dragonWalk")) {
        scene.anims.create({
            key: "dragonWalk",
            frames: [{key: "walk1"}, {key: "walk2"}, {key: "walk3"}, {key: "walk4"}, {key: "walk5"}, {key: "walk6"}, {key: "walk7"}, {key: "walk8"},],
            frameRate: 6,
            repeat: -1

        });
    }

    if (!scene.anims.exists("dragonRun")) {
        scene.anims.create({
            key: "dragonRun",
            frames: [{key: "run1"}, {key: "run2"}, {key: "run3"}, {key: "run4"}, {key: "run5"}, {key: "run6"}, {key: "run7"}, {key: "run8"},],
            frameRate: 6,
            repeat: -1
        });
    }

    if (!scene.anims.exists("dragonRest")) {
        scene.anims.create({
            key: "dragonRest",
            frames: [{key: "idle1"}, {key: "idle2"}, {key: "idle3"}, {key: "idle4"}, {key: "idle5"}, {key: "idle6"},],
            frameRate: 6,
            repeat: -1
        })
    }

    if (!scene.anims.exists("dragonJump")) {
        scene.anims.create({
            key: "dragonJump",
            frames: [{key: "jump1"}, {key: "jump2"}, {key: "jump3"}, {key: "jump4"},],
            frameRate: 6,
            repeat: 0
        });
    }

      if (!scene.anims.exists("dragonAttack")) {
        scene.anims.create({
            key: "dragonAttack",
            frames: [{key: "attack1"}, {key: "attack2"}, {key: "attack3"}, {key: "attack4"},],
            frameRate: 6,
            repeat: -1
        });
    }

     if (!scene.anims.exists("dragonDeath")) {
        scene.anims.create({
            key: "dragonDeath",
            frames: [{key: "death1"}, {key: "death2"}, {key: "death3"}, {key: "death4"}, {key: "death5"}],
            frameRate: 6,
            repeat: 0
        });
    }

    // init dragon with walking
    dragon.anims.play("dragonWalk");
    dragon.setScale(1.6);
    dragon.setCollideWorldBounds(true);
    dragon.setFlipX(true);

    // set dragon variables
    dragon.health = 200;
    dragon.speed = 80;
    dragon.direction = -1;

    dragon.state = "walk";

    dragon.speed = 80;
    dragon.walkSpeed = 80;
    dragon.chargeSpeed = 300;

    dragon.walkRange = 200;
    dragon.attackRange = 120;
    dragon.attackDamage = 5;

    dragon.jumpRange = 500;
    dragon.jumpSpeedX = 350;
    dragon.jumpVelocityY = -800;
    dragon.jumpTargetX = 0;
    dragon.jumpDamageRadius = 175;
    dragon.jumpDamage = 20;

    dragon.headDamage = 20;

    dragon.chargeCooldown = 4000;
    dragon.minChargeCooldown = 4000;

    dragon.chargeDuration = 4000;
    dragon.minChargeDuration = 4000;

    dragon.restTime = 3000;
    dragon.minRestTime = 1000;


    dragon.biteCoolTime = 1000;
    dragon.minBiteCoolTime = 300;

    dragon.headHitCooldown = 500;

    dragon.attackDuration = 1000;
    dragon.minAttackDuration = 500;

    dragon.attackCooldown = 1500;
    dragon.minAttackCooldown = 1500;

    dragon.nextChargeTime = 0;
    dragon.chargeEndTime = 0;
    dragon.restEndTime = 0;
    dragon.nextBiteTime = 0;
    dragon.nextHeadHit = 0;
    dragon.attackEndTime = 0;
    dragon.nextAttackTime = 0;
    dragon.returnTime = 0;

    dragon.knockbackDistance = 500;

    dragon.chargePlayer = false;
    dragon.wander = true;
    dragon.alive = true;
    dragon.rest = false;
    dragon.jump = false;
    dragon.hasJumped = false;
    dragon.hasDoneJumpDamage = false;
    dragon.hasDoneAttackDamage = false;
    dragon.wasInAir = false;
    dragon.deathStarted = false;

    // add collison
    scene.physics.add.collider(dragon, scene.groundLayer);

    return dragon;
}

// function to make the dragon walk
function dragonWalk(scene, dragon, player, time) {
    playDragonStomps(scene); // call the dragon walk sound effect

    // calculate distance to player
    let distanceX = Math.abs(dragon.x - player.x);
    let distanceY = Math.abs(dragon.y - player.y);

    // calculate if dragon is close to player
    let playerCloseX = distanceX <= dragon.attackRange;
    let playerCloseY = distanceY <= 50;

    // call face player function to keep dragon faacing the player
    dragonFacePlayer(dragon, player);
    dragon.setVelocityX(dragon.walkSpeed * dragon.direction); // sets its velocity to walking speed

    // if player is close to dragon and we are with the dragon attack time
    if (playerCloseX && playerCloseY && time >= dragon.nextAttackTime) {
        dragon.state = "attack"; // chage draon state
        dragon.attackEndTime = time + dragonRandTimeValue(dragon.minAttackDuration, dragon.attackDuration); // add random time to its end attack time
        dragon.hasDoneAttackDamage = false; // reset its attack variable
        dragon.setVelocityX(0); // stop moving
        return;
    }

    // flip left or right
    if (dragon.body.blocked.left) {
        dragon.direction = 1;
        dragon.setFlipX(false);
    }

    if (dragon.body.blocked.right) {
        dragon.direction = -1;
        dragon.setFlipX(true);
    }

    // play its walking animation
    playDragonAnimation(dragon, "dragonWalk");

    // if time its greater than its next charge time change state and add to timer
    if (time >= dragon.nextChargeTime) {
        dragon.state = "charge";
        dragon.chargeEndTime = time + dragonRandTimeValue(dragon.minChargeDuration, dragon.chargeDuration);;

        dragonFacePlayer(dragon, player);
    }
}

// function to charge at player
function dragonCharge(scene, dragon, player, time) {
    playDragonStomps(scene); // play stop sound effect

    // change its velocity to charging
    dragon.setVelocityX(dragon.chargeSpeed * dragon.direction);
    playDragonAnimation(dragon, "dragonRun"); // play its charge animation

    // calculate distance to player
    let distanceX = Math.abs(player.x - dragon.x);

    // If player is within jumping distance and the dragon is standing on the ground
    // change state from chargin to sumping
    if (distanceX <= dragon.jumpRange && dragon.body.blocked.down) {
        dragon.state = "jump";
        dragon.body.checkCollision.up = false; // take off the collison check while jumping
        let playerHightDifference = dragon.y - player.y; // if player is way higher than the dragon
        // give more y velocity jump
        if (playerHightDifference > 200) {
            dragon.newJumpVelocityY = -1200;
        } else {
            dragon.newJumpVelocityY = -1200;
        }

        // set the dragon target to player position
        dragon.jumpTargetX = player.x;
        // reset variables
        dragon.hasJumped = false;
        dragon.hasDoneJumpDamage = false;
        dragonFacePlayer(dragon, player);
        return;
    }

    // if time is greater than its end time
    if (time >= dragon.chargeEndTime) {
        dragon.state = "rest"; // change state to resting
        dragon.restEndTime = time + dragonRandTimeValue(dragon.minRestTime, dragon.restTime); // add to timer
    }
}

// function to rest dragon
function dragonRest(scene, dragon, player, time) {
    dragon.setVelocityX(0); // stop movemen
    scene.my.sounds.dragonStomp.stop(); // stop the stomp sound

    playDragonAnimation(dragon, "dragonRest"); // play rest animation
    dragonFacePlayer(dragon, player);

    // allow player to hit the head of dragon
    hitDragonHead(scene, dragon, player, time);

    // if timer is greated than the end of its rest time
    if (time >= dragon.restEndTime) {
        dragon.state = "walk"; // change state to walk
        dragon.nextChargeTime = time + dragonRandTimeValue(dragon.minChargeCooldown, dragon.chargeCooldown); // add to next timer
    }
}

// function to allow dragon to jump
function dragonJump(scene, dragon, time) {
    scene.my.sounds.dragonStomp.stop(); // stop the stomp sound

    // if it hasnt jumped
    if (!dragon.hasJumped) {
        // set jump variables
        dragon.hasJumped = true;
        dragon.wasInAir = true;

        // play jump animation
        dragon.anims.play("dragonJump");
        dragon.setVelocityY(dragon.newJumpVelocityY); // sets its jump velocity

        // if the target is lef or right of dragon change direction of jump
        if (dragon.jumpTargetX < dragon.x) {
            dragon.setVelocityX(-dragon.jumpSpeedX);
        } else {
            dragon.setVelocityX(dragon.jumpSpeedX);
        }
    }

    if (dragon.body.velocity.y > 0) {
        dragon.setTexture("jump4");
    }

    // if dragon is on floor and has jumped and its velocyt y is 0
    if (dragon.body.blocked.down && dragon.hasJumped && dragon.body.velocity.y === 0) {
        dragon.body.checkCollision.up = true; // turn its collison back on

        // stop movement
        dragon.setVelocityX(0);

        // its hasnt done damge
        if (!dragon.hasDoneJumpDamage) {
            dragon.hasDoneJumpDamage = true; // set damage to true
            scene.my.sounds.dragonImpact.play(); // play imact sound
            dragonSplashDamage(scene, dragon); // call the splash damage function
            dragonLandingPuff(scene, dragon); // call the puff function
        }
        dragon.state = "rest"; // set state to rest
        dragon.restEndTime = time + dragonRandTimeValue(dragon.minRestTime, dragon.restTime); // add to next time
    }
}

// function to deal splash damage to player
function dragonSplashDamage(scene, dragon) {
    let player = scene.my.sprite.player;
    
    // calculate distance to player
    let distnace = Phaser.Math.Distance.Between(dragon.x, dragon.y, player.x, player.y);

    // if distance is within the jump radius
    if (distnace <= dragon.jumpDamageRadius) {
        let direction;

        // calcualte direction where player should be going
        if (player.x > dragon.x) {
            direction = 1;
        } else {
            direction = -1;
        }
        
        // set player velocity and direction
        player.setVelocityX(direction * 1000);
        player.setVelocityY(-1000);

        // hurt the player
        scene.playerHealth -= dragon.jumpDamage;
        scene.my.sounds.hurtSound.play();
        playerDeathCheck(scene); // check if player is dead
    }
}

// functio to play the puff around dragon
function dragonLandingPuff(scene, dragon) {
    let puff = scene.add.particles(dragon.x, dragon.y + dragon.displayHeight / 2, "kenny-particles", {
        frame: ["smoke_03.png", "smoke_09.png"],
        random: true,
        scale: { start: 0.2, end: 0.4 },
        lifespan: 500,
        speed: { min: 80, max: 150 },
        gravityY: -200,
        quantity: 10
    });

    // chatgpt
    scene.time.delayedCall(200, () => {
        puff.destroy();
    });
    // end chatgpt
}

// function for dragon to do regular attack
function dragonAttack(scene, dragon, player, time) {
    // stop its movement
    dragon.setVelocityX(0);
    scene.my.sounds.dragonStomp.stop(); // stop stomp noise

    playDragonAnimation(dragon, "dragonAttack"); // play attack animation

    // calculate disntce between player and dragon
    let distanceX = Math.abs(dragon.x - player.x);
    let distanceY = Math.abs(dragon.y - player.y);

    let playerCloseX = distanceX <= dragon.attackRange;
    let playerCloseY = distanceY <= 50;

    // if player isnt close to dragon
    if (!playerCloseX || !playerCloseY) {
        dragon.state = "walk"; // change state back to walk
        dragon.nextAttackTime = time + dragonRandTimeValue(dragon.minAttackCooldown, dragon.attackCooldown); // add to end timer
        dragon.hasDoneAttackDamage = false;
        return;
    }

    dragonFacePlayer(dragon, player); // face dragon to player

    // if animation hasnt played play it
    if (dragon.anims.currentAnim?.key !== "dragonAttack") {
        dragon.anims.play("dragonAttack", true);
    }
    
    // if bite time is less than the current timer
    if (time >= dragon.nextBiteTime) {
        // play the bite animation and sounds and hurt player
        scene.my.sounds.dragonBite.play();
        scene.playerHealth -= dragon.attackDamage;
        scene.my.sounds.hurtSound.play();
        playerDeathCheck(scene);

        dragon.nextBiteTime = time + dragonRandTimeValue(dragon.minBiteCoolTime, dragon.biteCoolTime); // add to next timer
    }
}

// functio to jump on dragon head
function hitDragonHead(scene, dragon, player, time) {

    // if time is less than the next allowd head hit timer
    if (time < dragon.nextHeadHit) return;

    // calcuilate bottom of player and top if dragon
    let playerBottom = player.y + player.displayHeight / 2;
    let dragonTop = dragon.y - dragon.displayHeight / 2;

    // calcualte true/false variables depending on where player is to dragon
    let isNearHead = Math.abs(playerBottom - dragonTop) < 20;
    let isPlayerFalling = player.body.velocity.y > 0;
    let isClose = Math.abs(player.x - dragon.x) < dragon.displayWidth / 2;

    // if all are true
    if (isNearHead && isPlayerFalling && isClose) {
        // hurt the dragon
        scene.my.sounds.dragonHurt.play();
        dragon.health -= dragon.headDamage;
        dragon.nextHeadHit = time + dragon.headHitCooldown;
        player.setVelocityY(-500);
        
        // if dragon health is equal or less than 0
        if (dragon.health <= 0) {
            dragon.state = "death" // change state to death
            dragon.deathStarted = false;
        }
    }
}

// function for death of dragon
function dragonDeath(scene, dragon, time) {
    // stop movemnt and sounds
    dragon.setVelocityX(0);
    scene.my.sounds.dragonStomp.stop();

    // if we havent started the death scene
    if (!dragon.deathStarted) {
        // change vairbale to true nad play the death animation
        dragon.deathStarted = true;
        dragon.anims.play("dragonDeath");
        dragon.returnTime = time + 2000; // time to wait before sending back to over world
    }
    
    // if current time is return time or greater
    if (time >= dragon.returnTime) {
        // send back to overworld
        scene.my.sounds.music.stop();
        scene.scene.start("platformerScene");
    }
}

// function that will make dragon face player
function dragonFacePlayer(dragon, player) {
    if (player.x < dragon.x) {
        dragon.direction = -1;
        dragon.setFlipX(true);
    } else {
        dragon.direction = 1;
        dragon.setFlipX(false);
    }
}

// function that plays the passed animation type for the dragon
function playDragonAnimation(dragon, animationType) {
    if (dragon.anims.currentAnim?.key !== animationType) {
        dragon.anims.play(animationType);
    }
}

// function that plays dragon sounds. Might make this like animation because I will add different dragon sounds
function playDragonStomps(scene) {
    if (!scene.my.sounds.dragonStomp.isPlaying) {
        scene.my.sounds.dragonStomp.play();
    }
}
// function that just gets two random times
function dragonRandTimeValue(min, max) {
    return Phaser.Math.Between(min, max);
}

// function that calls all the smaller functions depending on dragons current state
function dragonActions(scene, dragon, time) {
    let player = scene.my.sprite.player;

    if (dragon.state == "walk") {
        dragonWalk(scene, dragon, player, time);
    }
    else if (dragon.state == "charge") {
        dragonCharge(scene, dragon, player, time);
    }
    else if (dragon.state == "jump") {
        dragonJump(scene, dragon, time);
    }
    else if (dragon.state == "rest") {
        dragonRest(scene, dragon, player, time);
    } else if (dragon.state == "attack") {
        dragonAttack(scene, dragon, player, time);
    } else if (dragon.state == "death") {
        dragonDeath(scene, dragon, time);
    }
}

// function to check player is alive
function playerDeathCheck(scene) {
    // return if player is still alive
    if (scene.playerHealth > 0 || scene.playerAlive == false) {
        return;
    }

    // else kill player
    scene.playerHealth = 0;
    scene.health.setText("Health: 0");

    scene.playerAlive = false;

    scene.my.sounds.footSteps.stop();
    scene.my.sounds.dragonStomp.stop();
    scene.my.sounds.music.stop();

    scene.my.sounds.deathSound.play();
    scene.my.sounds.loseSound.play();

    scene.my.sprite.player.setVisible(false);
    scene.my.sprite.player.body.enable = false;
    scene.my.sprite.player.setVelocity(0, 0);

    scene.cameras.main.stopFollow();

    scene.showEndScreen("YOU DIED", "#ff0000");
}

function collides(a, b) {
    if (Math.abs(a.x - b.x) > (a.displayWidth / 2 + b.displayWidth / 2)) return false;
    if (Math.abs(a.y - b.y) > (a.displayHeight / 2 + b.displayHeight / 2)) return false;
    return true;
}


export {
    moveRandom,
    enemyMovement,
    enemyShoot,
    moveProjectile,
    enemyMelee,
    seperateEnemies,
    specificSpawnEnemies,
    createDragon,
    dragonActions
};