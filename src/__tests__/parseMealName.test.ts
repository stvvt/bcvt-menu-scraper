import { parseMealName } from '../utils/parseMealName';

const createMock = jest.fn();
const mockClient: any = {
  chat: {
    completions: {
      create: (...args: unknown[]) => createMock(...args),
    },
  },
};

describe('parseMealName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('extracts quantity into weight and unit', async () => {
    createMock.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              name: 'Бяла чабата',
              weight: 120,
              unit: 'гр',
              subtitle: null,
            }),
          },
        },
      ],
    });

    const result = await parseMealName('Бяла чабата 120г', 'gpt-4.1-mini', mockClient);

    expect(result).toEqual({
      name: 'Бяла чабата',
      weight: 120,
      unit: 'гр',
    });
  });

  it('extracts subtitle from ingredient parentheses', async () => {
    createMock.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              name: 'Таратор',
              weight: null,
              unit: null,
              subtitle: 'копър, орехи, чесън',
            }),
          },
        },
      ],
    });

    const result = await parseMealName('Таратор (копър, орехи, чесън)', 'gpt-4.1-mini', mockClient);

    expect(result).toEqual({
      name: 'Таратор',
      subtitle: 'копър, орехи, чесън',
    });
  });

  it('extracts both quantity and subtitle when present', async () => {
    createMock.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              name: 'Салата Бурата',
              weight: 400,
              unit: 'g',
              subtitle: 'розови домати, печен патладжан, рукола, песто босилек',
            }),
          },
        },
      ],
    });

    const result = await parseMealName(
      'Салата Бурата 400гр (розови домати, печен патладжан, рукола, песто босилек)',
      'gpt-4.1-mini',
      mockClient
    );

    expect(result).toEqual({
      name: 'Салата Бурата',
      weight: 400,
      unit: 'гр',
      subtitle: 'розови домати, печен патладжан, рукола, песто босилек',
    });
  });

  it('falls back safely on malformed model output', async () => {
    createMock.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: 'not-json',
          },
        },
      ],
    });

    const rawName = 'Пълнозърнеста багета 120гр';
    const result = await parseMealName(rawName, 'gpt-4.1-mini', mockClient);

    expect(result).toEqual({ name: rawName });
  });
});
