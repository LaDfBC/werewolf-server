const Redis = require('ioredis')
const safeReturn = require('./../safeReturn')
const util = require('util')
const redis = new Redis(process.env.REDIS_URL)

const findPoll = async ({ channelId }) => {
  try {
    const file = await redis.get(channelId)
    if (file) {
      console.log(util.inspect(file, { showHidden: false, depth: null }))
      return safeReturn(null, JSON.parse(file))
    } else {
      throw new Error('No poll exists for this channel.')
    }
  } catch (error) {
    console.error(error)
    return safeReturn(error)
  }
}

const savePoll = async ({ channelId, data, ts }) => {
  try {
    await redis.set(channelId, JSON.stringify({ ts, poll: data }))
    return safeReturn(null, true)
  } catch (error) {
    console.error(error)
    return safeReturn(error)
  }
}

const deletePoll = async ({ channelId }) => {
  try {
    const result = await redis.del(channelId)
    return safeReturn(null, result)
  } catch (error) {
    console.error(error)
    return safeReturn(error)
  }
}

module.exports = {
  findPoll,
  savePoll,
  deletePoll,
}
