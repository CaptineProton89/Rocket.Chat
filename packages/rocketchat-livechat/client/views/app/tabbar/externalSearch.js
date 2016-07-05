Template.dynamic_redlink_default.helpers({

});
Template.dynamic_redlink_default.onRendered(function() {
});

Template.externalSearch.helpers({
	messages() {
		return RocketChat.models.LivechatExternalMessage.findByRoomId(this.rid, { ts: 1 });
	},
	dynamicTemplateExists() {
		return !!Template['dynamic_redlink_'+this.filledQueryType];
	},
	queryTemplate() {
		return 'dynamic_redlink_'+this.filledQueryType;
	},
	filledQueryTemplate() {
		var roomessages = RocketChat.models.LivechatExternalMessage.findByRoomId(this.rid, { ts: 1 }).fetch(),
			filledTemplate = [], tokens = [];

		if(roomessages.length > 0) {
			tokens = roomessages[0].redlinkQuery.tokens;
			$(roomessages[0].redlinkQuery.queryTemplates).each(function (indxTmpl, valTmpl) {

				let slotItem = {}, filledQuerySlots = [], querySlots = valTmpl.querySlots, currentToken;

				/* tokens und queryTemplates mergen */
				$(querySlots).each(function (indxSlot, valSlot) {
					if (valSlot.tokenIndex != -1) {
						currentToken = tokens[valSlot.tokenIndex];
						if(currentToken.type === "Date" && typeof currentToken.value === "object") {
							valSlot.clientValue = new Date(currentToken.value.date);
						} else {
							valSlot.clientValue = currentToken.value;
						}
						valSlot.tokenVal = currentToken;
					} else {
						valSlot.clientValue = "-";
					}
					filledQuerySlots.push(valSlot);
				});

				slotItem.filledQueryType = valTmpl.queryType;
				slotItem.filledQuerySlots = filledQuerySlots;
				slotItem.item = function (itm) {
					return slotItem.filledQuerySlots.filter((ele) => ele.role === itm)[0]['clientValue'] //todo npe-checks
				};

				filledTemplate.push(slotItem);
			});
		}
		return filledTemplate;
	}
});

Template.externalSearch.events({
	'click button.pick-message': function(event, instance) {
		event.preventDefault();

		$('#chat-window-' + instance.roomId + ' .input-message').val(this.msg).focus();
	}
});

Template.externalSearch.onCreated(function() {
	this.roomId = null;
	// console.log('externalSearch.this ->',this);
	this.autorun(() => {
		this.roomId = Template.currentData().rid;
		this.subscribe('livechat:externalMessages', Template.currentData().rid);
	});
});
