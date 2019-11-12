'use strict';

const https = require('https');
const Alexa = require('ask-sdk-core');
const { getSlotValue } = require('ask-sdk-core');

////////////////////////////////
// Code for the handlers here //
////////////////////////////////

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speechText = 'Welcome to Hospital Parking. Where do you want to check parking?';
        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    }
};

//{i want to|is there|are there|any|can i|how many|how much|}{park|parking|space|spaces|}{is|are|}{at|in|by|}{{hospital}}{hospital|}
const HospitalParkingIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'HospitalParkingIntent';
    },
    async handle(handlerInput) {
        let speechOutput;
        let textOutput;
        const hospitalName = getSlotValue(handlerInput.requestEnvelope, 'hospital');

        await getCurrentSpaces(hospitalName)
            .then((response) => {
                console.log(response);
                speechOutput = response.speech;
                textOutput = response.text;
            })
            .catch((err) => {
                ErrorHandler.handle(handlerInput, err);
            });

        return handlerInput.responseBuilder
            .speak(speechOutput)
            .withSimpleCard(textOutput.name + " hospital", textOutput.text)
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
    }
};

//////////////////////
// Helper functions //
//////////////////////

function getCurrentSpaces(hospital) {
    return new Promise((resolve, reject) => {
        https.get('https://i2yv4ll3q7.execute-api.eu-west-1.amazonaws.com/hack/space/current/' + hospital, (resp) => {
            let data = '';

            resp.on('data', (chunk) => {
                data += chunk;
            });
            resp.on('end', () => {
                if (resp.statusCode === 200) {
                    try {

                        resolve({
                            "speech": decodeParkingResponseSpeech(JSON.parse(data)),
                            "text": decodeParkingResponseText(JSON.parse(data))
                        });
                    } catch (e) {
                        reject({"message": "I'm having trouble understanding the response. Please try again later."});
                    }
                }
                reject({"message": "I'm unable to get the data right now. Please try again later."});
            });
        }).on("error", (err) => {
            reject(err);
        });
    });
}

function decodeParkingResponseSpeech(jsonData) {
    const  hospitalName = jsonData.name;
    const areas = jsonData.parking_areas;
    const totalSpaces = jsonData.total_space;

    if (totalSpaces === 0) {
        return "All car parking spaces are full at " + hospitalName + " hospital.";
    }

    let areaSpeech = "";
    if (areas !== null && areas !== 'undefined') {
        areas.forEach(function (area) {
            const speech = "In the " + area.name + " car park, there are " + area.spaces + " spaces. ";
            areaSpeech = areaSpeech + speech;
        });
    }
    return "In " + hospitalName + " hospital, there are " + totalSpaces + " spaces remaining.\n\n" + areaSpeech;
}

function decodeParkingResponseText(jsonData) {
    let hospitalName = jsonData.name;
    hospitalName = hospitalName[0].toUpperCase() + hospitalName.slice(1);
    const areas = jsonData.parking_areas;
    const totalSpaces = jsonData.total_space;

    if (totalSpaces === 0) {
        return "All car parking spaces are full at " + hospitalName + " hospital.";
    }

    let areaSpeech = "";
    if (areas !== null && areas !== 'undefined') {
        areas.forEach(function (area) {
            areaSpeech = areaSpeech + area.name + " car park: " + area.spaces + "\n";
        });
    }

    return {
        "name": hospitalName,
        "text": totalSpaces + " total spaces\n\n" + areaSpeech
    };
}

////////////////////////////////////
// Set up handlers within the DSK //
////////////////////////////////////

const skillBuilder = Alexa.SkillBuilders.custom();
exports.handler = skillBuilder
    .addRequestHandlers(
        LaunchRequestHandler,
        HospitalParkingIntentHandler
    )
    .addErrorHandlers(ErrorHandler)
    .lambda();
