#  Parkly parking


## About



### Usage



### Repository Contents
* `/.ask`	- [ASK CLI (Command Line Interface) configuration](https://developer.amazon.com/docs/smapi/ask-cli-intro.html)	 
* `/lambda/custom` - Back-end logic for the Alexa Skill hosted on [AWS Lambda](https://aws.amazon.com/lambda/)
* `/models/en-GB.json` - ASK CLI interaction model for UK English
* `skill.json`	- [Skill Manifest](https://developer.amazon.com/docs/smapi/skill-manifest.html)

## Setup w/ ASK CLI

### Pre-requisites

* Node.js (> v4.3)
* Register for an [AWS Account](https://aws.amazon.com/)
* Register for an [Amazon Developer Account](https://developer.amazon.com/)
* Install and setup [ASK CLI](https://developer.amazon.com/docs/smapi/quick-start-alexa-skills-kit-command-line-interface.html)

### Installation
1. Clone the repository.

2. Initialize the [ASK CLI](https://developer.amazon.com/docs/smapi/quick-start-alexa-skills-kit-command-line-interface.html) by navigating into the repository and running npm command: `ask init`. Follow the prompts.

	```bash
	$ ask init
	```

3. Install npm dependencies by navigating into the `lambda/custom` directory and running the npm command: `npm install`

	```bash
	$ cd lambda/custom
	$ npm install
	```


### Deployment

ASK CLI will create the skill and the Lambda function for you. The Lambda function will be created in ```eu-east-1 (Ireland)``` by default.

1. Deploy the skill and the Lambda function in one step by running the following command:

	```bash
	$ ask deploy
	```

### Testing

1. Log in to the [Alexa Developer Console](https://developer.amazon.com/edw/home.html#/skills), open your skill, and from the **Test** tab enable the **Test switch**.

2. Simulate verbal interaction with your skill through the command line using the following example:

	```bash
	 $ ask simulate -l en-GB -t "start Hospital Parking"

	 ✓ Simulation created for simulation id: 4a7a9ed8-94b2-40c0-b3bd-fb63d9887fa7
	◡ Waiting for simulation response{
	  "status": "SUCCESSFUL",
	  ...
	 ```

3. With the **Test switch** enabled, your skill can also be tested on devices associated with your developer account. Speak to Alexa through any enabled physical device, through your browser with [echosim.io](https://echosim.io/welcome), or through your Amazon Mobile App and say:

	```text
	start Parkly
	```

## Customization

1. Amend ```./skill.json```

	Change the skill name, example phrase, icons, testing instructions, etc ...

	Remember that interaction models are locale-specific and must be changed for each locale (en-US, en-GB, de-DE, etc.).

	See the Skill [Manifest Documentation](https://developer.amazon.com/docs/smapi/skill-manifest.html) for more information.

2. Amend ```./lambda/custom/index.js```

	Modify messages, and facts from the source code to customize the skill.

3. Amend ```./models/*.json```

	Change the model definition to replace the invocation name and the sample phrase for each intent.  Repeat the operation for each locale you are planning to support.
