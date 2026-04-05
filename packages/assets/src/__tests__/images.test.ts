import { describe, it, expect, vi } from 'vitest';
import { logo, logo128, logos, defaultAvatar } from '../images';

vi.mock('../images/logos/Memoflow.icns', () => ({ default: 'mock-icns-url' }));

describe('@dailyuse/assets - Images', () => {
  it('should export logo paths', () => {
    expect(logo).toBeDefined();
    expect(logo).toContain('Memoflow.svg');
  });

  it('should export logo128', () => {
    expect(logo128).toBeDefined();
    expect(logo128).toContain('Memoflow-128.png');
  });

  it('should export logos object', () => {
    expect(logos).toBeDefined();
    expect(logos.svg).toBeDefined();
    expect(logos.png128).toBeDefined();
  });

  it('should export default avatar', () => {
    expect(defaultAvatar).toBeDefined();
    expect(defaultAvatar).toContain('profile1.png');
  });

  it('all logo sizes should be defined', () => {
    expect(logos.png16).toBeDefined();
    expect(logos.png24).toBeDefined();
    expect(logos.png32).toBeDefined();
    expect(logos.png48).toBeDefined();
    expect(logos.png128).toBeDefined();
    expect(logos.png256).toBeDefined();
    expect(logos.trayWin16).toBeDefined();
    expect(logos.trayWin32).toBeDefined();
    expect(logos.ico).toBeDefined();
  });
});
