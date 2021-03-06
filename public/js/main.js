var isChrome = navigator.userAgent.toLowerCase().indexOf('crios') > -1;
if( !isChrome ){
	location.href = 'googlechrome' + location.href.substring(4);
}

Parse.initialize("trhHaGuuYNlb5Xh1tLPfala0t1TuW6LynFURnMR2", "dEUhUrIUbdSk89pnWAwb4zwhYx3LTxskmC82lPC7"); 
            
moneyGuard = {};
moneyGuard.expenses = {};
moneyGuard.settings = {};
moneyGuard.settings.weekStart = 0;
moneyGuard.settings.friends = [];

// Check to see if logged in
checkIfLoggedIn();
function checkIfLoggedIn(){
    if( Parse.User.current() == null ){
        $('body').removeClass('loading');
        $('#login-signup').addClass('active');       
    }else{
        $('body').addClass('loading');
        var user = Parse.User.current();
        userQuery = new Parse.Query(user);
        userQuery.equalTo('objectId', user.id);
        userQuery.find({
          success: function(user){
              var name = user[0].get("name");
              var friends = user[0].get("friends");
              $('#friends-input').val(friends)
              $('#top-bar').find('.name').html(name);
              moneyGuard.settings.name = name;
			  moneyGuard.settings.weekStart = user[0].get('weekStart');

              // Get Friends List
              var User = Parse.Object.extend("_User");
              var user = new User();
              var friendQuery = new Parse.Query(user);
              friendQuery.containedIn('username', friends);
              friendQuery.find(function(r){
				  for( var i = 0; i < r.length; r++){
					  moneyGuard.settings.friends.push(r[i]);
					  moneyGuard.settings.friends[i].name = r[i].get('name');
				  }
			
			  });
			  
              addCategoryHTML();
			$('#progress-view').addClass('active').siblings('section').removeClass('active');
			$('.week-view').trigger('click');
            $('body').addClass('signed-in');
          },
          error: function(error) {
            alert("Error: " + error.code + " " + error.message);
            }
        });
		
    }
}

// Sign Up
function signUp(name, username, password){
    var user = new Parse.User();
    user.set("name", name);
    user.set("username", username);
    user.set("password", password);
    user.set("email", username);
    user.set("weekStart", 0);

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
	
	categoriesQuery.descending('Budget');

	// Print out category list
	categoriesQuery.find({
		success: function(categories){
			var html = '<li class="newbie">Hey ' + $('#top-bar').find('.name').html() + ', edit your settings to get&nbsp;started.</li>';
			var monthHtml = html;
			var settingsHtml = '';
			var weekExpensesObj = {};
			var monthExpensesObj = {};
			var cat;
			var weekBudget;
			var monthBudget;

            if( categories.length > 0 ){
                $('#main-nav').addClass('active');
                html = '';
                monthHtml = '';
            }
			$('body').attr('data-categories', categories.length);
			for (var i = 0; i < categories.length; i++) {
                $('body').removeClass('no-categories');
				cat = categories[i];
				monthBudget = cat.get('Budget');
				weekBudget = Math.round(monthBudget / 4.3333333);
				weekExpensesObj[cat.id] = {};
				weekExpensesObj[cat.id].expenses = [];
				weekExpensesObj[cat.id].name = cat.get('Name');
				weekExpensesObj[cat.id].total = 0;
				
				monthExpensesObj[cat.id] = {};
				monthExpensesObj[cat.id].expenses = [];
				monthExpensesObj[cat.id].name = cat.get('Name');
				monthExpensesObj[cat.id].total = 0;

				html += '<li data-cat-id="' + cat.id + '"><button>+</button><span class="category">' + cat.get('Name') + '</span>';
				html += '<div class="cat-total"><span class="spent">0</span><span>$' + weekBudget + '</span></div>';
				html += '<div class="progress-bar-container">';
				html += 	'<span class="amount-left"></span><div class="empty-bar"><div class="filled-bar" data-budget="' + weekBudget + '"></div></div>';
				html += '</div>';
				html += '</li>';
				
				monthHtml += '<li data-cat-id="' + cat.id + '"><button>+</button><span class="category">' + cat.get('Name') + '</span>';
				monthHtml += '<div class="cat-total"><span class="spent">0</span><span>$' + monthBudget + '</span></div>';
				monthHtml += '<div class="progress-bar-container">';
				monthHtml += 	'<span class="amount-left"></span><div class="empty-bar"><div class="filled-bar" data-budget="' + monthBudget + '"></div></div>';
				monthHtml += '</div>';
				monthHtml += '</li>';
				
				settingsHtml += '<li data-cat-id="' + cat.id + '">'
				settingsHtml += '<input type="text" value="' + cat.get('Name') + '" placeholder="Category Name">';
				settingsHtml += '<input type="number" value="' + monthBudget + '" placeholder="Budget">';
				settingsHtml += '<button class="delete" type="button">delete</button>';
				settingsHtml += '</li>';
				
			}
            settingsHtml += '<li id="new-category">';
            settingsHtml += '<input type="text" placeholder="New Category"><input type="number" placeholder="Budget"><button type="button" class="add">add</button>';
			settingsHtml += '</li>';
            $('body').removeClass('loading');
			$('#progress-view').find('.week').html(html);
			$('#progress-view').find('.month').html(monthHtml);
			$('#settings').find('.add-remove-categories').html(settingsHtml);
			// Add categories to Object
			moneyGuard.expenses.week = weekExpensesObj;
			moneyGuard.expenses.month = monthExpensesObj;

			var expenses = Parse.Object.extend("Expenses");
			
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
			
			var monthExpenses = Parse.Object.extend("Expenses");
			
			// Month
			var monthQuery = new Parse.Query(monthExpenses);
			monthQuery.greaterThanOrEqualTo("Date", currentMonthDateObj);
			monthQuery.find({
			  success: function(exp){
				objectifyExpenses(exp, 'month');
			  },
			  error: function(error) {
				alert("Error: " + error.code + " " + error.message);
				}   
			});

			
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



// Events
$(document).on('click', '#signup-button', function(){
    $(this).addClass('pending');
   signUp($('#signup').find('[type=text]').val(), $('#signup').find('[type=email]').val(), $('#signup').find('[type=password]').val()); 
}).on('click', '#login-button', function(){
    $(this).addClass('pending');
   logIn($('#login').find('[type=email]').val(), $('#login').find('[type=password]').val()); 
}).on('click', '#progress-view button', function(){
    $(this).parents('section').addClass('background');
    var categoryName = $(this).parents('li').find('.category').html();
	addExpenseClone = $('.add-expense-template').clone();
	$('.add-expense-template').after(addExpenseClone.attr('id', 'add-expense'))
    addExpenseClone.find('h1').html(categoryName);
	$('html,body').scrollTop(0);
    addExpenseClone.addClass('active').attr('data-category', $(this).parents('li').attr('data-cat-id')); 
    addExpenseClone.find('.amount-input input').focus();
    getLocation();
}).on('click', '#save-button', function(){
    $('section.background').removeClass('background');
    $(this).addClass('pending');
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
    $('section.background').removeClass('background');
	$('#add-expense').remove();
    $(this).parent().removeClass('active');
    if($('#settings').attr('data-dirty') === 'true'){
        var Categories = Parse.Object.extend("Categories");
        newCat = new Categories();
        console.log(newCat.dirtyKeys());
        addCategoryHTML();
        $('#settings').attr('data-dirty', 'false');
    }
}).on('click', '.notes button', function(){
    $(this).next().toggleClass('active').focus();
}).on('click', '.toggle-list-view', function(){
    $('#progress-view').toggleClass('active');
	$(this).toggleClass('on');
	$('#list-view').toggleClass('active');
}).on('click', '.time-range-view-buttons a', function(){
	var timeRange = $(this).html().toLocaleLowerCase();
	$(this).addClass('active').siblings().removeClass('active');
	$('.' + timeRange + '.expenses').addClass('active').siblings().removeClass('active');
	$('#list-view').find('.' + timeRange).addClass('active').siblings().removeClass('active');
}).on('click', '#top-bar .settings-button', function(){
    $('section.active').addClass('background');
	$('#settings').toggleClass('active');
	$('#select-week-start').find('[value=' + moneyGuard.settings.weekStart + ']').attr('selected', true);
}).on('change', '#select-week-start', function(){
	var User = Parse.Object.extend(Parse.User.current());
    var user = new User();
	var day = $(this).val()*1;
	moneyGuard.settings.weekStart = day;
    user.save({
        'weekStart': day
    }, function(){
         markAsDirty($('#settings'));
    });
}).on('click', '#new-category button', function(){ 
	$(this).addClass('pending');
	var $container = $('#new-category');
	if( $container.find('[type="text"]').val().length > 0 && typeof($container.find('[type="number"]').val()*1) === 'number'){
		addCategory($container.find('[type="text"]').val(), $container.find('[type="number"]').val());
	}else{
		alert('There is a problem with this category.');
	}
}).on('change', '#settings [data-cat-id]', function(){ 
	var $container = $(this);
	updateCategory($container.find('[type="text"]').val(), $container.find('[type="number"]').val(), $container.attr('data-cat-id'));
}).on('click', '#settings .delete', function(){ 
	$(this).parent().addClass('really-delete');
	$(this).html('sure?');
}).on('click', '.really-delete .delete', function(){ 
	var id = $(this).parent().attr('data-cat-id');
    $(this).addClass('pending');
	deleteCategory(id);
}).on('change', '#friends-input', function(){ 
	updateFriends($(this).val());
}).on('click', '#logout', function(){
    Parse.User.logOut();
    window.location.href = '/';
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
        buttonsHtml += '<button data-time-ago="' + timeAgo + '">' + getDayWord(dayNumber, true) + '</button>';
        dayNumber++;
        j++
    }
    $('.other-days').html(buttonsHtml);
});
function markAsDirty($this){
    $this.attr('data-dirty', true);
}
function addExpense(amount, cat, date, location, notes){
    var Expenses = Parse.Object.extend("Expenses");
    var expenses = new Expenses();
    var category = new Parse.Object("Categories");
    category.id = cat;
    var geoPoint = new Parse.GeoPoint(location);
    expenses.setACL(justFriendsACL());
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
            incrementClientAmount(expenses.id, amount, cat, date, geoPoint, notes, Parse.User.current());
        },
        error: function(expenses, error) {
        }
    });
}
function justFriendsACL(){
   var acl = new Parse.ACL();
    acl.setWriteAccess( Parse.User.current(), true);
    acl.setReadAccess( Parse.User.current(), true);
    for(i=0; i < moneyGuard.settings.friends.length; i++){
        acl.setWriteAccess( moneyGuard.settings.friends[i], true);
        acl.setReadAccess( moneyGuard.settings.friends[i], true);
    } 
    acl.setPublicReadAccess(false);
    return acl;
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
		console.log(objCat)
        objCat.expenses.push({id: expenses[i].id, amount: amount, date: expenses[i].get('Date'), location: expenses[i].get('Location'), notes: expenses[i].get('Notes'), person: expenses[i].get('Person')})
        objCat.total = objCat.total + amount;
    }
	
	populateUi('week');
	populateUi('month');
}
function populateUi(timeRange){
	var categoryId;
	var catTotalSpent;
	var catBudget;
	var percentSpent;
	var $filledBar;
	var objExp;
	
	$('.expenses.' + timeRange).find('li').each(function(){
		$filledBar = $(this).find('.filled-bar');
		categoryId = $(this).attr('data-cat-id');
		
		objExp = moneyGuard.expenses[timeRange][categoryId].expenses;
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
			if( expensesByDay[d] > 0 && timeRange === 'week'){
				html += '<div class="day-' + d + '" data-number="' + numOfExpensesByDay[d] + '" style="left: ' + d * (100/7) + '%;">$' + Math.round(expensesByDay[d]) + '</div>';
			}
		}
		$(this).find('.progress-bar-container').append(html);
	});
	addDayMarker(timeRange);
	populateListUi(timeRange);
}
function incrementClientAmount(id, amount, cat, date, geoPoint, notes, user){
	moneyGuard.expenses.week[cat].expenses.push({id: id, amount: amount, date: date, location: geoPoint, notes: notes, person: user})
	moneyGuard.expenses.week[cat].total = moneyGuard.expenses.week[cat].total + amount;
	moneyGuard.expenses.month[cat].expenses.push({id: id, amount: amount, date: date, location: geoPoint, notes: notes, person: user})
	moneyGuard.expenses.month[cat].total = moneyGuard.expenses.month[cat].total + amount;
	populateUi('week');
	populateUi('month');
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
function getDaysAheadOfMonthStart(){
 	var startOfMonth = 1;
    var currentDay = new Date().getDate(); 
    return currentDay - startOfMonth;
}
function getDaysInMonth(){
	var today = new Date();
	var year = today.getFullYear();
	var month = today.getMonth() + 1;
	return new Date(year, month, 0).getDate();
}
function englishMonth(monthNum){
    var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[monthNum];
}
function getDayWord(number, abbr){
	if( abbr ){
    	var days = ['Su', 'M', 'T', 'W', 'Th', 'F', 'Sa'];
	}else{
		var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];	
	}
    return days[number];
}
function addDayMarker(timeRange){
	if( timeRange === 'week' ){
		width = (getDaysAheadOfWeekStart() * (100/7)) + '%';
		$('.week.expenses').append('<div class="day-marker" style="width: ' + width + '"></div>');
	}else if( timeRange === 'month' ){
		width = (getDaysAheadOfMonthStart() * (100/getDaysInMonth())) + '%';
		$('.month.expenses').append('<div class="day-marker" style="width: ' + width + '"></div>');
	}
}
function populateListUi(timeRange){
	if( timeRange === 'week' ){
		var timeRangeObj = moneyGuard.expenses.week;
	}else if( timeRange === 'month' ){
		var timeRangeObj = moneyGuard.expenses.month;
	}
	var friends = moneyGuard.settings.friends;
	var html = '';
	for(var cat in timeRangeObj) {
		if (timeRangeObj.hasOwnProperty(cat)) {
			html += '<li><h2>' + timeRangeObj[cat].name + '</h2>';
			html += '<ul>';
			for (var i = 0; i < timeRangeObj[cat].expenses.length; i++){
				var exp = timeRangeObj[cat].expenses[i];
				var lat;
				var long;
				var buyer = '';
				if( typeof(exp.location) !== 'undefined' ){
					lat = exp.location._latitude;
					long = exp.location._longitude;
				}
				if( typeof(exp.person) !== 'undefined'){
					for( var f = 0; f < friends.length; f++){
						if( exp.person.id === friends[f].id){
							buyer = friends[f].name;
						}else{
							buyer = moneyGuard.settings.name;	
						}
					}
				}
        		html += '<li>';
				if( isValidGeoPoint(lat, long) ){
					html += '<a class="list-view-map" href="https://www.google.com/maps/@' + exp.location._latitude + ',' + exp.location._longitude + ',18z/data=!4m2!3m1!1s0x0:0x0" target="_blank"></a>';
				}
				html += '<h3 class="list-view-name">' + buyer + '</h3>';
				html += '<p class="list-view-date">' + formatDate(exp.date) + '</p>';
				if( exp.notes.length > 0 ){
					html += '<p class="list-view-notes">' + exp.notes + '</p>';
				}
				html += '<span class="list-view-amount">' + Math.round(exp.amount) + '</span>';
				html += '<a class="edit-expense">E</a>';
				html += '</li>';
			}
			html += '</ul></li>';
    	}	
	}
	html += '';
	$('#list-view').find('.' + timeRange).html(html);
}
function isValidGeoPoint(lat,long){
	if( (Math.abs(lat) + ' ').length > 17 && (Math.abs(long) + ' ').length > 17){
		return true;	
	}else{
		return false;	
	}
}
function formatDate(date){
	var day = getDayWord(date.getDay(), false);
	var month = englishMonth(date.getMonth());
	var dateNum = date.getDate();
	var year = date.getFullYear();
	
	if( date.getHours() > 12 ){
		var convertedHours = date.getHours() - 12;	
		var amPm = 'pm';
	}else if(date.getHours() === 12){
		var convertedHours = date.getHours();	
		var amPm = 'midday';
	}else if(date.getHours() === 0){
		var convertedHours = 12;	
		var amPm = 'am';
	}else{
		var convertedHours = date.getHours();	
		var amPm = 'am';
	}
	var minutes = ('0' + date.getMinutes()).slice(-2);
	var time = convertedHours + ':' + minutes + ' ' + amPm;
	return day + ', ' + month + ' ' + dateNum + ', ' + year + ' at ' + time;
}
function addCategory(name, budget){
	var Categories = Parse.Object.extend("Categories");
	newCat = new Categories();
	newCat.set('Name', name);
	newCat.set('Budget', budget*1);
    newCat.setACL(justFriendsACL());
	newCat.save(null, function(addedCategory){
        var name = $('#new-category').find('[type=text]');
        var amount = $('#new-category').find('[type=number]');
        html = '<li data-cat-id="' + addedCategory.id + '"><input type="text" value="' + name.val() + '" placeholder="Category Name"><input type="number" value="' + amount.val() + '" placeholder="Budget"><button class="delete" type="button">delete</button></li>';
        $('#new-category').before(html);
        name.val('');
        amount.val('');
		$('#new-category').find('button').removeClass('pending');
        markAsDirty($('#settings'));
    });
}
function updateCategory(name, budget, id){
	var Categories = Parse.Object.extend("Categories");
	newCat = new Categories();
    newCat.id = id;
	newCat.set('Name', name);
	newCat.set('Budget', budget*1);
	newCat.save();
    markAsDirty($('#settings'));
}
function deleteCategory(catId){
	var Categories = Parse.Object.extend("Categories");
	catToDelete = new Categories();
	catToDelete.id = catId;
	catToDelete.destroy({
		success: function(){
			$('[data-cat-id=' + catId + ']').remove();
            markAsDirty($('#settings'));
		}
	});
}
function updateFriends(friendList){
	var friends = friendList.split(',');
    for(var i = 0; i < friends.length; i++){
        friends[i] = $.trim(friends[i]);
    }
    var user = Parse.User.current();
	user.save('friends', friends);
    shareExistingCategories();
}
function shareExistingCategories(){
    var Categories = Parse.Object.extend("Categories");
	var categoriesQuery = new Parse.Query(Categories);
    categoriesQuery.find(function(results){
        for(var i = 0; i < results.length; i++){
            console.log(results[i])
            results[i].setACL(justFriendsACL());
            // optimize?
            results[i].save();
        }
    });
}