const Alexa = require('ask-sdk-core');
var https = require('https');

const userId = 'field intentionally left blank'
const clientId = 'field intentionally left balnk'

const STREAMS = [
  {
     token: '1',
     metadata: {
      title: 'I Would Like to Say, by Goran Mihajlovski',
      subtitle: 'I Would Like to Say, a podcast by Goran Mihajlovski is available to you since January 92',
      art: {
        sources: [
          {
            contentDescription: 'goran mihailovski logo',
            url: 'https://sdk.mk/wp-content/uploads/2015/12/goran-mihailovski2.jpg',
            widthPixels: 190,
            heightPixels: 175,
          },
        ],
      },
    },
  },
];

function httpGet(pathURL) {
  return new Promise(((resolve, reject) => {
    var options = {
        host: 'api.soundcloud.com',
        path: pathURL,
        method: 'GET',
    };
    
    const request = https.request(options, (response) => {
      response.setEncoding('utf8');
      let returnData = '';

      response.on('data', (chunk) => {
        returnData += chunk;
      });

      response.on('end', () => {
        resolve(JSON.parse(returnData));
      });

      response.on('error', (error) => {
        reject(error);
      });
    });
    request.end();
  }));
}

const PlayStreamIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest'
      || handlerInput.requestEnvelope.request.type === 'IntentRequest'
        && (
          handlerInput.requestEnvelope.request.intent.name === 'PlayStreamIntent'
          || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.ResumeIntent'
          || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.LoopOnIntent'
          || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.NextIntent'
          || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.PreviousIntent'
          || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.RepeatIntent'
          || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.ShuffleOnIntent'
          || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StartOverIntent'
        );
  },
  async handle(handlerInput) {
    const stream = STREAMS[0];
    const getAllTracksResponse = await httpGet(`/users/${userId}/tracks?client_id=${clientId}`);
    const latestTrackId = getAllTracksResponse.sort((a, b) => (a.created_at < b.created_at) ? 1 : -1)[0].id;
    const loactionPath = `/tracks/${latestTrackId}/stream?client_id=${clientId}`;
    const locationResponse = await httpGet(loactionPath);

    handlerInput.responseBuilder
      .speak(`starting ${stream.metadata.title}`)
      .addAudioPlayerPlayDirective('REPLACE_ALL', locationResponse.location, stream.token, 0, null, stream.metadata);

    return handlerInput.responseBuilder
      .getResponse();
  },
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speechText = 'This skill plays Goran Mihajlovski\'s I would like to Say podast when it is started. It does not have any additional functionality.';

    return handlerInput.responseBuilder
      .speak(speechText)
      .getResponse();
  },
};

const AboutIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AboutIntent';
  },
  handle(handlerInput) {
    const speechText = 'This skill plays Goran Mihajlovski\'s SI would like to say column when it is started. To continue listening say: resume, or say: stop to stop listening.';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  },
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
        && (
          handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent'
          || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.PauseIntent'
          || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
          || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.LoopOffIntent'
          || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.ShuffleOffIntent'
        );
  },
  handle(handlerInput) {
    handlerInput.responseBuilder
      .addAudioPlayerClearQueueDirective('CLEAR_ALL')
      .addAudioPlayerStopDirective();

    return handlerInput.responseBuilder
      .getResponse();
  },
};

const PlaybackStoppedIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'PlaybackController.PauseCommandIssued'
            || handlerInput.requestEnvelope.request.type === 'AudioPlayer.PlaybackStopped';
  },
  handle(handlerInput) {
    handlerInput.responseBuilder
      .addAudioPlayerClearQueueDirective('CLEAR_ALL')
      .addAudioPlayerStopDirective();

    return handlerInput.responseBuilder
      .getResponse();
  },
};

const PlaybackStartedIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'AudioPlayer.PlaybackStarted';
  },
  handle(handlerInput) {
    handlerInput.responseBuilder
      .addAudioPlayerClearQueueDirective('CLEAR_ENQUEUED');

    return handlerInput.responseBuilder
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder
      .getResponse();
  },
};

const ExceptionEncounteredRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'System.ExceptionEncountered';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return true;
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);
    console.log(handlerInput.requestEnvelope.request.type);
    return handlerInput.responseBuilder
      .getResponse();
  },
};

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
  .addRequestHandlers(
    PlayStreamIntentHandler,
    PlaybackStartedIntentHandler,
    CancelAndStopIntentHandler,
    PlaybackStoppedIntentHandler,
    AboutIntentHandler,
    HelpIntentHandler,
    ExceptionEncounteredRequestHandler,
    SessionEndedRequestHandler,
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
