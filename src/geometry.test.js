import { describe, it, expect } from 'vitest';
import { edgePoint } from './geometry.js';

const r = { x: 0, y: 0, w: 100, h: 50 }; // center (50, 25)

describe('edgePoint', () => {
  it('exits through the side facing the target', () => {
    expect(edgePoint(r, 500, 25)).toEqual({ x: 100, y: 25 });
    expect(edgePoint(r, -500, 25)).toEqual({ x: 0, y: 25 });
    expect(edgePoint(r, 50, 500)).toEqual({ x: 50, y: 50 });
  });

  it('grows the rectangle by pad', () => {
    expect(edgePoint(r, 500, 25, 10)).toEqual({ x: 110, y: 25 });
  });

  it('returns the center when the target is the center', () => {
    expect(edgePoint(r, 50, 25)).toEqual({ x: 50, y: 25 });
  });
});
