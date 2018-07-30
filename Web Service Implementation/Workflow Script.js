//-------user Information Includes NUR_FirstName, NUR_LastName, NUR_NameofLocation->u_location_guid(u_prolog_contacts)
var firstName = current.variables.NUR_FirstName.toString();
var lastName = current.variables.NUR_LastName.toString();
var ProManager = current.variables.NUR_PrologManager.toString();
var Converge = current.variables.NUR_Converge.toString();
var Mobile = current.variables.NUR_Mobile.toString();
var RitmNumber = current.number;
var env = current.variables.NUR_EnvInfo;
var SoapCallRead;
var SoapCallSave;
var SoapCallAdd;

var fName = firstName.substring(0, 3);
var lName = lastName.substring(0, 3);
gs.log(RitmNumber + "ContactId: " + contactId + "fName: " + fName + "lName: " + lName);
var userName = firstName + " " + lastName;
//check for the environmnet to trigger the environment based soap calls

if (env == 'US') {
    SoapCallRead = 'Prolog_UserRequest__ReadSaveDocument_US';
    SoapCallSave = 'Prolog_UserRequest__ReadSaveDocument_US';
    SoapCallAdd = 'Prolog_UserRequest_AddUpdateUser_US';
    workflow.scratchpad.urls = "https://converge.jacobs.com/prologconverge/WebClient/"; //used in Notification
}
if (env == 'UK') {
    SoapCallRead = 'Prolog_UserRequest__ReadSaveDocument_UK';
    SoapCallSave = 'Prolog_UserRequest__ReadSaveDocument_UK';
    SoapCallAdd = 'Prolog_UserRequest_AddUpdateUser_UK';
    workflow.scratchpad.urls = "https://convergeeu.jacobs.com/prologconverge/WebClient/";
}
// set the enumeration value
var enumeration;
if (ProManager == 'true' && Converge == 'false' && Mobile == 'false')
    enumeration = '1';
if (ProManager == 'false' && Converge == 'true' && Mobile == 'false')
    enumeration = '2';
if (ProManager == 'true' && Converge == 'true' && Mobile == 'false')
    enumeration = '3';
if (ProManager == 'false' && Converge == 'false' && Mobile == 'true')
    enumeration = '4';
if (ProManager == 'true' && Converge == 'false' && Mobile == 'true')
    enumeration = '5';
if (ProManager == 'false' && Converge == 'true' && Mobile == 'true')
    enumeration = '6';
if (ProManager == 'true' && Converge == 'true' && Mobile == 'true')
    enumeration = '7';
gs.log(RitmNumber + "Enumeration: " + enumeration);
// unique username creation
var fName = firstName.substr(0, 3);
var lName = lastName.substr(0, 3);
var baseId = fName + lName;
baseId = baseId.toUpperCase();
var contactId = baseId;
var mx = 0;
var suffix = 0;

var gr = new GlideRecord("u_prolog_contacts");
gr.addEncodedQuery('u_contact_idSTARTSWITH' + contactId);
gr.orderBy('u_contact_id');
gr.query();

while (gr.next()) {
    gs.log("coming in loop");
    if (gr.u_contact_id == contactId) {
        mx = 0;
    } else {
        if (!isNaN(parseInt(gr.u_contact_id.substr(-2)))) { //joshim01
            if (mx < parseInt(gr.u_contact_id.substr(-2))) {
                mx = parseInt(gr.u_contact_id.substr(-2));
            }
        } else if (!isNaN(parseInt(gr.u_contact_id.substr(-1)))) { //johsim1
            if (mx < parseInt(gr.u_contact_id.substr(-1))) {
                mx = parseInt(gr.u_contact_id.substr(-1));
            }
        } else { //JOHSIMM Exists
            if (mx < 1) {
                mx = 0;
            }
        }
    }
}
if (mx > 0 && mx < 9) {
    suffix = mx + 1;
    contactId = baseId + '0' + suffix.toString();
    gs.log("contact id " + contactId);
} else if (mx > 9) {
    suffix = mx + 1;
    contactId = baseId + suffix.toString();
    gs.log("contact id else if is " + contactId);
} else {
    gs.log("contact id else is " + contactId);
}
// auto password generation
var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOP1234567890";
var pass = "";
var length = "10";
for (var x = 0; x < length; x++) {
    var j = Math.floor(Math.random() * chars.length);
    pass += chars.charAt(j);
}
//-----------Grid Information----------------
var dataGrid = current.variables.NUR_json;
var obj = JSON.parse(dataGrid);
gs.log(RitmNumber + "Data Grid:" + obj);

var databases = "";

for (var i = 0; i < obj.length; i++) {
    var portfolio = obj[i].field1;
    var proj = obj[i].field2;
    var security = obj[i].field3;
    var company = obj[i].field4;
    var location = obj[i].field5;
    databases += portfolio + ", ";
    gs.log(RitmNumber + "  Iteration: " + i + "\nPortfolio:" + portfolio + " Project:" + proj + " Security:" + security + " company:" + company + " location:" + location);

    //--u_company_name->u_company_guid(u_prolog_contacts)
    var gr1 = new GlideRecord('u_prolog_contacts');
    gr1.addQuery('u_company_name', company);
    gr1.addQuery('u_portfolio_name', portfolio);
    gr1.query();
    gr1.next();
    var companyGUID = gr1.u_company_guid;

    //--u_name_of_location->u_location_guid(u_prolog_contacts)
    var gr2 = new GlideRecord('u_prolog_contacts');
    gr2.addQuery('u_name_of_location', location);
    gr2.addQuery('u_portfolio_name', portfolio);
    gr2.addQuery('u_company_name', company);
    gr2.query();
    gr2.next();
    var locationGUID = gr2.u_location_guid;

    //--u_project_name->u_project_guid(u_prolog_projects)
    var gr3 = new GlideRecord('u_prolog_projects');
    gr3.addQuery('u_project_name', proj);
    gr3.query();
    gr3.next();
    var projGUID = gr3.u_project_guid;
    var projID = gr3.u_project_id;

    //--Security->u_usergroup_id(u_prolog_securitygroups)
    var gr4 = new GlideRecord('u_prolog_securitygroups');
    gr4.addQuery('u_usergroup_name', security);
    gr4.query();
    gr4.next();
    var GroupID = gr4.u_usergroup_id;

    try {
        //call 4 request
        var ReadCall = new sn_ws.SOAPMessageV2(SoapCallRead, 'DocumentServiceSoap.ReadDocument');
        ReadCall.setStringParameterNoEscape('Portfolio_name', portfolio); //portfolio
        ReadCall.setStringParameterNoEscape('Project_Name', proj); //projectname
        ReadCall.setStringParameterNoEscape('Document_GUID', companyGUID); //company guid
        var response = ReadCall.execute();
        var requestBody = ReadCall.getRequestBody();
        var responseBody = response.haveError() ? response.getErrorMessage() : response.getBody();
        var status = response.getStatusCode();

        gs.log(RitmNumber + "  Iteration: " + i + " | Read call status is -------" + status);
        gs.log(RitmNumber + "  Iteration: " + i + " | Read call Request Body is -------" + requestBody);
        gs.log(RitmNumber + "  Iteration: " + i + " | Read call Response Body is -------" + responseBody);
        var xmlDoc = new XMLDocument2();
        xmlDoc.parseXML(responseBody);

        var conEle = xmlDoc.getNode("//Contacts");
        xmlDoc.setCurrentElement(conEle);
        var newEle = xmlDoc.createElement("ContactsRow");
        newEle.setAttribute("RowState", "Added");
        xmlDoc.setCurrentElement(newEle);
        xmlDoc.createElementWithTextValue("ContactID", contactId);
        xmlDoc.createElementWithTextValue("Address_ItemGuid", locationGUID);
        xmlDoc.createElementWithTextValue("DisplayName", userName);
        xmlDoc.createElementWithTextValue("FirstName", firstName);
        xmlDoc.createElementWithTextValue("LastName", lastName);
        xmlDoc.createElementWithTextValue("IsMainContact", "false");
        xmlDoc.createElementWithTextValue("IsAutoNotify", "false");
        xmlDoc.createElementWithTextValue("IsActive", "true");
        xmlDoc.createElementWithTextValue("IsCurrent", "false");
        xmlDoc.createElement("GUID");
        var projEle = xmlDoc.createElement("ProjectsLinks");
        xmlDoc.setCurrentElement(projEle);
        var proLink = xmlDoc.createElement("ProjectsLinksRow");
        proLink.setAttribute("RowState", "Added");
        xmlDoc.setCurrentElement(proLink);
        xmlDoc.createElementWithTextValue("Project_Guid", projGUID);
        xmlDoc.createElementWithTextValue("Project_DocumentType", "MeridianSystems.Prolog.Business.Administration.Projects.ProjectsDocument");
        xmlDoc.createElementWithTextValue("IsMainProjectContact", "false");

        var docData = xmlDoc.getNode("//DocumentData");

        var saveRequest =
            "<s:Envelope xmlns:s=\"http://schemas.xmlsoap.org/soap/envelope/\">" +
            "<s:Header>" +
            "<Security xmlns=\"http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd\">" +
            "<o:UsernameToken u:id=\"e3bf6ff7-22f3-419e-8df1-82ba66dc388e\" xmlns:o=\"http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd\" xmlns:u=\"http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd\">" +
            "<o:Username>ServiceNowTest</o:Username>" +
            "<o:Password>service123</o:Password>" +
            "<o:Nonce>MQF6ciZl5K/OWGlQ9ClEptMx2r8=</o:Nonce>" +
            "</o:UsernameToken>" +
            "</Security>" +
            "<TargetPortfolio xmlns=\"http://www.mps.com/Prolog/webservices\">" + portfolio + "</TargetPortfolio>" +
            "<TargetProject xmlns=\"http://www.mps.com/Prolog/webservices\">" + proj + "</TargetProject>" +
            "</s:Header>" +
            "<s:Body xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\">" +
            "<SaveDocument xmlns=\"uri://meridiansystems.com/prolog/connect/documentservice\">" +
            "<SaveDocumentArgument>" +
            docData.toString() +
            "</SaveDocumentArgument>" +
            "<DocumentOutputOptions>" +
            "<IncludeMetaData>false</IncludeMetaData>" +
            "</DocumentOutputOptions>" +
            "</SaveDocument>" +
            "</s:Body>" +
            "</s:Envelope>";
        //Call 5 Request
        var SaveCall = new sn_ws.SOAPMessageV2(SoapCallSave, 'DocumentServiceSoap.SaveDocument');
        SaveCall.setRequestBody(saveRequest);

        var response_Save = SaveCall.execute();
        var requestBody_Save = SaveCall ? SaveCall.getRequestBody() : null;
        var responseBody_Save = response_Save.haveError() ? response_Save.getErrorMessage() : response_Save.getBody();
        var status_Save = response_Save.getStatusCode();
        var xmlDoc2 = new XMLDocument2(); //xml doc
        xmlDoc2.parseXML(responseBody_Save);
        var Faultstring = xmlDoc2.getNodeText('//faultstring');
        workflow.scratchpad.Faultstring = Faultstring;
        workflow.scratchpad.status = status_Save;
        //workflow.scratchpad.responsebody = responseBody_Save ;

        gs.log(RitmNumber + "  Iteration: " + i + " | SAVE call status is -------" + status_Save);
        gs.log(RitmNumber + "  Iteration: " + i + " | SAVE call Request Body: " + requestBody_Save);
        gs.log(RitmNumber + "  Iteration: " + i + " | SAVE call Response Body: " + responseBody_Save);
        //Call 6 Request
        var addUpdateCall = new sn_ws.SOAPMessageV2(SoapCallAdd, 'AdministrationServiceSoap.AddOrUpdateUser');
        addUpdateCall.setStringParameterNoEscape('Portfolio_name', portfolio); //portfolio
        addUpdateCall.setStringParameterNoEscape('Project_name', proj); //projectname
        addUpdateCall.setStringParameterNoEscape('User_name', userName);
        addUpdateCall.setStringParameterNoEscape('Password', pass);
        addUpdateCall.setStringParameterNoEscape('ContactId', contactId);
        addUpdateCall.setStringParameterNoEscape('DefGroupID', GroupID);
        addUpdateCall.setStringParameterNoEscape('DefGroupName', security);
        addUpdateCall.setStringParameterNoEscape('enumeration', enumeration);
        addUpdateCall.setStringParameterNoEscape('ProjectID', projID);
        addUpdateCall.setStringParameterNoEscape('GroupID', GroupID);
        addUpdateCall.setStringParameterNoEscape('GroupName', security);

        var response_add = addUpdateCall.execute();
        var requestBody_add = addUpdateCall ? addUpdateCall.getRequestBody() : null;
        var responseBody_add = response_add.getBody();
        var status_add = response_add.getStatusCode();

        gs.log(RitmNumber + "  Iteration: " + i + " | UPDATE call status is -------" + status_add);
        gs.log(RitmNumber + "  Iteration: " + i + " | UPDATE call Request Body: " + requestBody_add);
        gs.log(RitmNumber + "  Iteration: " + i + " | UPDATE call Response Body: " + responseBody_add);

    } catch (ex) {
        var message = ex.getMessage();
        //s.setXMLParameter('documentdata', doc);
    }
}
//below variables are used in workflow notification
workflow.scratchpad.env = env;
workflow.scratchpad.name = userName;
//workflow.scratchpad.email = current.variables.NUR_Emailaddress;
workflow.scratchpad.database = databases;
workflow.scratchpad.passWord = pass;