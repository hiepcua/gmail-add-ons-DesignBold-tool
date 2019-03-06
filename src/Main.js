/*-----------------------------------------------------------------------------------------------*/

/* Get access token in user properties store */
function getAccessTokenUserProperties(){
    var userProperties = PropertiesService.getUserProperties();
    var acToken = userProperties.getProperty('accessToken');

    if(acToken === 'null'){
        return false;
    }else{
        return acToken;
    }
}

/* Set access token in user properties store */
function setAccessTokenUserProperties(accessToken){
    var userProperties = PropertiesService.getUserProperties();
    userProperties.setProperty('accessToken', accessToken);
}

/* Check access token in user properties store, expires or not */
function checkAccessTokenExpires(accessToken){
}

/* Get refresh token in user properties store */
function getRefreshTokenUserProperties(){
    var userProperties = PropertiesService.getUserProperties();
    var refreshToken = userProperties.getProperty('refreshToken');

    if(refreshToken === 'null'){
        return false;
    }else{
        return refreshToken;
    }
}

/* Get refresh token from server by access token */
function getRefreshTokenByAccessToken(){
    var userProperties = PropertiesService.getUserProperties();
    var refreshToken = userProperties.getProperty('refreshToken');

    if(refreshToken === 'null'){
        return false;
    }else{
        return refreshToken;
    }
}

/* Set refresh token in user properties store */
function setRefreshTokenUserProperties(refreshToken){
    var userProperties = PropertiesService.getUserProperties();
    userProperties.setProperty('refreshToken', refreshToken);
}

/* Check refresh token in user properties store */
function checkRefreshToken(){}

/* Refresh access token */
function refreshToken5Time(){}

/*-----------------------------------------------------------------------------------------------*/
function getInsertImageComposeUI(e) {
    return [buildImageComposeCard()];
}

function buildImageComposeCard(accessToken) {
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
    // console.log(accessToken);

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
    // console.log('accessToken');

    var card = CardService.newCardBuilder();
    var cardHeader = CardService.newCardHeader();

    var buttonSet = CardService.newButtonSet()
    .addButton(CardService.newTextButton().setText('Logout')
        .setOnClickAction(
            CardService.newAction()
            .setFunctionName('logout')
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
            .setFunctionName('createComposeDraft'), 
            CardService.ComposedEmailType.REPLY_AS_DRAFT));

    var section_intro = CardService.newCardSection()
    .addWidget(
        CardService.newTextParagraph()
        .setText('<b class="db_title">Your design with DesignBold</b>')
        )
    .addWidget(buttonSet);

    return card.setHeader(cardHeader)
    .addSection(section_intro)
    .addSection(getListImage())
    .build();
}

function getData(){
    var accessToken = getOAuthService().getAccessToken();
    var headers_opt = {
        "Authorization": "Bearer " + accessToken
    }
    return accessProtectedResource("https://api.designbold.com/v3/document?owner=me&sort=modified&start=0&limit=15&target=my-design&loc=wp&folder_id=", "GET", headers_opt);
}

function getListImage(){
    var jsonData = JSON.parse(getData());
    var list = jsonData.response;
    var cardSection = CardService.newCardSection();
    var i=0;
    for (var item in list) {
        var imageUrl = list[item].thumb;
        var edit_link = list[item].edit_link;
        if(imageUrl === '') imageUrl = 'https://cdn.designbold.com/web/dbcream/main/images/empty_design.jpg';
        cardSection
        .addWidget(
            CardService.newImage()
            .setImageUrl(imageUrl)
            .setOnClickAction(
                CardService.newAction()
                .setFunctionName("designImgCallback")
                .setParameters({design_url: edit_link})
                )
            );
    }

    return cardSection;
}

function showOptionImage(){}

function designImgCallback(e) {
    // var accessToken = e.messageMetadata.accessToken;
    // GmailApp.setCurrentMessageAccessToken(accessToken);

    // var composeActionResponse = CardService.newComposeActionResponseBuilder()
    // .setGmailDraft(GmailApp.createDraft("recipient", "subject", "body"))
    // .build();

    // GmailApp.createDraft('mike@example.com', 'Attachment example', 'Please see attached file.', {
    //     bcc: "tranviethiep69@gmail.com",
    //     bcc: "tradaviahe2017@gmail.com",
    //     name: 'Automatic Emailer Script'
    // });

    // var draft = thread.createDraftReply('This is a reply');
    // return CardService.newComposeActionResponseBuilder()
    // .setGmailDraft(draft)
    // .build();

    var action_compose = CardService.newAction().setFunctionName('composeEmailCallback');
    CardService.newTextButton()
        .setText('Compose Email')
        .setComposeAction(action_compose, CardService.ComposedEmailType.REPLY_AS_DRAFT);
}

function composeEmailCallback(e) {
    var accessToken = e.messageMetadata.accessToken;
    GmailApp.setCurrentMessageAccessToken(accessToken);

    var thread = GmailApp.getThreadById(e.threadId);
    var draft = thread.createDraftReply('This is a reply');
    return CardService.newComposeActionResponseBuilder()
        .setGmailDraft(draft)
        .build();
}

/* Open link to edit/design image */
function openDesign(e){
    var actionResponse = CardService.newActionResponseBuilder()
    .setOpenLink(CardService.newOpenLink()
        .setUrl(e.parameters.design_url)
        .setOpenAs(CardService.OpenAs.FULL_SIZE)
        .setOnClose(CardService.OnClose.NOTHING));
    return actionResponse.build();
}

function createComposeDraft(e) {
    var url = e.parameters.url;
    var accessToken = e.messageMetadata.accessToken;
    GmailApp.setCurrentMessageAccessToken(accessToken);

    var draftCompose = GmailApp.createDraft("", "", "",{
        htmlBody: "<img src='https://cloud.designbold.com/document/27/A8/Yl/eE/ma/2/1/preview.jpg'/>",
    });

    return CardService.newComposeActionResponseBuilder()
        .setGmailDraft(draftCompose).build();
}

function saveDriver(e){
    var currentTime = new Date();
    var year = currentTime.getFullYear();
    var month = currentTime.getMonth() + 1;
    var day = currentTime.getDate();

    // If folder not exists then create folder DesignBold
    if(!checkFolderExists('DesignBold')){
        DriveApp.createFolder('DesignBold');
        var par_id = getFolderIdByParent(0, 'DesignBold');
        var f_year_id = createFolder(par_id, year); 
        var f_month_id = createFolder(f_year_id, month);
    }else{
        var par_id = getFolderIdByParent(0, 'DesignBold');
        var f_year_id = createFolder(par_id, year);
        var f_month_id = createFolder(f_year_id, month);
    }
}
/*
return
    true : File exists
    false : File not exists
*/
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
function getFolderIdByParent(parent_id, folderName){
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
    var child_id = getFolderIdByParent(folderId, folderName);

    if(child_id == ''){
        newFolder = parentFolder.createFolder(folderName);
        return newFolder.getId();
    }else{
        return child_id;
    }
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

function logout() {
    // console.log('logout');
    var service = getOAuthService()
    service.reset();
    getContextualAddOn();
}

function create3PAuthorizationUi() {
    // console.log("create3PAuthorizationUi");
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

function get3PAuthorizationUrls() {
    // var service = getOAuthService();
    // if(!service.hasAccess()) return create3PAuthorizationUi();
    //    var acToken = service.getAccessToken();
    //
    //    var rfToken = getRefreshTokenUserProperties();
    //    // Tạm thời
    //    // var dfAccessToken = "b0f99ceb3d596cb8e7152088548c41e981920c0bd92312047fd8e75b9eee440d";
    //    // var accessToken = "Z4nYOLdED50Q2WvwG6ly4eJqjb91rkypXB83zagP";
    //    // var refreshToken = "2bv0O7ADlj4WkR38mxLB8MdnpP6KozwrVygZNEBq";
    //    var headers_opt = {
    //        "Authorization": "Bearer Z4nYOLdED50Q2WvwG6ly4eJqjb91rkypXB83zagP"
    //    }
    //
    //    if( acToken !== null ){
    //        // Đã đăng nhập rồi, cần kiểm tra xem cái token đó đã hết hạn chưa, đã đúng định dạng chưa
    //        var status_acToken = checkAccessTokenExpires(acToken);
    //        // Nếu hết hạn thực hiện refresh 5 lần.
    //        if( status_acToken === 204 ){
    //            // refresh token 5 times
    //            var status_rfToken = refreshToken5Time(rfToken);
    //            if( status_rfToken === 200 ){
    //                /* refresh token success. Save new access token.Do something with new access token */
    //            }else{ /* 406 || 500 */
    //                /* refresh token false. Do something */
    //            }
    //        }else{
    //            // Nếu access token vẫn còn hạn. Do something.
    //            // .....
    //        }
    //    }else{
    //        return create3PAuthorizationUi();
    //    }

    // accessProtectedResource("https://api.designbold.com/v3/user/me", "GET");
    // accessProtectedResource("https://api.service2.com/probe");
    // accessProtectedResource("https://api.service3.com/check_logged_in");
}
