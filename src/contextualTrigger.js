function getContextualAddOn(e) {
    var service = getOAuthService();
    if(service.hasAccess()){
        var card = CardService.newCardBuilder();
        var cardHeader = CardService.newCardHeader();
        var updatePro_url = 'https://www.designbold.com/pricing';
        var accessToken = service.getAccessToken();
        var userInfo = JSON.parse(db_api_get_info_user(accessToken));

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
                .setFunctionName('getContextualAddOn')))

        .addButton(CardService.newTextButton().setText('Update to pro')
            .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
            .setOnClickAction(
                CardService.newAction()
                .setFunctionName('openLinkUpdatePro')
                .setParameters({updatePro_url: updatePro_url})));

        var section_intro = CardService.newCardSection()
        .addWidget(
            CardService.newTextParagraph()
            .setText('<b>'+userInfo.response.user.username+'</b><br>---------------------'))
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

    if(Object.keys(list).length > 0){
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

                .addButton(CardService.newTextButton().setText('Check out')
                    .setOnClickAction(
                        CardService.newAction()
                        .setFunctionName('checkoutNavigation')
                        .setParameters({url : imageUrl, id : imageId, version : version, isCompose : '0'})))

                .addButton(CardService.newTextButton().setText('Edit design')
                    .setOnClickAction(
                        CardService.newAction()
                        .setFunctionName('openLinkEditDesign')
                        .setParameters({design_url: edit_link})
                        )));
        }
    }else{
        cardSection
        .addWidget(
            CardService.newTextParagraph()
            .setText("You don't have any design yet."))

        .addWidget(CardService.newTextButton().setText("Design with DesignBold")
            .setOpenLink(CardService.newOpenLink()
                .setUrl('https://www.designbold.com/collection/create-new')
                .setOpenAs(CardService.OpenAs.FULL_SIZE)
                .setOnClose(CardService.OnClose.NOTHING)))
    }

    return cardSection;
}

function handleLoadMoreClick(e){
    var currentPage = getCurrentPage();
    currentPage = parseInt(currentPage) + 1;
    setCurrentPage(currentPage);
    return getContextualAddOn(e);
};

function insertImgToNewCompose(e) {
    var designUrl = e.parameters.designUrl;
    var accessToken = e.messageMetadata.accessToken;
    GmailApp.setCurrentMessageAccessToken(accessToken);

    var draftCompose = GmailApp.createDraft("", "", "",{
        htmlBody: "<img src='"+designUrl+"'/>"
    });

    return CardService.newComposeActionResponseBuilder()
    .setGmailDraft(draftCompose).build();
}