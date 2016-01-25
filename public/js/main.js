Parse.initialize("trhHaGuuYNlb5Xh1tLPfala0t1TuW6LynFURnMR2", "dEUhUrIUbdSk89pnWAwb4zwhYx3LTxskmC82lPC7"); 
            
moneyGuard = {};
moneyGuard.expenses = {};
moneyGuard.settings = {};
moneyGuard.settings.weekStart = 0;

// Check to see if logged in
checkIfLoggedIn();
function checkIfLoggedIn(){
    if( Parse.User.current() == null ){
        $('#login-signup').addClass('active');       
    }else{
        var user = Parse.User.current();
        console.log(user)
        userQuery = new Parse.Query(user);
        userQuery.equalTo('objectId', user.id);
        userQuery.find({
          success: function(user){
              var name = user[0].get("name");
              var friends = user[0].get("friends");
              $('#top-bar').find('.name').html(name);
              moneyGuard.settings.name = name;

              // Get Friends List
              var User = Parse.Object.extend("_User");
                var user = new User();
                var friendQuery = new Parse.Query(user);
                friendQuery.containedIn('username', friends);
                friendQuery.find(function(r){
                    console.log(r)
                    moneyGuard.settings.friends = r;
                });
              moneyGuard.settings.friends = friends;
          },
          error: function(error) {
            alert("Error: " + error.code + " " + error.message);
            }
        });
        $('#main').addClass('active').siblings().removeClass('active');
    }
}

// Sign Up
function signUp(username, password){
    var user = new Parse.User();
    user.set("username", username);
    user.set("password", password);
    user.set("email", username);

    user.signUp(null, {
      success: function(user) {
         checkIfLoggedIn();
      },
      error: function(user, error) {
        // Show the error message somewhere and let the user try again.
        alert("Error: " + error.code + " " + error.message);
      }
    })
}

// Log In
function logIn(username, password){
    var user = new Parse.User();
    Parse.User.logIn(username, password, {
        success: function(user) {
            checkIfLoggedIn();
        },
        error: function(user, error) {
            // The login failed. Check error to see why.
        }
    });
}

var Categories = Parse.Object.extend("Categories");
var categoriesQuery = new Parse.Query(Categories);





// Print out category list
categoriesQuery.find({
  success: function(categories){
      var categoryList = '';
      for (var i = 0; i < categories.length; i++) {
        categoryList += '<li id="' + categories[i].id + '"><button>+</button><span class="category">' + categories[i].get('Name') + '</span>';
        categoryList += '<div class="week"><span class="spent">0</span><span>$' + Math.round(categories[i].get('Budget') / 4.3333333) + '</span></div>';
        categoryList += '<div class="month"><span class="spent">0</span><span>$' + categories[i].get('Budget') + '</span></div>';
        categoryList += '</li>';
      }
      $('#main').html('<ul id="expenses">' + categoryList + '</ul>');
  },
  error: function(error) {
    alert("Error: " + error.code + " " + error.message);
    }
});

// Time Ranges
var currentYear = new Date().getFullYear();
var currentMonth = englishMonth(new Date().getMonth());
var currentDayOfWeek = new Date().getDay();
var currentMonthDateObj = new Date(currentMonth + ' 1, ' + currentYear + ' 00:00:00');


// Expenses
var expenses = Parse.Object.extend("Expenses");

// Month
var monthQuery = new Parse.Query(expenses);
monthQuery.greaterThanOrEqualTo("Date", currentMonthDateObj);

// Calculate monthly expenses
monthQuery.find({
  success: function(expenses){
    objectifyExpenses(expenses, 'month');
  },
  error: function(error1) {
    alert("Error: " + error.code + " " + error.message);
    }   
});

// Week
var weekQuery = new Parse.Query(expenses);
weekQuery.greaterThanOrEqualTo("Date", getWeekStart());

// Calculate weekly expenses
weekQuery.find({
  success: function(expenses){
    objectifyExpenses(expenses, 'week');

  },
  error: function(error) {
    alert("Error: " + error.code + " " + error.message);
    }   
});


// Events
$(document).on('click', '#signup-button', function(){
   signUp($('#signup').find('[type=email]').val(), $('#signup').find('[type=password]').val()); 
}).on('click', '#login-button', function(){
   logIn($('#login').find('[type=email]').val(), $('#login').find('[type=password]').val()); 
}).on('click', '#main button', function(){
    var categoryName = $(this).parents('li').find('.category').html();
    $('#add-expense').find('h1').html(categoryName);
    $('#add-expense').addClass('active').attr('data-category', $(this).parents('li').attr('id')); 
    $('#add-expense').find('.amount-input input').focus();
    getLocation();
}).on('click', '#save-button', function(){
    var amount = $('#add-expense').find('.amount-input input').val()*1;
    var time = $('#add-expense').attr('data-time');
    if( time === ''){
        time = new Date();   
    }else{
        time = new Date(new Date().setTime(time));
    }
    console.log(time);
    if( amount <= 0 ){
        alert('Something is wrong with your expense amount.');
    }else{
        var latLong;
        if( typeof($('#add-expense').attr('data-location')) !== 'undefined' ){
            latLong = $('#add-expense').attr('data-location').split(',');
            latLong = [latLong[0]*1, latLong[1]*1];
        }else{
            latLong = [0,0];
        }

        addExpense(amount, $('#add-expense').attr('data-category'), time, latLong, $('#add-expense').find('.notes').val()); 
    }
}).on('click', '.button-group button', function(){
    var $this = $(this);
    $this.siblings().removeClass('selected');
    $this.addClass('selected');
}).on('click', '.not-today-button', function(){
    $('.other-days').addClass('active');   
}).on('click', '.today-button', function(){
    $('.other-days').removeClass('active');   
}).on('click', '[data-time-ago]', function(){
    $('#add-expense').attr('data-time', $(this).attr('data-time-ago'));
});

$(document).ready(function(){
    // Make past days buttons
    var dayNumber = moneyGuard.settings.weekStart;
    var timestamp = new Date().getTime();
    var oneDay = 24 * 60 * 60 * 1000;
    var timeAgo;
    var buttonsHtml = '';
    var j= 0;
    for( var i = moneyGuard.settings.weekStart; i < moneyGuard.settings.weekStart + getDaysAheadOfWeekStart(); i++){
        if( dayNumber === 7){
            dayNumber = 0;  
        }
        timeAgo = timestamp - ((getDaysAheadOfWeekStart() - j) * oneDay);
        buttonsHtml += '<button data-time-ago="' + timeAgo + '">' + dayAbbr(dayNumber) + '</button>';
        dayNumber++;
        j++
    }
    $('.other-days').html(buttonsHtml);
})

// FUNCTIONS
function addExpense(amount, cat, date, location, notes){
    var Expenses = Parse.Object.extend("Expenses");
    var expenses = new Expenses();
    var category = new Parse.Object("Categories");
    category.id = cat;
    var geoPoint = new Parse.GeoPoint(location);

    // Set ACL
    var acl = new Parse.ACL();
    acl.setWriteAccess( Parse.User.current(), true);
    acl.setReadAccess( Parse.User.current(), true);
    for(i=0; i < moneyGuard.settings.friends.length; i++){
        console.log(moneyGuard.settings.friends[i])
        acl.setWriteAccess( moneyGuard.settings.friends[i], true);
        acl.setReadAccess( moneyGuard.settings.friends[i], true);
    }

    acl.setPublicReadAccess(false);
    expenses.setACL(acl);

    expenses.save({
        'Amount': amount,
        'Date': date,
        'Category': category,
        'Location': geoPoint,
        'Person': Parse.User.current(),
        'Notes': notes
    }, {
        success: function(expenses) {
            $('#add-expense').removeClass('active');
            incrementClientAmount(amount, cat);
        },
        error: function(expenses, error) {
            console.log(error);
        }
    });
}
function getLocation(){

    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(function(position) {
            $('#add-expense').attr('data-location', [position.coords.latitude, position.coords.longitude]);
        });
    } else {
        $('#add-expense').attr('data-location', [0,0]);
    }
}
function objectifyExpenses(expenses, timeRange){
    var expensesObj = {};
    var category;
    for (var i = 0; i < expenses.length; i++) {
        category = expenses[i].get('Category').id;
        expensesObj[category] = 0;      
    }
    for (var i = 0; i < expenses.length; i++) {
        category = expenses[i].get('Category').id;
        expensesObj[category] = expensesObj[category] + expenses[i].get('Amount');
    }
    moneyGuard.expenses[timeRange] = expensesObj;

    setTimeout(function(){
        $('#expenses').find('li').each(function(){
            categoryId = $(this).attr('id');
            $(this).find('.' + timeRange).find('.spent').html(Math.round(moneyGuard.expenses[timeRange][categoryId]));   
        });
        console.log(moneyGuard);
    }, 100, timeRange);
}
function incrementClientAmount(amount, cat){
    console.log(amount, cat); 
    var monthCurrent = $('#' + cat).find('.month').find('.spent').html()*1;
    var weekCurrent = $('#' + cat).find('.week').find('.spent').html()*1;
    $('#' + cat).find('.month').find('.spent').html(Math.round(monthCurrent + amount));
    $('#' + cat).find('.week').find('.spent').html(Math.round(weekCurrent + amount));
}
function getWeekStart() {  
    var timestamp = new Date().getTime();
    millisecondsAhead = getDaysAheadOfWeekStart() * (24 * 60 * 60 * 1000); 
    return new Date(new Date(timestamp - millisecondsAhead).setHours(0,0,0));
}
function getDaysAheadOfWeekStart(){
    var startOfWeek = moneyGuard.settings.weekStart;
    var currentDay = new Date().getDay();

    var daysAheadOfStart;
    var millisecondsAhead;

    if(currentDay >= startOfWeek){
        daysAheadOfStart = currentDay - startOfWeek;
    }else{
        daysAheadOfStart = 7 - (startOfWeek - currentDay);
    }
    return daysAheadOfStart;
}

function englishMonth(monthNum){
    var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[monthNum];
}
function dayAbbr(number){
    var days = ['Su', 'M', 'T', 'W', 'Th', 'F', 'Sa'];
    return days[number];
}