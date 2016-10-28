/**
 * Restful API endpoints for interaction with external systems
 */

// import {p2ph.P2pHelpApi} from './api';
// import {Restivus} from 'nimble:restivus';

const API = new Restivus({
	apiPath: 'p2p-help/',
	useDefaultAuth: true,
	prettyJson: true
});


function keysToUpperCase(obj) {
	for (let prop in obj){
		if(typeof obj[prop] === "object"){
			obj[prop] = keysToUpperCase(obj[prop]);
		}
		if(prop != prop.toUpperCase()){
			obj[prop.toUpperCase()] = obj[prop];
			delete obj[prop];
		}
	}
	return obj;
}

function keysToLowerCase(obj) {
	for (let prop in obj){
		if(typeof obj[prop] === "object"){
			obj[prop] = keysToLowerCase(obj[prop]);
		}
		if(prop != prop.toLowerCase()){
			obj[prop.toLowerCase()] = obj[prop];
			delete obj[prop];
		}
	}
	return obj;
}

function preProcessBody(body) {
	body = keysToLowerCase(body);
	// Extract properties from the load encapsulated in an additional REQUEST-object
	if (body.request) {
		for (let key in body.request){
			body[key] = body.request[key];
		}
		delete body.request;
	}

	//dereference references
	for (let key in body){
		if(typeof body[key] === 'object'){
			for (let prop in body[key]){
				if( prop === "%ref") {
					let refId = body[key][prop].replace(/\#/, "");
					body[key] = body["%heap"][refId]["%val"];
				}
			}
		}
	}
	delete body["%heap"];
}

API.addRoute('helpDiscussion', {
	/**
	 * Creates a room with an initial question and adds users who could possibly help
	 * @see packages\rocketchat-api\server\routes.coffee
	 * @return {*} statusCode 40x on error or  200 and information on the created room on success
	 */
	post() {

		// keysToLowerCase(this.bodyParams);
		preProcessBody(this.bodyParams);

		const api = new p2ph.P2pHelpApi();
		try {
			p2ph.P2pHelpApi.validateHelpDiscussionPostRequest(this.bodyParams)
		} catch (err) {
			console.log('P2PHelp rejected malformed request:', JSON.stringify(this.request.body, " ", 2));
			throw new Meteor.Error('Malformed request:' + JSON.stringify(err, " ", 2));
		}

		// if (!this.request.headers['X-Auth-Token'])) { //todo: Check authorization - or is this done by Restivus once setting another parameter?
		// 	return {statusCode: 401, message: "Authentication failed."};
		// }

		const creationResult = api.processHelpDiscussionPostRequest(this.bodyParams);

		return {
			status_code: 200,
			result: creationResult,
			RESULT: keysToUpperCase(creationResult)
		}
	}
});
