var g_start = 0;
var count_one_page = 6;

function getInsertImageComposeUI(e) {
    return [buildImageComposeCard()];
}

function buildImageComposeCard(e) {
    // console.log(buildImageComposeCard);
    var service = getOAuthService();
    if(service.hasAccess()){
        var card = CardService.newCardBuilder();
        var action = CardService.newAction().setFunctionName('openLoginWindow');
        var cardSection = CardService.newCardSection();
        cardSection.addWidget(CardService.newImage()
            .setImageUrl("https://ci5.googleusercontent.com/proxy/0bUHItshL0ecZvuWGz1KRhaHPiZtelj-j4pn3QJuRUqTz1gkmSLFIv4kA4wNv5MrgBUqXaoNO2GBjfKiTAvkjRSKPEw3UMOOEiiqSCs18sKH0eUP7dav5yyZjKVPzQhW4wxwnB0FlkRC")
            .setAltText("DesignBold")
            );
    }else{
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
}

function getContextualAddOn(e) {
    var accessToken = e.messageMetadata.accessToken;
    GmailApp.setCurrentMessageAccessToken(accessToken);
    setCurrentPageOnlyFirstTime();

    var service = getOAuthService();
    if(service.hasAccess(e)){
        return showSidebar(e);
    }else{
        return create3PAuthorizationUi();
    }
}

function showSidebar(e){
    var accessToken = e.messageMetadata.accessToken;
    GmailApp.setCurrentMessageAccessToken(accessToken);

    var card = CardService.newCardBuilder();
    var cardHeader = CardService.newCardHeader();

    var html = HtmlService.createTemplateFromFile('index').evaluate().getContent();

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
            .setFunctionName('showSidebar')))

    .addButton(CardService.newTextButton().setText('Driver')
        .setOnClickAction(
            CardService.newAction()
            .setFunctionName('saveDriver')))

    .addButton(CardService.newTextButton().setText('Add img')
        .setComposeAction(
            CardService.newAction()
            .setFunctionName('insertImgToCompose'), 
            CardService.ComposedEmailType.REPLY_AS_DRAFT));

    var section_intro = CardService.newCardSection()
    .addWidget(
        CardService.newTextParagraph()
        .setText('<b class="db_title">Your design with DesignBold</b>')
        )
    .addWidget(buttonSet);

    var section_html = CardService.newCardSection()
    .addWidget(CardService.newKeyValue().setContent(html));

    return card.setHeader(cardHeader)
    .addSection(section_intro)
    .addSection(section_html)
    .addSection(getListImage())
    .addSection(loadMore)
    .build();
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

function getListImage(){
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
            .addButton(CardService.newTextButton().setText('Sử dụng ảnh')
                .setComposeAction(
                    CardService.newAction()
                    .setFunctionName('insertImgToCompose')
                    .setParameters({url : imageUrl}),
                    CardService.ComposedEmailType.REPLY_AS_DRAFT))

            .addButton(CardService.newTextButton().setText('Sửa ảnh')
                .setOnClickAction(
                    CardService.newAction()
                    .setFunctionName('openLinkEditDesign')
                    .setParameters({design_url: edit_link})
                    )));
    }

    return cardSection;
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

function insertImgToCompose(e) {
    var url = e.parameters.url;
    var accessToken = e.messageMetadata.accessToken;
    GmailApp.setCurrentMessageAccessToken(accessToken);

    var driver_image_url = saveDriver(url);

    var draftCompose = GmailApp.createDraft("", "", "",{
        htmlBody: "<img src='"+driver_image_url+"'/>"
    });

    return CardService.newComposeActionResponseBuilder()
    .setGmailDraft(draftCompose).build();
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

function handleLoadMoreClick(e){
    var currentPage = getCurrentPage();
    currentPage = parseInt(currentPage) + 1;
    setCurrentPage(currentPage);
    return showSidebar(e);
}

// Save image to driver, return image url in driver
function saveDriver(url){
    var currentTime = new Date();
    var year = currentTime.getFullYear();
    var month = currentTime.getMonth() + 1;
    var day = currentTime.getDate();

    // If folder not exists then create folder DesignBold
    if(!checkFolderExists('DesignBold')){
        var folder = DriveApp.createFolder('DesignBold');
        folder.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.EDIT);
        
        var par_id = getFolderIdByName(0, 'DesignBold');
        var f_year_id = createFolder(par_id, year); 
        var f_month_id = createFolder(f_year_id, month);

        var response = UrlFetchApp.fetch(url);
        var urlImg = db_createFile(f_month_id, response);

        return 'https://drive.google.com/uc?id='+urlImg;
    }else{
        var par_id = getFolderIdByName(0, 'DesignBold');
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
    return newFile.getId();
}

/*------------------------------------------------------------------------------------------------*/

function accessProtectedResource(url, method_opt, headers_opt) {
    // console.log('accessProtectedResource');
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
            // Not fully authorized for this action.
            maybeAuthorized = false;
        } else {
            console.error("Backend server error (%s): %s", code.toString(),
                resp.getContentText("utf-8"));
            throw ("Backend server error: " + code);
        }
    }

    if (!maybeAuthorized) {
        CardService.newAuthorizationException()
        .setAuthorizationUrl(service.getAuthorizationUrl())
        .setResourceDisplayName("Display name to show to the user")
        .setCustomUiCallback('create3PAuthorizationUi')
        .throwException();
    }
}

function getOAuthService() {
    return OAuth2.createService('DESIGNBOLD_LOGIN')
    .setAuthorizationBaseUrl('https://beta.designbold.com/v3/authentication')
    .setTokenUrl('https://accounts-beta.designbold.com/v2/oauth/token')
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
    'To show you information from your 3P account that is relevant' +
    ' to the recipients of the email, this add-on needs authorization';

    var card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
        .setTitle('Authorization Required'))
    .addSection(CardService.newCardSection()
        .setHeader('This add-on needs access to your 3P account.')
        .addWidget(CardService.newTextParagraph()
            .setText(promptText))
        .addWidget(CardService.newButtonSet()
            .addButton(authButton)))
    .build();
    return card;
}