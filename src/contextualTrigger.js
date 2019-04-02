function getContextualAddOn(e) {
    var service = getOAuthService();
    if(service.hasAccess()){
        var card = CardService.newCardBuilder();
        var cardHeader = CardService.newCardHeader();

        var loadMore = CardService.newCardSection()
        .addWidget(
            CardService.newTextButton().setText('Load more')
            .setOnClickAction(
                CardService.newAction()
                .setFunctionName('handleLoadMoreClick')
                )
            );

        var buttonSet = CardService.newButtonSet()
        .addButton(CardService.newTextButton().setText('Logout')
            .setOnClickAction(
                CardService.newAction()
                .setFunctionName('handleSignOutClick')
                ))

        .addButton(CardService.newTextButton().setText('Refresh')
            .setOnClickAction(
                CardService.newAction()
                .setFunctionName('getContextualAddOn')));

        var section_intro = CardService.newCardSection()
        .addWidget(
            CardService.newTextParagraph()
            .setText('<b class="db_title">Your design with DesignBold</b>')
            )
        .addWidget(buttonSet);

        return card.setHeader(cardHeader)
        .addSection(section_intro)
        .addSection(getListImage())
        .addSection(loadMore)
        .build();   
    }else{
        return create3PAuthorizationUi();
    }
}

function getListImage(){
    var g_end = getCurrentPage() * count_one_page;
    var jsonData = JSON.parse(getData(g_start, g_end));
    var list = jsonData.response;
    var cardSection = CardService.newCardSection();

    for (var item in list) {
        var imageUrl = list[item].thumb;
        var imageId = list[item]._id;
        var edit_link = list[item].edit_link;
        var version = list[item].version;

        if(imageUrl === '') imageUrl = 'https://cdn.designbold.com/web/dbcream/main/images/empty_design.jpg';
        cardSection
        .addWidget(
            CardService.newImage().setImageUrl(imageUrl)
            )
        .addWidget(
            CardService.newButtonSet()
            .addButton(CardService.newTextButton().setText('Use image')
                .setComposeAction(
                    CardService.newAction()
                    .setFunctionName('insertImgToNewCompose')
                    .setParameters({url : imageUrl, id : imageId, version : version}),
                    CardService.ComposedEmailType.STANDALONE_DRAFT))

            .addButton(CardService.newTextButton().setText('Edit image')
                .setOnClickAction(
                    CardService.newAction()
                    .setFunctionName('openLinkEditDesign')
                    .setParameters({design_url: edit_link})
                    )));
    }

    return cardSection;
}

function insertImgToNewCompose(e) {
    var params = {
        "id" : e.parameters.id,
        "version" : e.parameters.version,
    };
    
    var url = e.parameters.url;
    var accessToken = e.messageMetadata.accessToken;
    GmailApp.setCurrentMessageAccessToken(accessToken);
    /* -------------------------------- */
    
    var checkout_info = JSON.parse(db_api_checkout(accessToken, params));
    if(parseInt(checkout_info.response.total) == 0){
    	var userProperties = PropertiesService.getUserProperties();
    	userProperties.setProperties({renderStatus: 0});

        db_api_render(accessToken, params, function(downloadUrl){
            userProperties.setProperties({renderStatus: 1});
            userProperties.setProperties({downloadUrl: downloadUrl});
        });

        while(true){
        	if(userProperties.getProperty('renderStatus') == 1){
        		var downloadUrl = userProperties.getProperty('downloadUrl');
        		var driver_image_url = saveDriver(downloadUrl);
	            var draftCompose = GmailApp.createDraft("", "", "",{
	                htmlBody: "<img src='"+driver_image_url+"'/>"
	            });
	            break;
        	}
        }

        return CardService.newComposeActionResponseBuilder()
        .setGmailDraft(draftCompose).build();

    }else{
    	console.log('ảnh trả phí');
        /* ảnh trả phí */
        // var driver_image_url = saveDriver(url);
        
        // var draftCompose = GmailApp.createDraft("", "", "",{
        //     htmlBody: "<img src='"+driver_image_url+"'/>"
        // });

        // return CardService.newComposeActionResponseBuilder()
        // .setGmailDraft(draftCompose).build();
    }
}

function handleLoadMoreClick(e){
    var currentPage = getCurrentPage();
    currentPage = parseInt(currentPage) + 1;
    setCurrentPage(currentPage);
    return getContextualAddOn(e);
}