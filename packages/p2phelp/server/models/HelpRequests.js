class HelpRequest extends RocketChat.models._Base {
	constructor() {
		super();
		this._initModel('helpRequest');

		this.tryEnsureIndex({'roomId': 1}, {unique: 1, sparse: 1});
		this.tryEnsureIndex({'supportArea': 1});
	}

//-------------------------- FIND ONE
	findOneById(_id, options) {
		const query = {id: _id};
		return this.findOne(query, options);
	}

	findOneByRoomId(roomId, options) {
		const query = {roomId: roomId};
		return this.findOne(query, options);
	}


//----------------------------- FIND
	findById(_id, options) {
		return this.find({_id: _id}, options)
	}

	findByIds(_ids, options) {
		return this.find({_id: {$in: [].concat(_ids)}}, options)
	}

	findBySupportArea(supportArea, options) {
		const query = {supportArea: supportArea};
		return this.find(query, options);
	}

//---------------------------- CREATE
	createForSupportArea(supportArea, roomId, question, environment) {
		const helpRequest = {
			createdOn: new Date(),
			supportArea: supportArea,
			roomId: roomId,
			question: question,
			environment: environment,
			resolutionStatus: RESOLUTION_STATUS.open,
		};

		return this.insert(helpRequest);
	}

//---------------------------- UPDATE
	markResolved(_id) {
		const query = {_id: _id};
		const update = {$set: {resolutionStatus: RESOLUTION_STATUS.resolved}};

		return this.update(query, update);
	}


//----------------------------- REMOVE
	removeById(_id) {
		const query = {_id: _id};
		return this.remove(query);
	}
}

// -------------------------Constants
HelpRequest.RESOLUTION_STATUS = {
	open: 'open',
	authorAction: 'authorAction',
	resolved: 'resolved'
};

RocketChat.models.HelpRequests = new HelpRequest();
