function getInsertImageComposeUI(e) {
    return [buildImageComposeCard(e)];
}

function buildImageComposeCard(e) {
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
                .setFunctionName('buildImageComposeCard')))

        .addButton(CardService.newTextButton().setText('Update to pro')
            .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
            .setOnClickAction(
                CardService.newAction()
                .setFunctionName('openLinkUpdatePro')
                .setParameters({updatePro_url: updatePro_url})));

        var section_intro = CardService.newCardSection()
        .addWidget(
            CardService.newTextParagraph()
            .setText('<b>'+userInfo.response.user.username+'</b><br>---------------------')
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
                .setOnClickAction(
                    CardService.newAction()
                    .setFunctionName('insertImgToCurrentComposeBeingOpen')
                    .setParameters({url : imageUrl, id : imageId, version : version})))

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
    var params = {
        "id" : e.parameters.id,
        "version" : e.parameters.version,
    };
    var accessToken = getOAuthService().getAccessToken();
    var checkout_info = JSON.parse(db_api_checkout(accessToken, params));
    if(parseInt(checkout_info.response.total) == 0){

        /* Set render status = 0. Chưa render */
        var userProperties = PropertiesService.getUserProperties();
        userProperties.setProperties({renderStatus: 0});

        db_api_render(accessToken, params, function(downloadUrl){
            userProperties.setProperties({downloadUrl: downloadUrl});
        });

        while(true){
            if(userProperties.getProperty('renderStatus') == 2){
                var downloadUrl = userProperties.getProperty('downloadUrl');
                var driver_image_url = saveDriver(downloadUrl);
                var imageHtmlContent = "<img src='"+driver_image_url+"'>";
                var response = CardService.newUpdateDraftActionResponseBuilder()
                .setUpdateDraftBodyAction(CardService.newUpdateDraftBodyAction()
                    .addUpdateContent(imageHtmlContent, CardService.ContentType.MUTABLE_HTML)
                    .setUpdateType(CardService.UpdateDraftBodyType.IN_PLACE_INSERT));
                break;
            }
        }
        return response.build();
    }else{
        console.log('ảnh trả phí');
        // var imageHtmlContent = "Ảnh phải trả phí";
        // var response = CardService.newUpdateDraftActionResponseBuilder()
        // .setUpdateDraftBodyAction(CardService.newUpdateDraftBodyAction()
        //     .addUpdateContent(imageHtmlContent, CardService.ContentType.MUTABLE_HTML)
        //     .setUpdateType(CardService.UpdateDraftBodyType.IN_PLACE_INSERT));
    }
}

function handleLoadMoreClick2(e){
    var currentPage = getCurrentPage();
    currentPage = parseInt(currentPage) + 1;
    setCurrentPage(currentPage);
    return buildImageComposeCard(e);
}