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
                    moneyGuard.settings.friends = r;
                });
              moneyGuard.settings.friends = friends;
          },
          error: function(error) {
            alert("Error: " + error.code + " " + error.message);
            }
        });
		addCategoryHTML();
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

function addCategoryHTML(){
	var Categories = Parse.Object.extend("Categories");
	var categoriesQuery = new Parse.Query(Categories);

	// Print out category list
	categoriesQuery.find({
		success: function(categories){
			var html = '';
			var expensesObj = {};
			var cat;
			var weekBudget;
			for (var i = 0; i < categories.length; i++) {
				cat = categories[i];
				weekBudget = Math.round(cat.get('Budget') / 4.3333333);
				expensesObj[cat.id] = {};
				expensesObj[cat.id].expenses = [];
				expensesObj[cat.id].name = cat.get('Name');
				expensesObj[cat.id].total = 0;

				html += '<li id="' + cat.id + '"><button>+</button><span clas"category">' + cat.get('Name') + '</span>';
				html += '<div class="cat-total"><span class="spent">0</span><span>$' + weekBudget + '</span></div>';
				html += '<div class="progress-bar-container">';
				html += 	'<span class="amount-left"></span><div class="empty-bar"><div class="filled-bar" data-budget="' + weekBudget + '"></div></div>';
				html += '</div>';
				//html += '<div class="month"><span class="spent">0</span><span>$' + cat.get('Budget') + '</span></div>';
				html += '</li>';
			}

			// Add categories to Object
			moneyGuard.expenses.week = expensesObj;
			moneyGuard.expenses.month = expensesObj;

			// Week
			var weekQuery = new Parse.Query(expenses);
			weekQuery.greaterThanOrEqualTo("Date", getWeekStart());
			weekQuery.find({
			  success: function(expenses){
				objectifyExpenses(expenses, 'week');
			  },
			  error: function(error) {
				alert("Error: " + error.code + " " + error.message);
				}   
			});

			$('#main').html('<ul id="expenses">' + html + '</ul>');

	  },
	  error: function(error) {
		alert("Error: " + error.code + " " + error.message);
		}
	});
}


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
    //objectifyExpenses(expenses, 'month');
  },
  error: function(error1) {
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
	addExpenseClone = $('.add-expense-template').clone();
	$('.add-expense-template').after(addExpenseClone.attr('id', 'add-expense'))
    addExpenseClone.find('h1').html(categoryName);
    addExpenseClone.addClass('active').attr('data-category', $(this).parents('li').attr('id')); 
    addExpenseClone.find('.amount-input input').focus();
    getLocation();
}).on('click', '#save-button', function(){
    var amount = $('#add-expense').find('.amount-input input').val()*1;
    var time = $('#add-expense').attr('data-time');
    if( time === ''){
        time = new Date();   
    }else{
        time = new Date(new Date().setTime(time));
    }
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

        addExpense(amount, $('#add-expense').attr('data-category'), time, latLong, $('#add-expense').find('.notes textarea').val()); 
    }
}).on('click', '.button-group button', function(){
    var $this = $(this);
    $this.siblings().removeClass('selected');
    $this.addClass('selected');
}).on('click', '.not-today-button', function(){
    $('#add-expense').find('.other-days').addClass('active');   
}).on('click', '.today-button', function(){
    $('#add-expense').find('.other-days').removeClass('active');   
}).on('click', '[data-time-ago]', function(){
    $('#add-expense').attr('data-time', $(this).attr('data-time-ago'));
}).on('click', '.cancel', function(){
	$('#add-expense').remove();
    $(this).parent().removeClass('active');
}).on('click', '.notes button', function(){
    $(this).next().toggleClass('active').focus();
}).on('click', '.toggle-list-view', function(){
    $('#main').toggleClass('active');
	$('#list-view').toggleClass('active');
})
;
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
});

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
        acl.setWriteAccess( moneyGuard.settings.friends[i], true);
        acl.setReadAccess( moneyGuard.settings.friends[i], true);
    }

    acl.setPublicReadAccess(false);
    expenses.setACL(acl);
	console.log(notes);
    expenses.save({
        'Amount': amount,
        'Date': date,
        'Category': category,
        'Location': geoPoint,
        'Person': Parse.User.current(),
        'Notes': notes
    }, {
        success: function(expenses) {
            $('#add-expense').remove();
            incrementClientAmount(amount, cat, date);
        },
        error: function(expenses, error) {
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
	var amount;
    for (var i = 0; i < expenses.length; i++) {
		amount = expenses[i].get('Amount');
        category = expenses[i].get('Category').id;
		objCat = moneyGuard.expenses[timeRange][category];
        objCat.expenses.push({id: expenses[i].id, amount: amount, date: expenses[i].get('Date'), location: expenses[i].get('Location'), notes: expenses[i].get('Notes'), person: expenses[i].get('Person')})
        objCat.total = objCat.total + amount;
    }
	populateUi('week');
}
function populateUi(timeRange){
	var categoryId;
	var catTotalSpent;
	var catBudget;
	var percentSpent;
	var $filledBar;
	var objExp;
	$('#expenses').find('li').each(function(){
		$filledBar = $(this).find('.filled-bar');
		categoryId = $(this).attr('id');
		objExp = moneyGuard.expenses.week[categoryId].expenses;
		catTotalSpent = Math.round(moneyGuard.expenses[timeRange][categoryId].total);
		catBudget = $filledBar.attr('data-budget')*1;
		percentSpent = (catTotalSpent / catBudget) * 100;
		amountLeft = catBudget - catTotalSpent;
		if( amountLeft >= 0 ){
			$(this).find('.amount-left').text('$' + amountLeft + ' left');
		}else{
			$(this).find('.amount-left').text('$' + amountLeft*-1 + ' over');
		}
		
		$filledBar.width(percentSpent + '%');
		if( percentSpent > 100 ){
			$filledBar.parents('.progress-bar-container').addClass('fail');
		}else if( percentSpent > 89 ){
			$filledBar.parents('.progress-bar-container').addClass('caution');
		}
		$(this).find('.cat-total').find('.spent').html(catTotalSpent);   
		
		expensesByDay = [0,0,0,0,0,0,0];
		numOfExpensesByDay = [0,0,0,0,0,0,0];
		for(i = 0; i < objExp.length; i++){
			day = objExp[i].date.getDay();
			numOfExpensesByDay[day] = numOfExpensesByDay[day] + 1;
			expensesByDay[day] = expensesByDay[day] + objExp[i].amount;
		}
		var html = '';
		for(d = 0; d <= 6; d++){
			if( expensesByDay[d] > 0 ){
				html += '<div class="day-' + d + '" data-number="' + numOfExpensesByDay[d] + '" style="left: ' + d * (100/7) + '%;">$' + expensesByDay[d] + '</div>';
			}
		}
		$(this).find('.progress-bar-container').append(html);
	});
	addDayMarker();
	populateListUi();
}
function incrementClientAmount(amount, cat, date){
	moneyGuard.expenses.week[cat].expenses.push({id: 'x', amount: amount, date: date})
	moneyGuard.expenses.week[cat].total = moneyGuard.expenses.week[cat].total + amount;
	populateUi('week');
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
function addDayMarker(){
	width = (getDaysAheadOfWeekStart() * (100/7)) + '%';
	$('#expenses').append('<div class="day-marker" style="width: ' + width + '"></div>')
}
function populateListUi(){
	console.log(moneyGuard);
	var weekObj = moneyGuard.expenses.week;
	var html = '<ul>';
	for(var cat in weekObj) {
		if (weekObj.hasOwnProperty(cat)) {
			html += '<li>' + weekObj[cat].name;
			html += '<ul>';
			for (var i = 0; i < weekObj[cat].expenses.length; i++){
				var exp = weekObj[cat].expenses[i];
        		html += '<li>';
				html += '<a class="list-view-map">M</a>';
				html += '<h3 class="list-view-name">' + exp.person.id + '</h3>';
				html += '<p class="list-view-date">' + exp.date + '</p>';
				html += '<p class="list-view-notes">' + exp.notes + '</p>';
				html += '<span class="list-view-amount">' + exp.amount + '</span>';
				html += '<a class="edit-expense">E</a>';
				html += '</li>';
			}
			html += '</ul></li>';
    	}	
	}
	html += '</ul>';
	$('#list-view').html(html);
}