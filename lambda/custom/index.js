'use strict';

const https = require('https');
const Alexa = require('ask-sdk-core');

let hospitalName = 'morriston';

////////////////////////////////
// Code for the handlers here //
////////////////////////////////

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speechText = 'Welcome to Hospital Parking. Where do you want to check parking?!';
        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .withSimpleCard('Hello 1234 World', speechText)
            .getResponse();
    }
};

const HelloWorldIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'HelloWorldIntent';
    },
    handle(handlerInput) {
        const speechText = 'Hello 1234 World!';
        return handlerInput.responseBuilder
            .speak(speechText)
            .withSimpleCard('Hello 1234 World', speechText)
            .getResponse();
    }
};

const DynamoIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'DynamoIntent';
    },
    handle(handlerInput) {
        //TODO Dynamic endpoint based on what was said!!
        https.get('https://i2yv4ll3q7.execute-api.eu-west-1.amazonaws.com/hack/space/current/' + hospitalName, (resp) => {
            let data = '';

            resp.on('data', (chunk) => {
                data += chunk;
            });

            resp.on('end', () => {
                if (resp.statusCode === 200) {
                    try {
                        const speechOutput = decodeParkingResponse(JSON.parse(data));
                        return handlerInput.responseBuilder.speak(speechOutput);
                    } catch (e) {
                        return ErrorHandler.handle(handlerInput, {"message": "I'm having trouble understanding the response. Please try again later."})
                    }
                }

                return ErrorHandler.handle(handlerInput, {"message": "I'm unable to get the data right now. Please try again later."})
            });
        }).on("error", (err) => {
            return ErrorHandler.handle(handlerInput, err)
        });
    }
};

const HospitalParkingIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'HospitalParkingIntent';
    },
    handle(handlerInput) {
        const speechText = 'There is a car park';
        return handlerInput.responseBuilder
            .speak(speechText)
            .withSimpleCard('Parking', speechText)
            .getResponse();
    }
};

const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`Error handled: ${error.message}`);
        return handlerInput.responseBuilder
            .speak("Sorry, I didn't understand. Please try again.")
            .reprompt("Sorry, I didn't understand. Please try again.")
            .getResponse();
    },
};

//////////////////////
// Helper functions //
//////////////////////

function decodeParkingResponse(jsonData) {
    console.log(jsonData);
    const name = jsonData.name;
    const areas = jsonData.parking_areas;
    const total = jsonData.total_space;

    let areaSpeech = "";
    if (areas !== null && areas !== 'undefined') {
        areas.forEach(function (area) {
            const speech = "In the " + area.name + " car park, there are " + area.spaces + " spaces remaining.";
            areaSpeech += speech;
        });
    }

    return "In " + name + " hospital, there are " + total + " spaces remaining.\n\n" + areaSpeech;
}

////////////////////////////////////
// Set up handlers within the DSK //
////////////////////////////////////

const skillBuilder = Alexa.SkillBuilders.custom();
exports.handler = skillBuilder
    .addRequestHandlers(
        LaunchRequestHandler,
        HelloWorldIntentHandler,
        HospitalParkingIntentHandler,
        DynamoIntentHandler
    )
    .addErrorHandlers(ErrorHandler)
    .lambda();
