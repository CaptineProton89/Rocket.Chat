Meteor.startup(function() {
	RocketChat.models.Rooms.tryEnsureIndex({ code: 1 });
	RocketChat.models.Rooms.tryEnsureIndex({ open: 1 }, { sparse: 1 });
	RocketChat.models.Subscriptions.tryEnsureIndex({ answered: 1 });
});
