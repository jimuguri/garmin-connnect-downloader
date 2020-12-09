
// Restore 
chrome.storage.sync.get('start_date', function(data) {
  $('[data-toggle="datepicker"]').val(data.start_date);
});
chrome.storage.sync.get('isStart', function(data) {
  $('.toggle-input').prop('checked', data.isStart);
});
chrome.storage.sync.get('directory', function(data) {
  $('.dlDirectory').val(data.directory);
});
chrome.storage.sync.get('checkActivity', function(data) {
  $('.checkActivity').prop('checked', data.checkActivity);
});
chrome.storage.sync.get('checkWellness', function(data) {
  $('.checkWellness').prop('checked', data.checkWellness);
});

// DatePicker
$('[data-toggle="datepicker"]').datepicker({
  format: 'yyyy-mm-dd'
});

// Save startDate to local storage.
$('[data-toggle="datepicker"]').change(function(){
  var date = $(this).val();
  chrome.storage.sync.set({start_date: date}, function() {
    console.log(date);
  });
});

// Save intervals to local storage.
$('.intervalTime').change(function(){
  var interval = $(this).val();
  chrome.storage.sync.set({interval: interval}, function() {
    console.log(interval);
  });
});

// Save directory to local storage.
$('.dlDirectory').change(function(){
  var directory = $(this).val();
  chrome.storage.sync.set({directory: directory}, function() {
    console.log(directory);
  });
});

// Save check-Activity to local storage.
$('.checkActivity').change(function(){
  var checked = $(this).prop('checked');
  chrome.storage.sync.set({checkActivity: checked}, function() {
    console.log(checked);
  });
});

// Save check-Activity to local storage.
$('.checkWellness').change(function(){
  var checked = $(this).prop('checked');
  if($(".checkWellness").prop('checked') && 
  $('[data-toggle="datepicker"]').val().length == 0) {
    console.log('Wellness checked, but no date has been entered.');
    $(".toggle-input").prop('checked', false);
    alert('Wellness checked, but no date has been entered.');
    return
  }
  chrome.storage.sync.set({checkWellness: checked}, function() {
    console.log(checked);
  });
});

// Toggle changed
$(".toggle-input").click(function toggleHandler(e) {
  // validate
  if(!$(".checkActivity").prop('checked') && 
      !$(".checkWellness").prop('checked') && 
      $(this).prop('checked')) {
    //Check either activity or wellness is required when download is on.
    console.log('check either activity or wellness is required when download is on.');
    $(this).prop('checked', false);
    alert('Check either activity or wellness is required when download is on.');
    return;
  }
  if($(".checkWellness").prop('checked') && 
      $('[data-toggle="datepicker"]').val().length == 0) {
    console.log('Wellness checked, but no date has been entered.');
    $(this).prop('checked', false);
    alert('Wellness checked, but no date has been entered.');
    return
  }
  
  var toggled = $(this).prop('checked');
  console.log('handle ' + toggled);
  // Set params to storage.
  chrome.storage.sync.set({isStart: toggled}, function() {
    console.log('isStart ' + toggled);
  });
});