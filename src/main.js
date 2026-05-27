import Load from "./Scenes/Load.js";
import Init from "./Scenes/Init.js";
import Overworld from "./Scenes/Overworld.js";

"use strict"

// game config
let config = {
    parent: 'phaser-game',
    type: Phaser.CANVAS,
    render: {
        pixelArt: true  // prevent pixel art from getting blurred when scaled
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: {
                x: 0,
                y: 0
            }
        }
    },
    width: 1440,
    height: 900,
    scene: [Load, Init, Overworld]
}

let my = {sprite: {}, text: {}};

const game = new Phaser.Game(config);