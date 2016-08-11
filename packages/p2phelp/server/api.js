// import { HelpDiscussionCreatedResponse } from './types';
class P2pHelpApi {

	/**
	 *
	 * @param bodyParams
	 * @throws Meteor.Error on invalid request
	 */
	static validateHelpDiscussionPostRequest(bodyParams) {
		// transport the user's information in the header, just like it's done in the RC rest-api

		if (!bodyParams) {
			throw new Meteor.Error('Post body empty');
		}

		if (!bodyParams.support_area || bodyParams.support_area.trim() === '') {
			throw new Meteor.Error('No support area defined');
		}

		if (!bodyParams.seeker || bodyParams.seeker.trim() === '') {
			throw new Meteor.Error('No user provided who is seeking help');
		}

		if (!bodyParams.providers || bodyParams.providers.length === 0) {
			throw new Meteor.Error('At least one user who could potentially help needs to be supplied');
		}

		if (!bodyParams.message || bodyParams.message.trim() === '') {
			throw new Meteor.Error('A message describing the question beends to be provided by the seeker');
		}
	}

	processHelpDiscussionPostRequest(bodyParams) {
		let environment = bodyParams.environment || {};
		let callbackUrl = bodyParams.callbackUrl || "";

		const creationResult = this._createHelpDiscussion(bodyParams.support_area, bodyParams.seeker, bodyParams.providers, bodyParams.message, environment, callbackUrl);

		//todo: record the helpdesk metadata

		return new p2ph.HelpDiscussionCreatedResponse(
			P2pHelpApi.getUrlForRoom(creationResult.room),
			creationResult.providers
		)
	}

	static getUrlForRoom(room) {
		const siteUrl = RocketChat.settings.get('Site_Url');

		return siteUrl + 'channel/' + room.name;
	}

	_findUsers(idsOrEmails) {
		const REGEX_OBJECTID = /^[a-f\d]{24}$/i;
		let potentialIds = [];
		let potentialEmails = [];

		let users = [];

		idsOrEmails.forEach((idOrEmail)=> {
			if (idOrEmail.match(REGEX_OBJECTID)) {
				potentialIds.push(idOrEmail);
			}

			if (idOrEmail.search('@') !== -1) {
				potentialEmails.push(idOrEmail);
			}
		});

		if (potentialEmails.length > 0) {
			users = users.concat(
				RocketChat.models.Users.findByEmailAddresses(potentialEmails).fetch()
			);
		}

		if (potentialEmails.length > 0) {
			users = users.concat(
				RocketChat.models.Users.findByIds(potentialIds).fetch()
			);
		}

		return users;

	}

	static getNextP2pHelpRoomCode() {
		const settingsRaw = RocketChat.models.Settings.model.rawCollection();
		const findAndModify = Meteor.wrapAsync(settingsRaw.findAndModify, settingsRaw);

		const query = {
			_id: 'P2pHelp_Room_Count'
		};

		const update = {
			$inc: {
				value: 1
			}
		};

		const P2pHelpCount = findAndModify(query, null, update);

		return P2pHelpCount.value;
	}

	/**
	 * Creates a new room and adds users who potential might be able to help
	 * @param seeker: The user looking for help. EMail-address and ID accepted
	 * @param providers: An array of Users who should join the conversation in order to resolve the question. EMail-addresses and IDs accepted
	 * @param message: The message describing the problematic situation
	 * @param environment: Context information about the current system-context of the seeker
	 * @param callback_url: An optional URL which shall be called on reply of a provider
	 * @private
	 */
	_createHelpDiscussion(support_area, seeker, providers, message, environment = {}, callback_url = "") {
		const seekerUser = this._findUsers([seeker])[0];
		const providerUsers = this._findUsers(providers);
		if (!seekerUser) {
			throw new Meteor.Error("Invalid user " + seeker + ' provided');
		}

		let channel = {};
		let helpRequest = {};
		try {
			Meteor.runAsUser(seekerUser._id, () => {
				channel = Meteor.call('createChannel', 'P2P-Help_' + P2pHelpApi.getNextP2pHelpRoomCode(), providerUsers.map((user) => user.username));
				const room = RocketChat.models.Rooms.findOneById(channel.rid);
				helpRequest = RocketChat.models.HelpRequests.createForSupportArea(support_area, channel.rid, message, environment);
				//propagate help-id to room in order to identify it as a "helped" room
				RocketChat.models.Rooms.addHelpRequestInfo(room, helpRequest._id);

				try {

					RocketChat.sendMessage({
						username: seekerUser.username,
						_id: seekerUser._id
					}, {msg: message}, {_id: channel.rid});

				} catch (err) {
					console.error('Could not add help message', err);
					throw new Meteor.Error(err);
				}
			});
		} catch (err) {
			//todo: Duplicate channel (same question): Join the seeker
			throw new Meteor.Error(err);
		}

		return {
			room: RocketChat.models.Rooms.findOne({_id: channel.rid}),
			providers
		};
	}
}

p2ph.P2pHelpApi = P2pHelpApi;
