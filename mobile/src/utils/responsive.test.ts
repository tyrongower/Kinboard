describe('responsive utilities', () => {
  it('computes expected column counts', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getColumnCount } = require('./responsive');

    expect(getColumnCount(500)).toBe(1);
    expect(getColumnCount(800)).toBe(2);
    expect(getColumnCount(1200)).toBe(3);
  });

  it('computes expected max widths', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getContentMaxWidth } = require('./responsive');

    expect(getContentMaxWidth(500)).toBe(500);
    expect(getContentMaxWidth(800)).toBe(900);
    expect(getContentMaxWidth(1200)).toBe(1200);
  });

  it('computes expected padding on phone/tablet', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getContentPadding } = require('./responsive');

    expect(getContentPadding(500)).toBe(16);
    expect(getContentPadding(800)).toBe(24);
  });

  it('returns TV-safe padding when Platform.isTV = true', () => {
    jest.resetModules();

    jest.doMock('react-native', () => ({
      Dimensions: {
        get: () => ({ width: 1920, height: 1080 }),
      },
      Platform: {
        isTV: true,
      },
    }));

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getContentPadding } = require('./responsive');
    expect(getContentPadding(320)).toBe(24);
  });
});
