var g_start = 0;
var count_one_page = 6;


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
function db_api_checkout(accessToken, params){
    var url = "https://api.designbold.com/v3/document/"+params.id+"/checkout?type=png&pages=all&version="+params.version;
    var headers_opt = {
        "Authorization": "Bearer " + accessToken
    }

    return accessProtectedResource(url, "GET", headers_opt);
}

/* Return image url designed */
function db_api_render(accessToken, params, successRender){
    var d = new Date();
    var n = d.getMilliseconds();
    var name = params.id + n;
    var url = "https://api.designbold.com/v3/document/"+params.id+"/render?name="+name+"&type=png&crop_bleed=0&quality=high&pages=picked&mode=download&wm=0&session=&beta=0&picked=%5B1%5D&pk=324a31810611bc5e5e162371a585d3d2";
    var headers_opt = {
        "Authorization": "Bearer " + accessToken
    }

    accessProtectedResource(url, "GET", headers_opt, function(result){
        result = JSON.parse(result);

        /* Set render status = 1. Đang render */
        var userProperties = PropertiesService.getUserProperties();
        userProperties.setProperties({renderStatus: 1});

        var downloadUrl = ("response" in result && "downloadUrl" in result.response) ? result.response.downloadUrl : 'undefined';

        if(downloadUrl == 'undefined'){
            /* Set render status = 3. Render thành công nhưng có lỗi */
            userProperties.setProperties({renderStatus: 3});
            db_api_render(accessToken, params, successRender);
        }else{
            /* Set render status = 3. Render thành công */
            userProperties.setProperties({renderStatus: 2});
            successRender(downloadUrl);
        }
    }, function(result){
        /* Set render status = 3. Render thành công nhưng có lỗi */
        userProperties.setProperties({renderStatus: 3});
        console.log(result);
    })
}

/* Get info user */
function db_api_get_info_user(accessToken){
    var url = "https://api.designbold.com/v3/user/me?";
    var headers_opt = {
        "Authorization": "Bearer " + accessToken
    }

    return accessProtectedResource(url, "GET", headers_opt);
}

/*------------------------------------------------------------------------------------------------*/

function accessProtectedResource(url, method_opt, headers_opt, successCallback, errorCallback) {
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
            if(typeof successCallback == 'function'){
                successCallback(resp.getContentText("utf-8"));
            }
            return resp.getContentText("utf-8"); // Success
        } else if (code == 401 || code == 403) {
            // Not fully authorized for this action.
            if(typeof errorCallback == 'function'){
                errorCallback(resp.getContentText("utf-8"));
            }
            maybeAuthorized = false;
        } else {
            console.error("Backend server error (%s): %s", code.toString(),
                resp.getContentText("utf-8"));
            if(typeof errorCallback == 'function'){
                errorCallback(resp.getContentText("utf-8"));
            }
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

function get3PAuthorizationUrls(){
    setCurrentPageOnlyFirstTime();
}