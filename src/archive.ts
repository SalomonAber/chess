import { Application, Assets, Container, MeshPlane } from 'pixi.js';
import { initDevtools } from '@pixi/devtools';

const CAMERA_Z = 1;
const HEIGHT_VARIANCE = 0.1;
const Z_SCALE_VARIANCE = 0;
const Z_Y_VARIANCE = 0.5;
const BLUR_VARIANCE = 1;
const PLANT_VARIETIES = [0.1, 0.1, 0.2, 0.1, 0.2, 0.2, 0.1];
const Y_OFFSET = -100;
const LAYERS = 5;
const SAMPLES = 500;
const SEGMENTS_X = 4;
const SEGMENTS_Y = 10;

/**
 * Returns a natural swaying value between -1 and 1, scaled by visual depth.
 * @param time - Time in milliseconds (e.g. from performance.now())
 * @param depth - 0 (foreground) to 1 (very far)
 * @param height - 0 (bottom) to 1 (top)
 * @returns number between -1 and 1, reduced for distant layers
 */
function getSwayingWind(time: number, depth: number, height: number): number {
  const t = time / 1000;
  const d = Math.max(0, Math.min(1, depth));
  const h = Math.max(0, Math.min(1, height));

  // Smooth layered oscillations (unsynced by depth)
  const base = h * h * Math.sin(t * 0.5 + d * 1.3);
  const gust = h * Math.sin(t * 1.2 + d * 2.1) * 0.3;
  const twitch = h * Math.sin(t * 3.5 + d * 5.7) * 0.1;

  const rawSway = base + gust + twitch;
  const intensity = Math.pow(d, 1.5);

  return rawSway * intensity;
}

type PlaneWithMetadata = MeshPlane & {
  offset: number;
  z: number;
  x: number;
  y: number;
  h: number;
};

(async () => {
  const app = new Application();

  initDevtools({ app });

  await app.init({
    resizeTo: window,
    background: "white"
  });

  document.body.appendChild(app.canvas);

  const container = new Container();
  app.stage.addChild(container);

  const textures = await Promise.all(
    PLANT_VARIETIES.map((_, i) =>
      Assets.load(`assets/plant${i}_transparent.png`)
    )
  );

  const planes: PlaneWithMetadata[] = [];

  for (let i = 0; i < PLANT_VARIETIES.length; i++) {
    const count = Math.floor(SAMPLES * PLANT_VARIETIES[i]);

    for (let j = 0; j < count; j++) {
      const texture = textures[i];
      const plane = new MeshPlane({
        texture,
        verticesX: SEGMENTS_X,
        verticesY: SEGMENTS_Y
      }) as PlaneWithMetadata;

      plane.x = 2 * (Math.random() - 0.5) * app.screen.width;
      plane.y = 2 * (Math.random() - 0.5) * app.screen.width;
      plane.h = (1 + HEIGHT_VARIANCE * Math.random());
      plane.z = Math.random();
      plane.offset = Math.random() * Math.PI * 2;

      planes.push(plane);
      container.addChild(plane);

      plane.eventMode = 'static';
      plane.on('globalpointermove', () => {
        plane.eventMode = 'none';
      });
    }
  }

  let timer = 0;

  app.ticker.add(() => {
    for (const plane of planes) {
      const { buffer } = plane.geometry.getAttribute('aPosition');
      for (let i = 0; i < buffer.data.length; i += 2) {
        const height = 1 - buffer.data[i + 1] / 200;
        buffer.data[i] += getSwayingWind(50 * timer, plane.z, height);
      }
      buffer.update();
    }
    timer++;
  });

})();
