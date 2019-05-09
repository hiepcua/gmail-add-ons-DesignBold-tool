var g_start = 0;
var count_one_page = 12;

function deleteAllUserProperties(){
    deleteAllPropertyDownloadUrl();
    deleteAllPropertyRenderStatus();
    deleteAllPropertyPkParameter();
    deleteAllPropertyPurchaseIdParameter();
}

function getData(start, end){
    var st = parseInt(start);
    var ed = parseInt(end);
    var accessToken = getOAuthService().getAccessToken();
    var headers_opt = {
        "Authorization": "Bearer " + accessToken
    }
    return accessProtectedResource("https://api.designbold.com/v3/document?owner=me&sort=modified&start="+st+"&limit="+ed+"&target=my-design&loc=wp&folder_id=", "GET", headers_opt);
}

/* Open link to edit/design image */
function openLinkEditDesign(e){
    var actionResponse = CardService.newActionResponseBuilder()
    .setOpenLink(CardService.newOpenLink()
        .setUrl(e.parameters.design_url)
        .setOpenAs(CardService.OpenAs.FULL_SIZE)
        .setOnClose(CardService.OnClose.NOTHING));
    return actionResponse.build();
}

function openLinkUpdatePro(e){
    var actionResponse = CardService.newActionResponseBuilder()
    .setOpenLink(CardService.newOpenLink()
        .setUrl(e.parameters.updatePro_url)
        .setOpenAs(CardService.OpenAs.FULL_SIZE)
        .setOnClose(CardService.OnClose.NOTHING));
    return actionResponse.build();
}

function getCurrentPage(){
    var userProperties = PropertiesService.getUserProperties();
    return userProperties.getProperty('currentPage');
}

function setCurrentPage(cur_page){
    var userProperties = PropertiesService.getUserProperties();
    userProperties.setProperties({currentPage: cur_page}, true);
}

function deleteCurrenPage(){
    var userProperties = PropertiesService.getUserProperties();
    userProperties.deleteProperty('currentPage');
}

function setCurrentPageOnlyFirstTime(){
    var userProperties = PropertiesService.getUserProperties();
    var currentPage = getCurrentPage();

    if(typeof(currentPage) == "undefined" || currentPage == null){
        userProperties.setProperties({currentPage: 1}, true);
    }
}

// Save image to driver, return image url in driver
function saveDriver(url){
    var currentTime = new Date();
    var year = currentTime.getFullYear();
    var month = currentTime.getMonth() + 1;
    var day = currentTime.getDate();

    // If folder not exists then create folder DesignBold
    if(!checkFolderExists('DesignBold Design Add-on')){
        var folder = DriveApp.createFolder('DesignBold Design Add-on');
        
        var par_id = getFolderIdByName(0, 'DesignBold Design Add-on');
        var f_year_id = createFolder(par_id, year); 
        var f_month_id = createFolder(f_year_id, month);

        var response = UrlFetchApp.fetch(url);
        var urlImg = db_createFile(f_month_id, response);

        return 'https://drive.google.com/uc?id='+urlImg;
    }else{
        var par_id = getFolderIdByName(0, 'DesignBold Design Add-on');
        var f_year_id = createFolder(par_id, year);
        var f_month_id = createFolder(f_year_id, month);

        var response = UrlFetchApp.fetch(url);
        var urlImg = db_createFile(f_month_id, response);

        return 'https://drive.google.com/uc?id='+urlImg;
    }
}

/* return true : File exists || false : File not exists */
function checkFolderExists(name){
    var list_folder = DriveApp.getFolders();
    var exists = false;
    while(list_folder.hasNext()){
        var folder = list_folder.next();

        if(folder.getName() === name){
            exists = true;
        }
    }
    return exists;
}

/* Return folder id with name equal folderName */
function getFolderIdByName(parent_id, folderName){
    var id = '';
    if(parent_id == 0){
        var folders = DriveApp.getFolders();
        while (folders.hasNext()) {
            var folder = folders.next();
            if(folder.getName() == folderName)
            {
                id = folder.getId();
            }
        }
    }else{
        var parentFolder = DriveApp.getFolderById(parent_id);
        var folders = parentFolder.getFolders();
        while (folders.hasNext()) {
            var folder = folders.next();
            if(folder.getName() == folderName)
            {
                id = folder.getId();
            }
        }
    }

    return id;
}

/* Create a folder only if that folder name does not exists in the Parent folder  */
function createFolder(folderId, folderName){
    var parentFolder = DriveApp.getFolderById(folderId);
    var newFolder = '';
    // Check if folder already exists.
    var child_id = getFolderIdByName(folderId, folderName);

    if(child_id == ''){
        newFolder = parentFolder.createFolder(folderName);
        return newFolder.getId();
    }else{
        return child_id;
    }
}

/* Create a file in folder that have id equal folderId */
function db_createFile(folderId, fileData){
    var folder = DriveApp.getFolderById(folderId);
    var newFile = folder.createFile(fileData);
    newFile.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.EDIT);
    return newFile.getId();
}

/* Get image info */
function db_api_download_info(accessToken, params){
    var id = params.id;
    var url = "https://api.designbold.com/v3/document/"+id+"/download-info";
    var headers_opt = {
        "Authorization": "Bearer " + accessToken
    }

    return accessProtectedResource(url, "GET", headers_opt);
}

/* Check image if free or not */
function db_api_checkout(accessToken, id, version){
    var url = "https://api.designbold.com/v3/document/"+id+"/checkout?type=png&pages=picked&version="+version+"&picked=[1]";
    var headers_opt = {
        "Authorization": "Bearer " + accessToken
    }

    return accessProtectedResource(url, "GET", headers_opt);
}

/* Set download url by document id*/
function setDownloadUrl(document_id, download_url){
    var item = {};
    if(document_id !== '' && download_url !== ''){
        var userProperties = PropertiesService.getUserProperties();
        var downloadUrl = userProperties.getProperty('downloadUrl');
        var obj_downloadUrl = JSON.parse(downloadUrl);

        if(obj_downloadUrl !== null){
            obj_downloadUrl[document_id] = download_url;
            obj_downloadUrl = JSON.stringify(obj_downloadUrl);
            userProperties.setProperties({downloadUrl: obj_downloadUrl});
        }else{
            item[document_id] = download_url;
            item = JSON.stringify(item);
            userProperties.setProperties({downloadUrl: item});
        }
    }
}

/* Get download url by document id */
function getDownloadUrlByDocumentId(document_id){
    var userProperties = PropertiesService.getUserProperties();
    var downloadUrl = userProperties.getProperty('downloadUrl');
    var obj_downloadUrl = JSON.parse(downloadUrl);
    
    if(downloadUrl !== null && obj_downloadUrl[document_id] !== undefined){
        return obj_downloadUrl[document_id];
    }else{
        return 0;
    }
}

/* Delete all download url */
function deleteItemPropertyDownloadUrl(document_id){
    var userProperties = PropertiesService.getUserProperties();
    var downloadUrl = userProperties.getProperty('downloadUrl');
    var obj_downloadUrl = JSON.parse(downloadUrl);
    delete obj_downloadUrl[document_id];
    setDownloadUrl(document_id, '');
}

/* Delete all download url */
function deleteAllPropertyDownloadUrl(){
    var userProperties = PropertiesService.getUserProperties();
    userProperties.deleteProperty('downloadUrl');
}

/* Set render status */
function setRenderStatus(document_id, status){
    var item = {};
    if(document_id !== '' && status !== ''){
        var userProperties = PropertiesService.getUserProperties();
        var renderStatus = userProperties.getProperty('renderStatus');
        var obj_renderStatus = JSON.parse(renderStatus);

        if(obj_renderStatus !== null){
            obj_renderStatus[document_id] = status;
            obj_renderStatus = JSON.stringify(obj_renderStatus);
            userProperties.setProperties({renderStatus: obj_renderStatus});
        }else{
            item[document_id] = status;
            item = JSON.stringify(item);
            userProperties.setProperties({renderStatus: item});
        }
    }
}

/* Get render status by document id */
function getRenderStatusByDocumentId(document_id){
    var userProperties = PropertiesService.getUserProperties();
    var renderStatus = userProperties.getProperty('renderStatus');
    var obj_renderStatus = JSON.parse(renderStatus);
    
    if(renderStatus !== null && obj_renderStatus[document_id] !== undefined){
        return obj_renderStatus[document_id];
    }else{
        return 0;
    }
}

/* Delete all render status */
function deleteItemPropertyRenderStatus(document_id){
    var userProperties = PropertiesService.getUserProperties();
    var renderStatus = userProperties.getProperty('renderStatus');
    var obj_renderStatus = JSON.parse(renderStatus);
    delete obj_renderStatus[document_id];
    setRenderStatus(document_id, 0);
}

/* Delete all render status */
function deleteAllPropertyRenderStatus(){
    var userProperties = PropertiesService.getUserProperties();
    userProperties.deleteProperty('renderStatus');
}

/* Set pk parameter */
function setPkParameter(document_id, pk){
    var item = {};
    if(document_id !== '' && pk !== ''){
        var userProperties = PropertiesService.getUserProperties();
        var pkParameter = userProperties.getProperty('pkParameter');
        var obj_pkParameter = JSON.parse(pkParameter);

        if(obj_pkParameter !== null){
            obj_pkParameter[document_id] = pk;
            obj_pkParameter = JSON.stringify(obj_pkParameter);
            userProperties.setProperties({pkParameter: obj_pkParameter});
        }else{
            item[document_id] = pk;
            item = JSON.stringify(item);
            userProperties.setProperties({pkParameter: item});
        }
    }
}

/* Get pk parameter by document id */
function getPkParameterByDocumentId(document_id){
    var userProperties = PropertiesService.getUserProperties();
    var pkParameter = userProperties.getProperty('pkParameter');
    var obj_pkParameter = JSON.parse(pkParameter);
    
    if(pkParameter !== null && obj_pkParameter[document_id] !== undefined){
        return obj_pkParameter[document_id];
    }else{
        return 0;
    }
}

/* Delete all pk parameter */
function deleteItemPropertyPkParameter(document_id){
    var userProperties = PropertiesService.getUserProperties();
    var pkParameter = userProperties.getProperty('pkParameter');
    var obj_pkParameter = JSON.parse(pkParameter);
    delete obj_pkParameter[document_id];
    setPkParameter(document_id, '');
}

/* Delete all pk parameter */
function deleteAllPropertyPkParameter(){
    var userProperties = PropertiesService.getUserProperties();
    userProperties.deleteProperty('pkParameter');
}

/* Set PurchaseId */
function setPurchaseIdParameter(document_id, purchaseId){
    var item = {};
    if(document_id !== '' && purchaseId !== ''){
        var userProperties = PropertiesService.getUserProperties();
        var tmp = userProperties.getProperty('purchaseId');
        var obj_purchaseId = JSON.parse(tmp);

        if(obj_purchaseId !== null){
            obj_purchaseId[document_id] = purchaseId;
            obj_purchaseId = JSON.stringify(obj_purchaseId);
            userProperties.setProperties({purchaseId: obj_purchaseId});
        }else{
            item[document_id] = purchaseId;
            item = JSON.stringify(item);
            userProperties.setProperties({purchaseId: item});
        }
    }
}

/* Get PurchaseId by document id */
function getPurchaseIdParameterByDocumentId(document_id){
    var userProperties = PropertiesService.getUserProperties();
    var purchaseId = userProperties.getProperty('purchaseId');
    var obj_purchaseId = JSON.parse(purchaseId);
    
    if(purchaseId !== null && obj_purchaseId[document_id] !== undefined){
        return obj_purchaseId[document_id];
    }else{
        return 0;
    }
}

/* Delete item PurchaseId */
function deleteItemPropertyPurchaseIdParameter(document_id){
    var userProperties = PropertiesService.getUserProperties();
    var purchaseId = userProperties.getProperty('purchaseId');
    var obj_purchaseId = JSON.parse(purchaseId);
    delete obj_purchaseId[document_id];
    setPkParameter(document_id, 0);
}

/* Delete all purchaseId */
function deleteAllPropertyPurchaseIdParameter(){
    var userProperties = PropertiesService.getUserProperties();
    userProperties.deleteProperty('purchaseId');
}

/*------------------------------------------------------------------------------------------------*/

/* Get info user */
function db_api_get_info_user(accessToken){
    var url = "https://api.designbold.com/v3/user/me?";
    var headers_opt = {
        "Authorization": "Bearer " + accessToken
    }

    return accessProtectedResource(url, "GET", headers_opt);
}

function checkoutNavigation(e){
    var accessToken = getOAuthService().getAccessToken();
    var checkout_info = JSON.parse(db_api_checkout(accessToken, e.parameters.id, e.parameters.version));
    var _medias = checkout_info.response.medias;
    var _total = checkout_info.response.total;

    if(parseInt(_total) == 0){
        return layout_free(e.parameters.id, e.parameters.version, _medias, _total, accessToken);
    }else{
        return layout_premium(e.parameters.id, e.parameters.version, _medias, _total, accessToken);
    }
}

function layout_free(_id, _version, _medias, _total, _accessToken){
    // List media used by design
    if(_medias.length > 0) var media_html = '<br>List items: <br>';
    else var media_html = '';
    
    for(var item in _medias){
        media_html += 'Title : <font color="#18b8a5"><a href="' + _medias[item].thumb + '"><b>'+_medias[item].title+'</b></a></font>';
        if(parseInt(_medias[item].price) !== 0){
            media_html += 'Price : <b><font color="#18b8a5">'+_medias[item].price+'</font></b>';
        }
        media_html += '<br>--------------------------------<br>';
    }

    // Check render status
    var renderStatus = getRenderStatusByDocumentId(_id);
    var btn_status; 
    var notify;

    // Generate button and notify base one render status
    if(renderStatus == 0){
        notify = '';
        btn_status = CardService.newTextButton().setText('Start render')
        .setOnClickAction(
            CardService.newAction().setFunctionName('db_api_free_render')
            .setParameters({
                id : _id,
                version : _version,
                accessToken : _accessToken,
            }));
    }else if(renderStatus == 1){
        var pk = getPkParameterByDocumentId(_id);
        notify = '<b>The design is rendering ...</b><br>---------------------';
        btn_status = CardService.newTextButton().setText('Check render status')
        .setOnClickAction(
            CardService.newAction().setFunctionName('db_api_check_status_render_free')
            .setParameters({
                id : _id,
                pk : pk,
                version : _version.toString(),
                accessToken : _accessToken,
            }));
    }else if(renderStatus == 2){
        var _downloadUrl = getDownloadUrlByDocumentId(_id);
        notify = '<b>Render successfully !</b><br>---------------------';
        btn_status = CardService.newTextButton().setText('Save To Google Drive')
        .setOnClickAction(
            CardService.newAction().setFunctionName('saveToGoogleDriver')
            .setParameters({
                id : _id,
                downloadUrl : _downloadUrl,
            }));
    }else if(renderStatus == 3){
        notify = '<b>Render error !</b><br>---------------------';
        btn_status = CardService.newTextParagraph()
        .setText('<b>Image too large. Can not render with Gmail.</b><br>---------------------');
    };

    var htmlTemplate = '<font color="#18b8a5">Design is free to download</font>'
    + '<br>-------------------<br>' + media_html;
    
    var card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle("Design infomation"))
    .addSection(CardService.newCardSection()
        .addWidget(CardService.newTextParagraph().setText(htmlTemplate))
        .addWidget(CardService.newTextParagraph().setText(notify))
        .addWidget(btn_status))
    .build();

    var nav = CardService.newNavigation().pushCard(card);
    return CardService.newActionResponseBuilder()
    .setNavigation(nav)
    .build();
}

function layout_premium(_id, _version, _medias, _total, _accessToken){
    // List media used by design
    if(_medias.length > 0) var media_html = '<br>List items: <br>';
    else var media_html = '';
    
    for(var item in _medias){
        media_html += 'Title : <font color="#18b8a5"><a href="' + _medias[item].thumb + '"><b>'+_medias[item].title+'</b></a><br></font>';
        if(parseInt(_medias[item].price) !== 0){
            media_html += 'Price : <b><font color="#18b8a5">'+_medias[item].price+'</font></b>';
        }
        media_html += '<br>--------------------------------<br>';
    }

    // Check render status
    var renderStatus = getRenderStatusByDocumentId(_id);
    var btn_status; 
    var notify;

    // Nếu chưa render
    if(renderStatus == 0){
        notify = '';
        btn_status = CardService.newTextButton().setText('Start render')
        .setOnClickAction(
            CardService.newAction().setFunctionName('db_api_render_premium')
            .setParameters({
                id : _id,
                version : _version,
                accessToken : _accessToken,
            }));
    }else if(renderStatus == 1){
        var pk = getPkParameterByDocumentId(_id);
        notify = '<b>The design is rendering ...</b><br>---------------------';
        btn_status = CardService.newTextButton().setText('Check render status')
        .setOnClickAction(
            CardService.newAction().setFunctionName('db_api_check_status_render_premium')
            .setParameters({
                id : _id,
                pk : pk,
                version : _version,
                accessToken : _accessToken
            }));
    }else if(renderStatus == 2){
        var _downloadUrl = getDownloadUrlByDocumentId(_id);
        notify = '<b>Render successfully !</b><br>---------------------';
        btn_status = CardService.newTextButton().setText('Save To Google Drive')
        .setOnClickAction(
            CardService.newAction().setFunctionName('saveToGoogleDriver')
            .setParameters({
                id : _id,
                downloadUrl : _downloadUrl
            }));
    }else if(renderStatus == 3){
        notify = '<b>Render error !</b><br>---------------------';
        btn_status = CardService.newTextParagraph()
        .setText('<b>Image too large. Can not render with Gmail.</b><br>---------------------');
    };

    var accountUser = JSON.parse(db_api_get_info_user(_accessToken));
    var your_budget = parseInt(accountUser.response.account.budget);
    var your_budget_bonus = parseInt(accountUser.response.account.budget_bonus);
    var total_budget = your_budget + your_budget_bonus;
    var estimate = parseInt(_total);

    var button;
    if(total_budget < estimate){
        button = CardService.newTextButton().setText('Buy Coin')
        .setOpenLink(CardService.newOpenLink()
            .setUrl("https://www.designbold.com/pricing")
            .setOpenAs(CardService.OpenAs.FULL_SIZE)
            .setOnClose(CardService.OnClose.NOTHING));
    }else{
        button = btn_status;
    }

    var htmlTemplate = '<font color="#18b8a5"><b>Design Premium </b></font><br>';
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
        .addWidget(CardService.newTextParagraph().setText(notify))
        .addWidget(button))
    .build();

    var nav = CardService.newNavigation().pushCard(card);
    return CardService.newActionResponseBuilder()
    .setNavigation(nav)
    .build();
}

// Layout redered successfully, show button saveToGoogleDriver
function layout_render_successfully(_id, _downloadUrl, _medias, _title, _notify){
    // List media used by design
    if(_medias.length > 0) var media_html = '<br>List items: <br>';
    else var media_html = '';

    for(var item in _medias){
        media_html += 'Title : <font color="#18b8a5"><a href="' + _medias[item].thumb + '"><b>'+_medias[item].title+'</b></a><br></font>';
        if(parseInt(_medias[item].price) !== 0){
            media_html += 'Price : <b><font color="#18b8a5">'+_medias[item].price+'</font></b>';
        }
        media_html += '<br>--------------------------------';
    }

    var card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle("Design infomation"))
    .addSection(CardService.newCardSection()
        .addWidget(CardService.newTextParagraph().setText('<font color="#18b8a5">' +_title+ '</font><br>'))
        .addWidget(CardService.newTextParagraph().setText('<font color="#18b8a5">Render successfully !</font><br>'))
        .addWidget(CardService.newTextParagraph().setText("<b>" +_notify+ "</b><br>--------------------------------"))
        .addWidget(CardService.newTextParagraph().setText(media_html))
        .addWidget(CardService.newTextButton().setText('Save To Google Drive')
            .setOnClickAction(
                CardService.newAction().setFunctionName('saveToGoogleDriver')
                .setParameters({
                    id : _id,
                    downloadUrl : _downloadUrl
                }))))
    .build();

    var nav = CardService.newNavigation().updateCard(card);
    return CardService.newActionResponseBuilder()
    .setNavigation(nav)
    .build();
}

// Layout rendering, again show button check render status.
function layout_rendering(_id, _version, _payout, _pk, _title, _notify, _accessToken){
    var checkout_info = JSON.parse(db_api_checkout(_accessToken, _id, _version));
    var _medias = checkout_info.response.medias;
    if(_medias.length > 0) var media_html = '<br>List items: <br>';
    else var media_html = '';

    if(parseInt(_payout) == 0) var callBackFunction = 'db_api_check_status_render_free';
    else var callBackFunction = 'db_api_check_status_render_premium';

    for(var item in _medias){
        media_html += 'Title : <font color="#18b8a5"><a href="' + _medias[item].thumb + '"><b>'+_medias[item].title+'</b></a><br></font><br>';
        if(parseInt(_medias[item].price) !== 0){
            media_html += 'Price : <b><font color="#18b8a5">'+_medias[item].price+'</font></b>';
        }
        media_html += '<br>--------------------------------';
    }

    var card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle("Design infomation"))
    .addSection(CardService.newCardSection()
        .addWidget(CardService.newTextParagraph().setText('<font color="#18b8a5">' + _title + '</font><br>' + media_html))
        .addWidget(CardService.newTextParagraph().setText("<b>" + _notify + "</b><br>---------------------"))
        .addWidget(CardService.newTextButton().setText('Check render status')
            .setOnClickAction(
                CardService.newAction().setFunctionName(callBackFunction)
                .setParameters({
                    pk : _pk,
                    id : _id,
                    title : _title,
                    notify : _notify,
                    version : _version.toString(),
                    accessToken : _accessToken,
                }))))
    .build();

    var nav = CardService.newNavigation().updateCard(card);
    return CardService.newActionResponseBuilder()
    .setNavigation(nav)
    .build();
}

/* Return image url designed */
function db_api_free_render(e){
    var accessToken = e.parameters.accessToken;
    var version = e.parameters.version;
    var id = e.parameters.id;
    var d = new Date();
    var n = d.getMilliseconds();
    var name = id + n;
    var url = "https://api.designbold.com/v3/document/"+id+"/render?name="+name+"&type=png&crop_bleed=0&quality=high&pages=picked&mode=download&wm=0&session=&beta=0&picked=%5B1%5D";
    var headers_opt = {
        "Authorization": "Bearer " + accessToken
    }

    setRenderStatus(e.parameters.id, 1);
    var res_payout = db_api_payout(accessToken, id, version);
    if("response" in res_payout && "purchase_id" in res_payout.response){
        setPurchaseIdParameter(id, res_payout.response.purchase_id);
    }
    var result = JSON.parse(accessProtectedResource(url, "GET", headers_opt));

    if(result.response.pk !== ''){
        // Set pk parameter with document id
        setPurchaseIdParameter(id, 0);
        setPkParameter(e.parameters.id, result.response.pk);

        var checkout_info = JSON.parse(db_api_checkout(accessToken, e.parameters.id, e.parameters.version));
        var _medias = checkout_info.response.medias;
        var _total = checkout_info.response.total;
        
        // List media used by design
        if(_medias.length > 0) var media_html = '<br>List items: <br>';
        else var media_html = '';

        for(var item in _medias){
            media_html += 'Title : <font color="#18b8a5"><a href="' + _medias[item].thumb + '"><b>'+_medias[item].title+'</b></a><br></font>';
            if(parseInt(_medias[item].price) !== 0){
                media_html += 'Price : <b><font color="#18b8a5">'+_medias[item].price+'</font></b>';
            }
            media_html += '<br>--------------------------------';
        }

        var card = CardService.newCardBuilder().setHeader(CardService.newCardHeader().setTitle("Design infomation"))
        .addSection(CardService.newCardSection()
            .addWidget(CardService.newTextParagraph()
                .setText('<font color="#18b8a5">Document is rendering ...</font><br>-------------------<br>'+media_html))
            .addWidget(
                CardService.newTextButton().setText('Check render status')
                .setOnClickAction(
                    CardService.newAction().setFunctionName('db_api_check_status_render_free')
                    .setParameters({
                        pk : result.response.pk,
                        id : e.parameters.id,
                        accessToken : accessToken,
                        version : e.parameters.version
                    }))
                ))
        .build();

        var nav = CardService.newNavigation().updateCard(card);
        return CardService.newActionResponseBuilder()
        .setNavigation(nav)
        .build();
    }else{
        Console.log('Render error !');
    }
}

/* Return image url designed */
function db_api_render_premium(e){
    var accessToken = e.parameters.accessToken;
    var version = e.parameters.version;
    var id = e.parameters.id;
    var d = new Date();
    var n = d.getMilliseconds();
    var name = id + n;
    var url = "https://api.designbold.com/v3/document/"+id+"/render?name="+name+"&type=png&crop_bleed=0&quality=high&pages=picked&mode=download&wm=0&session=&beta=0&picked=%5B1%5D";
    var headers_opt = {
        "Authorization": "Bearer " + accessToken
    }

    setRenderStatus(e.parameters.id, 1);
    var res_payout = db_api_payout(accessToken, id, version);
    if("response" in res_payout && "purchase_id" in res_payout.response){
        setPurchaseIdParameter(id, res_payout.response.purchase_id);
    }
    var result = JSON.parse(accessProtectedResource(url, "GET", headers_opt));

    if(result.response.pk !== ''){
        // Set pk parameter with document id
        setPkParameter(e.parameters.id, result.response.pk);
        
        var checkout_info = JSON.parse(db_api_checkout(accessToken, e.parameters.id, e.parameters.version));
        var _medias = checkout_info.response.medias;
        var _total = checkout_info.response.total;
        var accountUser = JSON.parse(db_api_get_info_user(accessToken));
        var your_budget = parseInt(accountUser.response.account.budget);
        var your_budget_bonus = parseInt(accountUser.response.account.budget_bonus);
        var total_budget = your_budget + your_budget_bonus;
        var estimate = parseInt(_total);

        // List media used by design
        if(_medias.length > 0) var media_html = '<br>List items: <br>';
        else var media_html = '';

        for(var item in _medias){
            media_html += 'Title : <font color="#18b8a5"><a href="' + _medias[item].thumb + '"><b>'+_medias[item].title+'</b></a><br></font>';
            if(parseInt(_medias[item].price) !== 0){
                media_html += 'Price : <b><font color="#18b8a5">'+_medias[item].price+'</font></b>';
            }
            media_html += '<br>--------------------------------';
        }

        var htmlTemplate = '<font color="#18b8a5"><b>Design Premium </b></font><br>';
        if(estimate > 1){
            htmlTemplate += 'Pay: <b><font color="#18b8a5">' + estimate +'</font></b> Coins<br>';
        }else if(estimate == 1){
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

        var card = CardService.newCardBuilder().setHeader(CardService.newCardHeader().setTitle("Design infomation"))
        .addSection(CardService.newCardSection()
            .addWidget(CardService.newTextParagraph()
                .setText('<font color="#18b8a5">Document is rendering ...</font><br>-------------------<br>'))
            .addWidget(CardService.newTextParagraph()
                .setText(htmlTemplate))
            .addWidget(
                CardService.newTextButton().setText('Check render status')
                .setOnClickAction(
                    CardService.newAction().setFunctionName('db_api_check_status_render_premium')
                    .setParameters({
                        pk : result.response.pk,
                        id : e.parameters.id,
                        accessToken : accessToken,
                        version : e.parameters.version
                    })))
            )
        .build();

        var nav = CardService.newNavigation().updateCard(card);
        return CardService.newActionResponseBuilder()
        .setNavigation(nav)
        .build();
    }else{
        Console.log('Render error !');
    }
}

/* Function check status render base on pk parameter */
function db_api_check_status_render_free(e){
    var id = e.parameters.id;
    var pk = e.parameters.pk;
    var version = parseInt(e.parameters.version);
    var accessToken = e.parameters.accessToken;
    var d = new Date();
    var n = d.getMilliseconds();
    var name = id + n;
    var url = '';
    var headers_opt = { "Authorization": "Bearer " + accessToken };

    url = "https://api.designbold.com/v3/document/"+id+"/render?name="+name+"&type=png&crop_bleed=0&quality=high&pages=picked&mode=download&wm=0&session=&beta=0&picked=%5B1%5D&pk="+pk;

    var result = JSON.parse(accessProtectedResource(url, "GET", headers_opt));
    if(result.response !== undefined && result.response.downloadUrl !== undefined){
        // Render successfully. Free to download!
        var checkout_info = JSON.parse(db_api_checkout(accessToken, id, version));
        var medias = checkout_info.response.medias;
        var downloadUrl = result.response.downloadUrl;
        setDownloadUrl(id, downloadUrl);
        setRenderStatus(id, 2);
        return layout_render_successfully(id, downloadUrl, medias, 'Design is free to download', 'The design is ready for download.');
    }else{
        // Rendering. Wait a minute!
        setRenderStatus(id, 1);
        return layout_rendering(id, version, 0, pk, 'Design is free to download', 'The design rendering... !', accessToken);
    }
}

function db_api_check_status_render_premium(e){
    var id = e.parameters.id;
    var pk = e.parameters.pk;
    var version = parseInt(e.parameters.version);
    var accessToken = e.parameters.accessToken;
    var d = new Date();
    var n = d.getMilliseconds();
    var name = id + n;
    var purId = getPurchaseIdParameterByDocumentId(id);
    var headers_opt = { "Authorization": "Bearer " + accessToken };
    var url = "https://api.designbold.com/v3/document/"+id+"/render?name="+name+"&type=png&crop_bleed=0&quality=high&pages=all&mode=download&wm=0&session=&beta=0&picked=%5B1%5D&purId="+purId+"&pk="+pk;
    
    var result = JSON.parse(accessProtectedResource(url, "GET", headers_opt));

    if(result.response !== undefined && result.response.downloadUrl !== undefined){
        var downloadUrl = result.response.downloadUrl;
        setDownloadUrl(id, downloadUrl);
        setRenderStatus(id, 2);
        var checkout_info = JSON.parse(db_api_checkout(accessToken, id, version));
        var medias = checkout_info.response.medias;

        return layout_render_successfully(id, downloadUrl, medias, 'Design Premium', 'The design is ready for download.');
    }else{
        setRenderStatus(id, 1);
        return layout_rendering(id, version, 1, pk, 'Design Premium', 'The design rendering... !', accessToken);
    }
}

/* payout */
function db_api_payout(accessToken, id, version){
    var url = "https://api.designbold.com/v3/document/"+id+"/payout";
    var headers_opt = {
        "Authorization": "Bearer " + accessToken
    }

    return JSON.parse(accessProtectedResource(url, "PATCH", headers_opt));
}

function saveToGoogleDriver(e){
    var params = {
        "id" : e.parameters.id,
        "downloadUrl" : e.parameters.downloadUrl
    };

    var design_url = saveDriver(params.downloadUrl);
    deleteItemPropertyDownloadUrl(params.id);
    deleteItemPropertyRenderStatus(params.id);
    deleteItemPropertyPkParameter(params.id);
    deleteItemPropertyPurchaseIdParameter(params.id);

    getRenderStatusByDocumentId(params.id)

    var card = CardService.newCardBuilder()
    .addSection(CardService.newCardSection()
        .addWidget(CardService.newTextParagraph()
            .setText('<font color="#18b8a5">The design was successfully downloaded</font><br>-------------------<br>'))
        .addWidget(CardService.newTextParagraph()
            .setText('<a href="'+design_url+'" target="_blank"><b>View design in drive</b></a>'))
        )
    .build();

    var nav = CardService.newNavigation().updateCard(card);
    return CardService.newActionResponseBuilder()
    .setNavigation(nav)
    .build();
}

/*------------------------------------------------------------------------------------------------*/

function accessProtectedResource(url, method_opt, headers_opt) {
    var service = getOAuthService();
    var maybeAuthorized = service.hasAccess();

    if (maybeAuthorized) {
        var accessToken = service.getAccessToken();
        var method = method_opt || 'get';
        var headers = headers_opt || {};
        headers['Authorization'] =
        Utilities.formatString('Bearer %s', accessToken);
        var resp = UrlFetchApp.fetch(url, {
            'headers': headers,
            'method' : method,
            'muteHttpExceptions': true, 
        });

        var code = resp.getResponseCode();
        if (code >= 200 && code < 300) {
            return resp.getContentText("utf-8"); // Success
        } else if (code == 401 || code == 403) {
            maybeAuthorized = false;
        } else {
            console.error("Backend server error (%s): %s", code.toString(),
                resp.getContentText("utf-8"));
            throw ("Backend server error: " + code);
        }
    }else{
        CardService.newAuthorizationException()
        .setAuthorizationUrl(service.getAuthorizationUrl())
        .setResourceDisplayName("Display name to show to the user")
        .setCustomUiCallback('create3PAuthorizationUi')
        .throwException();
    }
}

function getOAuthService() {
    return OAuth2.createService('DESIGNBOLD_LOGIN')
    .setAuthorizationBaseUrl('https://www.designbold.com/v3/authentication')
    .setTokenUrl('https://accounts.designbold.com/v2/oauth/token')
    .setClientId('QMvWpekgLW7KGywVmrl29ABap1QEb9o4qY6PJjDzZn0eR53NOXxvMoXmVg0n@designbold-apps')
    .setClientSecret('G63RlwG1kwqAXgDdPmQe25p3O6NZyQ5yxl4vKrRaM0LJzY7bBojEnW15dJpv@designbold-apps')
    .setCallbackFunction('authCallback')
    .setParam('response_type','code')
    .setCache(CacheService.getUserCache())
    .setLock(LockService.getUserLock())
    .setPropertyStore(PropertiesService.getUserProperties());
}

function authCallback(callbackRequest) {
    var authorized = getOAuthService().handleCallback(callbackRequest);
    if (authorized) {
        return HtmlService.createHtmlOutput(
            'Success! <script>setTimeout(function() { top.window.close() }, 1);</script>');
    } else {
        return HtmlService.createHtmlOutput('Denied');
    }
}

function handleSignOutClick() {
    deleteCurrenPage();
    deleteAllPropertyDownloadUrl();
    deleteAllPropertyRenderStatus();
    deleteAllPropertyPkParameter();
    deleteAllPropertyPurchaseIdParameter();
    var service = getOAuthService();
    service.reset();
    return create3PAuthorizationUi();
}

function create3PAuthorizationUi() {
    var service = getOAuthService();
    var authUrl = service.getAuthorizationUrl();
    var authButton = CardService.newTextButton()
    .setText('Begin Authorization')
    .setAuthorizationAction(CardService.newAuthorizationAction()
        .setAuthorizationUrl(authUrl));

    var promptText =
    'To show you information from your DesignBold account that is relevant' +
    ' to the recipients of the email, this add-on needs authorization';

    var card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
        .setTitle('Authorization Required'))
    .addSection(CardService.newCardSection()
        .setHeader('This add-on needs access to your DesignBold account.')
        .addWidget(CardService.newTextParagraph()
            .setText(promptText))
        .addWidget(CardService.newButtonSet()
            .addButton(authButton)))
    .build();
    return card;
}

function get3PAuthorizationUrls(){
    setCurrentPageOnlyFirstTime();
}