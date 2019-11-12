'use strict';
const Alexa = require('ask-sdk-core');
// use 'ask-sdk' if standard SDK module is installed
////////////////////////////////
// Code for the handlers here //
////////////////////////////////
exports.handler = Alexa.SkillBuilders.custom()
     .addRequestHandlers(LaunchRequestHandler, HelloWorldIntentHandler)
     .lambda();

     const LaunchRequestHandler = {
      canHandle(handlerInput) {
          return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
      },
      handle(handlerInput) {
          const speechText = 'Welcome to the Alexa Skills Kit, you can say hello!';
  return handlerInput.responseBuilder
              .speak(speechText)
              .reprompt(speechText)
              .withSimpleCard('Hello World', speechText)
              .getResponse();
      }
  };

const HelloWorldIntentHandler = {
  canHandle(handlerInput) {
      return handlerInput.requestEnvelope.request.type === 'IntentRequest'
          && handlerInput.requestEnvelope.request.intent.name === 'HelloWorldIntent';
  },
  handle(handlerInput) {
      const speechText = 'Hello World!';
return handlerInput.responseBuilder
          .speak(speechText)
          .withSimpleCard('Hello World', speechText)
          .getResponse();
  }
};