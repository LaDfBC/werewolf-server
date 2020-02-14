const axios = require('axios')
const safeReturn = require('./safeReturn')

const _getAxiosInstance = () =>
  axios.create({
    baseURL: 'https://slack.com/api',
    headers: {
      ContentType: 'application/json; charset=utf-8',
      Authorization: `Bearer ${process.env.BOT_TOKEN}`,
    },
  })

const _handleResponse = ({ channelId, response }) => {
  const { data } = response

  if (data.ok) {
    return safeReturn(null, {
      channelId,
      ts: data.ts,
    })
  } else {
    throw new Error(data.error)
  }
}

const postMessage = async ({ channelId, text, blocks }) => {
  try {
    return _handleResponse({
      channelId,
      response: await _getAxiosInstance().post('chat.postMessage', {
        channel: channelId,
        text,
        blocks: blocks && JSON.stringify(blocks),
      }),
    })
  } catch (error) {
    console.log(error)
    return safeReturn(error)
  }
}

const postEphemeral = async ({ channelId, text, blocks, userId }) => {
  try {
    return _handleResponse({
      channelId,
      response: await _getAxiosInstance().post('chat.postEphemeral', {
        channel: channelId,
        user: userId,
        text,
        blocks: blocks && JSON.stringify(blocks),
      }),
    })
  } catch (error) {
    console.log(error)
    safeReturn(error)
  }
}

const updateMessage = async ({ channelId, text, blocks, ts }) => {
  try {
    return _handleResponse({
      channelId,
      response: await _getAxiosInstance().post('chat.update', {
        channel: channelId,
        text,
        blocks: blocks && JSON.stringify(blocks),
        ts,
      }),
    })
  } catch (error) {
    console.log(error)
    safeReturn(error)
  }
}

module.exports = {
  postMessage,
  updateMessage,
  postEphemeral,
}
