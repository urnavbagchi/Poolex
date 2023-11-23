// ==UserScript==
// @name         PoolEx
// @description  Filter the candidates
// @author       Tech : gauraam, urnavb@ (Modified)
// @version      1.2
// @updateURL    https://drive-render.corp.amazon.com/view/gauraam@/PoolEx/PoolEx.user.js
// @downloadURL  https://drive-render.corp.amazon.com/view/gauraam@/PoolEx/PoolEx.user.js
// @match       *://hire.amazon.com/jobs_new/*
// @require     http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js
// @require     https://gist.github.com/raw/2625891/waitForKeyElements.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.5.0/Chart.min.js
// @grant       GM_addStyle
// @grant       GM.xmlHttpRequest
// @grant       GM.getValue
// @grant       GM.setValue
// @grant       unsafeWindow
// @require     https://gist.githubusercontent.com/arantius/3123124/raw/grant-none-shim.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/js/all.min.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.js

// ==/UserScript==
var localStoragePrefix = "******"+GM.info.script.name+"***"
const monthList = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
var todayDate = new Date();
var allCandidates = [];
var progbar=0;
var progbarOffset;
var batchSize = 50;

 // Create a div element with id 'myContainer'
  var zNode = document.createElement("div");
  zNode.setAttribute("id", "myContainer");

  // Find the target element with class 'css-1mdr4vu'
  var targetElement = document.querySelector('.css-1mdr4vu');

  // Check if the target element exists
  if (targetElement) {
    // Prepend the created div to the target element
    targetElement.prepend(zNode);

    // Add content to the created div
    zNode.innerHTML = '<div id="myProgress"><div id="myBar"></div></div>';
      // Create a div element for both buttons
      var buttonsContainer = document.createElement('div');
      buttonsContainer.style.position = 'fixed';
      buttonsContainer.style.bottom = '20px';
      buttonsContainer.style.left = '10px';
      buttonsContainer.style.display = 'flex';
      buttonsContainer.style.alignItems = 'center';

      // Create and append the Start Download button
      var startDownloadButton = document.createElement('button');
      //startDownloadButton.id = 'startDownload';
      startDownloadButton.setAttribute('id', 'startDownload');
      startDownloadButton.innerHTML = '<i class="fas fa-download"></i> Start Download';
      startDownloadButton.style.cursor = 'pointer';
      buttonsContainer.appendChild(startDownloadButton);

      // Create and append the Export button
      var exportButton = document.createElement('button');
      //exportButton.id = 'exportBtn';
      exportButton.setAttribute('id', 'exportBtn');
      exportButton.innerHTML = '<i class="fas fa-file-excel"></i> Download Report';
      exportButton.style.display = 'none';
      buttonsContainer.appendChild(exportButton);
      document.getElementById("job-detail-page-root").appendChild(buttonsContainer);

  } else {
    console.error("Element with class 'someContainer' not found");
  }

var elem = document.getElementById("myBar");


var currentLocation = window.location;
var reqURLActive = currentLocation.origin + currentLocation.pathname +'/people?page=1&size=10&sort=NAME_ASCENDING&state[]=ACTIVE,INACTIVE';

//var personDownlaod;


document.getElementById("startDownload").addEventListener("click", startDownload);

function startDownload(){
    elem.style.width = 0+"%"
    getAllPerson(reqURLActive);
    document.getElementById("myProgress")
    elem.innerHTML ="Downloading ... 2%";
    elem.style.width = 2+"%"
    startDownloadButton.disabled = true;
}

function getAllPerson (url) {
    GM_xmlhttpRequest({
        method: "GET",
        url:url,
        onload: function(data) {
            try {
                var allPersonResponse = JSON.parse(data.responseText);
                var totalPerson = allPersonResponse.total;
                console.log("allperson: ",allPersonResponse)
                console.log("getAllPerson :: totalPerson :: " +totalPerson )
                progbarOffset = (100/totalPerson);
                var totalBatch = Math.ceil(totalPerson/batchSize);
                for(var i = 1;i<=totalBatch;i++){
                    var reqURLActiveBatch = currentLocation.origin + currentLocation.pathname +'/people?page='+i+'&size='+batchSize+'&sort=NAME_ASCENDING&state[]=ACTIVE,INACTIVE';
                    //console.log("batch",reqURLActiveBatch)
                    getAllPersonBatch(reqURLActiveBatch)
                }

            } catch(e) {
                console.log(e);
            }
        }
    });
}

function getAllPersonBatch (url) {
    GM_xmlhttpRequest({
        method: "GET",
        url:url,
        onload: function(data) {
            try {
                var allPersonResponse = JSON.parse(data.responseText);
                console.log("allPersonResponse " +allPersonResponse.records.length )
               // var totalPersonBatch = allPersonResponse.records.length;
                var personsBatch = allPersonResponse.records;
                //personDownlaod = allPersonResponse.records
                findDesiredCandidate(personsBatch);
                                         sleep(5000);
            } catch(e) {
                console.log(e);
            }
        }
    });
}

var personUrlPrefix = 'https://hire.amazon.com/person/'
var personUrlPostfix = '/tags.json?filters[active_tags]=INACTIVE';

function findDesiredCandidate(persons){
    for(var index in persons){
     console.log("index ::" + index)
     if(persons[index].id != null){
         var url = personUrlPrefix + persons[index].id + personUrlPostfix;
         var candidateURL = personUrlPrefix + persons[index].id ;
         console.log("url: " + url + " candidateURL: " + candidateURL)
         getJobHistory(url,candidateURL,persons[index].name)
     }
        else{
            updateProgressBar();
        }
    }
}

document.getElementById("exportBtn").addEventListener("click", exportCandidateDetails);
function exportCandidateDetails(){
    console.log("Button clicked! Excel download logic goes here.")
    exportToExcel()
}

function exportToExcel(){
   var content = "";
    var uri = 'data:application/vnd.ms-excel;base64,';
    var template = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table>{table}</table></body></html>';
    var base64 = function (s) {
        return window.btoa(unescape(encodeURIComponent(s)));
    };
    var format = function (s, c) {
        return s.replace(/{(\w+)}/g, function (m, p) {
            return c[p];
        });
    };
    console.log("allCandidates:", allCandidates)

    for (var index in allCandidates) {
        content = content + '<tr><td>' + allCandidates[index].candidateName + '</td><td>' + allCandidates[index].candidateURL + '</td><td>' + getIcmsIdWithURL(allCandidates[index].candidateURL) + '</td><td>' + allCandidates[index].rejectionType + '</td><td>' + allCandidates[index].lastInterviewDate + '</td><td>' + allCandidates[index].coolOffdateSixMonth + '</td><td>' + allCandidates[index].TotalVote + '</td><td>' + allCandidates[index].TotalInclined + '</td><td>' + allCandidates[index].TotalNotInclined + '</td><td>' + allCandidates[index].jobTitle + '</td><td>' + allCandidates[index].eventURL + '</td><td>' + allCandidates[index].status + '</td><td>' + allCandidates[index].feedbackSummary + '</td></tr>';
    }

    var ctx = {
        worksheet: 'Worksheet',
        table: '<table><tr><h1>PoolEx</h1></th><tr><h3>Download Date :: ' + todayDate + '<h3></tr><tr><th>Candidate name</th><th>Candidate URL</th><th>ICMS Id</th><th>Rejection Type</th><th>Last Interview Date</th><th>Cool-off date</th><th>Last Interview Total Vote</th><th>Last Interview Total Inclined</th><th>Last Interview Total Not Inclined</th><th>Job Title</th><th>Last Interview event URL</th><th>Status</th><th>Feedback Summary</th>' + content + '</table>'
    };

    var xlsLink = document.createElement("a");
    xlsLink.download = "PoolEx.xls";
    xlsLink.href = uri + base64(format(template, ctx));
    xlsLink.click();
}

function getIcmsIdWithURL(url){
    return url.substring(31, ) +',';
}

function getJobHistory (url,candidateURL,candidateName) {
    GM_xmlhttpRequest({
        method: "GET",
        url:url,
        onload: function(data) {
            try {
                var historyData = JSON.parse(data.responseText);
                console.log("getJobHistory: ", historyData)
                var historyDataItems = isReject(historyData);
                if(historyDataItems!=null){
                    var activityGuid = getGuid(historyDataItems);
                    var lastInterviewDate = getLastInterviewDate(historyDataItems);
                    var coolOffdateSixMonth = getCoolOffdateSixMonth(lastInterviewDate);
                    var coolOffdateTwoYear = getCoolOffdateTwoYear(lastInterviewDate)
                    var jobTitle= getjobTitle(historyDataItems);
                    var inHouseUrl=getInHouseUrl(activityGuid)
                    getXml(candidateURL,inHouseUrl,candidateName,lastInterviewDate,coolOffdateSixMonth,coolOffdateTwoYear,jobTitle)

                }
                else{
                updateProgressBar();

                }
            } catch(e) {
                console.log(e);
                console.log("urnavb :: getting error in this section")
                //updateProgressBar();
            }
        }
    });
}

function getCoolOffdateSixMonth(lastInterviewDate){
var newDate = new Date(lastInterviewDate);
    return newDate.addDays(180)
}



function getCoolOffdateTwoYear(lastInterviewDate){
var newDate = new Date(lastInterviewDate);
    return newDate.addDays(730)
    //return newDate.addDays(270)
}

function getInHouseUrl(activityGuid){
return 'https://hire.amazon.com/interviews/'+activityGuid+'?type=IN_HOUSE#/interview_event';
}


function isReject(historyData){
    for(var index in historyData.items){
      for(var activitiesIndex in historyData.items[index].activities){
         if(historyData.items[index].activities[activitiesIndex].type == "ONSITE" && historyData.items[index].activities[activitiesIndex].action == "NOT_INCLINED" ){
           return historyData.items[index];
       }
   }
}
return null;
}


function getGuid(historyDataItems){
    if(historyDataItems != null){
       for (var index in historyDataItems.activities ){
           if(historyDataItems.activities[index].type == "ONSITE" && historyDataItems.activities[index].action == "NOT_INCLINED"){
               return historyDataItems.activities[index].guid;
           }
       }
   }
}

function getLastInterviewDate(historyDataItems){
    if(historyDataItems != null){
       for (var index in historyDataItems.activities ){
           if(historyDataItems.activities[index].type == "RECYCLED" || historyDataItems.activities[index].type == "REJECTED"){
               return new Date(historyDataItems.activities[index].timestamp);
           }
       }
   }
}

function getjobTitle(historyDataItems){
    if(historyDataItems != null){
        var consolitedJobTitle = historyDataItems.job.title +'( ID '+historyDataItems.job.icimsId +' | '+historyDataItems.job.location +' | Level '+historyDataItems.job.level +')';
        return consolitedJobTitle;
    }
}

function prettyDate(newDateValue){
            var day = newDateValue.getDate();
            var month = monthList[newDateValue.getMonth()];
            var year = newDateValue.getFullYear()
            var prettyDate = month +' ' + day +', '+year;
    return prettyDate
}

function checkNull(input){
if(input != null){
return input;
}
    else{
return "No_data"
}
}


function getXml(candidateURL,url,candidateName,lastInterviewDate,coolOffdateSixMonth,coolOffdateTwoYear,jobTitle){
    return new Promise(function(resolve, reject) {
      GM.xmlHttpRequest({
        method: 'GET',
        url: url,
        timeout : 0,
        onload: function (response) {
          var domParser = new DOMParser();
          try {
            var rejectionType = ""
            console.log("Name: "+ candidateName + " url: " +url)
            // Assuming response.responseText contains your HTML content
            var sanitizedHTML = response.responseText.replace(/&/g, '&amp;')
            // Add more replacements if needed for other special characters
            var xmlDoc = domParser.parseFromString(sanitizedHTML, 'text/xml');
            resolve(xmlDoc);
            var result1 = xmlDoc.getElementsByClassName("interview-show-app normal");
            var interviwersString = String(result1[0].attributes[3].value);
            var isBarRaiserFound = interviwersString.indexOf("BAR_RAISER");
            interviwersString = interviwersString.slice(0, -1);
            interviwersString = interviwersString.slice(5,);
            interviwersString = "["+interviwersString+"]";
            //console.log("getXML: ", xmlDoc)
            // Assuming interviewersString contains the JSON data
            var validJSONString = interviwersString.replace(/&quot;/g, '"');
            try{
            var obj = JSON.parse(validJSONString);
            } catch(error) {
                console.error('Invalid JSON format:', error.message);
            }
            var attendeesList = obj[1].attendees;
            //console.log("attendeesList: ", attendeesList)
            var feedbackSummary ="=";
            if(attendeesList != null){
                for(var attendeesIndex = 0; attendeesIndex < attendeesList.length; attendeesIndex++){
                    var voteType = checkNull(attendeesList[attendeesIndex].voteType);
                    var attendLocal = '['+ checkNull(attendeesList[attendeesIndex].role) +'] '+ checkNull(attendeesList[attendeesIndex].name) +'('+checkNull(attendeesList[attendeesIndex].login)+')\t\t\t '+ checkNull(attendeesList[attendeesIndex].competencies) + ' \t\t\t' +checkNull(voteType.description) + '';
                    if(attendeesIndex <attendeesList.length -1){
                        feedbackSummary = feedbackSummary+ '"' +attendLocal + '"&CHAR(10)&' ;
                    }
                    else{
                        feedbackSummary = feedbackSummary+ '"' +attendLocal + '"';
                    }
                }
            }
            if(isBarRaiserFound !== -1){
                var attendees = obj[1].attendees;
                var brName = "";
                var brLoginId = "";

                for(var i = 0; i < attendees.length; i++){
                    if(attendees[i].role == "BAR_RAISER")
                    {
                        brName = attendees[i].name;
                        brLoginId = attendees[i].login;
                    }
                }

         var status;
               var mailSubject = encodeURIComponent("Sign-off on recycling "+candidateName)
               // var mailBody ='<b>ME</b>'
             //  var mailBody = encodeURIComponent("Hi "+brName+ "\n\n"+ candidateName + " was processed on "+ lastInterviewDate +" for the role of "+jobTitle+"." + "\n\nPlease visit Hire to view the full interview feedback " +url+"."+ "\n\nPlease let me know if I can recycle this candidate for Amazon Hiring Process.");
             // var mailtoUrl ='mailto:'+brLoginId+'@amazon.com?Subject='+mailSubject+'&body='+mailBody
               var output1=""
               if(todayDate>=coolOffdateSixMonth && todayDate < coolOffdateTwoYear ){
                   status = "BR Approval to Process"
               }
                else if(todayDate>= coolOffdateTwoYear){
                    status = "Ready to Process"
                }
                else{
                    status = "Not Ready to Process"
                }

               rejectionType = "Debrief Reject"
           }
           else {
               var output =""
               if(todayDate>=coolOffdateSixMonth ){
                 status = "Ready to Process"
               }
               else {
                status = "Not Ready to Process"
               }

               rejectionType = "Onsite Reject"


        }
         var LastInterviewDetail = buildData(obj,url);
         var prettylastInterviewDate = prettyDate(lastInterviewDate);
         var prettyCoolOffdateSixMonth = prettyDate(coolOffdateSixMonth);
        allCandidates.push({ candidateName: candidateName, candidateURL: candidateURL, rejectionType: rejectionType,lastInterviewDate : prettylastInterviewDate,coolOffdateSixMonth : prettyCoolOffdateSixMonth, TotalVote : LastInterviewDetail[0].Totalvotes, TotalInclined : LastInterviewDetail[1].TotalInclined, TotalNotInclined : LastInterviewDetail[2].TotalNotInclined , jobTitle : jobTitle, eventURL : url, status : status,feedbackSummary : feedbackSummary });
        updateProgressBar();

     } catch(err) {
        updateProgressBar();
        reject('Failed to parse XML from ' + url + ' -- ' + response.responseText);
    }
},
onerror: function (response) {
  updateProgressBar();
  //reject(response.statusText);

}
});
});
}

function buildData(obj,url){
    var attendees = obj[1].attendees;
    let recipeMap = new Map([
  ['STRONG_HIRE', 0],
  ['INCLINED', 0],
  ['NOT_INCLINED', 0],
  ['STRONG_NO_HIRE', 0]
]);
    var count = 1;
    for(var i = 0; i < attendees.length; i++){
       if(null != attendees[i].voteType){
            recipeMap.set(attendees[i].voteType.description ,(recipeMap.get(attendees[i].voteType.description) + 1));
        }
    }
    var no_inclined = recipeMap.get('STRONG_HIRE') + recipeMap.get('INCLINED');
    var no_notInclined = recipeMap.get('NOT_INCLINED') + recipeMap.get('STRONG_NO_HIRE');
    var totalVote = Math.round(no_inclined+no_notInclined);
    var votes = []
    votes.push({Totalvotes : totalVote})
    votes.push({TotalInclined : no_inclined})
    votes.push({TotalNotInclined : no_notInclined})
    return votes;
}

Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}


function updateProgressBar(){
        progbar = progbar +progbarOffset;
        elem.style.width = progbar + "%";
        elem.innerHTML ="Downloading... " +Math.ceil(progbar) + "%";
        if(progbar >= 97){
            document.getElementById("exportBtn").className = "fas fa fa-table"
            elem.style.width = 100 + "%";
            elem.innerHTML ="PoolEx Report Download Completed";
            startDownloadButton.style.display = 'none';
            exportButton.style.display = 'block';
        }
}
function sleep(milliSeconds){
                var startTime = new Date().getTime(); // get the current time
                while (new Date().getTime() < startTime + milliSeconds); // hog cpu
}

//------------------------------BackEnd code End---------------------------------------

GM_addStyle ( `


#myContainer {

        opacity:                0.9;
        z-index:                1100;

    }

#myContainer1 {
        position:               absolute;
        right:                  0px;
        z-index:                1100;


    }
#myContainer0 {

        z-index:                1100;
        opacity:                0.9;

    }
#myContainer2 {
        position:               absolute;
        top:                    20px;
        right:                  10px;
        z-index:                1100;


    }
#myContainer3 {
    position:               absolute;
        top:                    20px;
        right:                  10px;
        z-index:                2100;
}
.alert-warning {
  padding: 20px;
  background-color: #f5e79e;
  color: #8a6d3b;
  font-size: 13px;
}
.alert-success {
  padding: 20px;
  background-color: #b2dba1;
  color: #3c763d;
  font-size: 13px;
}
.alert-danger {
  padding: 20px;
  background-color: #f2dede;
  color: #a94442;
font-size: 13px;
}

.closebtn {
  margin-left: 15px;
  color: white;
  font-weight: bold;
  float: right;
  font-size: 22px;
  line-height: 20px;
  cursor: pointer;
  transition: 0.3s;
}

.closebtn:hover {
  color: black;
}
.dropbtn {
  background-color: #3498DB;
  color: white;
  padding: 16px;
  font-size: 16px;
  border: none;
  cursor: pointer;
}

.dropbtn:hover, .dropbtn:focus {
  background-color: #2980B9;
}

.dropdown {
  position: relative;
  display: inline-block;
}

.dropdown-content {
  display: none;
  position: absolute;
  background-color: #f1f1f1;
  min-width: 160px;
  overflow: auto;
  box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
  z-index: 1;
}

.dropdown-content a {
  color: black;
  padding: 12px 16px;
  text-decoration: none;
  display: block;
}

.dropdown a:hover {background-color: #ddd;}

.show {display: block;}




nav { background: #2ba0db; }

nav ul {
  font-size: 0;
  margin: 0;
  padding: 0;
}

nav ul li {
  display: inline-block;
  position: relative;
}

nav ul li a {
  color: #fff;
  display: block;
  font-size: 14px;
  padding: 15px 14px;
  transition: 0.3s linear;
}

nav ul li:hover { background: #126d9b; }

nav ul li ul {
  border-bottom: 5px solid #2ba0db;
  display: none;
  position: left;
  width: 250px;
}

nav ul li ul li {
  border-top: 1px solid #444;
  display: block;
}

nav ul li ul li:first-child { border-top: none; }

nav ul li ul li a {
  background: #373737;
  display: block;
  padding: 10px 14px;
}

nav ul li ul li a:hover { background: #126d9b; }

#myProgress {
  width: 100%;
  background-color: #ddd;
  height: 30px;
  text-align: center;
  line-height: 30px;
}

#myBar {
  width: 0%;
  height: 30px;
  background-color: #008296;
  text-align: center;
  line-height: 30px;
  color: white;
}

* {box-sizing: border-box}

.container {
  width: 100%;
  background-color: #ddd;
}

.skills {
  text-align: centre;
  padding-top: 10px;
  padding-bottom: 10px;
  color: white;
}
.progress {
    display: block;
    width: 100%;
    height: 1.5rem;
    margin-bottom: 1rem;
}

.js {width: 65%; background-color: #f44336;}

.blink_text {

    animation:1s blinker linear infinite;
    -webkit-animation:1s blinker linear infinite;
    -moz-animation:1s blinker linear infinite;

    }

    @-moz-keyframes blinker {
     0% { opacity: 1.0; }
     50% { opacity: 0.0; }
     100% { opacity: 1.0; }
     }

    @-webkit-keyframes blinker {
     0% { opacity: 1.0; }
     50% { opacity: 0.0; }
     100% { opacity: 1.0; }
     }

    @keyframes blinker {
     0% { opacity: 1.0; }
     50% { opacity: 0.0; }
     100% { opacity: 1.0; }
     }
` );