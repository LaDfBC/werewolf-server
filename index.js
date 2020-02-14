// Import express and request modules
require('dotenv').config()
const express = require('express')
const request = require('request')

const polls = require('./src/polls')
const slackResponses = require('./src/slackResponses')
const validateRequest = require('./src/validateRequest')
const votes = require('./src/votes')
const commandHandler = require('./src/commandHandler')

// Store our app's ID and Secret. These we got from Step 1.
// For this tutorial, we'll keep your API credentials right here. But for an actual app, you'll want to  store them securely in environment variables.
const clientId = process.env.CLIENT_ID
const clientSecret = process.env.CLIENT_SECRET

// Instantiates Express and assigns our app variable to it
const app = express()

app.use(
  express.urlencoded({
    extended: true,
    verify: (req, res, buf) => {
      req.rawBody = buf
    },
  })
)

// Again, we define a port we want to listen to
const PORT = process.env.PORT || 4390

// Lets start our server
app.listen(PORT, () => {
  //Callback triggered when server is successfully listening. Hurray!
  console.log('Example app listening on port ' + PORT)
})

// This route handles GET requests to our root ngrok address and responds with the same "Ngrok is working message" we used before
app.get('/', (req, res) => {
  res.send('Werewolf server is running' + req.url)
})

// This route handles get request to a /oauth endpoint. We'll use this endpoint for handling the logic of the Slack oAuth process behind our app.
app.get('/oauth', (req, res) => {
  // When a user authorizes an app, a code query parameter is passed on the oAuth endpoint. If that code is not there, we respond with an error message
  if (!req.query.code) {
    res.status(500)
    res.send({ Error: "Looks like we're not getting code." })
    console.log("Looks like we're not getting code.")
  } else {
    // If it's there...

    // We'll do a GET call to Slack's `oauth.access` endpoint, passing our app's client ID, client secret, and the code we just got as query parameters.
    request(
      {
        url: 'https://slack.com/api/oauth.access', //URL to hit
        qs: {
          code: req.query.code,
          client_id: clientId,
          client_secret: clientSecret,
        }, //Query string data
        method: 'GET', //Specify the method
      },
      (error, response, body) => {
        if (error) {
          console.log(error)
        } else {
          res.json(body)
        }
      }
    )
  }
})

// Route the endpoint that our slash command will point to and send back a simple response to indicate that ngrok is working
app.post('/werewolf', validateRequest, async (req, res) => {
  console.log(req.body)
  const { user_id: userId, channel_id: channelId, text } = req.body

  const splitText = text.split(' ')
  const command = splitText.shift()
  const optionsString = splitText.join(' ')

  let message = {}
  let result = {}
  switch (command.toLowerCase()) {
    case 'poll':
      // result = await polls.create({ channelId, optionsString })

      // message = result.error
      //   ? slackResponses.errorResponse({ error: result.error })
      //   : slackResponses.publicResponse({
      //       blocks: polls.formatPollDisplay({ poll: result.results }),
      //     })
      // // create poll in channel
      commandHandler.poll({ channelId, optionsString, userId })
      return res.status(200).send()
    case 'results':
      result = await polls.find({ channelId })
      message = result.error
        ? slackResponses.errorResponse({ error: result.error })
        : slackResponses.privateResponse({
            blocks: polls.formatPollDisplay({ poll: result.results.poll }),
          })
      // format results and return
      break
    case 'vote':
      result = await votes.vote({ channelId, userId, optionsString })
      message = result.error
        ? slackResponses.errorResponse({ error: result.error })
        : slackResponses.privateResponse({
            text: 'Your vote has been recorded!',
          })
      break
    case 'unvote':
      result = await votes.unvote({ channelId, userId })
      message = result.error
        ? slackResponses.errorResponse({ error: result.error })
        : slackResponses.privateResponse({
            text: 'Your vote has been removed!',
          })
      // remove my vote
      break
    case 'close':
      result = await polls.close({ channelId })
      message = result.error
        ? slackResponses.errorResponse({ error: result.error })
        : slackResponses.publicResponse({
            blocks: polls.formatPollDisplay({ poll: result.results.poll }),
          })
      // delete poll
      break
    default:
      message = slackResponses.errorResponse(new Error('Unknown command'))
  }

  console.log(message)
  if (message) return res.status(200).json(message)
})
