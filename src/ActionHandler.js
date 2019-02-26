/**
* Collection of functions to handle user interactions with the add-on. 
*
* @constant
*/
var ActionHandlers = {
	/**
	* Primary handler for the add-on. Displays cards about a pull or issue
	* if referenced in the email.
	*
	* @param {Event} e - Event from Gmail
	* @return {Card[]}
	*/
	showAddOn: function(e) {
		var accessToken = e.messageMetadata.accessToken;
		GmailApp.setCurrentMessageAccessToken(accessToken);

		var messageId = e.messageMetadata.messageId;
		var message = GmailApp.getMessageById(messageId);
		var subject = message.getSubject();
		var sender = message.getFrom();
		var imageUrls = getImageUrls();

		var card = CardService.newCardBuilder();

		var cardHeader = CardService.newCardHeader()
		.setTitle('Login with DesignBold');

		var textButton = CardService.newTextButton()
		.setText("Login with DesignBold")
		.setOpenLink(CardService.newOpenLink()
			.setUrl("https://designbold.com/")
			.setOpenAs(CardService.OpenAs.OVERLAY)
			.setOnClose(CardService.OnClose.RELOAD_ADD_ON));

		var textParagraph = CardService.newTextParagraph()
		.setText("The design tools from DesignBold include all the options that you probably would need: Text, Filters, Crops, Grids, etc. The designed image is server-based rendered and saved into your library.");

		var cardLogin = CardService.newCardSection()
		.addWidget(textParagraph)
		.addWidget(textButton);

		return card.setHeader(cardHeader).addSection(cardLogin).build();
	},

	showLogin: function(e) {
		if( typeof(accessToken) !== "undefined" && accessToken !== null ){
			var imageUrls = getImageUrls();
			var card = CardService.newCardBuilder();
			var action = CardService.newAction().setFunctionName('openLoginWindow');
			var cardSection = CardService.newCardSection();
			cardSection.addWidget(CardService.newImage()
				.setImageUrl("https://ci5.googleusercontent.com/proxy/0bUHItshL0ecZvuWGz1KRhaHPiZtelj-j4pn3QJuRUqTz1gkmSLFIv4kA4wNv5MrgBUqXaoNO2GBjfKiTAvkjRSKPEw3UMOOEiiqSCs18sKH0eUP7dav5yyZjKVPzQhW4wxwnB0FlkRC")
				.setAltText("DesignBold")
				);
		}else{
			var imageUrls = getImageUrls();
			var card = CardService.newCardBuilder();
			var action = CardService.newAction().setFunctionName('openLoginWindow');
			var cardSection = CardService.newCardSection();
			cardSection.addWidget(CardService.newImage()
				.setImageUrl("https://ci5.googleusercontent.com/proxy/0bUHItshL0ecZvuWGz1KRhaHPiZtelj-j4pn3QJuRUqTz1gkmSLFIv4kA4wNv5MrgBUqXaoNO2GBjfKiTAvkjRSKPEw3UMOOEiiqSCs18sKH0eUP7dav5yyZjKVPzQhW4wxwnB0FlkRC")
				.setAltText("DesignBold")
				);

			cardSection.addWidget(CardService.newImage()
				.setImageUrl("https://ci6.googleusercontent.com/proxy/sZVfTGhXetRx5FCy27CJw0jLx3qgH9lzO7EuLbFBpRYx3SyFJNjy-jxkaUSkEbKe9EDWviHBHB0uCGGe_TD1AxLB_NPIeEsIfmWK6A6ia34b79cdniY_l0QBP8KRnc5jGF9UNt5UZQ")
				.setAltText("DesignBold")
				.setOnClickAction(action)
				);
		}

		return card.addSection(cardSection).build();
	},

	/**
	* Displays the add-on settings card.
	*
	* @param {Event} e - Event from Gmail
	* @return {CardService.FormAction}
	*/
	showSettings: function(e) {
		var githubResponse = githubClient().query(Queries.VIEWER, {});

		var card = buildSettingsCard({
			avatarUrl: githubResponse.viewer.avatarUrl,
			login: githubResponse.viewer.login
		});

		return CardService.newUniversalActionResponseBuilder()
		.displayAddOnCards([card])
		.build();
	},

	/**
	* Disconnects the user's GitHub account.
	*
	* @param {Event} e - Event from Gmail
	*/
	disconnectAccount: function(e) {
		githubClient().disconnect();
		throw new AuthorizationRequiredException();
	}
};
