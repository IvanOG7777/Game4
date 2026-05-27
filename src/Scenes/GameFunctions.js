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
    specificSpawnEnemies
};