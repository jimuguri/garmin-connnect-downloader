# garmin-connnect-downloader
garmin-connect-downloader is a Chrome extension that allows you to download all your activity and wellness information from Garmin Connect in .fit format.

## Description
You must be logged in to Garmin Connect in your browser to perform downloads with this app.
On the tab displaying Garmin Connect after authentication, enable this application and click the icon to display the input items for download.
- Download after this date : 
Specifies when to get wellness data. To get your Garmin equipment and get all the records, specify the date and time you started recording.
- Download data : You can select the target data to download.
- Download directory : Specify the download location.
Note: Only relative paths from the browser download directory are supported. Absolute paths are not supported (an error will occur).

When download is turned on, the specified data will be downloaded once a minute.
The activity information is updated once an hour. Acquire 50 activity information (ID) at a time and execute download for the acquired ID.
Therefore, if you have 1000 activity information, it will take 20 hours (+1 hour) to complete the download of all the information.

The ID and date of the downloaded file are managed in the browser's local storage, and when data is added to Garmin Connect, the additional data is automatically downloaded. (Only when this app is enabled).