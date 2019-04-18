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
                        .setFunctionName('checkoutComposeNavigation')
                        .setParameters({url : imageUrl, id : imageId, version : version})))

                .addButton(CardService.newTextButton().setText('Edit image')
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

function checkoutComposeNavigation(e) {
    var params = {
        "id" : e.parameters.id,
        "version" : e.parameters.version,
        "url" : e.parameters.url,
    };
    var accessToken = getOAuthService().getAccessToken();
    var checkout_info = JSON.parse(db_api_checkout(accessToken, params));

    var medias = checkout_info.response.medias;
    var media_html = '<br>List items: <br>';
    for(var item in medias){
        media_html += 'Title : <font color="#18b8a5"><a href="' + medias[item].thumb + '"><b>'+medias[item].title+'</b></a><br></font>';
        if(parseInt(medias[item].price) !== 0){
            media_html += 'Price : <b><font color="#18b8a5">'+medias[item].price+'</font></b>';
        }
        media_html += '<br>--------------------------------';
    }

    if(parseInt(checkout_info.response.total) == 0){
        var htmlTemplate = '<font color="#18b8a5">Document is free to download</font><br>-------------------';
        var button = CardService.newTextButton().setText('Save to Google Drive')
        .setOnClickAction(CardService.newAction()
            .setFunctionName('insertImgToCurrentComposeBeingOpen')
            .setParameters({
                url : params.url, 
                id : params.id, 
                version : params.version, 
                payout : '0'}));

        var card = CardService.newCardBuilder()
        .setHeader(CardService.newCardHeader().setTitle("Design infomation"))
        .addSection(CardService.newCardSection()
            .addWidget(CardService.newTextParagraph()
                .setText(htmlTemplate))
            .addWidget(button))
        .build();

        var nav = CardService.newNavigation().pushCard(card);
        return CardService.newActionResponseBuilder()
        .setNavigation(nav)
        .build();
    }else{
        var accountUser = JSON.parse(db_api_get_info_user(accessToken));
        var your_budget = parseInt(accountUser.response.account.budget);
        var your_budget_bonus = parseInt(accountUser.response.account.budget_bonus);
        var total_budget = your_budget + your_budget_bonus;
        var estimate = parseInt(checkout_info.response.total);

        if(total_budget < estimate){
            var button = CardService.newTextButton().setText('Buy Coin')
            .setOpenLink(CardService.newOpenLink()
                .setUrl("https://www.designbold.com/pricing")
                .setOpenAs(CardService.OpenAs.FULL_SIZE)
                .setOnClose(CardService.OnClose.NOTHING));
        }else{
            var button = CardService.newTextButton().setText('Save to Google Drive')
            .setOnClickAction(CardService.newAction()
                .setFunctionName('insertImgToCurrentComposeBeingOpen')
                .setParameters({
                    url : params.url, 
                    id : params.id, 
                    version : params.version, 
                    payout : '1'}));
        }

        var htmlTemplate = '<font color="#18b8a5"><b>Photo Premium </b></font><br>';
        if(estimate > 1){
            htmlTemplate += 'Pay: <b><font color="#18b8a5">' + estimate +'</font></b> Coins<br>';
        }else{
            htmlTemplate += 'Pay: <b><font color="#18b8a5">' + estimate +'</font></b> Coin <br>';
        }

        if(your_budget > 1){
            htmlTemplate += 'Budget: <b><font color="#18b8a5">' + your_budget +'</font></b> Coins<br>';
        }else if(your_budget == 1){
            htmlTemplate += 'Budget: <b><font color="#18b8a5">' + your_budget +'</font></b> Coin <br>';
        }

        if(your_budget_bonus > 1){
            htmlTemplate += 'Budget bonus: <b><font color="#18b8a5">' + your_budget_bonus +'</font></b> Coins<br>';
        }else if(your_budget_bonus == 1){
            htmlTemplate += 'Budget bonus: <b><font color="#18b8a5">' + your_budget_bonus +'</font></b> Coin <br>';
        }

        htmlTemplate += media_html;

        var card = CardService.newCardBuilder()
        .setHeader(CardService.newCardHeader().setTitle("Design infomation"))
        .addSection(CardService.newCardSection()
            .addWidget(CardService.newTextParagraph()
                .setText(htmlTemplate))
            .addWidget(button))
        .build();

        var nav = CardService.newNavigation().pushCard(card);
        return CardService.newActionResponseBuilder()
        .setNavigation(nav)
        .build();
    }
}

function insertImgToCurrentComposeBeingOpen(e) {
    var params = {
        "id" : e.parameters.id,
        "version" : e.parameters.version,
        "payout" : e.parameters.payout,
    };
    var accessToken = getOAuthService().getAccessToken();

    if(params.payout == 0){
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
        var purchase = JSON.parse(db_api_payout(accessToken, params.id));
        
        if("response" in purchase && "purchase_id" in purchase.response){
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
        }
    }
}

function handleLoadMoreClick2(e){
    var currentPage = getCurrentPage();
    currentPage = parseInt(currentPage) + 1;
    setCurrentPage(currentPage);
    return buildImageComposeCard(e);
}