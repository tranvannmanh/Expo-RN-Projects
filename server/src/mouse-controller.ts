// eslint-disable-next-line @typescript-eslint/no-require-imports
const robot = require('robotjs');

let scrollAccumY = 0;

type TouchpadEvent =
  | { type: 'MOVE'; dx: number; dy: number }
  | { type: 'LEFT_CLICK' }
  | { type: 'RIGHT_CLICK' }
  | { type: 'DOUBLE_CLICK' }
  | { type: 'SCROLL'; dx: number; dy: number };

export function handleEvent(event: TouchpadEvent): void {
  switch (event.type) {
    case 'MOVE': {
      const pos = robot.getMousePos();
      robot.moveMouse(Math.round(pos.x + event.dx), Math.round(pos.y + event.dy));
      break;
    }

    case 'LEFT_CLICK': {
      robot.mouseClick('left');
      break;
    }

    case 'RIGHT_CLICK': {
      robot.mouseClick('right');
      break;
    }

    case 'DOUBLE_CLICK': {
      robot.mouseClick('left', true);
      break;
    }

    case 'SCROLL': {
      scrollAccumY += event.dy;
      const units = Math.trunc(scrollAccumY);
      if (units !== 0) {
        scrollAccumY -= units;
        robot.scrollMouse(0, -units);
      }
      break;
    }
  }
}
