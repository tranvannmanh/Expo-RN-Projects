export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface ConnectionConfig {
  host: string;
  port: number;
}

export interface TouchpadMoveEvent {
  type: 'MOVE';
  dx: number;
  dy: number;
}

export interface TouchpadClickEvent {
  type: 'LEFT_CLICK' | 'RIGHT_CLICK' | 'DOUBLE_CLICK';
}

export interface TouchpadScrollEvent {
  type: 'SCROLL';
  dx: number;
  dy: number;
}

export type TouchpadEvent = TouchpadMoveEvent | TouchpadClickEvent | TouchpadScrollEvent;
