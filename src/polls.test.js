const poll = require('./polls')
const pollData = require('./data/pollData')
const blockBuilder = require('./blockBuilder')

describe('formatPoll', () => {
  it('should return a poll formatted into blocks', () => {
    // arrange
    jest
      .spyOn(blockBuilder, 'titleBlock')
      .mockImplementation(({ title }) => ({ title }))

    jest
      .spyOn(blockBuilder, 'divider')
      .mockImplementation(() => ({ divider: 'here' }))

    jest
      .spyOn(blockBuilder, 'optionBlock')
      .mockImplementation(({ option, optionKey }) => [
        { key: optionKey },
        { elements: option.votes },
      ])

    const expected = [
      { title: 'Hello World' },
      { divider: 'here' },
      { key: '1' },
      { elements: ['Vote 1', 'Vote 2'] },
      { key: '2' },
      { elements: ['Vote 3', 'Vote 4'] },
    ]

    const mockPoll = {
      channelId: '12345',
      title: 'Hello World',
      options: {
        1: {
          text: 'Option 1',
          votes: ['Vote 1', 'Vote 2'],
        },
        2: {
          text: 'Option 2',
          votes: ['Vote 3', 'Vote 4'],
        },
      },
    }

    // act
    const actual = poll.formatPollDisplay({ poll: mockPoll })

    // assert
    expect(actual).toEqual(expected)
  })
})

describe('createPoll', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should should return a poll object if all went well', async () => {
    // arrange
    const expected = {
      channelId: '12345',
      title: 'Test Poll',
      options: {
        1: {
          text: 'Option 1',
          votes: [],
        },
        2: {
          text: 'Option 2',
          votes: [],
        },
      },
    }

    jest
      .spyOn(pollData, 'findPoll')
      .mockImplementation(() =>
        Promise.resolve({ error: 'Mock Error', results: null })
      )

    const optionsString = '“Test Poll” Option 1, Option 2'

    // act
    const actual = await poll.create({ channelId: '12345', optionsString })
    // assert
    expect(actual.results).toEqual(expected)
  })

  it('should return an error if a channelId is undefined', async () => {
    // arrange
    jest
      .spyOn(pollData, 'findPoll')
      .mockImplementation(() => Promise.resolve({ error: null, results: {} }))

    // act
    const actual = await poll.create({
      channelId: undefined,
      optionsString: 'does not matter',
    })
    // assert
    expect(actual.error.message).toBe('channelId is required')
  })

  it('should return an error if a poll is found', async () => {
    // arrange
    jest
      .spyOn(pollData, 'findPoll')
      .mockImplementation(() =>
        Promise.resolve({ error: null, results: { something: '1234' } })
      )

    // act
    const actual = await poll.create({
      channelId: '12345',
      optionsString: 'does not matter',
    })

    // assert
    expect(actual.error.message).toBe('Poll already exists for this channel')
  })

  it('should return an error if options are not property formatted', async () => {
    // arrange
    jest
      .spyOn(pollData, 'findPoll')
      .mockImplementation(() =>
        Promise.resolve({ error: 'Mock Error', results: null })
      )

    // act
    const actual = await poll.create({
      channelId: '12345',
      optionsString: 'does not matter',
    })

    // assert
    expect(actual.error.message).toBe(
      'Poll not properly formatted. Please used "Poll Title Text" Option 1, Option 2...'
    )
  })
})
