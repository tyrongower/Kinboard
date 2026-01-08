describe('isTv', () => {
  it('returns true when Platform.isTV is true', () => {
    jest.resetModules();

    jest.doMock('react-native', () => ({
      Platform: {
        isTV: true,
      },
    }));

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { isTv, IS_TV } = require('./isTv');
    expect(isTv()).toBe(true);
    expect(IS_TV).toBe(true);
  });

  it('returns false when Platform.isTV is false', () => {
    jest.resetModules();

    jest.doMock('react-native', () => ({
      Platform: {
        isTV: false,
      },
    }));

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { isTv, IS_TV } = require('./isTv');
    expect(isTv()).toBe(false);
    expect(IS_TV).toBe(false);
  });

  it("returns true on Android when constants.uiMode is 'tv'", () => {
    jest.resetModules();

    jest.doMock('react-native', () => ({
      Platform: {
        OS: 'android',
        isTV: false,
        constants: {
          uiMode: 'tv',
        },
      },
    }));

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { isTv, IS_TV } = require('./isTv');
    expect(isTv()).toBe(true);
    expect(IS_TV).toBe(true);
  });

  it("returns false on Android when constants.uiMode is not 'tv'", () => {
    jest.resetModules();

    jest.doMock('react-native', () => ({
      Platform: {
        OS: 'android',
        isTV: false,
        constants: {
          uiMode: 'normal',
        },
      },
    }));

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { isTv, IS_TV } = require('./isTv');
    expect(isTv()).toBe(false);
    expect(IS_TV).toBe(false);
  });
});
