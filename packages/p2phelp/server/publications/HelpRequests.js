/**
 * Created by OliverJaegle on 10.08.2016.
 * Publish Peer-to-peer-specific enhancements to Rocket.Chat models
 *
 */


Meteor.publish('p2phelp:helpRequests', function (roomId) {
	if (!this.userId) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {publish: 'livechat:visitorInfo'}));
	}

	// todo: add permission
	// if (!RocketChat.authz.hasPermission(this.userId, 'view-livechat-rooms')) {
	// 	return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', {publish: 'livechat:visitorInfo'}));
	// }

	const room = RocketChat.models.Rooms.findOneById(roomId, {fields: {helpRequestId: 1}});

	if(room.helpRequestId) {
		return RocketChat.models.HelpRequests.findByRoomId(room.helpRequestId, {
			fields: {
				_id: 1,
				roomId: 1,
				supportArea: 1,
				question: 1,
				environment: 1,
				resolutionStatus: 1
			}
		});
	} else {
		return this.ready();
	}
});
