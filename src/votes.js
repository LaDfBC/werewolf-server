const { clone, pipe, curry } = require('ramda')
const pollsData = require('./data/pollData')
const polls = require('./polls')
const safeReturn = require('./safeReturn')

const _removeCurrentVote = (userId, pollOptions) =>
  Object.keys(pollOptions).reduce((accum, curr) => {
    return {
      ...accum,
      [curr]: {
        ...pollOptions[curr],
        votes: pollOptions[curr].votes.filter(v => v !== userId),
      },
    }
  }, {})

const _insertVote = curry((userId, optionValue, pollOptions) => {
  const clonedOptions = clone(pollOptions)
  clonedOptions[optionValue].votes.push(userId)
  return clonedOptions
})

const _removeAndInsertVote = (userId, optionValue, originalPollOptions) =>
  pipe(_removeCurrentVote, _insertVote(userId, optionValue))(
    userId,
    originalPollOptions
  )

const vote = async ({ channelId, userId, optionsString }) => {
  const pollResults = await polls.find({ channelId })
  // If there is an error just pass the safe return object through
  if (pollResults.error) {
    return pollResults
  }

  if (optionsString === '') {
    return safeReturn(new Error('Please provide a vote option'), null)
  }
  const { ts, poll: currentPoll } = pollResults.results

  const newPoll = Object.assign(
    {},
    {
      ...currentPoll,
      options: _removeAndInsertVote(
        userId,
        parseInt(optionsString, 10),
        currentPoll.options
      ),
    }
  )

  const saveResult = await pollsData.savePoll({ channelId, data: newPoll, ts })

  if (saveResult.error) {
    return saveResult
  }

  return safeReturn(null, newPoll)
}

const unvote = async ({ channelId, userId }) => {
  const pollResults = await polls.find({ channelId })
  // If there is an error just pass the safe return object through
  if (pollResults.error) {
    return pollResults
  }

  const currentPoll = pollResults.results
  const newPoll = Object.assign(
    {},
    {
      ...currentPoll,
      options: _removeCurrentVote(userId, currentPoll.options),
    }
  )

  const saveResult = await pollsData.savePoll({ channelId, data: newPoll })

  if (saveResult.error) {
    return saveResult
  }

  return safeReturn(null, newPoll)
}

module.exports = {
  vote,
  unvote,
}
