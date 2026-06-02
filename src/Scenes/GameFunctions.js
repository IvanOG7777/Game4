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

function enemyMovement(scene, enemyArray) {
    for (let enemy of enemyArray) {
        let distanceX = scene.my.sprite.player.x - enemy.x;
        let playerX = scene.my.sprite.player.x
        let direction = 1;

        let absDistanceX = Math.abs(distanceX);

        let totalDistance = Phaser.Math.Distance.Between(enemy.x, enemy.y, scene.my.sprite.player.x, scene.my.sprite.player.y);

        if (totalDistance <= enemy.meleeDistance) {
            enemy.attack = true;
        } else if (totalDistance <= enemy.followDistance) {
            enemy.chase = true;
        } else if (enemy.canShoot && totalDistance <= enemy.shootDistance) {
            enemy.shoot = true;
        } else {
            enemy.wander = true;
        }

        if (enemy.attack == true) {
            enemy.setVelocityX(0);
            direction *= -1;
        }

        if (enemy.chase == true) {
            if (absDistanceX > enemy.stopDistance) {
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

        if (enemy.shoot == true) {
            enemy.setVelocityX(0);
            if (distanceX > 0) {
                enemy.setFlipX(false);
            } else {
                enemy.setFlipX(true);
            }
            enemyShoot(scene, enemy);
        }

        if (enemy.wander == true) {
            moveRandom(scene, enemy);
        }

        if (enemy.locked) {
            enemy.x = Phaser.Math.Clamp(enemy.x, enemy.minX, enemy.maxX);

            if (enemy.x <= enemy.minX && enemy.body.velocity.x < 0) {
                enemy.setVelocityX(enemy.speed);
                enemy.wanderDirection = 1;
            }

            if (enemy.x >= enemy.maxX && enemy.body.velocity.x > 0) {
                enemy.setVelocityX(-enemy.speed);
                enemy.wanderDirection = -1;
            }
        }

        enemy.wander = false;
        enemy.chase = false;
        enemy.attack = false;
        enemy.shoot = false;
    }
}

function enemyShoot(scene, enemy) {
    let currentTime = scene.time.now; // get current this time

    if (currentTime < enemy.nextShootTime) {
        return;
    }

    let playerX = scene.my.sprite.player.x
    let playerY = scene.my.sprite.player.y;

    let distanceX = Math.abs(playerX - enemy.x);
    let distanceY = playerY - enemy.y;

    let potion = scene.physics.add.sprite(enemy.x, enemy.y, "redPotion");
    potion.setScale(2);
    potion.body.allowGravity = false;
    potion.isDead = false;
    scene.my.sounds.potionThrow.play();

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

function moveProjectile(scene, deltaTime) {
    for (let projectile of scene.evilWizardPotionArray) {

        if (projectile.y >= scene.physics.world.bounds.height) {
            scene.my.sounds.potionImpact.play();
            projectile.isDead = true;
            projectile.destroy();
            continue;
        }

        if (collides(scene.my.sprite.player, projectile) == true) {
            scene.my.sounds.hurtSound.play();
            scene.my.sounds.potionImpact.play();
            scene.playerHealth -= 10;
            scene.health.setText("Health: " + scene.playerHealth);
            projectile.isDead = true;
            projectile.destroy();
            continue;
        }

        projectile.x += projectile.direction * projectile.velX * (deltaTime / 1000);
        projectile.y += projectile.velY * (deltaTime / 1000);

        projectile.velY += 700 * (deltaTime / 1000);
    }

    scene.evilWizardPotionArray = scene.evilWizardPotionArray.filter(projectile => !projectile.isDead);
}

function enemyMelee(scene, enemyArray) {
    let currentTime = scene.time.now;

    for (let enemy of enemyArray) {

        if (currentTime < enemy.nextMeleeTime) {
            continue;
        }

        if (collides(scene.my.sprite.player, enemy)) {
            enemy.sound.play();
            scene.playerHealth -= enemy.meleeDamage;
            scene.my.sounds.hurtSound.play();
            scene.health.setText("Health: " + scene.playerHealth);

            enemy.nextMeleeTime = currentTime + enemy.meleeDelay;
        }
    }
}

function seperateEnemies(enemyArray) {
    let pushAmount = 3;
    let minDistance = 60;

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

    for (let section of sections) {
        for (let i = 0; i < amount; i++) {
            let x = Phaser.Math.Between(section.x1, section.x2);
            let y = Phaser.Math.Between(section.y1, section.y2);

            let enemy = scene.physics.add.sprite(x, y, mobType);

            enemy.locked = section.locked;

            enemy.setScale(2.25);
            enemy.setCollideWorldBounds(true);

            // keep within bound only
            if (enemy.locked) {
                enemy.minX = Math.min(section.x1, section.x2);
                enemy.maxX = Math.max(section.x1, section.x2);
            }

            enemy.isDead = false;
            enemy.wander = false;
            enemy.chase = false;
            enemy.shoot = false;

            enemy.stopDistance = 30;
            enemy.wanderTimer = scene.enemyWanderTime;
            enemy.nextWanderChange = 0;
            enemy.nextShootTime = 0;

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

            scene.physics.add.collider(enemy, scene.groundLayer);

            enemies.push(enemy);
        }
    }

    return enemies;
}

function createDragon(scene) {
    let dragon = scene.physics.add.sprite(1000, 400, "walk1");


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


    dragon.anims.play("dragonWalk");
    dragon.setScale(1.6);
    dragon.setCollideWorldBounds(true);
    dragon.setFlipX(true);

    dragon.health = 50;
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

    scene.physics.add.collider(dragon, scene.groundLayer);

    return dragon;
}

function dragonWalk(scene, dragon, player, time) {
    playDragonStomps(scene);

    let distanceX = Math.abs(dragon.x - player.x);
    let distanceY = Math.abs(dragon.y - player.y);

    let playerCloseX = distanceX <= dragon.attackRange;
    let playerCloseY = distanceY <= 50;

    dragonFacePlayer(dragon, player);
    dragon.setVelocityX(dragon.walkSpeed * dragon.direction);

    if (playerCloseX && playerCloseY && time >= dragon.nextAttackTime) {
        dragon.state = "attack";
        dragon.attackEndTime = time + dragonRandTimeValue(dragon.minAttackDuration, dragon.attackDuration);
        dragon.hasDoneAttackDamage = false;
        dragon.setVelocityX(0);
        return;
    }

    if (dragon.body.blocked.left) {
        dragon.direction = 1;
        dragon.setFlipX(false);
    }

    if (dragon.body.blocked.right) {
        dragon.direction = -1;
        dragon.setFlipX(true);
    }

    playDragonAnimation(dragon, "dragonWalk");

    if (time >= dragon.nextChargeTime) {
        dragon.state = "charge";
        dragon.chargeEndTime = time + dragonRandTimeValue(dragon.minChargeDuration, dragon.chargeDuration);;

        dragonFacePlayer(dragon, player);
    }
}

function dragonCharge(scene, dragon, player, time) {
    playDragonStomps(scene);

    dragon.setVelocityX(dragon.chargeSpeed * dragon.direction);
    playDragonAnimation(dragon, "dragonRun");

    let distanceX = Math.abs(player.x - dragon.x);

    if (distanceX <= dragon.jumpRange && dragon.body.blocked.down) {
        dragon.state = "jump";
        dragon.body.checkCollision.up = false;
        let playerHightDifference = dragon.y - player.y;
        if (playerHightDifference > 200) {
            dragon.newJumpVelocityY = -1200;
        } else {
            dragon.newJumpVelocityY = -1200;
        }
        dragon.jumpTargetX = player.x;
        dragon.hasJumped = false;
        dragon.hasDoneJumpDamage = false;
        dragonFacePlayer(dragon, player);
        return;
    }

    if (time >= dragon.chargeEndTime) {
        dragon.state = "rest";
        dragon.restEndTime = time + dragonRandTimeValue(dragon.minRestTime, dragon.restTime);
    }
}

function dragonRest(scene, dragon, player, time) {
    dragon.setVelocityX(0);
    scene.my.sounds.dragonStomp.stop();

    playDragonAnimation(dragon, "dragonRest");
    dragonFacePlayer(dragon, player);

    hitDragonHead(scene, dragon, player, time);

    if (time >= dragon.restEndTime) {
        dragon.state = "walk";
        dragon.nextChargeTime = time + dragonRandTimeValue(dragon.minChargeCooldown, dragon.chargeCooldown);
    }
}

function dragonJump(scene, dragon, time) {
    scene.my.sounds.dragonStomp.stop();

    if (!dragon.hasJumped) {
        dragon.hasJumped = true;
        dragon.wasInAir = true;

        dragon.anims.play("dragonJump");
        dragon.setVelocityY(dragon.newJumpVelocityY);

        if (dragon.jumpTargetX < dragon.x) {
            dragon.setVelocityX(-dragon.jumpSpeedX);
        } else {
            dragon.setVelocityX(dragon.jumpSpeedX);
        }
    }

    if (dragon.body.velocity.y > 0) {
        dragon.setTexture("jump4");
    }

    if (dragon.body.blocked.down && dragon.hasJumped && dragon.body.velocity.y === 0) {
        dragon.body.checkCollision.up = true;

        dragon.setVelocityX(0);

        if (!dragon.hasDoneJumpDamage) {
            dragon.hasDoneJumpDamage = true;
            scene.my.sounds.dragonImpact.play();
            dragonSplashDamage(scene, dragon);
            dragonLandingPuff(scene, dragon);
        }

        dragon.state = "rest";
        dragon.restEndTime = time + dragonRandTimeValue(dragon.minRestTime, dragon.restTime);
    }
}

function dragonSplashDamage(scene, dragon) {
    let player = scene.my.sprite.player;

    let distnace = Phaser.Math.Distance.Between(dragon.x, dragon.y, player.x, player.y);

    if (distnace <= dragon.jumpDamageRadius) {
        scene.playerHealth -= dragon.jumpDamage;
        scene.my.sounds.hurtSound.play();
    }
}

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

function dragonAttack(scene, dragon, player, time) {
    dragon.setVelocityX(0);
    scene.my.sounds.dragonStomp.stop();

    playDragonAnimation(dragon, "dragonAttack");

    let distanceX = Math.abs(dragon.x - player.x);
    let distanceY = Math.abs(dragon.y - player.y);

    let playerCloseX = distanceX <= dragon.attackRange;
    let playerCloseY = distanceY <= 50;

    if (!playerCloseX || !playerCloseY) {
        dragon.state = "walk";
        dragon.nextAttackTime = time + dragonRandTimeValue(dragon.minAttackCooldown, dragon.attackCooldown);
        dragon.hasDoneAttackDamage = false;
        return;
    }

    dragonFacePlayer(dragon, player);

    if (dragon.anims.currentAnim?.key !== "dragonAttack") {
        dragon.anims.play("dragonAttack", true);
    }
    
    if (time >= dragon.nextBiteTime) {
        scene.my.sounds.dragonBite.play();
        scene.playerHealth -= dragon.attackDamage;
        scene.my.sounds.hurtSound.play();

        dragon.nextBiteTime = time + dragonRandTimeValue(dragon.minBiteCoolTime, dragon.biteCoolTime);
    }
}

function hitDragonHead(scene, dragon, player, time) {

    if (time < dragon.nextHeadHit) return;

    let playerBottom = player.y + player.displayHeight / 2;
    let dragonTop = dragon.y - dragon.displayHeight / 2;

    let isNearHead = Math.abs(playerBottom - dragonTop) < 20;
    let isPlayerFalling = player.body.velocity.y > 0;
    let isClose = Math.abs(player.x - dragon.x) < dragon.displayWidth / 2;

    if (isNearHead && isPlayerFalling && isClose) {
        scene.my.sounds.dragonHurt.play();
        dragon.health -= dragon.headDamage;
        dragon.nextHeadHit = time + dragon.headHitCooldown;
        player.setVelocityY(-500);

        console.log("Dragon health:", dragon.health);
        
        if (dragon.health <= 0) {
            dragon.state = "death"
            dragon.deathStarted = false;
        }
    }
}

function dragonDeath(scene, dragon, time) {
    dragon.setVelocityX(0);
    scene.my.sounds.dragonStomp.stop();

    if (!dragon.deathStarted) {
         dragon.deathStarted = true;
        dragon.anims.play("dragonDeath");
        dragon.returnTime = time + 1500;
    }
    
    if (time >= dragon.returnTime) {
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

function dragonRandTimeValue(min, max) {
    return Phaser.Math.Between(min, max);
}

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