const polls = require('./polls')
const pollData = require('./data/pollData')
const slackResponses = require('./slackResponses')
const votes = require('./votes')
const slackChatApi = require('./slackChatApi')
const safeReturn = require('./safeReturn')

const poll = async ({ channelId, optionsString, userId }) => {
  try {
    const { error: pollCreateError, results: poll } = await polls.create({
      channelId,
      optionsString,
    })

    if (pollCreateError) {
      await slackChatApi.postEphemeral({
        channelId,
        text: pollCreateError.message,
        userId: userId,
      })

      return
    }

    const blocks = polls.formatPollDisplay({ poll })
    const {
      error: messageError,
      results: messageResponse,
    } = await slackChatApi.postMessage({
      channelId,
      blocks,
    })

    if (messageError) {
      await slackChatApi.postEphemeral({
        channelId,
        text: messageError.error.message,
        userId: userId,
      })

      return
    }

    const { error: saveError } = await pollData.savePoll({
      channelId,
      data: poll,
      ts: messageResponse.ts,
    })

    if (saveError) {
      await slackChatApi.postEphemeral({
        channelId,
        text: saveError.message,
        userId: userId,
      })

      return
    }
  } catch (e) {
    console.log(e)
  }
}

module.exports = { poll }
