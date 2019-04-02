function getInsertImageComposeUI(e) {
    return [buildImageComposeCard(e)];
}

function buildImageComposeCard(e) {
    var service = getOAuthService();
    if(service.hasAccess()){
        var card = CardService.newCardBuilder();
        var cardHeader = CardService.newCardHeader();

        var loadMore = CardService.newCardSection()
        .addWidget(
            CardService.newTextButton().setText('Load more')
            .setOnClickAction(
                CardService.newAction()
                .setFunctionName('handleLoadMoreClick2')
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
                .setFunctionName('buildImageComposeCard')));

        var section_intro = CardService.newCardSection()
        .addWidget(
            CardService.newTextParagraph()
            .setText('<b class="db_title">Your design with DesignBold</b>')
            )
        .addWidget(buttonSet);

        return card.setHeader(cardHeader)
        .addSection(section_intro)
        .addSection(getListImage2())
        .addSection(loadMore)
        .build();
    }else{
        return create3PAuthorizationUi();
    }
}

function getListImage2(){
    var g_end = getCurrentPage() * count_one_page;
    var jsonData = JSON.parse(getData(g_start, g_end));
    var list = jsonData.response;
    var cardSection = CardService.newCardSection();
    var i=0;

    for (var item in list) {
        var imageUrl = list[item].thumb;
        var edit_link = list[item].edit_link;
        if(imageUrl === '') imageUrl = 'https://cdn.designbold.com/web/dbcream/main/images/empty_design.jpg';
        cardSection
        .addWidget(
            CardService.newImage().setImageUrl(imageUrl)
            )
        .addWidget(
            CardService.newButtonSet()
            .addButton(CardService.newTextButton().setText('Use image')
                .setOnClickAction(
                    CardService.newAction()
                    .setFunctionName('insertImgToCurrentComposeBeingOpen')
                    .setParameters({url : imageUrl})))

            .addButton(CardService.newTextButton().setText('Edit image')
                .setOnClickAction(
                    CardService.newAction()
                    .setFunctionName('openLinkEditDesign')
                    .setParameters({design_url: edit_link})
                    )));
    }

    return cardSection;
}

function insertImgToCurrentComposeBeingOpen(e) {
    var url = e.parameters.url;
    var driver_image_url = saveDriver(url);
    var imageHtmlContent = "<img src='"+driver_image_url+"'>";
    var response = CardService.newUpdateDraftActionResponseBuilder()
    .setUpdateDraftBodyAction(CardService.newUpdateDraftBodyAction()
        .addUpdateContent(imageHtmlContent, CardService.ContentType.MUTABLE_HTML)
        .setUpdateType(CardService.UpdateDraftBodyType.IN_PLACE_INSERT))
    .build();
    return response;
}

function handleLoadMoreClick2(e){
    var currentPage = getCurrentPage();
    currentPage = parseInt(currentPage) + 1;
    setCurrentPage(currentPage);
    return buildImageComposeCard(e);
}