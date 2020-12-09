chrome.runtime.onInstalled.addListener(function() {
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
      chrome.declarativeContent.onPageChanged.addRules([{
        conditions: [new chrome.declarativeContent.PageStateMatcher({
          pageUrl: {hostEquals: 'connect.garmin.com'},
        })
        ],
            actions: [new chrome.declarativeContent.ShowPageAction()]
      }]);
    });
});

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
     //switch (request.directive) {
     //    case "start-dl":
     if(request.directive == 'start-dl') {
            //  開始日時から+1日しつづけて現在日付-1日までループでダウンロード実行
            var current = moment();
            var start = moment(request.startDate);

            download(current, start, request.interval).then(result => {
              sendResponse(result);
            });
     }
      return true;
  }
);

/**
 * Set alarm when installing extension
 */
chrome.runtime.onInstalled.addListener(function (details) {
  console.log(details.reason);
  chrome.alarms.create("dl_fire", { "periodInMinutes": 1 });
  chrome.alarms.create("get_activity_list", { "periodInMinutes": 60, "delayInMinutes": 1 });
});


async function download(current, start, interval) {
  return new Promise((resolve,reject) => {
    while(current.isAfter(start)){
      console.log('download start');
    }
    resolve("download complete");
  })
}

/**
 * Set alarm for daily data download in the background.
 */
chrome.alarms.onAlarm.addListener(async function (alarm) {
    
  let _isStart = await getLocalStorageVal('isStart');
  let _isChecked = await getLocalStorageVal('checkWellness');

  if (_isStart.isStart && _isChecked.checkWellness && alarm.name == "dl_fire") {

    let _startDateString = await getLocalStorageVal('start_date');
    var start = moment(_startDateString.start_date);
    //Download until yesterday
    var yesterday = moment().subtract(1, 'd');

    if(yesterday.isAfter(start)) {
      var urlDate = start.format('YYYY-MM-DD');
      var url = 'https://connect.garmin.com/modern/proxy/download-service/files/wellness/' + urlDate;
      var _dir = await getLocalStorageVal('directory');

      chrome.downloads.download({
        url: url, 
        filename: _dir.directory + "/" + urlDate + '.zip'
      });
      start = start.add(1, 'd');
      chrome.storage.sync.set({start_date: start.format('YYYY-MM-DD')}, function() {
        // Save next date to local storage
      });
    }
  }
});

/**
 * Set alarm for activity download in the background.
 */
chrome.alarms.onAlarm.addListener(async function (alarm) {
    
  let _isStart = await getLocalStorageVal('isStart');
  let _isChecked = await getLocalStorageVal('checkActivity');

  if (_isStart.isStart && _isChecked.checkActivity && alarm.name == "dl_fire") {
    
    var _unreadIds = await getLocalStorageVal("unread_activity_ids");
    if(!("unread_activity_ids" in _unreadIds) || 
      (("unread_activity_ids" in _unreadIds) && _unreadIds.unread_activity_ids == "[]")) {
      return true;
    }

    ids = JSON.parse(_unreadIds.unread_activity_ids);

    id = ids.pop();

    if(id) {
      var url = "https://connect.garmin.com/modern/proxy/download-service/files/activity/" + id;
      var _dir = await getLocalStorageVal('directory');
      chrome.downloads.download({
        url: url, 
        filename: _dir.directory + "/" + id + '.zip'
      });
      chrome.storage.sync.set({unread_activity_ids: JSON.stringify(ids)}, function() {
        // Save updated id_list to local storage
      });
    }

    chrome.storage.sync.set({last_read_activity_id: id}, function() {
      // Save updated id_list to local storage
    });
  }
});

/**
 * Set alarm for regular download in the background.
 */
chrome.alarms.onAlarm.addListener(async function (alarm) {
  let _isStart = await getLocalStorageVal('isStart');

  if (_isStart.isStart && alarm.name == "get_activity_list") {
    var _activityId = await getLocalStorageVal("last_read_activity_id");
    var _unreadIds = await getLocalStorageVal("unread_activity_ids");
    if(("unread_activity_ids" in _unreadIds) && _unreadIds.unread_activity_ids != '[]') {
      // If there is an undownloaded activity list in the local storage, 
      // do not load the DL target ID additionally
      console.log('There is a list of unloaded activities');
      return;
    }

    var nextPage = true;
    var start = 0;
    var limit = 20;
    while(nextPage) {
      var _ids = await getLocalStorageVal("unread_activity_ids");
      
      var ids = [];
      if("unread_activity_ids" in _ids) {
        ids = JSON.parse(_ids.unread_activity_ids);
      }

      var olderIds = await getActivityList(start, limit);
      
      if(olderIds.length == 0) {
        // If can't get the activity list, exit
        nextPage = false;
        break;
      }

      if(!_activityId.last_read_activity_id) {
        // No activity loaded in the past (first time)
        start = start + limit;
        ids = ids.concat(olderIds);
      } else {
        if(olderIds.indexOf(_activityId.last_read_activity_id) >= 0) {
          // The activity ID loaded last time is included in the acquired list
          nextPage = false;
          ids = ids.concat(olderIds.slice(0, olderIds.indexOf(_activityId.last_read_activity_id)));
        } else {
          // No ID previously imported into the acquired list (inspection on the next page)
          start = start + limit;
          ids = ids.concat(olderIds);
        }
      }
      // Up to 50 items can be saved to local storage (to prevent storage exhaustion).
      // Truncate the newer data (because the newer data can be obtained at the next execution).
      if(ids.length > 50) {
        ids.splice(0, ids.length - 50);
      }
      console.log(ids); // TODO: delete
      chrome.storage.sync.set({unread_activity_ids: JSON.stringify(ids)}, function() {
        // Save next date to local storage
      });
      
    }
  }
});

/**
 * Get activity id list.
 * @param {number} start 
 * @param {number} limit 
 */
async function getActivityList(start, limit) {
  var url = "https://connect.garmin.com/modern/proxy/activitylist-service/activities/search/activities?" +
          "limit=" + limit +
          "&start=" + start +
          "&_=" + moment().valueOf(); // unix timestamp (ms)
  var activityIds = [];

  return new Promise((resolve, reject) => {
    fetch(url, {
      credentials: 'include',
      mode: 'cors',
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.text();
      })
      .then(function(text){
        const activities = JSON.parse(text);
        activities.forEach(activity => {
          activityIds.push(activity.activityId);
        });
      })
      .then(function(){
        resolve(activityIds);
      })
      .catch(ex => reject(ex))
    });
}

/**
 * Get from local storage
 * @param {string} key 
 */
async function getLocalStorageVal(key) {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.sync.get(key, function(value) {
        resolve(value);
      })
    } catch (ex) {
      reject(ex);
    }
  });
}
