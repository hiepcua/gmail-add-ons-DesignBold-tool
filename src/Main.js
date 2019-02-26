var DEBUG = true;

function getInsertImageComposeUI(e) {
    return [buildImageComposeCard()];
}

function getImageUrls(){
    return [
    "https://www.gettyimages.ie/gi-resources/images/Homepage/Hero/UK/CMS_Creative_164657191_Kingfisher.jpg",
    "https://www.gettyimages.ie/gi-resources/images/Homepage/Hero/UK/CMS_Creative_164657191_Kingfisher.jpg",
    "https://www.gettyimages.ie/gi-resources/images/Homepage/Hero/UK/CMS_Creative_164657191_Kingfisher.jpg"
    ];
}

function getContextualAddOn(event) {
    event.parameters = { action: "showAddOn" };
    return dispatchActionInternal_(event, addOnErrorHandler);
}

function buildImageComposeCard(accessToken) {
    return dispatchActionInternal_({
        parameters: {
            action: "showLogin",
            pars: accessToken
        }
    });
}

// Function open new window login DesignBold
function openLoginWindow() {
    CardService.newAuthorizationAction()
    .setAuthorizationUrl("https://designbold.com/");

    // CardService.newAuthorizationException()
    //     .setAuthorizationUrl("https://designbold.com/")
    //     .setResourceDisplayName("Example Resource")
    //     .setCustomUiCallback('test')
    //     .throwException();

    var actionResponse = CardService.newActionResponseBuilder()
    .setOpenLink(CardService.newOpenLink()
        .setUrl("https://designbold.com/")
        .setOpenAs(CardService.OpenAs.OVERLAY)
        .setOnClose(CardService.OnClose.RELOAD_ADD_ON));
    return actionResponse.build();
}

/* Function check login. Access token not expires */
function isLogin(){
    var flag = false;
    var acToken = getAccessTokenUserProperties();
    /* Kiểm tra xem access token đã hết hạn/ hợp lệ chưa. */
    if( acToken ){

    }

    return flag;
}

function applyInsertImageAction(e) {
    var actionResponse = CardService.newActionResponseBuilder()
    .setOpenLink(CardService.newOpenLink()
        .setUrl("https://designbold.com/")
        .setOpenAs(CardService.OpenAs.FULL_SIZE));
    return actionResponse.build();
}

/**
* Validates and dispatches an action.
*
* @param {Event} event - user event to process
* @param {ErrorHandler} errorHandler - Handles errors, optionally 
*        returning a card or action response.
* @return {ActionResponse|UniversalActionResponse|Card} Card or form action
*/
function dispatchActionInternal_(event, errorHandler) {
    if (DEBUG) {
        // console.time("dispatchActionInternal");
        // console.log(event);
    }

    try {
        var actionName = event.parameters.action;
        if (!actionName) {
            throw new Error("Missing action name.");
        }

        var actionFn = ActionHandlers[actionName];
        if (!actionFn) {
            throw new Error("Action not found: " + actionName);
        }

        return actionFn(event);
    } catch (err) {
        // console.error(err);
        if (errorHandler) {
            return errorHandler(err);
        } else {
            throw err;
        }
    } finally {
        if (DEBUG) {
            // console.timeEnd("dispatchActionInternal");
        }
    }
}

/**
* Handle unexpected errors for the main universal action entry points.
*
* @param {Error} exception - Exception to handle
* @return {Card|ActionResponse|UnivseralActionResponse} optional card or action response to render
*/
function addOnErrorHandler(err) {
    var card = addOnErrorHandler(err);
    return CardService.newUniversalActionResponseBuilder()
    .displayAddOnCards([card])
    .build();
    // if (err instanceof AuthorizationRequiredException) {
    //     CardService.newAuthorizationException()
    //     .setAuthorizationUrl(githubClient().authorizationUrl())
    //     .setResourceDisplayName("GitHub")
    //     .setCustomUiCallback("handleAuthorizationRequired")
    //     .throwException();
    // } else {
    //     return buildErrorCard({
    //         exception: err,
    //         showStackTrace: DEBUG
    //     });
    // }
}

function loginErrorHandler(err) {
    var card = addOnErrorHandler(err);
    return CardService.newUniversalActionResponseBuilder()
    .displayAddOnCards([card])
    .build();
}

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

/* Set refresh token in user properties store */
function setRefreshTokenUserProperties(refreshToken){
    var userProperties = PropertiesService.getUserProperties();
    userProperties.setProperty('refreshToken', refreshToken);
}

/* Check refresh token in user properties store */
function checkRefreshToken(){}

/* Refresh access token */
function refreshToken5Time(){}

function accessProtectedResource(url, method_opt, headers_opt) {
    var service = getOAuthService();
    var maybeAuthorized = service.hasAccess();
    if (maybeAuthorized) {
        // A token is present, but it may be expired or invalid. Make a
        // request and check the response code to be sure.

        // Make the UrlFetch request and return the result.
        var accessToken = service.getAccessToken();
        var method = method_opt || 'get';
        var headers = headers_opt || {};
        headers['Authorization'] =
        Utilities.formatString('Bearer %s', accessToken);
        var resp = UrlFetchApp.fetch(url, {
            'headers': headers,
            'method' : method,
            'muteHttpExceptions': true, // Prevents thrown HTTP exceptions.
        });

        var code = resp.getResponseCode();
        if (code >= 200 && code < 300) {
            return resp.getContentText("utf-8"); // Success
        } else if (code == 401 || code == 403) {
            // Not fully authorized for this action.
            maybeAuthorized = false;
        } else {
            // Handle other response codes by logging them and throwing an
            // exception.
            console.error("Backend server error (%s): %s", code.toString(),
                resp.getContentText("utf-8"));
            throw ("Backend server error: " + code);
        }
    }

    if (!maybeAuthorized) {
        // Invoke the authorization flow using the default authorization
        // prompt card.
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

function resetOAuth() {
    getOAuthService().reset();
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
    ' to the recipients of the email, this add-on needs authorization' +
    ' to: <ul><li>Read recipients of the email</li>' +
    '         <li>Read contact information from 3P account</li></ul>.';

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
    return [card];
}

function get3PAuthorizationUrls() {
    var acToken = getAccessTokenUserProperties();
    var rfToken = getRefreshTokenUserProperties();
    // Tạm thời
    // var dfAccessToken = "b0f99ceb3d596cb8e7152088548c41e981920c0bd92312047fd8e75b9eee440d";
    // var accessToken = "Z4nYOLdED50Q2WvwG6ly4eJqjb91rkypXB83zagP";
    // var refreshToken = "2bv0O7ADlj4WkR38mxLB8MdnpP6KozwrVygZNEBq";
    var headers_opt = {
        "Authorization": "Bearer Z4nYOLdED50Q2WvwG6ly4eJqjb91rkypXB83zagP"
    }

    if( acToken !== null && rfToken !== null ){
        // Đã đăng nhập rồi, cần kiểm tra xem cái token đó đã hết hạn chưa, đã đúng định dạng chưa
        var status_acToken = checkAccessTokenExpires(acToken);
        // Nếu hết hạn thực hiện refresh 5 lần.
        if( status_acToken === 204 ){
            // refresh token 5 times
            var status_rfToken = refreshToken5Time(rfToken);
            if( status_rfToken === 200 ){
                /* refresh token success. Save new access token.Do something with new access token */
            }else{ /* 406 || 500 */
                /* refresh token false. Do something */
            }
        }else{
            // Nếu access token vẫn còn hạn. Do something.
            // .....
        }
    }else{
        // Trường hợp chưa đăng nhập.
        // var card = CardService.newCardBuilder();
        // card.setHeader(CardService.newCardHeader().setTitle('Login'));
        // card.build();
        accessProtectedResource("https://api.designbold.com/v3/user/me", "GET", headers_opt);
    }

    // accessProtectedResource("https://api.designbold.com/v3/user/me", "GET");
    // accessProtectedResource("https://api.service2.com/probe");
    // accessProtectedResource("https://api.service3.com/check_logged_in");
}