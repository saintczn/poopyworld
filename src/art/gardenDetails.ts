import Phaser from 'phaser';

/**
 * Extra hand-placed garden dressing for the first playable area.
 * Kept separate from the map data so the garden can gain visual richness
 * without changing movement, collision, or interaction coordinates.
 */
export function buildGardenDetails(scene: Phaser.Scene) {
  const flowerBeds = [
    { x: 242, y: 224, colors: ['#f7d66b', '#f5a4c7', '#fff0d0', '#b9a2ef'] },
    { x: 382, y: 224, colors: ['#f7d66b', '#f5a4c7', '#fff0d0', '#b9a2ef'] },
    { x: 118, y: 92, colors: ['#f5a4c7', '#fff0d0', '#f7d66b'] },
    { x: 510, y: 366, colors: ['#fff0d0', '#f7d66b', '#b9a2ef'] },
    { x: 282, y: 424, colors: ['#f5a4c7', '#fff0d0', '#f7d66b'] },
  ];

  flowerBeds.forEach((bed, bedIndex) => {
    for (let i = 0; i < 8; i++) {
      const x = bed.x + ((i * 17 + bedIndex * 7) % 49);
      const y = bed.y + ((i * 11 + bedIndex * 5) % 25);
      const color = bed.colors[(i + bedIndex) % bed.colors.length];
      const plant = scene.add.graphics();
      plant.fillStyle('#397f38', 1);
      plant.fillRect(3, 7, 2, 5);
      plant.fillRect(0, 9, 3, 2);
      plant.fillRect(5, 8, 3, 2);
      plant.fillStyle(color, 1);
      plant.fillRect(2, 2, 3, 3);
      plant.fillRect(0, 4, 3, 3);
      plant.fillRect(4, 4, 3, 3);
      plant.fillRect(2, 6, 3, 3);
      plant.fillStyle('#f5d46b', 1);
      plant.fillRect(3, 4, 2, 2);
      plant.setPosition(x, y).setDepth(y + 1);
    }
  });

  // Small stepping stones soften the edges of the main paths.
  const stones = [
    [176, 187], [194, 190], [216, 187], [432, 190], [452, 187],
    [180, 310], [190, 338], [448, 338], [464, 312], [306, 410],
  ];
  stones.forEach(([x, y], i) => {
    const stone = scene.add.graphics();
    stone.fillStyle('#a98b61', 0.45);
    stone.fillRect(1, 2, 7 + (i % 3), 3);
    stone.fillStyle('#ead3a8', 0.75);
    stone.fillRect(2, 1, 5 + (i % 3), 2);
    stone.setPosition(x, y).setDepth(y);
  });

  // A few tiny clover patches make the open lawn feel less repetitive.
  const cloverSpots = [[72, 246], [520, 190], [570, 300], [110, 410], [490, 445], [260, 120]];
  cloverSpots.forEach(([x, y]) => {
    const clover = scene.add.graphics();
    clover.fillStyle('#438d3d', 1);
    clover.fillRect(3, 5, 2, 5);
    clover.fillStyle('#8bcf68', 1);
    clover.fillRect(0, 1, 4, 4);
    clover.fillRect(4, 0, 4, 4);
    clover.fillRect(2, 4, 4, 3);
    clover.setPosition(x, y).setDepth(y + 1);
  });
}
