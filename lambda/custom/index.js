'use strict';

const https = require('https');
const Alexa = require('ask-sdk-core');
const {getSlotValue} = require('ask-sdk-core');

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

//{how many|will there be|how much}{park|parking|space|spaces|}{will there|is there|}{be|at|on|}{{time}|{date}|{hospital}|}{hospital|}{on|at|during|}{{time}|{date}|{hospital}|}{on|}{{time}|{date}|{hospital}|}
const HospitalPredictParkingIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'HospitalPredictParkingIntent';
    },
    async handle(handlerInput) {
        let speechOutput;
        let textOutput;
        const hospitalName = getSlotValue(handlerInput.requestEnvelope, 'hospital');
        const day = getSlotValue(handlerInput.requestEnvelope, 'day');
        const time = getSlotValue(handlerInput.requestEnvelope, 'time');

        await getPredictedSpaces(hospitalName, day, time)
            .then((response) => {
                speechOutput = response.speech;
                textOutput = response.text;
            })
            .catch((err) => {
                ErrorHandler.handle(handlerInput, err);
            });

        console.log("Got here");
        console.log(speechOutput);
        console.log(textOutput.name);
        console.log(textOutput.text);

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
                reject(e);
            });
        }).on("error", (err) => {
            reject(err);
        });
    });
}


function getPredictedSpaces(hospital, dateTest, timeTime) {
    return new Promise((resolve, reject) => {
        const url = 'https://i2yv4ll3q7.execute-api.eu-west-1.amazonaws.com/hack/space/predict/' + hospital + '/' + dateTest + 'T' + timeTime;
        console.log(url);
        https.get(url, (resp) => {
            let data = '';

            resp.on('data', (chunk) => {
                data += chunk;
            });
            resp.on('end', () => {
                if (resp.statusCode === 200) {
                    console.log(data);
                    try {
                        resolve({
                            "speech": decodePredictiveParkingResponseSpeech(JSON.parse(data)),
                            "text": decodePredictiveParkingResponseText(JSON.parse(data))
                        });
                    } catch (e) {
                        reject(e);
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
    const hospitalName = jsonData.name;
    const areas = jsonData.parking_areas;
    const totalSpaces = jsonData.total_space;

    if (totalSpaces === 0) {
        return "All car parking spaces are full at " + hospitalName + " hospital.";
    }

    let areaSpeech = "";
    if (areas !== null && areas !== 'undefined') {
        areas.forEach(function (area) {
            const speech = "In the " + area.name + " car park, there are " + spacesToText(area.spaces) + ". ";
            areaSpeech = areaSpeech + speech;
        });
    }
    return "In " + hospitalName + " hospital, there are " + spacesToText(totalSpaces) + " remaining.\n\n" + areaSpeech;
}

function decodePredictiveParkingResponseSpeech(jsonData) {
    const hospitalName = jsonData.name;
    const areas = jsonData.parking_area;
    const totalSpaces = jsonData.predicted_space;
    const dateTime = jsonData.time;
    const confidence = jsonData.confidence;
    const reason = jsonData.reason;

    const date = dateTime.split("T")[0];
    const time = dateTime.split("T")[1];

    const dateSpeech = `<say-as interpret-as="date" format="ymd">` + date + `</say-as>`;

    if (totalSpaces === 0) {
        return "I am " + formatPercentageSpeech(confidence) + " confident all car parking spaces will be full at " + hospitalName + " hospital at " + time + " on " + dateSpeech;
    }

    let areaSpeech = "";
    if (areas !== null && areas !== 'undefined') {
        areas.forEach(function (area) {
            const speech = "In the " + area.name + " car park, there will be " + spacesToText(area.spaces) + ". ";
            areaSpeech = areaSpeech + speech;
        });
    }

    let speechOutput = "In " + hospitalName + " hospital on " + dateSpeech + " at " + timeSpeech + ", I am " + formatPercentageSpeech(confidence) + " confident there will be " + spacesToText(totalSpaces) + " remaining.\n\n" + areaSpeech;

    if (reason) {
        speechOutput = speechOutput + "\n\nPlease note: " + reason;
    }

    return speechOutput;
}

function decodeParkingResponseText(jsonData) {
    let hospitalName = jsonData.name;
    hospitalName = hospitalName[0].toUpperCase() + hospitalName.slice(1);
    const areas = jsonData.parking_area;
    const totalSpaces = jsonData.total_space;

    if (totalSpaces === 0) {
        return {
            "name": hospitalName,
            "text": "All car parking spaces are full at " + hospitalName + " hospital."
        }
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

function decodePredictiveParkingResponseText(jsonData) {
    let hospitalName = jsonData.name;
    hospitalName = hospitalName[0].toUpperCase() + hospitalName.slice(1);
    const areas = jsonData.parking_areas;
    const totalSpaces = jsonData.predicted_space;
    const dateTime = jsonData.time;
    const confidence = jsonData.confidence;

    const date = dateTime.split("T")[0];
    const time = dateTime.split("T")[1];

    if (totalSpaces === 0) {
        return {
            "name": hospitalName,
            "text": "There will be no car parking spaces available at " + hospitalName + " at " + time + " on " + date + " (" + confidence + "% confident)"
        }
    }

    let areaSpeech = "";
    if (areas !== null && areas !== 'undefined') {
        areas.forEach(function (area) {
            areaSpeech = areaSpeech + area.name + " car park: " + area.spaces + "\n";
        });
    }

    return {
        "name": hospitalName,
        "text": totalSpaces + " total spaces at " + time + " on " + date + "\n\n" + areaSpeech + "\n\n"
    };
}

function spacesToText(spaces) {
    if (!spaces) {
        return "zero spaces";
    }
    if (spaces === 1) {
        return spaces + " space";
    }
    return spaces + " spaces";
}

function formatPercentageSpeech(percentage) {
    return percentage + " percent";
}

////////////////////////////////////
// Set up handlers within the DSK //
////////////////////////////////////

const skillBuilder = Alexa.SkillBuilders.custom();
exports.handler = skillBuilder
    .addRequestHandlers(
        LaunchRequestHandler,
        HospitalParkingIntentHandler,
        HospitalPredictParkingIntentHandler
    )
    .addErrorHandlers(ErrorHandler)
    .lambda();
